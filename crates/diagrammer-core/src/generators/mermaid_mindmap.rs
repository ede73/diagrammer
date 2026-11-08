use super::{Generator, OutputFormatter};
use crate::ast::GraphCanvas;
use std::collections::{HashMap, HashSet};

pub struct MermaidMindmap;

impl Generator for MermaidMindmap {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("mindmap", None);

        // Build adjacency list: parent -> children
        let mut adj: HashMap<String, Vec<String>> = HashMap::new();
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut all_nodes = HashSet::new();

        for obj in canvas.get_objects(true) {
            if obj.is_vertex() {
                let name = obj.get_name().to_string();
                if !name.is_empty() {
                    all_nodes.insert(name.clone());
                    in_degree.entry(name).or_insert(0);
                }
            }
        }

        for edge in canvas.get_edges() {
            let u = edge.left.clone();
            let v = edge.right.clone();
            all_nodes.insert(u.clone());
            all_nodes.insert(v.clone());
            *in_degree.entry(v.clone()).or_insert(0) += 1;
            in_degree.entry(u.clone()).or_insert(0);
            adj.entry(u).or_default().push(v);
        }

        if all_nodes.is_empty() {
            formatter.lout("  root((Root))", None);
            return formatter.finish();
        }

        // Determine root(s)
        let candidate_roots: Vec<String> = if let Some(ref s) = canvas.start {
            vec![s.clone()]
        } else {
            let mut zero_in: Vec<String> = all_nodes
                .iter()
                .filter(|n| in_degree.get(*n).copied().unwrap_or(0) == 0)
                .cloned()
                .collect();
            zero_in.sort();
            if zero_in.is_empty() {
                // Pick first node alphabetically if there is a cycle
                let mut sorted: Vec<String> = all_nodes.iter().cloned().collect();
                sorted.sort();
                vec![sorted[0].clone()]
            } else {
                zero_in
            }
        };

        let mut visited = HashSet::new();

        if candidate_roots.len() == 1 {
            let root = &candidate_roots[0];
            render_mindmap_node(root, canvas, 1, &adj, &mut visited, &mut formatter);
        } else {
            formatter.lout("  root((Root))", None);
            for root in &candidate_roots {
                render_mindmap_node(root, canvas, 2, &adj, &mut visited, &mut formatter);
            }
        }

        // Render any disconnected unvisited nodes
        for node in &all_nodes {
            if !visited.contains(node) {
                render_mindmap_node(node, canvas, 2, &adj, &mut visited, &mut formatter);
            }
        }

        formatter.finish()
    }
}

fn render_mindmap_node(
    node: &str,
    canvas: &GraphCanvas,
    depth: usize,
    adj: &HashMap<String, Vec<String>>,
    visited: &mut HashSet<String>,
    formatter: &mut OutputFormatter,
) {
    if visited.contains(node) {
        return;
    }
    visited.insert(node.to_string());

    let indent = "  ".repeat(depth);
    let shape_str = format_mindmap_node(node, canvas, depth == 1);
    formatter.lout(&format!("{}{}", indent, shape_str), None);

    if let Some(children) = adj.get(node) {
        for child in children {
            render_mindmap_node(child, canvas, depth + 1, adj, visited, formatter);
        }
    }
}

fn format_mindmap_node(name: &str, canvas: &GraphCanvas, is_root: bool) -> String {
    let mut label = name;
    let mut shape = "default";

    for obj in canvas.get_objects(true) {
        if obj.get_name() == name {
            if let Some(l) = obj.get_label() {
                if !l.is_empty() {
                    let text = l.split("::").next().unwrap_or(l).trim();
                    if !text.is_empty() {
                        label = text;
                    }
                }
            }
            if let Some(s) = obj.get_shape() {
                shape = s;
            }
            break;
        }
    }

    let escaped = label.replace('"', "\\\"").replace('\n', " ");

    if is_root {
        format!("{}((\"{}\"))", safe_id(name), escaped)
    } else {
        match shape {
            "circle" => format!("{}((\"{}\"))", safe_id(name), escaped),
            "hexagon" => format!("{}{{{{\"{}\"}}}}", safe_id(name), escaped),
            "cloud" => format!("{}(-\"{}\"-)", safe_id(name), escaped),
            "bang" => format!("{}))\"{}\"((", safe_id(name), escaped),
            "round" | "rounded" => format!("{}(\"{}\")", safe_id(name), escaped),
            _ => format!("{}[\"{}\"]", safe_id(name), escaped),
        }
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
        "n".to_string()
    } else {
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_mermaid_mindmap_tree() {
        let input = r#"
A > B
  B > e
  B > f
A > C
  C > h
"#;
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidMindmap.generate(&canvas);

        assert!(output.contains("mindmap"));
        assert!(output.contains("A((\"A\"))"));
        assert!(output.contains("B[\"B\"]"));
        assert!(output.contains("e[\"e\"]"));
        assert!(output.contains("C[\"C\"]"));
    }
}
