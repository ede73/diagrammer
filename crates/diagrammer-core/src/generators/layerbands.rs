use serde::Serialize;

use super::Generator;
use crate::ast::{GraphCanvas, GraphObject};

pub struct LayerBands;

#[derive(Serialize)]
struct BandItem {
    text: String,
}

#[derive(Serialize)]
#[serde(untagged)]
enum BandEntry {
    Bands {
        key: String,
        category: String,
        #[serde(rename = "itemArray")]
        item_array: Vec<BandItem>,
    },
    Link {
        key: String,
        parent: String,
    },
}

impl Generator for LayerBands {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut bands = Vec::new();
        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                bands.push(BandItem {
                    text: grp.name.clone(),
                });
            }
        }

        let mut result = vec![BandEntry::Bands {
            key: "_BANDS".to_string(),
            category: "Bands".to_string(),
            item_array: bands,
        }];

        for edge in canvas.get_edges() {
            result.push(BandEntry::Link {
                key: edge.right.clone(),
                parent: edge.left.clone(),
            });
        }

        let mut output = serde_json::to_string(&result).unwrap_or_default();
        output.push('\n');
        output
    }
}
