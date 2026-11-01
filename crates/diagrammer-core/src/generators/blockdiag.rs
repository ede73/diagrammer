use super::{multi_attr_fmt, Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};

pub struct BlockDiag;

impl Generator for BlockDiag {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();

        formatter.lout("blockdiag {", Some(true));
        formatter.lout("default_fontsize = 14", None);
        if canvas.direction.as_deref() == Some("portrait") {
            formatter.lout("orientation=portrait", None);
        } else {
            formatter.lout("orientation=landscape", None);
        }

        for obj in canvas.get_objects(false) {
            parse_object(&mut formatter, obj);
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
            formatter.lout(&format!("{} -> {}{};", edge.left, edge.right, t), None);
        }

        formatter.lout("}", Some(false));
        formatter.finish()
    }
}

fn parse_object(formatter: &mut OutputFormatter, obj: &GraphObject) {
    if let GraphObject::Group(grp) = obj {
        let label = grp.label.as_deref().unwrap_or("");
        formatter.lout(&format!("group \"{}\"{{", label), Some(true));
        let color_line = grp.color.as_deref().map(|c| format!("color=\"{}\"", c)).unwrap_or_default();
        formatter.lout(&color_line, None);
        let label_line = grp.label.as_deref().map(|l| format!("label=\"{}\"", l)).unwrap_or_default();
        formatter.lout(&label_line, None);

        for inner_obj in grp.get_objects(false) {
            let mapped_shape = get_mapped_shape(inner_obj.get_shape());
            let tmp = multi_attr_fmt(
                &[
                    ("color", inner_obj.get_color(), "color=\"{0}\""),
                    ("label", inner_obj.get_label(), "label=\"{0}\""),
                ],
                &mapped_shape,
            );
            formatter.lout(&format!("{}{};", inner_obj.get_name(), tmp), None);
        }
        formatter.lout("}", Some(false));
    } else {
        let mut style = String::new();
        if let Some(st) = obj.get_style() {
            if st == "dotted" || st == "dashed" || st == "solid" {
                style = format!(", style=\"{}\"", st);
            }
        }

        let mapped = get_mapped_shape(obj.get_shape());
        let mut extras = mapped;
        if !style.is_empty() {
            extras.push(style);
        }

        let color_icon_shape_label = multi_attr_fmt(
            &[
                ("color", obj.get_color(), "color=\"{0}\""),
                ("image", obj.get_image(), "background=\"icons{0}\""),
                ("label", obj.get_label(), "label=\"{0}\""),
            ],
            &extras,
        );
        formatter.lout(&format!("{}{};", obj.get_name(), color_icon_shape_label), None);
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
