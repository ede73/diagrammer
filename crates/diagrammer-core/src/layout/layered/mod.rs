use crate::ast::{ArrowType, GraphCanvas, GraphObject};
use std::collections::HashMap;

pub mod default;
pub mod style;
pub mod uml;

pub use default::DefaultStyler;
pub use style::LayeredStyler;
pub use uml::UmlStyler;

#[derive(Debug, Clone, PartialEq)]
pub struct UmlMember {
    pub id: String,
    pub label: String,
}

/// A node positioned on a 2D layer canvas
#[derive(Debug, Clone)]
pub struct LayeredNode {
    pub id: String,
    pub label: String,
    pub shape: String,
    pub style: Option<String>,
    pub image: Option<String>,
    pub width: f64,
    pub height: f64,
    pub x: f64,
    pub y: f64,
    pub layer: usize,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub members: Vec<UmlMember>,
    pub embedded_subgraph: Option<crate::layout::poly::EmbeddedSubgraph>,
}

/// An edge routed between layered nodes
#[derive(Debug, Clone)]
pub struct LayeredEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub edge_type: String,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub points: Vec<(f64, f64)>,
    pub is_inheritance: bool,
    pub left_arrow: ArrowType,
    pub right_arrow: ArrowType,
    pub line_type: String,
    pub is_cross_boundary: bool,
}

