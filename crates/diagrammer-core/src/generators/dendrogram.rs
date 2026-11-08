use std::collections::{HashMap, HashSet};

use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphEdge};

pub struct Dendrogram;

impl Generator for Dendrogram {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let objects = canvas.get_objects(false);
        let edges = canvas.get_edges();

        let mut adj: HashMap<&str, Vec<(&str, &GraphEdge)>> = HashMap::new();
        let mut has_parent: HashSet<&str> = HashSet::new();

        for edge in &edges {
            let left_arrow = edge.left_arrow_type();
            let right_arrow = edge.right_arrow_type();

            let is_right = left_arrow == ArrowType::None && right_arrow != ArrowType::None;
            let is_left = left_arrow != ArrowType::None && right_arrow == ArrowType::None;

            if is_left {
                adj.entry(&edge.right).or_default().push((&edge.left, edge));
                has_parent.insert(&edge.left);
            } else if is_right {
                adj.entry(&edge.left).or_default().push((&edge.right, edge));
                has_parent.insert(&edge.right);
            } else {
                adj.entry(&edge.left).or_default().push((&edge.right, edge));
                adj.entry(&edge.right).or_default().push((&edge.left, edge));
                has_parent.insert(&edge.right);
                has_parent.insert(&edge.left);
            }
        }

        // Roots are objects that have outgoing edges but are not someone's child
        let mut roots: Vec<&str> = objects
            .iter()
            .map(|o| o.get_name())
            .filter(|name| adj.contains_key(name) && !has_parent.contains(name))
            .collect();

        if roots.is_empty() {
            if let Some(first) = objects.first() {
                roots.push(first.get_name());
            }
        }

        if roots.len() != 1 {
            panic!("Sorry, dendrogram must have exactly one root, no more, no less");
        }

        let root_name = roots[0];

        let get_extras = |node_name: &str, edge: Option<&GraphEdge>| -> String {
            let mut ret = Vec::new();
            if let Some(e) = edge {
                if let Some(c) = e.color.as_deref() {
                    ret.push(format!(" \"edgecolor\": \"{}\"", c));
                }
            }
            if let Some(obj) = objects.iter().find(|o| o.get_name() == node_name) {
                if let Some(s) = obj.get_shape() {
                    ret.push(format!(" \"nodeshape\": \"{}\"", s));
                }
                if let Some(c) = obj.get_color() {
                    ret.push(format!(" \"nodecolor\": \"{}\"", c));
                }
                if let Some(l) = obj.get_label() {
                    ret.push(format!(" \"nodelabel\": \"{}\"", l));
                }
            }
            if !ret.is_empty() {
                format!(", {}", ret.join(", "))
            } else {
                String::new()
            }
        };

        let mut lines: Vec<(String, Option<bool>)> = Vec::new();
        let mut visited: HashSet<&str> = HashSet::new();

        fn traverse<'a>(
            name: &'a str,
            edge: Option<&'a GraphEdge>,
            adj: &HashMap<&'a str, Vec<(&'a str, &'a GraphEdge)>>,
            get_extras_fn: &dyn Fn(&str, Option<&GraphEdge>) -> String,
            lines: &mut Vec<(String, Option<bool>)>,
            visited: &mut HashSet<&'a str>,
        ) {
            visited.insert(name);

            let empty_vec = Vec::new();
            let children_candidates = adj.get(name).unwrap_or(&empty_vec);
            let unvisited_children: Vec<(&'a str, &'a GraphEdge)> = children_candidates
                .iter()
                .filter(|(child_name, _)| !visited.contains(child_name))
                .copied()
                .collect();

            let is_leaf = unvisited_children.is_empty();
            let extras = get_extras_fn(name, edge);

            if is_leaf {
                lines.push((
                    format!("{{\"name\": \"{}\", \"size\": 1{}}}", name, extras),
                    None,
                ));
            } else {
                lines.push(("{".to_string(), Some(true)));
                lines.push((format!("\"name\": \"{}\"{},", name, extras), None));
                lines.push(("\"children\": [".to_string(), Some(true)));

                for (idx, (child_name, child_edge)) in unvisited_children.iter().enumerate() {
                    if idx > 0 {
                        if let Some((prev_line, _)) = lines.last_mut() {
                            prev_line.push(',');
                        }
                    }
                    traverse(
                        child_name,
                        Some(child_edge),
                        adj,
                        get_extras_fn,
                        lines,
                        visited,
                    );
                }

                lines.push(("]".to_string(), Some(false)));
                lines.push(("}".to_string(), Some(false)));
            }
        }

        traverse(
            root_name,
            None,
            &adj,
            &get_extras,
            &mut lines,
            &mut visited,
        );

        let mut formatter = OutputFormatter::new();
        for (text, indent_or_dedent) in lines {
            formatter.lout(&text, indent_or_dedent);
        }
        formatter.finish()
    }
}
