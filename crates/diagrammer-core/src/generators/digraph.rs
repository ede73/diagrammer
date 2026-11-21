use std::collections::BTreeMap;

use super::{Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphGroup, GraphObject};

pub struct DiGraph;

impl Generator for DiGraph {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();

        formatter.lout("digraph {", Some(true));
        formatter.lout("compound=true;", None);
        if matches!(
            canvas.direction.as_deref().map(|s| s.to_lowercase()).as_deref(),
            Some("landscape") | Some("lr") | Some("horizontal")
        ) {
            formatter.lout("rankdir=LR;", None);
        } else {
            formatter.lout("rankdir=TD;", None);
        }

        if let Some(ref start) = canvas.start {
            // Find start vertex or forward declare
            let mut found = false;
            let default_shape = canvas.shape.as_deref();
            for obj in canvas.get_objects(false) {
                if obj.get_name() == start {
                    process_a_vertex(&mut formatter, obj, default_shape);
                    found = true;
                    break;
                }
            }
            if !found {
                formatter.lout(&format!("{};", start), None);
            }
            formatter.lout("//startnode setup", None);
            formatter.lout(&format!("{{rank = same;null}} {{rank = same; {}}}", start), Some(true));
            formatter.lout("null [shape=plaintext, label=\"\"];", None);
            formatter.lout(&format!("{}[shape=doublecircle];", start), None);
            formatter.lout(&format!("null->{};\n", start), None);
            formatter.dedent();
        }

        if !canvas.equal.is_empty() {
            formatter.lout("{rank=same;", Some(true));
            for eq in &canvas.equal {
                formatter.lout(&format!("{};", eq.get_name()), None);
            }
            formatter.lout("}", Some(false));
        }

        let default_shape = canvas.shape.as_deref();
        let mut cond_state = ConditionalState {
            lastexit: None,
            lastendif: None,
        };
        for obj in canvas.get_objects(false) {
            traverse_object(&mut formatter, obj, default_shape, canvas, &mut cond_state);
        }

        formatter.lout("//links start", None);

        // Pre-compute group mappings
        let groups: BTreeMap<&str, &GraphGroup> = canvas
            .objects
            .iter()
            .filter_map(|obj| match obj {
                GraphObject::Group(g) => Some((g.name.as_str(), g.as_ref())),
                _ => None,
            })
            .collect();

        for edge in canvas.get_edges() {
            let mut attrs: Vec<String> = Vec::new();
            let mut lhs_name = edge.left.clone();
            let mut rhs_name = edge.right.clone();

            if let Some(ref l) = edge.label {
                if l.contains("::") {
                    let mut parts = l.splitn(2, "::");
                    let left_part = parts.next().unwrap_or("").trim();
                    let right_part = parts.next().unwrap_or("").trim();
                    attrs.push(format!("label=\"{}\"", left_part));
                    attrs.push(format!("xlabel=\"{}\"", right_part));
                } else {
                    attrs.push(format!("label=\"{}\"", l.trim()));
                }
            }

            if let Some(ref c) = edge.color {
                attrs.push(format!("color=\"{}\"", c));
            }

            if let Some(ref tc) = edge.textcolor {
                attrs.push(format!("fontcolor=\"{}\"", tc));
            }

            if let Some(ref u) = edge.url {
                attrs.push(format!("URL=\"{}\"", u));
            }

            // Arrow tails/heads
            let left_arrow = edge.left_arrow_type();
            let right_arrow = edge.right_arrow_type();

            if left_arrow == crate::ast::ArrowType::Double {
                attrs.push("arrowtail=\"diamond\"".to_string());
            } else if left_arrow == crate::ast::ArrowType::Flat {
                attrs.push("arrowtail=\"tee\"".to_string());
            }

            if right_arrow == crate::ast::ArrowType::Double {
                attrs.push("arrowhead=\"diamond\"".to_string());
            } else if right_arrow == crate::ast::ArrowType::Flat {
                attrs.push("arrowhead=\"tee\"".to_string());
            }

            // Line type
            let lt = edge.line_type();
            if lt == "broken" {
                attrs.push("arrowhead=\"tee\"".to_string());
            } else if lt == "dashed" {
                attrs.push("style=\"dashed\"".to_string());
            } else if lt == "dotted" {
                attrs.push("style=\"dotted\"".to_string());
            } else if lt == "double" {
                attrs.push("peripheries=2".to_string());
                let c = edge.color.as_deref().unwrap_or("white");
                attrs.push(format!("color=\"{}:{}:invis\"", c, c));
            }

            // Direction
            let is_bidirectional = edge.edge_type.contains('<') && edge.edge_type.contains('>');
            let is_unidirectional = !edge.edge_type.contains('<') && !edge.edge_type.contains('>');
            let is_left_only = edge.edge_type.contains('<') && !edge.edge_type.contains('>');

            if is_bidirectional {
                attrs.push("dir=both".to_string());
            } else if is_unidirectional {
                attrs.push("dir=none".to_string());
            } else if is_left_only {
                std::mem::swap(&mut lhs_name, &mut rhs_name);
            }

            if let Some(grp) = groups.get(rhs_name.as_str()) {
                if !grp.is_inner_graph {
                    attrs.push(format!(" lhead=cluster_{}", grp.name));
                }
                if let Some(first_obj) = grp.get_objects(false).first() {
                    rhs_name = first_obj.get_name().to_string();
                }
            }

            if let Some(grp) = groups.get(lhs_name.as_str()) {
                if !grp.is_inner_graph {
                    attrs.push(format!(" ltail=cluster_{}", grp.name));
                }
                if let Some(first_obj) = grp.get_objects(false).first() {
                    lhs_name = first_obj.get_name().to_string();
                }
            }

            let mut t = String::new();
            if !attrs.is_empty() {
                attrs.sort();
                t = format!("[ {} ]", attrs.join(", "));
            }

            let lcompass = edge.lcompass.as_deref().unwrap_or("").trim();
            let rcompass = edge.rcompass.as_deref().unwrap_or("").trim();

            formatter.lout(&format!("{}{ldir}->{}{rdir}{t};", lhs_name, rhs_name, ldir = lcompass, rdir = rcompass, t = t), None);
        }