/// A visual cluster container grouping multiple layered nodes
#[derive(Debug, Clone)]
pub struct LayeredGroup {
    pub name: String,
    pub label: String,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub member_ids: Vec<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// The complete laid-out DAG ready for rendering
#[derive(Debug, Clone)]
pub struct LayeredGraph {
    pub nodes: HashMap<String, LayeredNode>,
    pub groups: Vec<LayeredGroup>,
    pub edges: Vec<LayeredEdge>,
    pub width: f64,
    pub height: f64,
    pub direction: String,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
    pub type_registry: crate::ast::TypeRegistry,
}

fn create_layered_node_from_obj(
    obj: &GraphObject,
    canvas: &GraphCanvas,
) -> LayeredNode {
    let name = obj.get_name().to_string();
    let label = obj.get_label().unwrap_or(&name).to_string();
    let shape = obj.get_shape().unwrap_or("rounded").to_string();
    let style = obj.get_style().map(|s| s.to_string());
    let image = obj.get_image().map(|s| s.to_string());
    let mut w = ((label.len() as f64) * 8.8 + 36.0).max(84.0);
    let mut h = 40.0;

    if let Some(template) = canvas.type_registry.get_shape(&shape) {
        if let Some(tw) = template.width {
            w = tw;
        }
        if let Some(th) = template.height {
            h = th;
        }
    } else if shape == "circle" || shape == "doublecircle" {
        let sz = w.max(50.0);
        w = sz;
        h = sz;
    } else if shape == "diamond" || shape == "condition" {
        w = (w * 1.15).max(70.0);
        h = 50.0;
    } else if image.is_some() {
        h = 56.0;
        w = w.max(72.0);
    }

    LayeredNode {
        id: name,
        label,
        shape,
        style,
        image,
        width: w,
        height: h,
        x: 0.0,
        y: 0.0,
        layer: 0,
        color: obj.get_color().map(|s| s.to_string()).or_else(|| canvas.defaults.vertexcolor.clone()),
        textcolor: obj.get_textcolor().map(|s| s.to_string()).or_else(|| canvas.defaults.vertextextcolor.clone()),
        members: Vec::new(),
        embedded_subgraph: None,
    }
}

fn is_uml_group(grp: &crate::ast::GraphGroup, canvas: &GraphCanvas) -> bool {
    let visualizer_hint = canvas.visualizer.as_deref().map(|s| s.to_lowercase());
    let is_canvas_uml = matches!(
        visualizer_hint.as_deref(),
        Some("uml") | Some("umlclass") | Some("er")
    );
    if is_canvas_uml {
        return true;
    }
    if grp.objects.iter().any(|o| o.get_shape() == Some("uml_class")) {
        return true;
    }
    let has_internal_edges = grp.objects.iter().any(|o| o.is_edge());
    let has_child_groups = grp.objects.iter().any(|o| matches!(o, GraphObject::Group(_)));
    if has_internal_edges || has_child_groups {
        return false;
    }
    if let Some(ref l) = grp.label {
        let l_lower = l.to_lowercase();
        if l_lower.contains("generalization")
            || l_lower.contains("realization")
            || l_lower.contains("composition")
            || l_lower.contains("aggregation")
            || l.contains(':')
        {
            return true;
        }
    }
    let canvas_has_uml_clues = canvas.get_edges().iter().any(|e| {
        e.label.as_ref().map(|l| {
            let ll = l.to_lowercase();
            ll.contains("triangle") || ll.contains("diamond") || ll.contains("extends") || ll.contains("aggregation")
        }).unwrap_or(false)
    });
    if canvas_has_uml_clues && grp.objects.is_empty() {
        return true;
    }
    let vertices: Vec<&GraphObject> = grp.objects.iter().filter(|o| o.is_vertex()).collect();
    if vertices.len() >= 2
        && vertices.iter().all(|v| {
            let lbl = v.get_label().unwrap_or_else(|| v.get_name());
            lbl.starts_with('+')
                || lbl.starts_with('-')
                || lbl.starts_with('#')
                || lbl.starts_with('~')
                || lbl.contains("()")
                || lbl.contains(':')
        })
    {
        return true;
    }
    false
}

fn collect_cluster_group_vertices(
    grp: &crate::ast::GraphGroup,
    canvas: &GraphCanvas,
    nodes: &mut HashMap<String, LayeredNode>,
    member_ids: &mut Vec<String>,
) {
    for inner in &grp.objects {
        match inner {
            GraphObject::Group(sub) => {
                collect_cluster_group_vertices(sub, canvas, nodes, member_ids);
            }
            _ => {
                if inner.is_vertex() || inner.is_reference() {
                    let name = inner.get_name().to_string();
                    if !member_ids.contains(&name) {
                        member_ids.push(name.clone());
                    }
                    if let Some(existing) = nodes.get_mut(&name) {
                        if let Some(lbl) = inner.get_label() {
                            existing.label = lbl.to_string();
                        }
                        if let Some(c) = inner.get_color() {
                            existing.color = Some(c.to_string());
                        }
                        if let Some(tc) = inner.get_textcolor() {
                            existing.textcolor = Some(tc.to_string());
                        }
                        if let Some(img) = inner.get_image() {
                            existing.image = Some(img.to_string());
                        }
                    } else {
                        nodes.insert(name.clone(), create_layered_node_from_obj(inner, canvas));
                    }
                }
            }
        }
    }
}

impl LayeredGraph {
    /// Builds and calculates coordinates for all nodes and edges in a GraphCanvas
    pub fn build(canvas: &GraphCanvas) -> Self {
        let direction = match canvas.direction.as_deref().map(|s| s.to_lowercase()).as_deref() {
            Some("landscape") | Some("lr") | Some("horizontal") => "LR".to_string(),
            _ => "TD".to_string(),
        };

        let mut nodes: HashMap<String, LayeredNode> = HashMap::new();
        let mut groups: Vec<LayeredGroup> = Vec::new();
        let mut edges: Vec<LayeredEdge> = Vec::new();

        // Identify all composite groups (groups with custom visualizers) and encapsulate their members
        let mut composite_member_nodes: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut composite_group_names: std::collections::HashSet<String> = std::collections::HashSet::new();

        fn collect_all_group_names(grp: &crate::ast::GraphGroup, out: &mut std::collections::HashSet<String>) {
            out.insert(grp.name.clone());
            for obj in &grp.objects {
                if let GraphObject::Group(sub) = obj {
                    collect_all_group_names(sub, out);
                }
            }
        }

        fn find_composite_groups(
            objects: &[GraphObject],
            canvas: &GraphCanvas,
            comp_nodes: &mut std::collections::HashSet<String>,
            comp_groups: &mut std::collections::HashSet<String>,
        ) {
            for obj in objects {
                if let GraphObject::Group(grp) = obj {
                    if grp.visualizer.is_some() {
                        comp_groups.insert(grp.name.clone());
                        collect_all_group_names(grp, comp_groups);
                        comp_nodes.extend(crate::layout::poly::collect_group_member_names(grp, canvas));
                    }
                    find_composite_groups(&grp.objects, canvas, comp_nodes, comp_groups);
                }
            }
        }

        find_composite_groups(&canvas.objects, canvas, &mut composite_member_nodes, &mut composite_group_names);

        // 1. Extract nodes and groups
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    if is_uml_group(grp, canvas) {
                        let mut members = Vec::new();
                        for inner in &grp.objects {
                            if inner.is_vertex() {
                                let id = inner.get_name().to_string();
                                let raw_lbl = inner.get_label().map(|s| s.to_string()).unwrap_or_else(|| id.clone());
                                members.push(UmlMember {
                                    id,
                                    label: raw_lbl,
                                });
                            }
                        }
                        let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                        let max_member_len = members.iter().map(|m| m.label.len()).max().unwrap_or(0);
                        let title_len = label.len();
                        let max_len = max_member_len.max(title_len);

                        let w = ((max_len as f64) * 8.5 + 44.0).max(140.0);
                        let h = if members.is_empty() {
                            44.0
                        } else {
                            36.0 + (members.len() as f64) * 22.0 + 8.0
                        };

                        nodes.insert(
                            grp.name.clone(),
                            LayeredNode {
                                id: grp.name.clone(),
                                label,
                                shape: "uml_class".to_string(),
                                style: None,
                                image: None,
                                width: w,
                                height: h,
                                x: 0.0,
                                y: 0.0,
                                layer: 0,
                                color: grp.color.clone().or_else(|| canvas.defaults.vertexcolor.clone()),
                                textcolor: grp.textcolor.clone().or_else(|| canvas.defaults.vertextextcolor.clone()),
                                members,
                                embedded_subgraph: None,
                            },
                        );
                    } else if grp.visualizer.is_some() {
                        // Poly-archetype: Embedded Subgraph!
                        let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                        if let Some(sub) = crate::layout::poly::render_subgraph(canvas, grp) {
                            let w = sub.width + 48.0;
                            let h = sub.height + 60.0;
                            nodes.insert(
                                grp.name.clone(),
                                LayeredNode {
                                    id: grp.name.clone(),
                                    label,
                                    shape: "poly_composite".to_string(),
                                    style: None,
                                    image: None,
                                    width: w,
                                    height: h,
                                    x: 0.0,
                                    y: 0.0,
                                    layer: 0,
                                    color: grp.color.clone().or_else(|| canvas.defaults.vertexcolor.clone()),
                                    textcolor: grp.textcolor.clone().or_else(|| canvas.defaults.vertextextcolor.clone()),
                                    members: Vec::new(),
                                    embedded_subgraph: Some(sub),
                                },
                            );
                        } else {
                            let mut member_ids = Vec::new();
                            collect_cluster_group_vertices(grp, canvas, &mut nodes, &mut member_ids);
                            let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                            groups.push(LayeredGroup {
                                name: grp.name.clone(),
                                label,
                                color: grp.color.clone(),
                                textcolor: grp.textcolor.clone(),
                                member_ids,
                                x: 0.0,
                                y: 0.0,
                                width: 0.0,
                                height: 0.0,
                            });
                        }
                    } else {
                        // Cluster group container: extract members and register group
                        let mut member_ids = Vec::new();
                        collect_cluster_group_vertices(grp, canvas, &mut nodes, &mut member_ids);
                        let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                        groups.push(LayeredGroup {
                            name: grp.name.clone(),
                            label,
                            color: grp.color.clone(),
                            textcolor: grp.textcolor.clone(),
                            member_ids,
                            x: 0.0,
                            y: 0.0,
                            width: 0.0,
                            height: 0.0,
                        });
                    }
                }
                _ => {
                    if obj.is_vertex() {
                        let name = obj.get_name().to_string();
                        // Encapsulation: Do not register vertices that belong to an embedded composite subgraph
                        if composite_member_nodes.contains(&name) {
                            continue;
                        }
                        if let Some(existing) = nodes.get_mut(&name) {
                            if let Some(lbl) = obj.get_label() {
                                existing.label = lbl.to_string();
                            }
                            if let Some(c) = obj.get_color() {
                                existing.color = Some(c.to_string());
                            }
                            if let Some(tc) = obj.get_textcolor() {
                                existing.textcolor = Some(tc.to_string());
                            }
                            if let Some(img) = obj.get_image() {
                                existing.image = Some(img.to_string());
                            }
                        } else {
                            nodes.insert(name.clone(), create_layered_node_from_obj(obj, canvas));
                        }
                    }
                }
            }
        }

        let mut group_members_map: HashMap<String, String> = HashMap::new();
        for grp in &groups {
            if let Some(first_member) = grp.member_ids.first() {
                group_members_map.insert(grp.name.clone(), first_member.clone());
            }
        }

        // Ensure all edge endpoints exist as nodes (resolving group names to their first member if needed)
        for edge in canvas.get_edges() {
            // Ignore inner edges encapsulated within an embedded composite subgraph
            if edge.parent.as_ref().map_or(false, |p| composite_group_names.contains(p)) {
                continue;
            }
            if composite_member_nodes.contains(&edge.left) || composite_member_nodes.contains(&edge.right) {
                continue;
            }

            let left_target = if !nodes.contains_key(&edge.left) && group_members_map.contains_key(&edge.left) {
                &group_members_map[&edge.left]
            } else {
                &edge.left
            };
            let right_target = if !nodes.contains_key(&edge.right) && group_members_map.contains_key(&edge.right) {
                &group_members_map[&edge.right]
            } else {
                &edge.right
            };

            for endpoint in [left_target, right_target] {
                if !nodes.contains_key(endpoint) && !composite_member_nodes.contains(endpoint) {
                    let w = ((endpoint.len() as f64) * 8.8 + 36.0).max(84.0);
                    nodes.insert(
                        endpoint.clone(),
                        LayeredNode {
                            id: endpoint.clone(),
                            label: endpoint.clone(),
                            shape: "rounded".to_string(),
                            style: None,
                            image: None,
                            width: w,
                            height: 40.0,
                            x: 0.0,
                            y: 0.0,
                            layer: 0,
                            color: canvas.defaults.vertexcolor.clone(),
                            textcolor: canvas.defaults.vertextextcolor.clone(),
                            members: Vec::new(),
                            embedded_subgraph: None,
                        },
                    );
                }
            }
        }

        // 2. Extract edges and identify inheritance relationships
        let raw_edges = canvas.get_edges();
        for edge in &raw_edges {
            // Skip inner edges of composite subgraphs
            if edge.parent.as_ref().map_or(false, |p| composite_group_names.contains(p)) {
                continue;
            }
            if composite_member_nodes.contains(&edge.left) || composite_member_nodes.contains(&edge.right) {
                continue;
            }
            let left_target = if !nodes.contains_key(&edge.left) && group_members_map.contains_key(&edge.left) {
                group_members_map[&edge.left].clone()
            } else {
                edge.left.clone()
            };
            let right_target = if !nodes.contains_key(&edge.right) && group_members_map.contains_key(&edge.right) {
                group_members_map[&edge.right].clone()
            } else {
                edge.right.clone()
            };

            // Deduplicate identical edges
            let is_duplicate = edges.iter().any(|e| {
                e.from == left_target
                    && e.to == right_target
                    && e.label == edge.label
                    && e.edge_type == edge.edge_type
                    && e.line_type == edge.line_type()
            });
            if is_duplicate {
                continue;
            }

            let is_inh = edge.edge_type.contains('<') || edge.edge_type.contains('>');
            edges.push(LayeredEdge {
                from: left_target,
                to: right_target,
                label: edge.label.clone(),
                edge_type: edge.edge_type.clone(),
                color: edge.color.clone().or_else(|| canvas.defaults.edgecolor.clone()),
                textcolor: edge.textcolor.clone().or_else(|| canvas.defaults.edgetextcolor.clone()),
                points: Vec::new(),
                is_inheritance: is_inh,
                left_arrow: edge.left_arrow_type(),
                right_arrow: edge.right_arrow_type(),
                line_type: edge.line_type().to_string(),
                is_cross_boundary: false,
            });
        }

        // 3. Phase 1: Topological Layer Assignment (Longest Path Leveling)
        let mut in_degrees: HashMap<String, usize> = HashMap::new();
        let mut adj: HashMap<String, Vec<String>> = HashMap::new();
        for id in nodes.keys() {
            in_degrees.insert(id.clone(), 0);
            adj.insert(id.clone(), Vec::new());
        }

        for e in &edges {
            if nodes.contains_key(&e.from) && nodes.contains_key(&e.to) && e.from != e.to {
                adj.entry(e.from.clone()).or_default().push(e.to.clone());
                *in_degrees.entry(e.to.clone()).or_default() += 1;
            }
        }

        // Find roots (in-degree == 0)
        let mut roots: Vec<String> = nodes
            .keys()
            .filter(|id| in_degrees.get(*id).copied().unwrap_or(0) == 0)
            .cloned()
            .collect();
        roots.sort();

        // If cycles exist or no root found, pick the first lexicographical node as root
        if roots.is_empty() && !nodes.is_empty() {
            let mut all_ids: Vec<String> = nodes.keys().cloned().collect();
            all_ids.sort();
            roots.push(all_ids[0].clone());
        }

        // Longest path leveling using Bellman-Ford / BFS traversal with cycle protection
        let mut layers_map: HashMap<String, usize> = HashMap::new();
        for r in &roots {
            layers_map.insert(r.clone(), 0);
        }

        let max_iterations = nodes.len().max(1);
        for _ in 0..max_iterations {
            let mut changed = false;
            for e in &edges {
                if let Some(&u_layer) = layers_map.get(&e.from) {
                    let v_layer = layers_map.get(&e.to).copied().unwrap_or(0);
                    if u_layer + 1 > v_layer {
                        layers_map.insert(e.to.clone(), u_layer + 1);
                        changed = true;
                    }
                }
            }
            if !changed {
                break;
            }
        }

        // Assign default layer 0 to any unreached disconnected node
        for id in nodes.keys() {
            layers_map.entry(id.clone()).or_insert(0);
        }

        for (id, layer) in &layers_map {
            if let Some(node) = nodes.get_mut(id) {
                node.layer = *layer;
            }
        }

        // 4. Phase 2: Crossing Reduction & Ordering within Layers (Barycenter heuristic)
        let max_layer = layers_map.values().copied().max().unwrap_or(0);
        let mut layers: Vec<Vec<String>> = vec![Vec::new(); max_layer + 1];
        for (id, &layer) in &layers_map {
            layers[layer].push(id.clone());
        }

        // Sort initial roots lexicographically
        layers[0].sort();

        // Downward barycenter sweep
        for l in 1..=max_layer {
            let pos_in_prev: HashMap<String, f64> = layers[l - 1]
                .iter()
                .enumerate()
                .map(|(i, id)| (id.clone(), i as f64))
                .collect();

            layers[l].sort_by(|a, b| {
                let a_parents: Vec<f64> = edges
                    .iter()
                    .filter(|e| e.to == *a && pos_in_prev.contains_key(&e.from))
                    .map(|e| pos_in_prev[&e.from])
                    .collect();
                let b_parents: Vec<f64> = edges
                    .iter()
                    .filter(|e| e.to == *b && pos_in_prev.contains_key(&e.from))
                    .map(|e| pos_in_prev[&e.from])
                    .collect();

                let a_bary: f64 = if a_parents.is_empty() {
                    0.0
                } else {
                    a_parents.iter().sum::<f64>() / (a_parents.len() as f64)
                };
                let b_bary: f64 = if b_parents.is_empty() {
                    0.0
                } else {
                    b_parents.iter().sum::<f64>() / (b_parents.len() as f64)
                };

                a_bary.partial_cmp(&b_bary).unwrap_or(std::cmp::Ordering::Equal).then_with(|| a.cmp(b))
            });
        }

        // 5. Phase 3: Coordinate Assignment (X, Y)
        let node_sep = 36.0;
        let rank_sep = 60.0;
        let margin_x = 40.0;
        let margin_y = 40.0;

        let is_lr = direction == "LR";

        if !is_lr {
            // TD (Top-Down) Placement
            let mut curr_y = margin_y;
            let mut max_layer_width = 0.0;

            for layer in &layers {
                let layer_nodes: Vec<&LayeredNode> = layer.iter().map(|id| &nodes[id]).collect();
                let layer_w: f64 = layer_nodes.iter().map(|n| n.width).sum::<f64>()
                    + ((layer_nodes.len().saturating_sub(1)) as f64) * node_sep;
                if layer_w > max_layer_width {
                    max_layer_width = layer_w;
                }
            }

            for layer in &layers {
                let layer_nodes: Vec<&LayeredNode> = layer.iter().map(|id| &nodes[id]).collect();
                let layer_w: f64 = layer_nodes.iter().map(|n| n.width).sum::<f64>()
                    + ((layer_nodes.len().saturating_sub(1)) as f64) * node_sep;
                let start_x = margin_x + (max_layer_width - layer_w) / 2.0;

                let mut curr_x = start_x;
                let max_h: f64 = layer_nodes.iter().map(|n| n.height).fold(0.0, f64::max);

                for id in layer {
                    if let Some(node) = nodes.get_mut(id) {
                        node.x = curr_x;
                        node.y = curr_y;
                        curr_x += node.width + node_sep;
                    }
                }
                curr_y += max_h + rank_sep;
            }
        } else {
            // LR (Left-to-Right) Placement
            let mut curr_x = margin_x;
            let mut max_layer_height = 0.0;

            for layer in &layers {
                let layer_nodes: Vec<&LayeredNode> = layer.iter().map(|id| &nodes[id]).collect();
                let layer_h: f64 = layer_nodes.iter().map(|n| n.height).sum::<f64>()
                    + ((layer_nodes.len().saturating_sub(1)) as f64) * node_sep;
                if layer_h > max_layer_height {
                    max_layer_height = layer_h;
                }
            }

            for layer in &layers {
                let layer_nodes: Vec<&LayeredNode> = layer.iter().map(|id| &nodes[id]).collect();
                let layer_h: f64 = layer_nodes.iter().map(|n| n.height).sum::<f64>()
                    + ((layer_nodes.len().saturating_sub(1)) as f64) * node_sep;
                let start_y = margin_y + (max_layer_height - layer_h) / 2.0;

                let mut curr_y = start_y;
                let max_w: f64 = layer_nodes.iter().map(|n| n.width).fold(0.0, f64::max);

                for id in layer {
                    if let Some(node) = nodes.get_mut(id) {
                        node.x = curr_x;
                        node.y = curr_y;
                        curr_y += node.height + node_sep;
                    }
                }
                curr_x += max_w + rank_sep;
            }
        }

        // 6. Phase 4: Edge Routing with Port Distribution and Multi-Track Channel Assignment
        let mut exit_ports: HashMap<usize, (f64, f64)> = HashMap::new();
        let mut entry_ports: HashMap<usize, (f64, f64)> = HashMap::new();

        // 6a. Compute source exit ports per node
        let mut node_out_edges: HashMap<String, Vec<usize>> = HashMap::new();
        for (idx, e) in edges.iter().enumerate() {
            node_out_edges.entry(e.from.clone()).or_default().push(idx);
        }
        for (u_id, mut out_idxs) in node_out_edges {
            if let Some(u) = nodes.get(&u_id) {
                // Sort outgoing edges by target node's coordinate to prevent line crossings
                out_idxs.sort_by(|&a, &b| {
                    let to_a_x = nodes.get(&edges[a].to).map(|v| if !is_lr { v.x } else { v.y }).unwrap_or(0.0);
                    let to_b_x = nodes.get(&edges[b].to).map(|v| if !is_lr { v.x } else { v.y }).unwrap_or(0.0);
                    to_a_x.partial_cmp(&to_b_x).unwrap_or(std::cmp::Ordering::Equal)
                });
                let count = out_idxs.len();
                for (i, &edge_idx) in out_idxs.iter().enumerate() {
                    let exit = if !is_lr {
                        let frac = (i as f64 + 1.0) / (count as f64 + 1.0);
                        (u.x + u.width * frac, u.y + u.height)
                    } else {
                        let frac = (i as f64 + 1.0) / (count as f64 + 1.0);
                        (u.x + u.width, u.y + u.height * frac)
                    };
                    exit_ports.insert(edge_idx, exit);
                }
            }
        }

        // 6b. Compute target entry ports per node
        let mut node_in_edges: HashMap<String, Vec<usize>> = HashMap::new();
        for (idx, e) in edges.iter().enumerate() {
            node_in_edges.entry(e.to.clone()).or_default().push(idx);
        }
        for (v_id, mut in_idxs) in node_in_edges {
            if let Some(v) = nodes.get(&v_id) {
                // Sort incoming edges by source node's coordinate to prevent line crossings
                in_idxs.sort_by(|&a, &b| {
                    let from_a_x = nodes.get(&edges[a].from).map(|u| if !is_lr { u.x } else { u.y }).unwrap_or(0.0);
                    let from_b_x = nodes.get(&edges[b].from).map(|u| if !is_lr { u.x } else { u.y }).unwrap_or(0.0);
                    from_a_x.partial_cmp(&from_b_x).unwrap_or(std::cmp::Ordering::Equal)
                });
                let count = in_idxs.len();
                for (j, &edge_idx) in in_idxs.iter().enumerate() {
                    let entry = if !is_lr {
                        let frac = (j as f64 + 1.0) / (count as f64 + 1.0);
                        (v.x + v.width * frac, v.y)
                    } else {
                        let frac = (j as f64 + 1.0) / (count as f64 + 1.0);
                        (v.x, v.y + v.height * frac)
                    };
                    entry_ports.insert(edge_idx, entry);
                }
            }
        }

        // 6c. Multi-Track Channel Assignment for orthogonal elbow routes
        // Group edges by layer channel to assign distinct non-overlapping tracks
        let mut channel_edges: HashMap<(usize, usize), Vec<usize>> = HashMap::new();
        for (idx, e) in edges.iter().enumerate() {
            if let (Some(u), Some(v)) = (nodes.get(&e.from), nodes.get(&e.to)) {
                let min_l = u.layer.min(v.layer);
                let max_l = u.layer.max(v.layer);
                channel_edges.entry((min_l, max_l)).or_default().push(idx);
            }
        }

        let mut edge_track_offsets: HashMap<usize, f64> = HashMap::new();
        for (_channel, mut c_edges) in channel_edges {
            // Sort edges in this channel by average X coordinate so tracks don't cross
            c_edges.sort_by(|&a, &b| {
                let mid_a = match (exit_ports.get(&a), entry_ports.get(&a)) {
                    (Some(p1), Some(p2)) => if !is_lr { (p1.0 + p2.0) / 2.0 } else { (p1.1 + p2.1) / 2.0 },
                    _ => 0.0,
                };
                let mid_b = match (exit_ports.get(&b), entry_ports.get(&b)) {
                    (Some(p1), Some(p2)) => if !is_lr { (p1.0 + p2.0) / 2.0 } else { (p1.1 + p2.1) / 2.0 },
                    _ => 0.0,
                };
                mid_a.partial_cmp(&mid_b).unwrap_or(std::cmp::Ordering::Equal)
            });

            let count = c_edges.len();
            for (p, &e_idx) in c_edges.iter().enumerate() {
                if count > 1 {
                    let offset = ((p as f64) - (count as f64 - 1.0) / 2.0) * 14.0;
                    edge_track_offsets.insert(e_idx, offset);
                } else {
                    edge_track_offsets.insert(e_idx, 0.0);
                }
            }
        }

        // 6d. Build final routing points
        for (idx, e) in edges.iter_mut().enumerate() {
            if let (Some(&exit), Some(&entry)) = (exit_ports.get(&idx), entry_ports.get(&idx)) {
                let track_offset = edge_track_offsets.get(&idx).copied().unwrap_or(0.0);
                if !is_lr {
                    if (exit.0 - entry.0).abs() < 1.0 && track_offset.abs() < 0.1 {
                        e.points = vec![exit, entry];
                    } else {
                        let max_offset = ((entry.1 - exit.1).abs() / 2.0 - 10.0).max(0.0);
                        let clamped_offset = track_offset.clamp(-max_offset, max_offset);
                        let mid_y = (exit.1 + entry.1) / 2.0 + clamped_offset;
                        e.points = vec![exit, (exit.0, mid_y), (entry.0, mid_y), entry];
                    }
                } else {
                    if (exit.1 - entry.1).abs() < 1.0 && track_offset.abs() < 0.1 {
                        e.points = vec![exit, entry];
                    } else {
                        let max_offset = ((entry.0 - exit.0).abs() / 2.0 - 10.0).max(0.0);
                        let clamped_offset = track_offset.clamp(-max_offset, max_offset);
                        let mid_x = (exit.0 + entry.0) / 2.0 + clamped_offset;
                        e.points = vec![exit, (mid_x, exit.1), (mid_x, entry.1), entry];
                    }
                }
            }
        }

        // Calculate group bounding boxes
        for grp in &mut groups {
            let member_nodes: Vec<&LayeredNode> = grp
                .member_ids
                .iter()
                .filter_map(|id| nodes.get(id))
                .collect();
            if !member_nodes.is_empty() {
                let pad_x = 16.0;
                let pad_top = 28.0;
                let pad_bottom = 16.0;
                let min_x = member_nodes.iter().map(|n| n.x).fold(f64::INFINITY, f64::min) - pad_x;
                let min_y = member_nodes.iter().map(|n| n.y).fold(f64::INFINITY, f64::min) - pad_top;
                let max_x = member_nodes.iter().map(|n| n.x + n.width).fold(f64::NEG_INFINITY, f64::max) + pad_x;
                let max_y = member_nodes.iter().map(|n| n.y + n.height).fold(f64::NEG_INFINITY, f64::max) + pad_bottom;

                grp.x = min_x.max(8.0);
                grp.y = min_y.max(8.0);
                grp.width = (max_x - grp.x).max(100.0);
                grp.height = (max_y - grp.y).max(50.0);
            }
        }

        // 7. Route Cross-Boundary Inter-Group Edges
        #[derive(Debug, Clone, Copy)]
        #[allow(dead_code)]
        struct NodeAnchor {
            x: f64,
            y: f64,
            width: f64,
            height: f64,
            center_x: f64,
            center_y: f64,
            is_inside_subgraph: bool,
        }

        let mut all_node_anchors: HashMap<String, NodeAnchor> = HashMap::new();
        let mut node_to_composite_group: HashMap<String, String> = HashMap::new();

        // 1. Top-level leaf nodes (excluding composite containers which are hosts)
        for node in nodes.values() {
            if node.embedded_subgraph.is_none() {
                let (anchor_y, anchor_h) = if node.shape == "uml_class" && !node.members.is_empty() {
                    (node.y, 32.0)
                } else {
                    (node.y, node.height)
                };

                all_node_anchors.insert(
                    node.id.clone(),
                    NodeAnchor {
                        x: node.x,
                        y: anchor_y,
                        width: node.width,
                        height: anchor_h,
                        center_x: node.x + node.width / 2.0,
                        center_y: anchor_y + anchor_h / 2.0,
                        is_inside_subgraph: false,
                    },
                );

                if node.shape == "uml_class" {
                    let row_h = 22.0;
                    for (idx, member) in node.members.iter().enumerate() {
                        let member_y = node.y + 32.0 + 11.0 + (idx as f64) * row_h;
                        let member_x = node.x + 8.0;
                        let member_w = ((member.label.len() as f64) * 7.5 + 14.0).max(48.0);
                        all_node_anchors.insert(
                            member.id.clone(),
                            NodeAnchor {
                                x: member_x,
                                y: member_y - 10.0,
                                width: member_w,
                                height: 20.0,
                                center_x: member_x + member_w / 2.0,
                                center_y: member_y,
                                is_inside_subgraph: false,
                            },
                        );
                    }
                }
            }

            // 2. Resolve internal child nodes within composite subgraphs
            if let Some(ref sub) = node.embedded_subgraph {
                let sub_dim = crate::layout::poly::parse_svg_dimensions(&sub.svg);
                let sub_x = node.x + (node.width - sub_dim.0).max(0.0) / 2.0;
                let sub_y = node.y + 44.0;

                for (child_id, bounds) in &sub.node_bounds {
                    let abs_x = sub_x + bounds.x;
                    let abs_y = sub_y + bounds.y;
                    all_node_anchors.insert(
                        child_id.clone(),
                        NodeAnchor {
                            x: abs_x,
                            y: abs_y,
                            width: bounds.width,
                            height: bounds.height,
                            center_x: abs_x + bounds.width / 2.0,
                            center_y: abs_y + bounds.height / 2.0,
                            is_inside_subgraph: true,
                        },
                    );
                    node_to_composite_group.insert(child_id.clone(), node.id.clone());
                }
            }
        }

        let center_x = if !nodes.is_empty() {
            nodes.values().map(|n| n.x + n.width / 2.0).sum::<f64>() / (nodes.len() as f64)
        } else {
            300.0
        };
        let min_canvas_x = nodes.values().map(|n| n.x).fold(center_x, f64::min);
        let max_canvas_x = nodes.values().map(|n| n.x + n.width).fold(center_x, f64::max);
        let gutter_left = (min_canvas_x - 70.0).max(40.0);
        let gutter_right = max_canvas_x + 70.0;

        let mut cross_boundary_idx = 0usize;
        for e in &raw_edges {
            if e.parent.as_ref().map_or(false, |p| composite_group_names.contains(p)) {
                continue;
            }
            let grp_left = node_to_composite_group.get(&e.left);
            let grp_right = node_to_composite_group.get(&e.right);

            // Skip internal edges where BOTH endpoints belong to the same composite group
            if grp_left.is_some() && grp_left == grp_right {
                continue;
            }

            let (u_anchor, v_anchor) = match (all_node_anchors.get(&e.left), all_node_anchors.get(&e.right)) {
                (Some(a), Some(b)) => (*a, *b),
                _ => continue,
            };

            let is_cross = u_anchor.is_inside_subgraph || v_anchor.is_inside_subgraph;
            if !is_cross {
                continue;
            }

            cross_boundary_idx += 1;
            let stagger = ((cross_boundary_idx - 1) % 4) as f64 * 16.0;

            // Obstacle collision avoidance: count horizontal entry/exit segment intersections with intermediate nodes
            let collides_h = |x_start: f64, x_end: f64, y: f64| -> usize {
                let min_x = x_start.min(x_end);
                let max_x = x_start.max(x_end);
                let mut count = 0;
                for (id, a) in &all_node_anchors {
                    if id == &e.left || id == &e.right {
                        continue;
                    }
                    // Skip containers that physically enclose the endpoints
                    let is_enclosing_u = a.x <= u_anchor.x + 1.0
                        && a.x + a.width >= u_anchor.x + u_anchor.width - 1.0
                        && a.y <= u_anchor.y + 1.0
                        && a.y + a.height >= u_anchor.y + u_anchor.height - 1.0;
                    let is_enclosing_v = a.x <= v_anchor.x + 1.0
                        && a.x + a.width >= v_anchor.x + v_anchor.width - 1.0
                        && a.y <= v_anchor.y + 1.0
                        && a.y + a.height >= v_anchor.y + v_anchor.height - 1.0;
                    if is_enclosing_u || is_enclosing_v {
                        continue;
                    }

                    // Skip internal members/children enclosed by u_anchor or v_anchor
                    let is_inside_u = a.x >= u_anchor.x - 1.0
                        && a.x + a.width <= u_anchor.x + u_anchor.width + 1.0
                        && a.y >= u_anchor.y - 1.0
                        && a.y + a.height <= u_anchor.y + u_anchor.height + 1.0;
                    let is_inside_v = a.x >= v_anchor.x - 1.0
                        && a.x + a.width <= v_anchor.x + v_anchor.width + 1.0
                        && a.y >= v_anchor.y - 1.0
                        && a.y + a.height <= v_anchor.y + v_anchor.height + 1.0;
                    if is_inside_u || is_inside_v {
                        continue;
                    }

                    if y >= a.y && y <= a.y + a.height {
                        if max_x > a.x + 2.0 && min_x < a.x + a.width - 2.0 {
                            count += 1;
                        }
                    }
                }
                count
            };

            let left_collisions = collides_h(gutter_left, u_anchor.x, u_anchor.center_y)
                + collides_h(gutter_left, v_anchor.x, v_anchor.center_y);
            let right_collisions = collides_h(u_anchor.x + u_anchor.width, gutter_right, u_anchor.center_y)
                + collides_h(v_anchor.x + v_anchor.width, gutter_right, v_anchor.center_y);

            let use_right = if left_collisions != right_collisions {
                left_collisions > right_collisions
            } else {
                (u_anchor.center_x + v_anchor.center_x) / 2.0 >= center_x
            };

            let gutter_x = if use_right {
                gutter_right + 20.0 + stagger
            } else {
                (gutter_left - 20.0 - stagger).max(30.0)
            };

            let p_start = if use_right {
                (u_anchor.x + u_anchor.width, u_anchor.center_y)
            } else {
                (u_anchor.x, u_anchor.center_y)
            };
            let p_end = if use_right {
                (v_anchor.x + v_anchor.width, v_anchor.center_y)
            } else {
                (v_anchor.x, v_anchor.center_y)
            };

            let points = vec![
                p_start,
                (gutter_x, p_start.1),
                (gutter_x, p_end.1),
                p_end,
            ];

            let is_inh = e.edge_type.contains('<') || e.edge_type.contains('>');
            edges.push(LayeredEdge {
                from: e.left.clone(),
                to: e.right.clone(),
                label: e.label.clone(),
                edge_type: e.edge_type.clone(),
                color: e.color.clone().or_else(|| Some("#38bdf8".to_string())),
                textcolor: e.textcolor.clone().or_else(|| canvas.defaults.edgetextcolor.clone()),
                points,
                is_inheritance: is_inh,
                left_arrow: e.left_arrow_type(),
                right_arrow: e.right_arrow_type(),
                line_type: e.line_type().to_string(),
                is_cross_boundary: true,
            });
        }

        // Calculate total canvas bounds
        let max_node_x = nodes.values().map(|n| n.x + n.width).fold(300.0, f64::max);
        let max_grp_x = groups.iter().map(|g| g.x + g.width).fold(300.0, f64::max);
        let max_x = max_node_x.max(max_grp_x);

        let max_node_y = nodes.values().map(|n| n.y + n.height).fold(200.0, f64::max);
        let max_grp_y = groups.iter().map(|g| g.y + g.height).fold(200.0, f64::max);
        let max_y = max_node_y.max(max_grp_y);

        let max_gutter_x = if cross_boundary_idx > 0 {
            gutter_right + 60.0 + (cross_boundary_idx as f64) * 16.0
        } else {
            max_x
        };
        let total_w = max_x.max(max_gutter_x) + margin_x;
        let total_h = max_y + margin_y;

        Self {
            nodes,
            groups,
            edges,
            width: total_w,
            height: total_h,
            direction,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
            type_registry: canvas.type_registry.clone(),
        }
    }

    /// Renders the calculated graph into a standalone, theme-adaptive vector SVG
    pub fn render_svg(&self) -> String {
        self.render_svg_with_styler(None)
    }

    /// Renders the calculated graph into SVG using the given visualizer hint
    pub fn render_svg_with_styler(&self, visualizer_hint: Option<&str>) -> String {
        let styler: Box<dyn LayeredStyler> = match visualizer_hint.map(|s| s.to_lowercase()).as_deref() {
            Some("uml") | Some("umlclass") | Some("er") => Box::new(UmlStyler),
            _ => {
                // If any node is a uml_class shape, default to UmlStyler
                if self.nodes.values().any(|n| n.shape == "uml_class") {
                    Box::new(UmlStyler)
                } else {
                    Box::new(DefaultStyler)
                }
            }
        };

        self.render_svg_internal(styler.as_ref())
    }

    fn render_svg_internal(&self, styler: &dyn LayeredStyler) -> String {
        let mut svg = String::with_capacity(16 * 1024);

        let bg_color = self.background.as_deref().unwrap_or("#1e1e2e");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#3b82f6");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#94a3b8");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-layered-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

        // Dynamic operator arrowhead markers
        let mut custom_markers = String::new();
        for op in self.type_registry.operators.values() {
            if let Some(ref ah) = op.arrowhead {
                let op_marker_id = format!("dl-op-{}", crate::layout::shapes::sanitize_operator_id(&op.symbol));
                let stroke_c = op.color.as_deref().unwrap_or(default_edge_stroke);
                crate::layout::shapes::render_custom_marker(
                    &op_marker_id,
                    ah,
                    Some(&self.type_registry),
                    stroke_c,
                    &mut custom_markers,
                );
            }
        }

        // SVG Defs: Shadows, Markers, Gradients
        svg.push_str(&format!(
            r##"  <defs>
    <filter id="dl-shadow" x="-8%" y="-8%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25" flood-color="#000000" />
    </filter>
    <!-- Arrowhead markers -->
    <marker id="dl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="{}" />
    </marker>
    <marker id="dl-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
    </marker>
    <marker id="dl-arrow-inheritance" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <polygon points="0,1 12,6 0,11" fill="#ffffff" stroke="{}" stroke-width="1.5" />
    </marker>
{}  </defs>

  <style>
    .dl-bg {{ fill: {}; }}
    .dl-node {{ cursor: pointer; transition: transform 0.15s ease; }}
    .dl-node:hover {{ filter: brightness(1.08); }}
    .dl-node-box {{
      stroke-width: 1.5;
      rx: 6px;
      ry: 6px;
    }}
    .dl-class-box {{
      stroke-width: 1.5;
      rx: 4px;
      ry: 4px;
    }}
    .dl-class-header {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
    .dl-class-member {{
      font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
      font-size: 11px;
      fill: #cbd5e1;
      dominant-baseline: central;
    }}
    .dl-node-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
    .dl-group-box {{
      fill: rgba(30, 41, 59, 0.35);
      stroke-width: 1.5;
      stroke-dasharray: 5,4;
    }}
    .dl-group-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }}
    .dl-edge-path {{
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }}
    .dl-edge-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 600;
      fill: #cbd5e1;
      text-anchor: middle;
      dominant-baseline: central;
      paint-order: stroke fill;
      stroke: {};
      stroke-width: 3.5px;
      stroke-linejoin: round;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dl-bg" />

"##,
            default_edge_stroke, default_edge_stroke, custom_markers, bg_color, bg_color
        ));

        // 0. Render Groups / Clusters
        if !self.groups.is_empty() {
            svg.push_str("  <!-- Groups / Clusters -->\n  <g class=\"dl-groups-group\">\n");
            for grp in &self.groups {
                if grp.width <= 0.0 || grp.height <= 0.0 {
                    continue;
                }
                let stroke_c = grp.color.as_deref().unwrap_or("#64748b");
                let label_c = grp.textcolor.as_deref().unwrap_or("#94a3b8");
                svg.push_str(&format!(
                    r##"    <g class="dl-group" id="group-{}">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="8.0" ry="8.0" class="dl-group-box" stroke="{}" />
      <text x="{:.1}" y="{:.1}" class="dl-group-label" fill="{}">{}</text>
    </g>
"##,
                    escape_xml(&grp.name),
                    grp.x, grp.y, grp.width, grp.height, stroke_c,
                    grp.x + 12.0, grp.y + 16.0,
                    label_c, escape_xml(&grp.label)
                ));
            }
            svg.push_str("  </g>\n\n");
        }

        // 1. Render Edges
        svg.push_str("  <!-- Edges -->\n  <g class=\"dl-edges-group\">\n");
        for edge in &self.edges {
            if edge.is_cross_boundary || edge.points.len() < 2 {
                continue;
            }
            let edge_color = edge.color.as_deref().unwrap_or(default_edge_stroke);
            let mut path_d = String::new();
            for (i, pt) in edge.points.iter().enumerate() {
                if i == 0 {
                    path_d.push_str(&format!("M {:.1} {:.1}", pt.0, pt.1));
                } else {
                    path_d.push_str(&format!(" L {:.1} {:.1}", pt.0, pt.1));
                }
            }

            let op_opt = self.type_registry.get_operator(&edge.edge_type);

            let (marker_start_attr, marker_end_attr) = if let Some(op) = op_opt {
                if op.arrowhead.is_some() {
                    let op_marker_url = format!("url(#dl-op-{})", crate::layout::shapes::sanitize_operator_id(&op.symbol));
                    let is_bidi = op.edge_type.as_deref() == Some("bidirectional") || (edge.edge_type.contains('<') && edge.edge_type.contains('>'));
                    let is_none = op.edge_type.as_deref() == Some("none") || op.edge_type.as_deref() == Some("undirected");
                    if is_bidi {
                        (format!(" marker-start=\"{}\"", op_marker_url), format!(" marker-end=\"{}\"", op_marker_url))
                    } else if is_none {
                        (String::new(), String::new())
                    } else {
                        (String::new(), format!(" marker-end=\"{}\"", op_marker_url))
                    }
                } else {
                    let is_bidi = op.edge_type.as_deref() == Some("bidirectional") || (edge.edge_type.contains('<') && edge.edge_type.contains('>'));
                    let is_none = op.edge_type.as_deref() == Some("none") || op.edge_type.as_deref() == Some("undirected");
                    let marker_url = if edge.is_inheritance { "url(#dl-arrow-inheritance)" } else { "url(#dl-arrow)" };
                    if is_bidi {
                        (format!(" marker-start=\"{}\"", marker_url), format!(" marker-end=\"{}\"", marker_url))
                    } else if is_none {
                        (String::new(), String::new())
                    } else {
                        (String::new(), format!(" marker-end=\"{}\"", marker_url))
                    }
                }
            } else {
                let is_bidi = edge.edge_type.contains('<') && edge.edge_type.contains('>');
                let marker_url = if edge.is_inheritance { "url(#dl-arrow-inheritance)" } else { "url(#dl-arrow)" };
                if is_bidi {
                    (format!(" marker-start=\"{}\"", marker_url), format!(" marker-end=\"{}\"", marker_url))
                } else if edge.edge_type.contains('>') {
                    (String::new(), format!(" marker-end=\"{}\"", marker_url))
                } else if edge.edge_type.contains('<') {
                    (format!(" marker-start=\"{}\"", marker_url), String::new())
                } else {
                    (String::new(), String::new())
                }
            };

            let is_bold = edge.line_type == "bold" || op_opt.and_then(|o| o.style.as_deref()) == Some("bold");
            let stroke_width_attr = if is_bold { " stroke-width=\"3.0\"" } else { "" };
            let is_dashed = edge.line_type == "dashed" || op_opt.and_then(|o| o.style.as_deref()) == Some("dashed");
            let is_dotted = edge.line_type == "dotted" || op_opt.and_then(|o| o.style.as_deref()) == Some("dotted");
            let dash_attr = if is_dashed {
                " stroke-dasharray=\"6,4\""
            } else if is_dotted {
                " stroke-dasharray=\"2,4\""
            } else {
                ""
            };

            svg.push_str(&format!(
                r#"    <path d="{}" class="dl-edge-path" stroke="{}"{}{}{}{} />
"#,
                path_d, edge_color, marker_start_attr, marker_end_attr, dash_attr, stroke_width_attr
            ));

            // Render Edge Label if present (borderless with SVG halo, floating cleanly on the track)
            styler.render_edge_label(edge, &mut svg);
        }
        svg.push_str("  </g>\n\n");

        // 2. Render Nodes
        svg.push_str("  <!-- Nodes -->\n  <g class=\"dl-nodes-group\">\n");
        let mut sorted_nodes: Vec<&LayeredNode> = self.nodes.values().collect();
        sorted_nodes.sort_by_key(|n| (n.layer, n.x as i64));

        for node in sorted_nodes {
            styler.render_node(node, default_node_fill, Some(&self.type_registry), &mut svg);
        }
        svg.push_str("  </g>\n\n");

        // 3. Render Cross-Boundary Inter-Group Edges (on top layer so lines & arrowheads entering containers are crisp)
        let cross_edges: Vec<&LayeredEdge> = self.edges.iter().filter(|e| e.is_cross_boundary).collect();
        if !cross_edges.is_empty() {
            svg.push_str("  <!-- Cross-Boundary Inter-Group Edges -->\n  <g class=\"dl-inter-group-edges\">\n");
            for edge in cross_edges {
                if edge.points.len() < 2 {
                    continue;
                }
                let stroke = edge.color.as_deref().unwrap_or("#38bdf8");
                let is_bold = edge.line_type == "bold";
                let is_dashed = edge.line_type == "dashed";
                let is_dotted = edge.line_type == "dotted";
                let dash_attr = if is_dotted {
                    r#" stroke-dasharray="2,4""#
                } else if is_dashed {
                    r#" stroke-dasharray="6,4""#
                } else {
                    ""
                };
                let stroke_width_attr = if is_bold { " stroke-width=\"3.0\"" } else { " stroke-width=\"2.0\"" };

                let mut path_d = String::new();
                for (i, pt) in edge.points.iter().enumerate() {
                    if i == 0 {
                        path_d.push_str(&format!("M {:.1} {:.1}", pt.0, pt.1));
                    } else {
                        path_d.push_str(&format!(" L {:.1} {:.1}", pt.0, pt.1));
                    }
                }

                svg.push_str(&format!(
                    r#"    <path d="{}" class="dl-edge-path dl-cross-edge" fill="none" stroke="{}"{}{}{} marker-end="url(#dl-arrow-active)" />
"#,
                    path_d, stroke, dash_attr, stroke_width_attr, ""
                ));

                styler.render_edge_label(edge, &mut svg);
            }
            svg.push_str("  </g>\n\n");
        }
        svg.push_str("</svg>\n");

        svg
    }
}

