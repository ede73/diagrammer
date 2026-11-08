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
            let id = safe_actor_id(&participant);
            formatter.lout(&format!("participant {} as \"{}\"", id, escape_label(&participant)), None);
        }

        for edge in canvas.get_edges() {
            let lhs = &edge.left;
            let rhs = &edge.right;
            // Graceful Group Degradation: ignore container-level edges (GROUP --> AnotherGroup)
            if group_names.contains(lhs) || group_names.contains(rhs) {
                continue;
            }

            let left_arr = edge.left_arrow_type() != ArrowType::None;
            let right_arr = edge.right_arrow_type() != ArrowType::None;

            let (from, to) = if left_arr && !right_arr {
                (safe_actor_id(rhs), safe_actor_id(lhs))
            } else {
                (safe_actor_id(lhs), safe_actor_id(rhs))
            };

            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            let clean_label = label
                .split("::")
                .next()
                .unwrap_or(label)
                .replace('"', "")
                .replace("\\n", " ")
                .replace('\n', " ")
                .replace('\r', "")
                .trim()
                .to_string();

            let direction = get_mermaid_edge_direction(edge);
            let display_label = if clean_label.is_empty() { "\"\"" } else { &clean_label };

            formatter.lout(&format!("{} {} {}: {}", from, direction, to, display_label), None);
        }

        formatter.finish()
    }
}

fn safe_actor_id(name: &str) -> String {
    let reserved = [
        "end", "loop", "alt", "opt", "par", "rect", "actor", "participant",
        "activate", "deactivate", "note", "over", "autonumber", "link",
        "links", "create", "destroy", "box"
    ];
    let lower = name.to_lowercase();
    let is_reserved = reserved.contains(&lower.as_str());

    let mut out = String::new();
    for ch in name.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if is_reserved || out.is_empty() || out.chars().next().unwrap().is_ascii_digit() {
        format!("p_{}", out)
    } else {
        out
    }
}

fn escape_label(label: &str) -> String {
    label.replace('"', "'").replace("\\n", " ").replace('\n', " ").replace('\r', "")
}

fn get_mermaid_edge_direction(edge: &crate::ast::GraphEdge) -> &'static str {
    let lt = edge.line_type();
    let is_dashed = lt == "dotted" || lt == "dashed";

    let left = edge.left_arrow_type() != ArrowType::None;
    let right = edge.right_arrow_type() != ArrowType::None;

    if left && right {
        if is_dashed { "<<-->>" } else { "<<->>" }
    } else if is_dashed {
        "-->>"
    } else {
        "->>"
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
        assert!(output.contains("b ->> e: cross-group vertex edge"));
        assert!(output.contains("inner_v ->> d: \"\""));
        // Container-level edges ARE ignored
        assert!(!output.contains("grp1"));
        assert!(!output.contains("grp2"));
    }
}
