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

/// Recursively collects all vertex/node names defined within a group, including edge endpoints.
pub fn collect_group_member_names(grp: &GraphGroup, parent_canvas: &GraphCanvas) -> HashSet<String> {
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
                members.extend(collect_group_member_names(sub_grp, parent_canvas));
            }
            _ => {}
        }
    }

    // Also include endpoints of edges belonging to this group
    for obj in &parent_canvas.objects {
        if let GraphObject::Edge { edge } = obj {
            if edge.parent.as_deref() == Some(&grp.name) {
                members.insert(edge.left.clone());
                members.insert(edge.right.clone());
            }
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

    let member_names = collect_group_member_names(group, parent_canvas);
    let mut sub_objects = group.objects.clone();

    // Collect all entities (vertices, references, and groups) already declared within sub_objects
    fn collect_declared_names(objects: &[GraphObject], out: &mut HashSet<String>) {
        for obj in objects {
            match obj {
                GraphObject::Vertex(v) => { out.insert(v.name.clone()); }
                GraphObject::VertexRef { vertex } => { out.insert(vertex.name.clone()); }
                GraphObject::Reference(r) => { out.insert(r.name.clone()); }
                GraphObject::Group(grp) => {
                    out.insert(grp.name.clone());
                    collect_declared_names(&grp.objects, out);
                }
                _ => {}
            }
        }
    }

    let mut existing_entities = HashSet::new();
    collect_declared_names(&sub_objects, &mut existing_entities);

    // Only synthesize vertices for edge endpoints that are not declared anywhere in sub_objects
    for m in &member_names {
        if !existing_entities.contains(m) {
            let parent_vertex = parent_canvas.get_flattened_vertices().into_iter().find(|v| v.get_name() == m);
            let (label, color, textcolor, shape, style, image, url) = if let Some(pv) = parent_vertex {
                (
                    pv.get_label().map(|s| s.to_string()),
                    pv.get_color().map(|s| s.to_string()),
                    pv.get_textcolor().map(|s| s.to_string()),
                    pv.get_shape().map(|s| s.to_string()),
                    pv.get_style().map(|s| s.to_string()),
                    pv.get_image().map(|s| s.to_string()),
                    pv.get_url().map(|s| s.to_string()),
                )
            } else {
                (None, None, None, None, None, None, None)
            };

            sub_objects.push(GraphObject::Vertex(crate::ast::GraphVertex {
                pseudo_type: "GraphVertex".to_string(),
                name: m.clone(),
                label,
                color,
                textcolor,
                shape,
                style,
                image,
                url,
            }));
        }
    }

    // Include edges between member nodes from the parent canvas
    for obj in &parent_canvas.objects {
        if let GraphObject::Edge { edge } = obj {
            let is_child_edge = edge.parent.as_deref() == Some(&group.name)
                || (member_names.contains(&edge.left) && member_names.contains(&edge.right));
            if is_child_edge {
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
