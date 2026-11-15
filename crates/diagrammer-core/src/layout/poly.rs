//! Generalized Poly-Archetype Subgraph execution engine.
//!
//! Enables any Diagrammer native visualizer (layered, state, tree, grid, sequence, force)
//! to host any other visualizer recursively inside group / cluster containers.

use crate::ast::{GraphCanvas, GraphGroup, GraphObject};
use std::collections::HashSet;

/// Representation of an embedded sub-diagram rendered by an independent visualizer engine.
#[derive(Debug, Clone)]
pub struct EmbeddedSubgraph {
    pub visualizer: String,
    pub svg: String,
    pub width: f64,
    pub height: f64,
}

/// Recursively collects all vertex/node names defined within a group.
pub fn collect_group_member_names(grp: &GraphGroup) -> HashSet<String> {
    let mut members = HashSet::new();
    for obj in &grp.objects {
        match obj {
            GraphObject::Vertex(v) => {
                members.insert(v.name.clone());
            }
            GraphObject::VertexRef { vertex } => {
                members.insert(vertex.name.clone());
            }
            GraphObject::Group(sub_grp) => {
                members.insert(sub_grp.name.clone());
                members.extend(collect_group_member_names(sub_grp));
            }
            _ => {}
        }
    }
    members
}

/// Parses the width and height from an SVG string (either via viewBox or explicit width/height attributes).
pub fn parse_svg_dimensions(svg: &str) -> (f64, f64) {
    if let Some(vb_idx) = svg.find("viewBox=\"") {
        let rest = &svg[vb_idx + 9..];
        if let Some(end_idx) = rest.find('"') {
            let parts: Vec<&str> = rest[..end_idx].split_whitespace().collect();
            if parts.len() == 4 {
                let w = parts[2].parse::<f64>().unwrap_or(420.0);
                let h = parts[3].parse::<f64>().unwrap_or(240.0);
                return (w, h);
            }
        }
    }

    let mut w = 420.0;
    let mut h = 240.0;
    if let Some(w_idx) = svg.find("width=\"") {
        let rest = &svg[w_idx + 7..];
        if let Some(end_idx) = rest.find('"') {
            if let Ok(val) = rest[..end_idx].parse::<f64>() {
                w = val;
            }
        }
    }
    if let Some(h_idx) = svg.find("height=\"") {
        let rest = &svg[h_idx + 8..];
        if let Some(end_idx) = rest.find('"') {
            if let Ok(val) = rest[..end_idx].parse::<f64>() {
                h = val;
            }
        }
    }
    (w, h)
}

/// Executes an isolated sub-generator for a group that specifies its own visualizer.
pub fn render_subgraph(
    parent_canvas: &GraphCanvas,
    group: &GraphGroup,
) -> Option<EmbeddedSubgraph> {
    let sub_viz = group.visualizer.as_ref()?;
    let generator = crate::generators::make_generator(sub_viz)?;

    let mut sub_canvas = parent_canvas.clone();
    sub_canvas.visualizer = Some(sub_viz.clone());

    let member_names = collect_group_member_names(group);
    let mut sub_objects = group.objects.clone();

    // Include edges between member nodes from the parent canvas
    for obj in &parent_canvas.objects {
        if let GraphObject::Edge { edge } = obj {
            if member_names.contains(&edge.left) && member_names.contains(&edge.right) {
                sub_objects.push(obj.clone());
            }
        }
    }
    sub_canvas.objects = sub_objects;

    let rendered = generator.generate(&sub_canvas);
    let (w, h) = parse_svg_dimensions(&rendered);

    Some(EmbeddedSubgraph {
        visualizer: sub_viz.clone(),
        svg: rendered,
        width: w,
        height: h,
    })
}
