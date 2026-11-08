use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};

pub struct MermaidFlowchart;

impl Generator for MermaidFlowchart {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        let dir = if canvas.direction.as_deref() == Some("landscape") {
            "LR"
        } else {
            "TD"
        };
        formatter.lout(&format!("flowchart {}", dir), Some(true));

        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    let label = grp.label.as_deref().unwrap_or(&grp.name);
                    formatter.lout(&format!("subgraph {} [\"{}\"]", grp.name, label), Some(true));
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
            let lhs = &edge.left;
            let rhs = &edge.right;
            let arrow = get_mermaid_flow_arrow(edge);
            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            if !label.is_empty() {
                formatter.lout(&format!("{} {}|\"{}\"| {}", lhs, arrow, label, rhs), None);
            } else {
                formatter.lout(&format!("{} {} {}", lhs, arrow, rhs), None);
            }
        }

        formatter.finish()
    }
}

fn format_vertex(obj: &GraphObject) -> String {
    let name = obj.get_name();
    let label = obj.get_label().unwrap_or(name);
    let shape = obj.get_shape().unwrap_or("default");

    match shape {
        "round" | "rounded" | "roundedbox" => format!("{}[\"{}\"]", name, label),
        "circle" => format!("{}((\"{}\"))", name, label),
        "doublecircle" => format!("{}(((\"{}\")))", name, label),
        "diamond" | "condition" => format!("{}{{\"{}\"}}", name, label),
        "hexagon" | "preparation" => format!("{}{{{{\"{}\"}}}}", name, label),
        "database" | "cylinder" => format!("{}[(\"{}\")]", name, label),
        "subroutine" => format!("{}[[\"{}\"]]", name, label),
        "asymmetric" | "flag" => format!("{}>\"{}\"]", name, label),
        "parallelogram" | "input" => format!("{}[/\"{}\"/]", name, label),
        "ellipse" | "display" => format!("{}(\"{}\")", name, label),
        _ => format!("{}[\"{}\"]", name, label),
    }
}

fn get_mermaid_flow_arrow(edge: &crate::ast::GraphEdge) -> &'static str {
    let lt = edge.line_type();
    let left = edge.left_arrow_type() != ArrowType::None;
    let right = edge.right_arrow_type() != ArrowType::None;

    if lt == "dotted" || lt == "dashed" {
        if left && right {
            "<-.->"
        } else if left {
            "<-.-"
        } else if right {
            "-.->"
        } else {
            "-.-"
        }
    } else if left && right {
        "<-->"
    } else if left {
        "<--"
    } else if right {
        "-->"
    } else {
        "---"
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
}