        formatter.lout("}", Some(false));
        formatter.finish()
    }
}

struct ConditionalState {
    lastexit: Option<String>,
    lastendif: Option<String>,
}

fn traverse_object(
    formatter: &mut OutputFormatter,
    obj: &GraphObject,
    default_shape: Option<&str>,
    canvas: &GraphCanvas,
    cond_state: &mut ConditionalState,
) {
    match obj {
        GraphObject::Group(grp) => process_a_group(formatter, grp, default_shape, canvas, cond_state),
        _ => process_a_vertex(formatter, obj, default_shape),
    }
}

fn get_first_lhs_referred_node_from_group(canvas: &GraphCanvas, grp: &GraphGroup) -> Option<String> {
    let grp_objs: std::collections::HashSet<String> = grp.get_objects(true).iter().map(|o| o.get_name().to_string()).collect();
    for edge in canvas.get_edges() {
        if grp_objs.contains(&edge.left) {
            return Some(edge.left.clone());
        }
    }
    grp.get_objects(false).first().map(|o| o.get_name().to_string())
}

fn get_last_lhs_or_rhs_referred_node_in_group(canvas: &GraphCanvas, grp: &GraphGroup) -> Option<String> {
    let grp_objs: std::collections::HashSet<String> = grp.get_objects(true).iter().map(|o| o.get_name().to_string()).collect();
    let mut last_node = None;
    for edge in canvas.get_edges() {
        if grp_objs.contains(&edge.left) {
            last_node = Some(edge.left.clone());
        }
        if grp_objs.contains(&edge.right) {
            last_node = Some(edge.right.clone());
        }
    }
    last_node.or_else(|| grp.get_objects(false).last().map(|o| o.get_name().to_string()))
}

fn process_a_group(
    formatter: &mut OutputFormatter,
    grp: &GraphGroup,
    default_shape: Option<&str>,
    canvas: &GraphCanvas,
    cond_state: &mut ConditionalState,
) {
    formatter.lout(&format!("subgraph cluster_{} {{", grp.name), Some(true));

    if grp.is_inner_graph {
        formatter.lout("graph[ style=invis ];", None);
    }
    if let Some(ref l) = grp.label {
        formatter.lout(&format!("label=\"{}\";", l), None);
    }
    if let Some(ref c) = grp.color {
        formatter.lout("style=filled;", None);
        formatter.lout(&format!("color=\"{}\";", c), None);
    }

    for inner in grp.get_objects(false) {
        traverse_object(formatter, inner, default_shape, canvas, cond_state);
    }

    let cond_str = grp.conditional.as_deref().unwrap_or("");
    formatter.lout(&format!("}}//end of {} {}", grp.name, cond_str), Some(false));

    if let Some(ref cond) = grp.conditional {
        formatter.lout(&format!("//COND {} {}", grp.name, cond), None);
        if cond == "endif" {
            if let Some(ref exit_edge) = grp.conditional_exit_edge {
                if let (Some(lexit), Some(lendif)) = (&cond_state.lastexit, &cond_state.lastendif) {
                    formatter.lout(&format!("{}->{}[ color=red ];", lexit, lendif), None);
                    formatter.lout(&format!("{}->{};", lendif, exit_edge), None);
                }
            }
            cond_state.lastexit = None;
            cond_state.lastendif = None;
        } else {
            let exit_idx = grp.exitvertex.unwrap_or(1);
            let exit_vertex_in_conditional = format!("conditional_{}_{}", cond, exit_idx);
            if cond_state.lastendif.is_none() {
                let last_endif = format!("conditional_endif_{}", exit_idx);
                formatter.lout(&format!("{}[ shape=circle, label=\"\", width=0.01, height=0.01 ];", last_endif), None);
                cond_state.lastendif = Some(last_endif);
            }
            let grp_lbl = grp.label.as_deref().unwrap_or("");
            formatter.lout(&format!("{}[ shape=diamond, fixedsize=true, width=1, height=1, label=\"{}\" ];", exit_vertex_in_conditional, grp_lbl), None);

            if cond == "if" {
                if let Some(ref entry) = grp.conditional_entry_edge {
                    formatter.lout(&format!("{}->{};", entry, exit_vertex_in_conditional), None);
                }
            }

            if let Some(ref prev_exit) = cond_state.lastexit {
                formatter.lout(&format!("{}->{}[ label=\"NO\", color=red ];", prev_exit, exit_vertex_in_conditional), None);
            }

            let first_node = get_first_lhs_referred_node_from_group(canvas, grp);
            let last_node = get_last_lhs_or_rhs_referred_node_in_group(canvas, grp);

            if let Some(ref first) = first_node {
                formatter.lout(
                    &format!("{exit}->{node}[ label=\"YES\", color=green, lhead=cluster_{gname} ];",
                        exit = exit_vertex_in_conditional,
                        node = first,
                        gname = grp.name
                    ),
                    None
                );
            }
            if let (Some(ref last), Some(lendif)) = (last_node, &cond_state.lastendif) {
                formatter.lout(&format!("{}->{}[ label=\"\" ];", last, lendif), None);
            }
            cond_state.lastexit = Some(exit_vertex_in_conditional);
        }
    }
}

