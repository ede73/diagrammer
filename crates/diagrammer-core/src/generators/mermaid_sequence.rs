use std::collections::HashSet;

use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};

pub struct MermaidSequence;

impl Generator for MermaidSequence {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("sequenceDiagram", Some(true));

        let mut seen = HashSet::new();
        let mut participants = Vec::new();

        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    for z in grp.get_objects(false) {
                        let name = z.get_name().to_string();
                        if seen.insert(name.clone()) {
                            participants.push(name);
                        }
                    }
                }
                GraphObject::Vertex(_) | GraphObject::VertexRef { .. } => {
                    let name = obj.get_name().to_string();
                    if seen.insert(name.clone()) {
                        participants.push(name);
                    }
                }
                _ => {}
            }
        }

        for participant in participants {
            formatter.lout(&format!("participant {}", participant), None);
        }

        for edge in canvas.get_edges() {
            let lhs = &edge.left;
            let rhs = &edge.right;
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
