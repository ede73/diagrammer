use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};

pub struct MermaidState;

impl Generator for MermaidState {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("stateDiagram-v2", Some(true));

        if canvas.direction.as_deref() == Some("landscape") {
            formatter.lout("direction LR", None);
        }

        // Start node if specified on canvas
        if let Some(ref start) = canvas.start {
            formatter.lout(&format!("[*] --> {}", safe_id(start)), None);
        }

        // Render groups (composite states) and top-level states
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    format_state_group(grp, &mut formatter);
                }
                _ => {
                    if obj.is_vertex() {
                        format_state_vertex(obj, &mut formatter);
                    }
                }
            }
        }

        // Render transitions
        for edge in canvas.get_edges() {
            let left_arr = edge.left_arrow_type() != ArrowType::None;
            let right_arr = edge.right_arrow_type() != ArrowType::None;

            let (lhs, rhs) = if left_arr && !right_arr {
                // Reverse edge
                (map_state_id(&edge.right, canvas), map_state_id(&edge.left, canvas))
            } else {
                (map_state_id(&edge.left, canvas), map_state_id(&edge.right, canvas))
            };

            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            if !label.is_empty() {
                let clean = escape_transition_label(label);
                if !clean.is_empty() {
                    formatter.lout(&format!("{} --> {}: {}", lhs, rhs, clean), None);
                } else {
                    formatter.lout(&format!("{} --> {}", lhs, rhs), None);
                }
            } else {
                formatter.lout(&format!("{} --> {}", lhs, rhs), None);
            }
        }

        formatter.finish()
    }
}

fn map_state_id(name: &str, canvas: &GraphCanvas) -> String {
    // Check if node is beginpoint or endpoint
    for obj in canvas.get_objects(true) {
        if obj.get_name() == name {
            if let Some(shape) = obj.get_shape() {
                if shape == "beginpoint" || shape == "endpoint" {
                    return "[*]".to_string();
                }
            }
        }
    }
    safe_id(name)
}

fn format_state_group(grp: &crate::ast::GraphGroup, formatter: &mut OutputFormatter) {
    let id = safe_id(&grp.name);
    let label = grp.label.as_deref().unwrap_or(&grp.name);
    if !label.is_empty() && label != grp.name {
        formatter.lout(&format!("state \"{}\" as {} {{", escape_label(label), id), Some(true));
    } else {
        formatter.lout(&format!("state {} {{", id), Some(true));
    }
    for inner in grp.get_objects(false) {
        match inner {
            GraphObject::Group(sub) => format_state_group(sub, formatter),
            _ => {
                if inner.is_vertex() {
                    format_state_vertex(inner, formatter);
                }
            }
        }
    }
    formatter.lout("}", Some(false));
}

fn format_state_vertex(obj: &GraphObject, formatter: &mut OutputFormatter) {
    let name = obj.get_name();
    let shape = obj.get_shape().unwrap_or("");

    if shape == "beginpoint" || shape == "endpoint" {
        return;
    }

    let id = safe_id(name);
    if let Some(label) = obj.get_label() {
        if label != name {
            formatter.lout(&format!("state \"{}\" as {}", escape_label(label), id), None);
            return;
        }
    }

    if shape == "condition" || shape == "diamond" {
        formatter.lout(&format!("state {} <<choice>>", id), None);
    } else {
        formatter.lout(&id, None);
    }
}

fn safe_id(name: &str) -> String {
    let mut out = String::new();
    for ch in name.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if out.is_empty() {
        "node".to_string()
    } else if out == "style" || out == "direction" || out == "class" || out == "state" {
        format!("{}_node", out)
    } else {
        out
    }
}

fn escape_transition_label(label: &str) -> String {
    label
        .split("::")
        .next()
        .unwrap_or(label)
        .replace(':', " ")
        .replace(';', " ")
        .replace("-->", "-")
        .replace("->", "-")
        .replace('"', "")
        .replace("\\n", " ")
        .replace('\n', " ")
        .trim()
        .to_string()
}

fn escape_label(s: &str) -> String {
    s.replace('"', "\\\"").replace("\\n", "<br/>").replace('\n', "<br/>")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_mermaid_state_simple() {
        let input = "s1 > \"event\" s2\ns2 > s3";
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidState.generate(&canvas);

        assert!(output.contains("stateDiagram-v2"));
        assert!(output.contains("s1 --> s2: event"));
        assert!(output.contains("s2 --> s3"));
    }

    #[test]
    fn test_mermaid_state_composite() {
        let input = "group composite_state;Composite Label\n  sub1 > sub2\ngroup end\ns0 > composite_state";
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidState.generate(&canvas);

        assert!(output.contains("state \"Composite Label\" as composite_state {"));
        assert!(output.contains("sub1 --> sub2"));
        assert!(output.contains("s0 --> composite_state"));
    }

    #[test]
    fn test_mermaid_state_nested_and_endpoints() {
        let input = r#"
endpoint done
{ outer;Outer State
  { inner;Inner State
    step1 > step2
  }
}
start > outer
step2 > done
"#;
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidState.generate(&canvas);

        assert!(output.contains("state \"Outer State\" as outer {"));
        assert!(output.contains("state \"Inner State\" as inner {"));
        assert!(output.contains("step1 --> step2"));
        assert!(output.contains("start --> outer"));
        assert!(output.contains("step2 --> [*]"));
        assert!(!output.contains("state done"));
    }
}

