use super::{multi_attr_fmt, Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};

pub struct ActDiag;

impl Generator for ActDiag {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();

        formatter.lout("actdiag {", Some(true));
        formatter.lout("default_fontsize = 14", None);
        if canvas.direction.as_deref() == Some("portrait") {
            formatter.lout("orientation=portrait", None);
        } else {
            formatter.lout("orientation=landscape", None);
        }

        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                formatter.lout(&format!("lane \"{}\"{{", grp.name), Some(true));
                for inner_obj in grp.get_objects(false) {
                    let mapped = get_mapped_shape(inner_obj.get_shape());
                    let color_shape_label = multi_attr_fmt(
                        &[
                            ("color", inner_obj.get_color(), "color=\"{0}\""),
                            ("label", inner_obj.get_label(), "label=\"{0}\""),
                        ],
                        &mapped,
                    );
                    formatter.lout(&format!("{} {};", inner_obj.get_name(), color_shape_label), None);
                }
                formatter.lout("}", Some(false));
            } else {
                let mapped = get_mapped_shape(obj.get_shape());
                let color_icon_shape_label = multi_attr_fmt(
                    &[
                        ("color", obj.get_color(), "color=\"{0}\""),
                        ("image", obj.get_image(), "background=\"icons{0}\""),
                        ("label", obj.get_label(), "label=\"{0}\""),
                    ],
                    &mapped,
                );
                formatter.lout(&format!("{}{};", obj.get_name(), color_icon_shape_label), None);
            }
        }

        for edge in canvas.get_edges() {
            let mut s = String::new();
            if edge.line_type() == "dotted" {
                s = "style=\"dotted\"".to_string();
            } else if edge.line_type() == "dashed" {
                s = "style=\"dashed\"".to_string();
            }
            let extras = if s.is_empty() { vec![] } else { vec![s] };
            let t = multi_attr_fmt(
                &[
                    ("label", edge.label.as_deref(), "label=\"{0}\""),
                    ("color", edge.color.as_deref(), "color=\"{0}\""),
                ],
                &extras,
            );
            formatter.lout(&format!("{} -> {} {};", edge.left, edge.right, t), None);
        }

        formatter.lout("}", Some(false));
        formatter.finish()
    }
}

fn get_mapped_shape(shape_opt: Option<&str>) -> Vec<String> {
    let shape = shape_opt.unwrap_or("default");
    let mapped = match shape {
        "condition" => "flowchart.condition",
        "database" => "flowchart.database",
        "input" => "flowchart.input",
        "left" | "loop" | "loopin" => "flowchart.loopin",
        "loopout" | "right" => "flowchart.loopout",
        "document" | "note" => "note",
        "display" | "ellipse" => "ellipse",
        "doublecircle" | "circle" => "circle",
        "preparation" | "subroutine" => "roundedbox",
        "actor" => "actor",
        "beginpoint" => "beginpoint",
        "cloud" => "cloud",
        "diamond" => "diamond",
        "dots" => "dots",
        "endpoint" => "endpoint",
        "mail" => "mail",
        _ => "box",
    };
    let mut nattrs = vec![format!("shape={}", mapped)];
    if shape == "left" || shape == "right" {
        nattrs.push("rotate=\"90\"".to_string());
    } else if shape == "roundedbox" {
        nattrs.push("style=\"rounded\"".to_string());
    }
    nattrs
}
