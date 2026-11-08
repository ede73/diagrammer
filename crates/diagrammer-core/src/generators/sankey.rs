use std::collections::HashMap;

use serde::Serialize;

use super::Generator;
use crate::ast::{ArrowType, GraphCanvas, GraphEdge};

pub struct Sankey;

#[derive(Serialize)]
struct SankeyNode {
    name: String,
}

fn serialize_sankey_value<S>(val: &f64, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    if val.fract() == 0.0 {
        serializer.serialize_i64(*val as i64)
    } else {
        serializer.serialize_f64(*val)
    }
}

#[derive(Serialize)]
struct SankeyLink {
    source: usize,
    target: usize,
    #[serde(serialize_with = "serialize_sankey_value")]
    value: f64,
}

#[derive(Serialize)]
struct SankeyDoc {
    nodes: Vec<SankeyNode>,
    links: Vec<SankeyLink>,
}

fn is_right_pointing(edge: &GraphEdge) -> bool {
    let left_arrow = edge.left_arrow_type();
    let right_arrow = edge.right_arrow_type();
    left_arrow == ArrowType::None && right_arrow != ArrowType::None
}

fn get_value_and_percentage(edge: &GraphEdge) -> (f64, bool, bool) {
    if let Some(ref label) = edge.label {
        let trimmed = label.trim();
        let mut num_str = String::new();
        let mut chars = trimmed.chars().peekable();
        while let Some(&c) = chars.peek() {
            if c.is_ascii_digit() || c == '.' {
                num_str.push(c);
                chars.next();
            } else {
                break;
            }
        }
        if let Ok(num) = num_str.parse::<f64>() {
            while let Some(&c) = chars.peek() {
                if c == ' ' || c == '\t' {
                    chars.next();
                } else {
                    break;
                }
            }
            let is_percentage = chars.next() == Some('%');
            return (num, true, is_percentage);
        }
    }
    (f64::NAN, false, false)
}

fn get_edge_value<'a>(edge: &'a GraphEdge, all_edges: &[&'a GraphEdge]) -> f64 {
    let (val, has_val, is_pct) = get_value_and_percentage(edge);
    if !has_val {
        return f64::NAN;
    }
    if !is_pct {
        return val;
    }
    let preceding = if is_right_pointing(edge) {
        &edge.left
    } else {
        &edge.right
    };
    let ipn = all_edges.iter().filter(|e| {
        if is_right_pointing(e) {
            &e.right == preceding
        } else {
            &e.left == preceding
        }
    });
    ipn.map(|n| (val * get_edge_value(n, all_edges)) / 100.0).sum()
}

impl Generator for Sankey {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut vertex_indexes: HashMap<String, usize> = HashMap::new();
        let mut nodes = Vec::new();

        let mut index = 0;
        for vertex in canvas.get_objects(false) {
            let name = vertex.get_name();
            let label = vertex.get_label();
            vertex_indexes.insert(name.to_string(), index);
            index += 1;
            let display_name = label.unwrap_or(name);
            nodes.push(SankeyNode {
                name: display_name.to_string(),
            });
        }

        let all_edges = canvas.get_edges();

        let mut links = Vec::new();
        for edge in &all_edges {
            let amount = get_edge_value(edge, &all_edges);
            let left_idx = *vertex_indexes.get(&edge.left).unwrap_or(&0);
            let right_idx = *vertex_indexes.get(&edge.right).unwrap_or(&0);

            let (source, target) = if is_right_pointing(edge) {
                (left_idx, right_idx)
            } else {
                (right_idx, left_idx)
            };

            links.push(SankeyLink {
                source,
                target,
                value: amount,
            });
        }

        let doc = SankeyDoc { nodes, links };
        let mut out = serde_json::to_string(&doc).unwrap_or_default();
        out.push('\n');
        out
    }
}
