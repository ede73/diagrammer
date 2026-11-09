use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};

pub struct MermaidFlowchart;

impl Generator for MermaidFlowchart {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        let dir = match canvas.direction.as_deref().map(|s| s.to_lowercase()).as_deref() {
            Some("landscape") | Some("lr") | Some("horizontal") => "LR",
            Some("rl") => "RL",
            Some("bt") | Some("bottom-top") => "BT",
            _ => "TD",
        };
        formatter.lout(&format!("flowchart {}", dir), Some(true));

        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    let id = safe_id(&grp.name);
                    let raw_label = grp.label.as_deref().unwrap_or(&grp.name);
                    let label = escape_label(raw_label);
                    formatter.lout(&format!("subgraph {} [\"{}\"]", id, label), Some(true));
                    for inner in grp.get_objects(false) {
                        if inner.is_vertex() {
                            formatter.lout(&format_vertex(inner), None);
                        }
                    }
                    formatter.lout("end", Some(false));
                }
                _ => {
                    if obj.is_vertex() {
                        formatter.lout(&format_vertex(obj), None);
                    }
                }
            }
        }

        for edge in canvas.get_edges() {
            let left_arr = edge.left_arrow_type() != ArrowType::None;
            let right_arr = edge.right_arrow_type() != ArrowType::None;
            let lt = edge.line_type();
            let is_self_loop = edge.left == edge.right;

            let (lhs, rhs, arrow) = if left_arr && !right_arr {
                // Mermaid flowchart only supports forward arrows -> reverse nodes
                let l = safe_id(&edge.right);
                let r = safe_id(&edge.left);
                let a = if lt == "dotted" || lt == "dashed" { "-.->" } else { "-->" };
                (l, r, a)
            } else if left_arr && right_arr {
                let l = safe_id(&edge.left);
                let r = safe_id(&edge.right);
                let a = if lt == "dotted" || lt == "dashed" { "<-.->" } else { "<-->" };
                (l, r, a)
            } else if right_arr {
                let l = safe_id(&edge.left);
                let r = safe_id(&edge.right);
                let a = if lt == "dotted" || lt == "dashed" { "-.->" } else { "-->" };
                (l, r, a)
            } else if is_self_loop {
                // Dagre crashes on undirected self-loops; route as directed self-loop
                let l = safe_id(&edge.left);
                let r = safe_id(&edge.right);
                let a = if lt == "dotted" || lt == "dashed" { "-.->" } else { "-->" };
                (l, r, a)
            } else {
                let l = safe_id(&edge.left);
                let r = safe_id(&edge.right);
                let a = if lt == "dotted" || lt == "dashed" { "-.-" } else { "---" };
                (l, r, a)
            };

            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            if !label.is_empty() {
                let escaped = escape_label(label);
                formatter.lout(&format!("{} {}|\"{}\"| {}", lhs, arrow, escaped, rhs), None);
            } else {
                formatter.lout(&format!("{} {} {}", lhs, arrow, rhs), None);
            }
        }

        // Emit node styles if colors are specified
        for obj in canvas.get_flattened_vertices() {
            let id = safe_id(obj.get_name());
            let mut style_parts: Vec<String> = Vec::new();
            if let Some(color) = obj.get_color() {
                style_parts.push(format!("fill:{}", color));
            }
            if let Some(tc) = obj.get_textcolor() {
                style_parts.push(format!("color:{}", tc));
            }
            if !style_parts.is_empty() {
                formatter.lout(&format!("style {} {}", id, style_parts.join(",")), None);
            }
        }

        // Emit edge styles if colors are specified
        for (i, edge) in canvas.get_edges().iter().enumerate() {
            if let Some(ref color) = edge.color {
                formatter.lout(&format!("linkStyle {} stroke:{}", i, color), None);
            }
        }

        formatter.finish()
    }
}

