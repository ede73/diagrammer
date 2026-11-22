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

/// Scans rendered SVG for all tagged node bounding boxes (`<g id="node-<id>">...<rect|circle>`),
/// accumulating any parent `<g transform="translate(tx, ty)">` translation offsets.
pub fn extract_svg_node_bounds(svg: &str) -> HashMap<String, SubNodeBounds> {
    let mut bounds = HashMap::new();
    let mut transform_stack: Vec<(f64, f64)> = Vec::new();
    let mut cursor = 0;

    while cursor < svg.len() {
        if let Some(tag_start) = svg[cursor..].find('<') {
            let abs_start = cursor + tag_start;
            if let Some(tag_end) = svg[abs_start..].find('>') {
                let tag = &svg[abs_start..abs_start + tag_end + 1];
                let is_g_open = tag.starts_with("<g") && !tag.ends_with("/>");
                let is_g_close = tag.starts_with("</g");

                if is_g_open {
                    let mut tx = 0.0;
                    let mut ty = 0.0;
                    if let Some(t_idx) = tag.find("transform=\"translate") {
                        let rest = &tag[t_idx + 19..];
                        if let Some(paren_open) = rest.find('(') {
                            let inside = &rest[paren_open + 1..];
                            if let Some(paren_close) = inside.find(')') {
                                let inner = &inside[..paren_close];
                                let parts: Vec<&str> = inner.split(',').collect();
                                if parts.len() == 2 {
                                    tx = parts[0].trim().parse::<f64>().unwrap_or(0.0);
                                    ty = parts[1].trim().parse::<f64>().unwrap_or(0.0);
                                }
                            }
                        }
                    }
                    transform_stack.push((tx, ty));
                }

                // Check if this tag or element has `id="node-"` or `id="group-"`
                let maybe_id = if let Some(n_idx) = tag.find("id=\"node-") {
                    let id_start = n_idx + 9;
                    tag[id_start..].find('"').map(|id_end| tag[id_start..id_start + id_end].to_string())
                } else if let Some(g_idx) = tag.find("id=\"group-") {
                    let id_start = g_idx + 10;
                    tag[id_start..].find('"').map(|id_end| format!("__group__{}", &tag[id_start..id_start + id_end]))
                } else {
                    None
                };

                if let Some(node_id) = maybe_id {
                    let total_tx: f64 = transform_stack.iter().map(|t| t.0).sum();
                    let total_ty: f64 = transform_stack.iter().map(|t| t.1).sum();

                    let rest = &svg[abs_start + tag_end..];
                    let window_len = rest.len().min(1200);
                    let node_block = &rest[..window_len];

                    if let Some(rx) = node_block.find("<rect ") {
                        let rect_str = &node_block[rx..];
                        if let (Some(x), Some(y), Some(w), Some(h)) = (
                            parse_attr(rect_str, "x=\""),
                            parse_attr(rect_str, "y=\""),
                            parse_attr(rect_str, "width=\""),
                            parse_attr(rect_str, "height=\""),
                        ) {
                            bounds.insert(
                                node_id,
                                SubNodeBounds {
                                    x: x + total_tx,
                                    y: y + total_ty,
                                    width: w,
                                    height: h,
                                },
                            );
                        }
                    } else if let Some(cx_idx) = node_block.find("<circle ") {
                        let circle_str = &node_block[cx_idx..];
                        if let (Some(cx), Some(cy), Some(r)) = (
                            parse_attr(circle_str, "cx=\""),
                            parse_attr(circle_str, "cy=\""),
                            parse_attr(circle_str, "r=\""),
                        ) {
                            bounds.insert(
                                node_id,
                                SubNodeBounds {
                                    x: cx - r + total_tx,
                                    y: cy - r + total_ty,
                                    width: r * 2.0,
                                    height: r * 2.0,
                                },
                            );
                        }
                    }
                }

                if is_g_close {
                    transform_stack.pop();
                }

                cursor = abs_start + tag_end + 1;
            } else {
                break;
            }
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

/// Computes tight content bounding box from extracted node/group boundaries
/// and rewrites the sub-SVG's viewBox and dimensions to eliminate excess empty space.
pub fn minify_svg_bounds(
    svg: &str,
    node_bounds: &mut HashMap<String, SubNodeBounds>,
) -> (String, f64, f64) {
    let (orig_w, orig_h) = parse_svg_dimensions(svg);
    if node_bounds.is_empty() {
        return (svg.to_string(), orig_w, orig_h);
    }

    let min_x = node_bounds.values().map(|b| b.x).fold(f64::INFINITY, f64::min);
    let max_x = node_bounds.values().map(|b| b.x + b.width).fold(f64::NEG_INFINITY, f64::max);
    let min_y = node_bounds.values().map(|b| b.y).fold(f64::INFINITY, f64::min);
    let max_y = node_bounds.values().map(|b| b.y + b.height).fold(f64::NEG_INFINITY, f64::max);

    if !min_x.is_finite() || !max_x.is_finite() || !min_y.is_finite() || !max_y.is_finite() {
        return (svg.to_string(), orig_w, orig_h);
    }

    let pad_x = 24.0;
    let pad_y = 20.0;
    let crop_x = (min_x - pad_x).max(0.0);
    let crop_y = (min_y - pad_y).max(0.0);
    let crop_w = (max_x - crop_x + pad_x).max(80.0);
    let crop_h = (max_y - crop_y + pad_y).max(50.0);

    // Only minify if the cropped bounds are meaningfully tighter than the original canvas
    if crop_w >= orig_w && crop_h >= orig_h && crop_x < 5.0 && crop_y < 5.0 {
        return (svg.to_string(), orig_w, orig_h);
    }

    // Adjust all sub-node bounds relative to the new cropped top-left
    for b in node_bounds.values_mut() {
        b.x -= crop_x;
        b.y -= crop_y;
    }

    // Rewrite root <svg ...> tag's viewBox, width, and height
    let mut new_svg = svg.to_string();
    if let Some(svg_tag_end) = new_svg.find('>') {
        let first_tag = &new_svg[..svg_tag_end];
        let mut rewritten_tag = first_tag.to_string();

        // Replace viewBox
        if let Some(vb_idx) = rewritten_tag.find("viewBox=\"") {
            if let Some(end_quote) = rewritten_tag[vb_idx + 9..].find('"') {
                let full_vb = &rewritten_tag[vb_idx..vb_idx + 9 + end_quote + 1];
                rewritten_tag = rewritten_tag.replace(
                    full_vb,
                    &format!("viewBox=\"{:.1} {:.1} {:.1} {:.1}\"", crop_x, crop_y, crop_w, crop_h),
                );
            }
        }

        // Replace width
        if let Some(w_idx) = rewritten_tag.find("width=\"") {
            if let Some(end_quote) = rewritten_tag[w_idx + 7..].find('"') {
                let full_w = &rewritten_tag[w_idx..w_idx + 7 + end_quote + 1];
                rewritten_tag = rewritten_tag.replace(
                    full_w,
                    &format!("width=\"{:.1}\"", crop_w),
                );
            }
        }

        // Replace height
        if let Some(h_idx) = rewritten_tag.find("height=\"") {
            if let Some(end_quote) = rewritten_tag[h_idx + 8..].find('"') {
                let full_h = &rewritten_tag[h_idx..h_idx + 8 + end_quote + 1];
                rewritten_tag = rewritten_tag.replace(
                    full_h,
                    &format!("height=\"{:.1}\"", crop_h),
                );
            }
        }

        new_svg.replace_range(..svg_tag_end, &rewritten_tag);
    }

    (new_svg, crop_w, crop_h)
}

    let rendered = generator.generate(&sub_canvas);
    let mut node_bounds = extract_svg_node_bounds(&rendered);
    let (minified_svg, w, h) = minify_svg_bounds(&rendered, &mut node_bounds);

    Some(EmbeddedSubgraph {
        visualizer: sub_viz.clone(),
        svg: minified_svg,
        width: w,
        height: h,
        node_bounds,
    })
}
