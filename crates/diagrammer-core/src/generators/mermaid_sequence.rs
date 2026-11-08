use std::collections::HashSet;

use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas};

pub struct MermaidSequence;

impl Generator for MermaidSequence {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("sequenceDiagram", Some(true));

        let group_names = canvas.get_group_names();
        let mut seen = HashSet::new();
        let mut participants = Vec::new();

        for obj in canvas.get_flattened_vertices() {
            let name = obj.get_name().to_string();
            if !name.is_empty() && seen.insert(name.clone()) {
                participants.push(name);
            }
        }

        for participant in participants {
            formatter.lout(&format!("participant {}", participant), None);
        }

        for edge in canvas.get_edges() {
            let lhs = &edge.left;
            let rhs = &edge.right;
            // Graceful Group Degradation: ignore container-level edges (GROUP --> AnotherGroup)
            if group_names.contains(lhs) || group_names.contains(rhs) {
                continue;
            }
            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            let direction = get_mermaid_edge_direction(edge);

            if !label.is_empty() {
                formatter.lout(&format!("{} {} {}: {}", lhs, direction, rhs, label), None);
            } else {
                formatter.lout(&format!("{} {} {}:", lhs, direction, rhs), None);
            }
        }

        formatter.finish()
    }
}

fn get_mermaid_edge_direction(edge: &crate::ast::GraphEdge) -> &'static str {
    let lt = edge.line_type();
    if lt == "dotted" {
        return "-->";
    } else if lt == "dashed" {
        return "==>";
    }

    let left = edge.left_arrow_type();
    let right = edge.right_arrow_type();

    if left != ArrowType::None && right != ArrowType::None {
        "<->"
    } else if left != ArrowType::None {
        "-->"
    } else {
        "->"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_graceful_group_degradation_in_mermaid_sequence() {
        let input = r#"
{ grp1
  a
  b
  c
  group InnerGroup
    inner_v
  }
}
{ grp2
  d
  e
  f
}
b > "cross-group vertex edge" e
inner_v > d
grp1 > "group to group should be ignored" grp2
a > "node to group should be ignored" grp2
"#;
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidSequence.generate(&canvas);

        // Inner vertices are flattened and declared as participants
        assert!(output.contains("participant a"));
        assert!(output.contains("participant b"));
        assert!(output.contains("participant inner_v"));
        assert!(output.contains("participant e"));
        // Groups themselves are NOT participants
        assert!(!output.contains("participant grp1"));
        assert!(!output.contains("participant InnerGroup"));
        assert!(!output.contains("participant grp2"));
        // Vertex-to-vertex edges across groups ARE rendered
        assert!(output.contains("b -> e: cross-group vertex edge"));
        assert!(output.contains("inner_v -> d:"));
        // Container-level edges ARE ignored
        assert!(!output.contains("grp1"));
        assert!(!output.contains("grp2"));
    }
}
