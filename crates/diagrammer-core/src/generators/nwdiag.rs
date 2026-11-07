use std::collections::HashSet;

use super::{multi_attr_fmt, Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};

pub struct NWDiag;

impl Generator for NWDiag {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();

        formatter.lout("nwdiag {", Some(true));
        formatter.lout("// everything is so tiny, make bigger (and also badly colored)", None);
        formatter.lout("default_fontsize = 20; ", None);
        formatter.lout("default_node_color = lightblue;", None);
        formatter.lout("default_group_color = \"#7777FF\";", None);
        formatter.lout("default_linecolor = \"#FFFFFF\";", None);
        formatter.lout("default_textcolor = red;", None);
        formatter.lout("node_width = 200;  // default value is 128", None);
        formatter.lout("node_height = 100;  // default value is 40", None);

        let group_names: HashSet<&str> = canvas
            .objects
            .iter()
            .filter_map(|obj| match obj {
                GraphObject::Group(g) => Some(g.name.as_str()),
                _ => None,
            })
            .collect();

        for edge in canvas.get_edges() {
            if !group_names.contains(edge.left.as_str()) && !group_names.contains(edge.right.as_str()) {
                formatter.lout(&format!("{} -- {};", edge.left, edge.right), None);
            }
        }

        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                formatter.lout(&format!("network {} {{", grp.name), Some(true));
                // In JS: if (obj.getLabel() !== '') address="..."
                // If label is None, (None ?? "") => address=""
                let addr = grp.label.as_deref().unwrap_or("");
                formatter.lout(&format!("address=\"{}\"", addr), None);

                for second_lvl in grp.get_objects(true) {
                    if second_lvl.is_reference() {
                        formatter.lout(&format!("{};", second_lvl.get_name()), None);
                    }
                    let mapped_shape = if second_lvl.is_vertex() {
                        get_mapped_shape(second_lvl.get_shape())
                    } else {
                        Vec::new()
                    };
                    let nattrs = get_node_attrs(second_lvl, mapped_shape);
                    formatter.lout(&format!("{}{};", second_lvl.get_name(), nattrs), None);
                }

                for edge in canvas.get_edges() {
                    let tmp = edge
                        .label
                        .as_deref()
                        .map(|l| format!("[ address=\"{}\" ]", l))
                        .unwrap_or_default();
                    if edge.left == grp.name {
                        formatter.lout(&format!("{}{};", edge.right, tmp), None);
                    }
                    if edge.right == grp.name {
                        formatter.lout(&format!("{}{};", edge.left, tmp), None);
                    }
                }

                formatter.lout("}", Some(false));
            } else {
                let mapped_shape = get_mapped_shape(obj.get_shape());
                let nattrs = get_node_attrs(obj, mapped_shape);
                formatter.lout(&format!("{}{};", obj.get_name(), nattrs), None);
            }
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
    }
    nattrs
}

fn get_node_attrs(obj: &GraphObject, mapped_shape: Vec<String>) -> String {
    multi_attr_fmt(
        &[
            ("color", obj.get_color(), "color=\"{0}\""),
            ("image", obj.get_image(), "icon=\"icons{0}\""),
            ("label", obj.get_label(), "address=\"{0}\""),
        ],
        &mapped_shape,
    )
}