pub fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_layered_dag_simple_chain() {
        let input = "a > b > c";
        let canvas = AstBuilder::new().build(input).unwrap();
        let graph = LayeredGraph::build(&canvas);

        assert_eq!(graph.nodes.len(), 3);
        assert_eq!(graph.nodes["a"].layer, 0);
        assert_eq!(graph.nodes["b"].layer, 1);
        assert_eq!(graph.nodes["c"].layer, 2);

        // In TD mode, Y positions must strictly increase
        assert!(graph.nodes["a"].y < graph.nodes["b"].y);
        assert!(graph.nodes["b"].y < graph.nodes["c"].y);

        let svg = graph.render_svg();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("class=\"diagrammer-layered-svg\""));
        assert!(svg.contains("node-a"));
        assert!(svg.contains("node-b"));
        assert!(svg.contains("node-c"));
        assert!(svg.contains("dl-edge-path"));
    }

    #[test]
    fn test_layered_dag_branching_and_uml_structure() {
        let input = r#"
{Person;Person
name;+String
birth;#Date
}
Student, Professor > Person
"#;
        let canvas = AstBuilder::new().build(input).unwrap();
        let graph = LayeredGraph::build(&canvas);

        assert!(graph.nodes.contains_key("Person"));
        assert!(graph.nodes.contains_key("Student"));
        assert!(graph.nodes.contains_key("Professor"));

        let person = &graph.nodes["Person"];
        assert_eq!(person.shape, "uml_class");
        assert_eq!(person.members.len(), 2);

        let svg = graph.render_svg();
        assert!(svg.contains("dl-class-node"));
        assert!(svg.contains("dl-class-header"));
        assert!(svg.contains("dl-arrow-inheritance"));
    }

    #[test]
    fn test_layered_dag_group_containment_and_no_duplicate_nodes() {
        let input = "s\n{dummy\n  a > s\n}\n";
        let canvas = AstBuilder::new().build(input).unwrap();
        let graph = LayeredGraph::build(&canvas);

        // Must contain exactly 2 nodes: 'a' and 's', with NO duplicates
        assert_eq!(graph.nodes.len(), 2);
        assert!(graph.nodes.contains_key("a"));
        assert!(graph.nodes.contains_key("s"));

        // Must contain 1 cluster group (dummy) enclosing both 'a' and 's'
        assert_eq!(graph.groups.len(), 1);
        let dummy = &graph.groups[0];
        assert_eq!(dummy.name, "dummy");
        assert!(dummy.member_ids.contains(&"a".to_string()));
        assert!(dummy.member_ids.contains(&"s".to_string()));
        assert!(dummy.width > 0.0);
        assert!(dummy.height > 0.0);

        let svg = graph.render_svg();
        assert!(svg.contains("dl-group-box"));
        assert!(svg.contains("group-dummy"));
        assert!(svg.contains("node-a"));
        assert!(svg.contains("node-s"));
    }

    #[test]
    fn test_layered_dag_network_clusters_and_cross_group_edges() {
        let input = r#"
inet
{comcast
  cablemodem
  router
}
inet - cablemodem
"#;
        let canvas = AstBuilder::new().build(input).unwrap();
        let graph = LayeredGraph::build(&canvas);

        // Exactly 3 nodes: inet, cablemodem, router (no duplicate cablemodem)
        assert_eq!(graph.nodes.len(), 3);
        assert!(graph.nodes.contains_key("inet"));
        assert!(graph.nodes.contains_key("cablemodem"));
        assert!(graph.nodes.contains_key("router"));

        assert_eq!(graph.groups.len(), 1);
        assert_eq!(graph.groups[0].name, "comcast");

        let svg = graph.render_svg();
        assert!(svg.contains("group-comcast"));
        assert!(svg.contains("node-inet"));
        assert!(svg.contains("node-cablemodem"));
    }
}
