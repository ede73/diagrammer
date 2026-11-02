use std::collections::HashMap;

use serde::Serialize;

use super::Generator;
use crate::ast::GraphCanvas;

pub struct ParseTree;

#[derive(Serialize)]
struct ParseTreeNode {
    key: usize,
    text: String,
    fill: &'static str,
    stroke: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    parent: Option<usize>,
}

impl Generator for ParseTree {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut node_list = Vec::new();
        let mut key_map: HashMap<String, usize> = HashMap::new();

        if canvas.root_vertices.len() > 1 {
            panic!("Only one root node supported");
        }

        if let Some(root) = canvas.root_vertices.first() {
            let root_name = root.get_name().to_string();
            let text = root.get_label().unwrap_or(&root_name).to_string();
            key_map.insert(root_name, 1);
            node_list.push(ParseTreeNode {
                key: 1,
                text,
                fill: "#f8f8f8",
                stroke: "#4d90fe",
                parent: None,
            });
        }

        let mut key_id = 2;
        for obj in canvas.get_objects(false) {
            let name = obj.get_name().to_string();
            if !name.is_empty() && !key_map.contains_key(&name) {
                key_map.insert(name, key_id);
                key_id += 1;
            }
        }

        for edge in canvas.get_edges() {
            let parent_key = key_map.get(&edge.left).copied();
            let key = key_map.get(&edge.right).copied().unwrap_or(0);
            let right_obj = canvas
                .objects
                .iter()
                .find(|o| o.get_name() == edge.right);
            let text = right_obj
                .and_then(|o| o.get_label())
                .unwrap_or(&edge.right)
                .to_string();

            node_list.push(ParseTreeNode {
                key,
                text,
                fill: "#f8f8f8",
                stroke: "#4d90fe",
                parent: parent_key,
            });
        }

        let formatter = serde_json::ser::PrettyFormatter::with_indent(b"   ");
        let mut buf = Vec::new();
        let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
        node_list.serialize(&mut ser).unwrap();
        let mut output = String::from_utf8(buf).unwrap();
        output.push('\n');
        output
    }
}