pub fn safe_id(name: &str) -> String {
    let reserved = [
        "style", "class", "classdef", "click", "subgraph", "end",
        "graph", "flowchart", "direction", "interpolate", "linkstyle"
    ];
    let lower = name.to_lowercase();
    let is_reserved = reserved.contains(&lower.as_str());

    let mut sanitized = String::new();
    for c in name.chars() {
        if c.is_ascii_alphanumeric() || c == '_' {
            sanitized.push(c);
        } else {
            sanitized.push('_');
        }
    }

    if is_reserved || sanitized.is_empty() || sanitized.chars().next().unwrap().is_ascii_digit() {
        format!("n_{}", sanitized)
    } else {
        sanitized
    }
}

fn escape_label(label: &str) -> String {
    label.replace('"', "#quot;").replace('\n', "<br/>")
}

fn format_vertex(obj: &GraphObject) -> String {
    let raw_name = obj.get_name();
    let id = safe_id(raw_name);
    let label = obj.get_label().unwrap_or(raw_name);
    let escaped_label = escape_label(label);
    let shape = obj.get_shape().unwrap_or("default");

    match shape {
        "round" | "rounded" | "roundedbox" => format!("{}[\"{}\"]", id, escaped_label),
        "circle" => format!("{}((\"{}\"))", id, escaped_label),
        "doublecircle" => format!("{}(((\"{}\")))", id, escaped_label),
        "diamond" | "condition" => format!("{}{{\"{}\"}}", id, escaped_label),
        "hexagon" | "preparation" => format!("{}{{{{\"{}\"}}}}", id, escaped_label),
        "database" | "cylinder" => format!("{}[(\"{}\")]", id, escaped_label),
        "subroutine" => format!("{}[[\"{}\"]]", id, escaped_label),
        "asymmetric" | "flag" => format!("{}>\"{}\"]", id, escaped_label),
        "parallelogram" | "input" => format!("{}[/\"{}\"/]", id, escaped_label),
        "ellipse" | "display" => format!("{}(\"{}\")", id, escaped_label),
        _ => format!("{}[\"{}\"]", id, escaped_label),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_mermaid_flowchart_generation() {
        let input = "a > b > c";
        let canvas = AstBuilder::new().build(input).unwrap();
        let generator = MermaidFlowchart;
        let output = generator.generate(&canvas);

        assert!(output.contains("flowchart TD"));
        assert!(output.contains("a[\"a\"]"));
        assert!(output.contains("a --> b"));
        assert!(output.contains("b --> c"));
    }

    #[test]
    fn test_mermaid_flowchart_left_arrow_reversal() {
        let input = "a < b";
        let canvas = AstBuilder::new().build(input).unwrap();
        let generator = MermaidFlowchart;
        let output = generator.generate(&canvas);

        assert!(output.contains("b --> a"));
    }

    #[test]
    fn test_mermaid_flowchart_shapes_and_subgraph() {
        let input = "{ xGroup;\n circle x\n}\nx > \"test\" y";
        let canvas = AstBuilder::new().build(input).unwrap();
        let generator = MermaidFlowchart;
        let output = generator.generate(&canvas);

        assert!(output.contains("subgraph xGroup"));
        assert!(output.contains("x((\"x\"))"));
        assert!(output.contains("x -->|\"test\"| y"));
        assert!(output.contains("end"));
    }

    #[test]
    fn test_mermaid_flowchart_reserved_keywords_and_dots() {
        let input = "{ GNode; Node:GraphObject\n style\n}\nGraphObject .> GNode; extends(GraphObject->GNode)";
        let canvas = AstBuilder::new().build(input).unwrap();
        let generator = MermaidFlowchart;
        let output = generator.generate(&canvas);

        // 'style' must be sanitized to 'n_style' to avoid Mermaid keyword syntax error
        assert!(output.contains("n_style[\"style\"]"));
        assert!(output.contains("GraphObject -.->|\"extends(GraphObject->GNode)\"| GNode"));
    }
}