fn process_a_vertex(formatter: &mut OutputFormatter, obj: &GraphObject, default_shape: Option<&str>) {
    let mut nattrs: Vec<String> = Vec::new();
    let mut styles: Vec<String> = Vec::new();

    if let Some(c) = obj.get_color() {
        nattrs.push(format!("fillcolor=\"{}\"", c));
        styles.push("filled".to_string());
    }

    if let Some(s) = obj.get_style() {
        styles.push(s.to_string());
    }

    if let Some(url) = obj.get_url() {
        nattrs.push(format!("URL=\"{}\"", url));
    }

    if let Some(tc) = obj.get_textcolor() {
        nattrs.push(format!("fontcolor=\"{}\"", tc));
    }

    if !styles.is_empty() {
        if styles.iter().any(|s| s.contains("singularity")) {
            nattrs.push("shape=\"circle\"".to_string());
            nattrs.push("label=\"\"".to_string());
            nattrs.push("width=0.01".to_string());
            nattrs.push("weight=0.01".to_string());
        } else {
            styles.sort();
            nattrs.push(format!("style=\"{}\"", styles.join(",")));
        }
    }

    if let Some(img) = obj.get_image() {
        nattrs.push(format!("image=\"icons{}\"", img));
        nattrs.push("penwidth=0".to_string());
    }

    let shape_opt = obj.get_shape().or(default_shape);
    if let Some(shape) = shape_opt {
        let (mapped, extras) = get_digraph_shape(shape);
        nattrs.push(format!("shape=\"{}\"", mapped));
        for (k, v) in extras {
            nattrs.push(format!("{}=\"{}\"", k, v));
        }
    }

    if let Some(lbl) = obj.get_label() {
        nattrs.push(format!("label=\"{}\"", lbl));
    }

    let mut t = String::new();
    if !nattrs.is_empty() {
        nattrs.sort();
        t = format!("[ {} ]", nattrs.join(", "));
    }

    formatter.lout(&format!("{}{};", obj.get_name(), t), None);
}

fn get_digraph_shape(shape: &str) -> (&'static str, Vec<(&'static str, &'static str)>) {
    match shape {
        "actor" => ("cds", vec![]),
        "beginpoint" => ("box", vec![("style", "rounded")]),
        "circle" => ("circle", vec![]),
        "cloud" => ("tripleoctagon", vec![]),
        "condition" => ("Mdiamond", vec![]),
        "database" => ("cylinder", vec![]),
        "diamond" => ("diamond", vec![]),
        "dots" => ("point", vec![]),
        "doublecircle" => ("doublecircle", vec![]),
        "ellipse" => ("ellipse", vec![]),
        "endpoint" => ("box", vec![("style", "rounded")]),
        "folder" => ("folder", vec![]),
        "input" => ("parallelogram", vec![]),
        "left" => ("house", vec![("orientation", "90")]),
        "loop" => ("invtrapezium", vec![]),
        "loopin" => ("house", vec![]),
        "loopout" => ("invhouse", vec![]),
        "mail" => ("tab", vec![]),
        "document" => ("polygon", vec![("style", "diagonals"), ("peripheries", "3"), ("skew", "-0.5"), ("distortion", "-0.9"), ("sides", "4")]),
        "display" => ("egg", vec![("width", "2"), ("peripheries", "1"), ("orientation", "90")]),
        "note" => ("note", vec![]),
        "preparation" => ("polygon", vec![("shape", "polygon"), ("sides", "6")]),
        "record" => ("record", vec![]),
        "rect" => ("box", vec![]),
        "right" => ("house", vec![("orientation", "-90")]),
        "roundedbox" => ("box", vec![("style", "rounded")]),
        "square" => ("square", vec![]),
        "subroutine" => ("rect", vec![("peripheries", "2")]),
        _ => ("box", vec![]),
    }
}
