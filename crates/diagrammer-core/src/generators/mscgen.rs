use super::{multi_attr_fmt, Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};

pub struct MSCGen;

impl Generator for MSCGen {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("msc {", Some(true));

        let mut vertices = Vec::new();
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    for z in grp.get_objects(false) {
                        let tmp = multi_attr_fmt(
                            &[
                                ("color", z.get_color(), "color=\"{0}\""),
                                ("style", z.get_style(), "style={0}"),
                                ("label", z.get_label(), "label=\"{0}\""),
                            ],
                            &[],
                        );
                        vertices.push(format!("{}{}", z.get_name(), tmp));
                    }
                }
                GraphObject::Vertex(_) | GraphObject::VertexRef { .. } => {
                    let tmp = multi_attr_fmt(
                        &[
                            ("color", obj.get_color(), "textbgcolor=\"{0}\""),
                            ("style", obj.get_style(), "style={0}"),
                            ("label", obj.get_label(), "label=\"{0}\""),
                        ],
                        &[],
                    );
                    vertices.push(format!("{}{}", obj.get_name(), tmp));
                }
                _ => {}
            }
        }

        formatter.lout(&format!("{};", vertices.join(",")), None);

        let msc_edge_mapping: std::collections::HashMap<&str, &str> = [
            ("->", "->"),
            ("<-", "<-"),
            ("<->", "<->"),
            ("-|", "->"),
            ("|-", "<-"),
            ("|-|", "<->"),
            (".|", "->"),
            ("|.", "<-"),
            ("|.|", "<->"),
            ("=|", "->"),
            ("|=", "<-"),
            ("|=|", "<->"),
            (">", "=>"),
            ("<", "<="),
            ("<>", "<=>"),
            (".>", "=>>"),
            ("<.", "<<="),
            ("<.>", "<<=>>"),
            ("/>", "-x "),
            ("</", " x-"),
            (".", "..."),
            ("-", "---"),
            (">>", ">>"),
            ("<<", "<<"),
            ("<<>>", "<<=>>"),
            ("=>", ":>"),
            ("<=", "<:"),
            ("<=>", "<:>"),
        ]
        .into_iter()
        .collect();

        let mut id = 1;
        for edge in canvas.get_edges() {
            let mut edge_type_str = String::new();
            let mut right_name = edge.right.clone();
            let lhs_name = &edge.left;

            let mut attrs: Vec<String> = Vec::new();
            let mut note = String::new();
            if let Some(ref color) = edge.color {
                attrs.push(format!("linecolor=\"{}\"", color));
            }
            if let Some(ref label) = edge.label {
                if label.contains("::") {
                    let parts: Vec<&str> = label.split("::").collect();
                    note = parts[1].trim().to_string();
                    attrs.push(format!("label=\"{}\"", parts[0].trim()));
                } else {
                    attrs.push(format!("label=\"{}\"", label.trim()));
                }
            }
            attrs.push(format!("id=\"{}\"", id));
            id += 1;

            let left_arrow = edge.left_arrow_type();
            let right_arrow = edge.right_arrow_type();
            let lt = edge.line_type();

            let is_bidirectional = (left_arrow == ArrowType::Flat && right_arrow == ArrowType::Flat)
                || (left_arrow != ArrowType::None && right_arrow != ArrowType::None);
            let is_right = left_arrow == ArrowType::None && right_arrow != ArrowType::None;
            let is_left = left_arrow != ArrowType::None && right_arrow == ArrowType::None;

            if is_bidirectional {
                if lhs_name == &right_name {
                    edge_type_str = "->".to_string();
                    right_name = "*".to_string();
                } else {
                    edge_type_str = msc_edge_mapping
                        .get(edge.edge_type.as_str())
                        .copied()
                        .unwrap_or("")
                        .to_string();
                }
            } else if is_left {
                edge_type_str = msc_edge_mapping
                    .get(edge.edge_type.as_str())
                    .copied()
                    .unwrap_or("")
                    .to_string();
            } else if is_right {
                edge_type_str = msc_edge_mapping
                    .get(edge.edge_type.as_str())
                    .copied()
                    .unwrap_or("")
                    .to_string();
            } else if lt == "dotted" {
                if let Some(ref color) = edge.color {
                    attrs.push(format!("textcolor=\"{}\"", color));
                }
                attrs.sort();
                formatter.lout(&format!("... [ {} ];", attrs.join(",")), None);
                continue;
            } else if lt == "dashed" {
                if let Some(ref color) = edge.color {
                    attrs.push(format!("textcolor=\"{}\"", color));
                }
                attrs.sort();
                formatter.lout(&format!("--- [ {} ];", attrs.join(",")), None);
                continue;
            } else {
                formatter.lout("ERROR: SHOULD NOT HAPPEN", None);
            }

            attrs.sort();
            formatter.lout(
                &format!(
                    "{}{}{}[{}];",
                    lhs_name,
                    edge_type_str,
                    right_name,
                    attrs.join(", ")
                ),
                None,
            );
            if !note.is_empty() {
                formatter.lout(
                    &format!("{} abox {}[ label=\"{}\" ];", right_name, right_name, note),
                    None,
                );
            }
        }

        formatter.lout("}", Some(false));
        formatter.finish()
    }
}
