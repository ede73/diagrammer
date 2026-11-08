use super::{multi_attr_fmt, Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};

pub struct SeqDiag;

impl Generator for SeqDiag {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();

        formatter.lout("seqdiag {", Some(true));
        formatter.lout("autonumber = True;", None);
        formatter.lout("activation = none;", None);

        // print out all node declarations FIRST (if any)
        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                let lbl = grp.label.as_deref().map(|l| format!(" {}*/", l)).unwrap_or_else(|| "*/".to_string());
                formatter.lout(&format!("/*{}{}", grp.name, lbl), None);
                for second_lvl in grp.get_objects(false) {
                    let style_and_label = multi_attr_fmt(
                        &[
                            ("style", second_lvl.get_style(), "style={0}"),
                            ("label", second_lvl.get_label(), "label=\"{0}\""),
                        ],
                        &[],
                    );
                    formatter.lout(&format!("{}{};", second_lvl.get_name(), style_and_label), None);
                }
            } else if obj.is_vertex() {
                let style_and_label = multi_attr_fmt(
                    &[
                        ("style", obj.get_style(), "style={0}"),
                        ("label", obj.get_label(), "label=\"{0}\""),
                        ("color", obj.get_color(), "color=\"{0}\""),
                    ],
                    &[],
                );
                formatter.lout(&format!("{}{};", obj.get_name(), style_and_label), None);
            }
        }

        for edge in canvas.get_edges() {
            let mut attrs: Vec<String> = Vec::new();
            let mut edge_type_str = String::new();

            if let Some(color) = edge.color.as_deref() {
                attrs.push(format!("color=\"{}\"", color));
            }
            if let Some(label) = edge.label.as_deref() {
                if label.contains("::") {
                    let mut parts = label.splitn(2, "::");
                    let left_part = parts.next().unwrap_or("").trim();
                    let right_part = parts.next().unwrap_or("").trim();
                    attrs.push(format!("note=\"{}\"", right_part));
                    attrs.push(format!("label=\"{}\"", left_part));
                } else {
                    attrs.push(format!("label=\"{}\"", label.trim()));
                }
            }

            let dot = edge.line_type() == "dotted";
            let dash = edge.line_type() == "dashed";
            if edge.line_type() == "broken" {
                attrs.push("failed".to_string());
            }

            if edge.edge_type.contains('<') && edge.edge_type.contains('>') {
                if edge.right == edge.left {
                    let broadcast_label = edge.label.as_deref().unwrap_or("");
                    formatter.lout(&format!("===BROADCAST:{}===", broadcast_label), None);
                    continue;
                }
                edge_type_str = "=>".to_string();
            } else if edge.edge_type.contains('<') {
                if dot {
                    edge_type_str = "<--".to_string();
                } else if dash {
                    edge_type_str = "<<--".to_string();
                } else {
                    edge_type_str = "<-".to_string();
                }
            } else if edge.edge_type.contains('>') {
                if dot {
                    edge_type_str = "-->".to_string();
                } else if dash {
                    edge_type_str = "-->>".to_string();
                } else {
                    edge_type_str = "->".to_string();
                }
            } else if dot {
                let note_label = edge.label.as_deref().unwrap_or("");
                formatter.lout(&format!("...{}...", note_label), None);
                continue;
            } else if dash {
                let note_label = edge.label.as_deref().unwrap_or("");
                formatter.lout(&format!("==={}===", note_label), None);
                continue;
            } else {
                formatter.lout("ERROR: SHOULD NOT HAPPEN", None);
            }

            if attrs.is_empty() {
                attrs.push("label=\"\"".to_string());
            }
            attrs.sort();
            formatter.lout(
                &format!("{} {} {}[ {} ];", edge.left, edge_type_str, edge.right, attrs.join(", ")),
                None,
            );
        }

        formatter.lout("}", Some(false));
        formatter.finish()
    }
}
