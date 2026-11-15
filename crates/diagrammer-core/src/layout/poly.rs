//! Generalized Poly-Archetype Subgraph execution engine.
//!
//! Enables any Diagrammer native visualizer (layered, state, tree, grid, sequence, force)
//! to host any other visualizer recursively inside group / cluster containers.

use crate::ast::{GraphCanvas, GraphGroup, GraphObject};
use std::collections::{HashMap, HashSet};

/// Geometric bounding box of a node rendered inside a sub-diagram.
#[derive(Debug, Clone, PartialEq)]
pub struct SubNodeBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Representation of an embedded sub-diagram rendered by an independent visualizer engine.
#[derive(Debug, Clone)]
pub struct EmbeddedSubgraph {
    pub visualizer: String,
    pub svg: String,
    pub width: f64,
    pub height: f64,
    pub node_bounds: HashMap<String, SubNodeBounds>,
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

fn parse_attr(tag: &str, attr: &str) -> Option<f64> {
    if let Some(pos) = tag.find(attr) {
        let rest = &tag[pos + attr.len()..];
        if let Some(end) = rest.find('"') {
            return rest[..end].parse::<f64>().ok();
        }
    }
    None
}

/// Scans rendered SVG for all tagged node bounding boxes (`<g id="node-<id>">...<rect|circle>`).
pub fn extract_svg_node_bounds(svg: &str) -> HashMap<String, SubNodeBounds> {
    let mut bounds = HashMap::new();
    let marker = "id=\"node-";
    let mut cursor = 0;
    while let Some(idx) = svg[cursor..].find(marker) {
        let start = cursor + idx + marker.len();
        if let Some(end_id) = svg[start..].find('"') {
            let node_id = &svg[start..start + end_id];
            // Skip bottom mirrored sequence headers
            if !node_id.ends_with("-bottom") {
                let rest = &svg[start + end_id..];
                let search_window_len = rest.len().min(1200);
                let node_block = &rest[..search_window_len];

                if let Some(rx) = node_block.find("<rect ") {
                    let rect_str = &node_block[rx..];
                    if let (Some(x), Some(y), Some(w), Some(h)) = (
                        parse_attr(rect_str, "x=\""),
                        parse_attr(rect_str, "y=\""),
                        parse_attr(rect_str, "width=\""),
                        parse_attr(rect_str, "height=\""),
                    ) {
                        bounds.insert(node_id.to_string(), SubNodeBounds { x, y, width: w, height: h });
                    }
                } else if let Some(cx_idx) = node_block.find("<circle ") {
                    let circle_str = &node_block[cx_idx..];
                    if let (Some(cx), Some(cy), Some(r)) = (
                        parse_attr(circle_str, "cx=\""),
                        parse_attr(circle_str, "cy=\""),
                        parse_attr(circle_str, "r=\""),
                    ) {
                        bounds.insert(node_id.to_string(), SubNodeBounds {
                            x: cx - r,
                            y: cy - r,
                            width: r * 2.0,
                            height: r * 2.0,
                        });
                    }
                }
            }
            cursor = start + end_id;
        } else {
            break;
        }
    }
    bounds
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
    let node_bounds = extract_svg_node_bounds(&rendered);

    Some(EmbeddedSubgraph {
        visualizer: sub_viz.clone(),
        svg: rendered,
        width: w,
        height: h,
        node_bounds,
    })
}
