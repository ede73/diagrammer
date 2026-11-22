//! Native State Diagram & Statechart layout engine in pure Rust.
//!
//! Provides intelligent layout for finite state machines (FSMs), statecharts, and
//! lifecycle diagrams. Supports:
//! - Entry/terminal state identification and vertical lifecycle spine
//! - Multi-column parallel phase lanes (e.g. Active vs Passive close in TCP)
//! - Perimeter gutter routing for bypass, loopback, reset, and timeout transitions
//! - Composable Poly-Archetype Subgraph execution (groups with their own visualizer)
//! - Composite States with embedded sub-archetypes and sub-flows

use std::collections::{HashMap, HashSet};
use crate::ast::{GraphCanvas, GraphObject};
use crate::layout::layered::escape_xml;
use crate::layout::shapes::render_svg_node;

/// Helper to parse viewBox width and height from generated sub-SVG
fn parse_svg_dimensions(svg: &str) -> (f64, f64) {
    if let Some(pos) = svg.find("viewBox=\"") {
        let rest = &svg[pos + 9..];
        if let Some(end) = rest.find('"') {
            let parts: Vec<&str> = rest[..end]
                .split(|c: char| c.is_whitespace() || c == ',')
                .filter(|s| !s.is_empty())
                .collect();
            if parts.len() == 4 {
                let w = parts[2].parse::<f64>().unwrap_or(420.0);
                let h = parts[3].parse::<f64>().unwrap_or(240.0);
                return (w, h);
            }
        }
    }
    (420.0, 240.0)
}

/// Representation of a state node
#[derive(Debug, Clone)]
pub struct StateNode {
    pub id: String,
    pub label: String,
    pub shape: String,
    pub style: Option<String>,
    pub image: Option<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub is_start: bool,
    pub is_end: bool,
    pub group: Option<String>,
    pub column: i32,
    pub rank: usize,
    pub is_composite: bool,
    pub composite_sub_svg: Option<String>,
    pub composite_subgraph: Option<crate::layout::poly::EmbeddedSubgraph>,
    pub composite_tasks: Vec<String>,
    pub composite_label: Option<String>,
}

/// Representation of a state group / cluster or embedded sub-visualizer
#[derive(Debug, Clone)]
pub struct StateGroup {
    pub id: String,
    pub label: String,
    pub color: Option<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub member_nodes: Vec<String>,
    pub sub_visualizer: Option<String>,
    pub sub_svg: Option<String>,
}

/// Edge / state transition
#[derive(Debug, Clone)]
pub struct StateEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub color: Option<String>,
    pub style: Option<String>,
    pub path_d: String,
    pub label_x: f64,
    pub label_y: f64,
    pub is_loopback: bool,
    pub is_cross_boundary: bool,
}

/// Standalone State Machine layout engine in pure Rust
#[derive(Debug, Clone)]
pub struct StateGraph {
    pub nodes: HashMap<String, StateNode>,
    pub groups: Vec<StateGroup>,
    pub edges: Vec<StateEdge>,
    pub width: f64,
    pub height: f64,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
    pub type_registry: crate::ast::TypeRegistry,
    pub debug_bounding_boxes: Option<String>,
}

impl StateGraph {
    /// Builds and computes state diagram coordinates
    pub fn new(canvas: &GraphCanvas) -> Self {
        let mut nodes: HashMap<String, StateNode> = HashMap::new();
        let mut groups: Vec<StateGroup> = Vec::new();

        // 1. Identify top-level edge endpoints
        let raw_edges = canvas.get_edges();
        let mut top_level_endpoints: HashSet<String> = HashSet::new();
        for e in &raw_edges {
            top_level_endpoints.insert(e.left.clone());
            top_level_endpoints.insert(e.right.clone());
        }

        // 2. Discover composite groups vs cluster groups
        let mut composite_groups: HashMap<String, (Option<crate::layout::poly::EmbeddedSubgraph>, Vec<String>, Option<String>, Option<String>, f64, f64)> = HashMap::new();
        let mut composite_member_nodes: HashSet<String> = HashSet::new();
        let mut composite_group_names: HashSet<String> = HashSet::new();
        let mut node_to_cluster_group: HashMap<String, String> = HashMap::new();

        fn collect_all_group_names(grp: &crate::ast::GraphGroup, out: &mut HashSet<String>) {
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
            comp_nodes: &mut HashSet<String>,
            comp_groups: &mut HashSet<String>,
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

        for obj in &canvas.objects {
            if let GraphObject::Group(grp) = obj {
                let is_composite = grp.visualizer.is_some() || top_level_endpoints.contains(&grp.name);
                let grp_label = grp.label.clone().unwrap_or_else(|| grp.name.clone());

                if is_composite {
                    if grp.visualizer.is_some() {
                        // Poly-archetype: Embedded Subgraph!
                        let sub_opt = crate::layout::poly::render_subgraph(canvas, grp);
                        let (sub_w, sub_h) = if let Some(ref sub) = sub_opt {
                            (sub.width, sub.height)
                        } else {
                            (420.0, 240.0)
                        };

                        composite_groups.insert(
                            grp.name.clone(),
                            (sub_opt, Vec::new(), Some(grp_label), grp.color.clone(), sub_w, sub_h),
                        );
                    } else {
                        // Ordinary composite group (display list of tasks)
                        let mut inner_tasks = Vec::new();
                        for m in &grp.objects {
                            if m.is_vertex() || m.is_reference() {
                                inner_tasks.push(m.get_label().unwrap_or_else(|| m.get_name()).to_string());
                                composite_member_nodes.insert(m.get_name().to_string());
                            }
                        }

                        composite_groups.insert(
                            grp.name.clone(),
                            (None, inner_tasks, Some(grp_label), grp.color.clone(), 420.0, 100.0),
                        );
                    }
                } else {
                    // Cluster group (e.g. PassiveClose or ActiveClose in state_tcp)
                    let mut member_names = Vec::new();
                    for m in &grp.objects {
                        match m {
                            GraphObject::Vertex(v) => {
                                member_names.push(v.name.clone());
                                node_to_cluster_group.insert(v.name.clone(), grp.name.clone());
                            }
                            GraphObject::VertexRef { vertex } => {
                                member_names.push(vertex.name.clone());
                                node_to_cluster_group.insert(vertex.name.clone(), grp.name.clone());
                            }
                            GraphObject::Reference(r) => {
                                member_names.push(r.name.clone());
                                node_to_cluster_group.insert(r.name.clone(), grp.name.clone());
                            }
                            _ => {}
                        }
                    }

                    groups.push(StateGroup {
                        id: grp.name.clone(),
                        label: grp_label,
                        color: grp.color.clone(),
                        x: 0.0,
                        y: 0.0,
                        width: 0.0,
                        height: 0.0,
                        member_nodes: member_names,
                        sub_visualizer: grp.visualizer.clone(),
                        sub_svg: None,
                    });
                }
            }
        }

        // 3. Collect vertices: exclude internal members of composite states
        let raw_vertices = canvas.get_flattened_vertices();
        let explicit_start = canvas.start.as_deref();
        let mut in_degrees: HashMap<String, usize> = HashMap::new();
        let mut out_degrees: HashMap<String, usize> = HashMap::new();

        for e in &raw_edges {
            if e.parent.as_ref().map_or(false, |p| composite_group_names.contains(p)) {
                continue;
            }
            if composite_member_nodes.contains(&e.left) || composite_member_nodes.contains(&e.right) {
                continue;
            }
            *in_degrees.entry(e.left.clone()).or_insert(0) += 0;
            *out_degrees.entry(e.left.clone()).or_insert(0) += 1;
            *in_degrees.entry(e.right.clone()).or_insert(0) += 1;
            *out_degrees.entry(e.right.clone()).or_insert(0) += 0;
        }

        for v in raw_vertices {
            let name = v.get_name().to_string();
            // Skip vertices that belong inside a composite state
            if composite_member_nodes.contains(&name) || composite_group_names.contains(&name) {
                continue;
            }
            // If this vertex is a composite group, we will add the composite node instead
            if composite_groups.contains_key(&name) {
                continue;
            }

            let label = v.get_label().unwrap_or(&name).to_string();
            let shape = v.get_shape().unwrap_or("rect").to_string();
            let style = v.get_style().map(|s| s.to_string());
            let image = v.get_image().map(|s| s.to_string());
            let color = v.get_color().map(|s| s.to_string());
            let textcolor = v.get_textcolor().map(|s| s.to_string());

            let name_lower = name.to_lowercase();
            let is_start = explicit_start == Some(&name)
                || name_lower == "start"
                || name_lower == "xstart"
                || name_lower == "closed"
                || name_lower == "init"
                || (in_degrees.get(&name).copied().unwrap_or(0) == 0 && out_degrees.get(&name).copied().unwrap_or(0) > 0);

            let is_end = name_lower.ends_with("_end")
                || name_lower == "end"
                || name_lower == "stop"
                || name_lower == "terminal"
                || (out_degrees.get(&name).copied().unwrap_or(0) == 0 && in_degrees.get(&name).copied().unwrap_or(0) > 0);

            let lines: Vec<&str> = label.split("\\n").collect();
            let max_line_len = lines.iter().map(|l| l.len()).max().unwrap_or(4);
            let width = if shape == "beginpoint" || shape == "endpoint" || shape == "circle" {
                36.0
            } else {
                (max_line_len as f64 * 8.5 + 36.0).max(110.0)
            };
            let height = if shape == "beginpoint" || shape == "endpoint" || shape == "circle" {
                36.0
            } else {
                (lines.len() as f64 * 16.0 + 26.0).max(44.0)
            };

            let grp = node_to_cluster_group.get(&name).cloned();

            nodes.insert(
                name.clone(),
                StateNode {
                    id: name,
                    label,
                    shape,
                    style,
                    image,
                    x: 0.0,
                    y: 0.0,
                    width,
                    height,
                    color,
                    textcolor,
                    is_start,
                    is_end,
                    group: grp,
                    column: 0,
                    rank: 0,
                    is_composite: false,
                    composite_sub_svg: None,
                    composite_subgraph: None,
                    composite_tasks: Vec::new(),
                    composite_label: None,
                },
            );
        }

        // Add composite groups as StateNodes
        let max_composite_w = composite_groups
            .values()
            .map(|(sub_opt, tasks, _, _, sw, _)| {
                if sub_opt.is_some() {
                    (*sw + 48.0).max(480.0)
                } else if !tasks.is_empty() {
                    ((tasks.len() as f64) * 110.0 + 80.0).max(480.0)
                } else {
                    480.0
                }
            })
            .fold(480.0, f64::max);

        for (grp_name, (sub_opt, tasks, lbl, clr, _sw, sh)) in composite_groups {
            let width = max_composite_w;

            let height = if sub_opt.is_some() {
                sh + 54.0
            } else if !tasks.is_empty() {
                116.0
            } else {
                80.0
            };

            let is_start = explicit_start == Some(&grp_name)
                || (in_degrees.get(&grp_name).copied().unwrap_or(0) == 0 && out_degrees.get(&grp_name).copied().unwrap_or(0) > 0);

            let is_end = out_degrees.get(&grp_name).copied().unwrap_or(0) == 0 && in_degrees.get(&grp_name).copied().unwrap_or(0) > 0;

            let sub_svg = sub_opt.as_ref().map(|s| s.svg.clone());

            nodes.insert(
                grp_name.clone(),
                StateNode {
                    id: grp_name.clone(),
                    label: lbl.clone().unwrap_or_else(|| grp_name.clone()),
                    shape: "rect".to_string(),
                    style: None,
                    image: None,
                    x: 0.0,
                    y: 0.0,
                    width,
                    height,
                    color: clr,
                    textcolor: None,
                    is_start,
                    is_end,
                    group: None,
                    column: 0,
                    rank: 0,
                    is_composite: true,
                    composite_sub_svg: sub_svg,
                    composite_subgraph: sub_opt,
                    composite_tasks: tasks,
                    composite_label: lbl,
                },
            );
        }

        // 4. Topological ranking & Lane assignment
        let mut forward_adj: HashMap<String, Vec<String>> = HashMap::new();
        for e in &raw_edges {
            if e.parent.as_ref().map_or(false, |p| composite_group_names.contains(p)) {
                continue;
            }
            if composite_member_nodes.contains(&e.left) || composite_member_nodes.contains(&e.right) {
                continue;
            }
            if e.left != e.right {
                forward_adj.entry(e.left.clone()).or_default().push(e.right.clone());
            }
        }

        // Topological Longest-Path Ranking for DAG
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        for id in nodes.keys() {
            in_degree.entry(id.clone()).or_insert(0);
        }
        for succs in forward_adj.values() {
            for s in succs {
                *in_degree.entry(s.clone()).or_default() += 1;
            }
        }

        let mut queue = std::collections::VecDeque::new();
        for (id, &deg) in &in_degree {
            if deg == 0 {
                queue.push_back(id.clone());
            }
        }

        while let Some(curr) = queue.pop_front() {
            let curr_rank = nodes.get(&curr).map_or(0, |n| n.rank);
            if let Some(succs) = forward_adj.get(&curr) {
                for s in succs {
                    if let Some(succ_node) = nodes.get_mut(s) {
                        succ_node.rank = succ_node.rank.max(curr_rank + 1);
                    }
                    if let Some(deg) = in_degree.get_mut(s) {
                        *deg = deg.saturating_sub(1);
                        if *deg == 0 {
                            queue.push_back(s.clone());
                        }
                    }
                }
            }
        }

        // Assign columns for cluster groups (e.g. PassiveClose vs ActiveClose in TCP)
        let cluster_groups: Vec<&StateGroup> = groups.iter().filter(|g| !g.member_nodes.is_empty()).collect();
        if cluster_groups.len() >= 2 {
            let g0_name = cluster_groups[0].id.clone();
            let g1_name = cluster_groups[1].id.clone();

            for node in nodes.values_mut() {
                if let Some(ref g) = node.group {
                    if g == &g0_name {
                        node.column = -1;
                    } else if g == &g1_name {
                        node.column = 1;
                    }
                }
            }
        }

        // Heuristics for ungrouped nodes in branching graphs
        for n in nodes.values_mut() {
            if n.column == 0 && !n.is_start && !n.is_end && !n.is_composite {
                let id_lower = n.id.to_lowercase();
                if id_lower.contains("listen") || id_lower.contains("rcvd") || id_lower.contains("received") {
                    n.column = -1;
                } else if id_lower.contains("sent") {
                    n.column = 1;
                }
            }
        }

        // Group nodes by rank
        let mut rank_nodes: HashMap<usize, Vec<String>> = HashMap::new();
        for (id, node) in &nodes {
            rank_nodes.entry(node.rank).or_default().push(id.clone());
        }

        let mut sorted_ranks: Vec<usize> = rank_nodes.keys().copied().collect();
        sorted_ranks.sort();

        // 5. Dynamic Non-Overlapping Coordinates Calculation
        let mut max_w_by_col: HashMap<i32, f64> = HashMap::new();
        for r in &sorted_ranks {
            let node_ids = rank_nodes.get(r).unwrap();
            let mut by_col_count: HashMap<i32, Vec<String>> = HashMap::new();
            for id in node_ids {
                if let Some(node) = nodes.get(id) {
                    by_col_count.entry(node.column).or_default().push(id.clone());
                }
            }
            for (col, c_ids) in by_col_count {
                let count = c_ids.len();
                let row_w: f64 = c_ids.iter().map(|id| nodes.get(id).map_or(110.0, |n| n.width)).sum::<f64>()
                    + (count.saturating_sub(1) as f64) * 24.0;
                let entry = max_w_by_col.entry(col).or_insert(110.0);
                *entry = entry.max(row_w);
            }
        }

        let w_left = max_w_by_col.get(&-1).copied().unwrap_or(0.0);
        let w_center = max_w_by_col.get(&0).copied().unwrap_or(480.0).max(480.0);
        let w_right = max_w_by_col.get(&1).copied().unwrap_or(0.0);

        let gutter_margin = 50.0f64;
        let column_gap = 60.0f64;

        // Dynamic column centers ensuring non-overlapping columns and positive coordinates
        let center_x = if w_left > 0.0 {
            gutter_margin + w_left + column_gap + w_center / 2.0
        } else {
            gutter_margin + w_center / 2.0 + 80.0
        };

        let left_col_x = center_x - (w_center / 2.0 + column_gap + w_left / 2.0);
        let right_col_x = center_x + (w_center / 2.0 + column_gap + w_right / 2.0);

        let rank_gap = 55.0;
        let margin_top = 50.0;

        let mut current_y = margin_top;
        for r in &sorted_ranks {
            let node_ids = rank_nodes.get(r).unwrap();
            let mut max_h_in_rank = 44.0f64;

            // Group nodes in this rank by column to distribute horizontally
            let mut by_col: HashMap<i32, Vec<String>> = HashMap::new();
            for id in node_ids {
                if let Some(node) = nodes.get(id) {
                    by_col.entry(node.column).or_default().push(id.clone());
                }
            }

            for (col, c_ids) in by_col {
                let base_x = match col {
                    -1 => left_col_x,
                    1 => right_col_x,
                    _ => center_x,
                };
                let count = c_ids.len();
                let total_w: f64 = c_ids.iter().map(|id| nodes.get(id).map_or(110.0, |n| n.width)).sum::<f64>()
                    + (count.saturating_sub(1) as f64) * 24.0;
                let mut curr_x = base_x - total_w / 2.0;
                for id in &c_ids {
                    if let Some(node) = nodes.get_mut(id) {
                        node.x = curr_x;
                        node.y = current_y;
                        curr_x += node.width + 24.0;
                        max_h_in_rank = max_h_in_rank.max(node.height);
                    }
                }
            }
            current_y += max_h_in_rank + rank_gap;
        }

        // Compute group bounding boxes around cluster member nodes
        for grp in &mut groups {
            let mut min_x = f64::MAX;
            let mut max_x = f64::MIN;
            let mut min_y = f64::MAX;
            let mut max_y = f64::MIN;

            for m in &grp.member_nodes {
                if let Some(n) = nodes.get(m) {
                    min_x = min_x.min(n.x);
                    max_x = max_x.max(n.x + n.width);
                    min_y = min_y.min(n.y);
                    max_y = max_y.max(n.y + n.height);
                }
            }

            if min_x <= max_x && min_y <= max_y {
                grp.x = min_x - 16.0;
                grp.y = min_y - 32.0;
                grp.width = (max_x - min_x) + 32.0;
                grp.height = (max_y - min_y) + 48.0;
            }
        }

        // Guarantee strictly non-overlapping groups by checking pairwise collisions
        for i in 0..groups.len() {
            for j in (i + 1)..groups.len() {
                let g1_x = groups[i].x;
                let g1_r = groups[i].x + groups[i].width;
                let g1_y = groups[i].y;
                let g1_b = groups[i].y + groups[i].height;

                let g2_x = groups[j].x;
                let g2_r = groups[j].x + groups[j].width;
                let g2_y = groups[j].y;
                let g2_b = groups[j].y + groups[j].height;

                let overlap_x = (g1_r.min(g2_r) - g1_x.max(g2_x)).max(0.0);
                let overlap_y = (g1_b.min(g2_b) - g1_y.max(g2_y)).max(0.0);

                if overlap_x > 0.0 && overlap_y > 0.0 {
                    if g1_x < g2_x {
                        let shift = overlap_x + 24.0;
                        groups[j].x += shift;
                        for m in &groups[j].member_nodes {
                            if let Some(node) = nodes.get_mut(m) {
                                node.x += shift;
                            }
                        }
                    } else {
                        let shift = overlap_x + 24.0;
                        groups[i].x += shift;
                        for m in &groups[i].member_nodes {
                            if let Some(node) = nodes.get_mut(m) {
                                node.x += shift;
                            }
                        }
                    }
                }
            }
        }

        // 6. Collect all obstacles (groups & composite containers) that edge routing must avoid
        struct Obstacle {
            id: String,
            x: f64,
            y: f64,
            width: f64,
            height: f64,
        }

        let mut obstacles: Vec<Obstacle> = Vec::new();
        for grp in &groups {
            if grp.width > 0.0 && grp.height > 0.0 {
                obstacles.push(Obstacle {
                    id: grp.id.clone(),
                    x: grp.x,
                    y: grp.y,
                    width: grp.width,
                    height: grp.height,
                });
            }
        }
        for node in nodes.values() {
            if node.is_composite {
                obstacles.push(Obstacle {
                    id: node.id.clone(),
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                });
            }
        }

        // 7. Route Edges with Obstacle Avoidance and Perimeter Gutters
        let min_canvas_x = nodes.values().map(|n| n.x).fold(center_x, f64::min);
        let max_canvas_x = nodes.values().map(|n| n.x + n.width).fold(center_x, f64::max);
        let gutter_left = (min_canvas_x - 70.0).max(40.0);
        let gutter_right = max_canvas_x + 70.0;

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

        // 1. Top-level nodes (both leaf states and composite containers)
        for node in nodes.values() {
            all_node_anchors.insert(
                node.id.clone(),
                NodeAnchor {
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                    center_x: node.x + node.width / 2.0,
                    center_y: node.y + node.height / 2.0,
                    is_inside_subgraph: false,
                },
            );

            // 2. Resolve internal child nodes within composite subgraphs
            if let Some(ref sub) = node.composite_subgraph {
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

        let mut edges: Vec<StateEdge> = Vec::new();
        let mut inter_group_idx = 0usize;

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

            let is_source_seq = all_node_anchors.contains_key(&format!("{}-bottom", e.left));
            let is_target_seq = all_node_anchors.contains_key(&format!("{}-bottom", e.right));

            let u_anchor = if is_source_seq {
                all_node_anchors.get(&format!("{}-bottom", e.left))
            } else {
                all_node_anchors.get(&e.left)
            };
            let v_anchor = all_node_anchors.get(&e.right);

            let (u_anchor, v_anchor) = match (u_anchor, v_anchor) {
                (Some(a), Some(b)) => (*a, *b),
                _ => continue,
            };

            let is_cross_boundary = u_anchor.is_inside_subgraph || v_anchor.is_inside_subgraph;

            if is_cross_boundary {
                inter_group_idx += 1;
                let stagger = ((inter_group_idx - 1) % 4) as f64 * 16.0;

                // Obstacle collision avoidance: count horizontal entry/exit segment intersections with intermediate nodes
                let collides_h = |x_start: f64, x_end: f64, y: f64| -> usize {
                    let min_x = x_start.min(x_end);
                    let max_x = x_start.max(x_end);
                    let mut count = 0;
                    for (id, a) in &all_node_anchors {
                        if id == &e.left || id == &e.right || id == &format!("{}-bottom", e.left) || id == &format!("{}-bottom", e.right) {
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

                let u_left_x = if is_source_seq { u_anchor.center_x } else { u_anchor.x };
                let u_right_x = if is_source_seq { u_anchor.center_x } else { u_anchor.x + u_anchor.width };
                let v_left_x = if is_target_seq { v_anchor.center_x } else { v_anchor.x };
                let v_right_x = if is_target_seq { v_anchor.center_x } else { v_anchor.x + v_anchor.width };

                let left_collisions = collides_h(gutter_left, u_left_x, u_anchor.center_y)
                    + collides_h(gutter_left, v_left_x, v_anchor.center_y);
                let right_collisions = collides_h(u_right_x, gutter_right, u_anchor.center_y)
                    + collides_h(v_right_x, gutter_right, v_anchor.center_y);

                let use_right = if left_collisions != right_collisions {
                    left_collisions > right_collisions
                } else {
                    (u_anchor.center_x + v_anchor.center_x) / 2.0 >= center_x
                };

                let gutter_x = if use_right {
                    gutter_right + 20.0 + stagger
                } else {
                    gutter_left - 20.0 - stagger
                };

                let u_collides = if !is_source_seq {
                    if use_right {
                        collides_h(u_anchor.x + u_anchor.width, gutter_right, u_anchor.center_y) > 0
                    } else {
                        collides_h(gutter_left, u_anchor.x, u_anchor.center_y) > 0
                    }
                } else {
                    false
                };

                let v_collides = if !is_target_seq {
                    if use_right {
                        collides_h(v_anchor.x + v_anchor.width, gutter_right, v_anchor.center_y) > 0
                    } else {
                        collides_h(gutter_left, v_anchor.x, v_anchor.center_y) > 0
                    }
                } else {
                    false
                };

                let y_start_h = if is_source_seq {
                    u_anchor.y + u_anchor.height + 16.0
                } else if u_collides {
                    if v_anchor.center_y < u_anchor.center_y {
                        u_anchor.y - 14.0
                    } else {
                        u_anchor.y + u_anchor.height + 14.0
                    }
                } else {
                    u_anchor.center_y
                };

                let y_end_h = if is_target_seq {
                    v_anchor.y - 16.0
                } else if v_collides {
                    if u_anchor.center_y < v_anchor.center_y {
                        v_anchor.y - 14.0
                    } else {
                        v_anchor.y + v_anchor.height + 14.0
                    }
                } else {
                    v_anchor.center_y
                };

                let p_start = if is_source_seq {
                    (u_anchor.center_x, u_anchor.y + u_anchor.height)
                } else if u_collides {
                    (u_anchor.center_x, if v_anchor.center_y < u_anchor.center_y { u_anchor.y } else { u_anchor.y + u_anchor.height })
                } else if use_right {
                    (u_anchor.x + u_anchor.width, u_anchor.center_y)
                } else {
                    (u_anchor.x, u_anchor.center_y)
                };

                let p_end = if is_target_seq {
                    (v_anchor.center_x, v_anchor.y)
                } else if v_collides {
                    (v_anchor.center_x, if u_anchor.center_y < v_anchor.center_y { v_anchor.y } else { v_anchor.y + v_anchor.height })
                } else if use_right {
                    (v_anchor.x + v_anchor.width, v_anchor.center_y)
                } else {
                    (v_anchor.x, v_anchor.center_y)
                };

                let mut points = Vec::new();
                points.push(p_start);
                if is_source_seq || u_collides {
                    points.push((u_anchor.center_x, y_start_h));
                }
                points.push((gutter_x, y_start_h));
                points.push((gutter_x, y_end_h));
                if is_target_seq || v_collides {
                    points.push((v_anchor.center_x, y_end_h));
                }
                points.push(p_end);

                let mut path_d = String::new();
                for (i, pt) in points.iter().enumerate() {
                    if i == 0 {
                        path_d.push_str(&format!("M {:.1} {:.1}", pt.0, pt.1));
                    } else {
                        path_d.push_str(&format!(" L {:.1} {:.1}", pt.0, pt.1));
                    }
                }

                let label_x = gutter_x + if use_right { 12.0 } else { -12.0 };
                let label_y = (p_start.1 + p_end.1) / 2.0;

                edges.push(StateEdge {
                    from: e.left.clone(),
                    to: e.right.clone(),
                    label: e.label.clone(),
                    color: e.color.clone().or_else(|| Some("#38bdf8".to_string())),
                    style: e.style.clone(),
                    path_d,
                    label_x,
                    label_y,
                    is_loopback: false,
                    is_cross_boundary: true,
                });
                continue;
            }

            if let (Some(u), Some(v)) = (nodes.get(&e.left), nodes.get(&e.right)) {
                let is_self = e.left == e.right;
                let is_backward = u.y >= v.y || (u.is_end && !v.is_end);

                let path_d;
                let label_x;
                let label_y;

                if is_self {
                    let p0 = (u.x + u.width * 0.7, u.y);
                    let p1 = (u.x + u.width, u.y + u.height * 0.3);
                    let arc_x = u.x + u.width + 25.0;
                    let arc_y = u.y - 20.0;

                    path_d = format!(
                        "M {:.1} {:.1} C {:.1} {:.1}, {:.1} {:.1}, {:.1} {:.1}",
                        p0.0, p0.1, arc_x, arc_y, arc_x + 10.0, arc_y + 10.0, p1.0, p1.1
                    );
                    label_x = arc_x + 10.0;
                    label_y = arc_y;
                } else if is_backward {
                    let use_right = u.column > 0 || (u.column == 0 && v.column > 0);
                    let gutter_x = if use_right { gutter_right } else { gutter_left };

                    let p_start = if use_right {
                        (u.x + u.width, u.y + u.height * 0.5)
                    } else {
                        (u.x, u.y + u.height * 0.5)
                    };

                    let p_end = if use_right {
                        (v.x + v.width, v.y + v.height * 0.5)
                    } else {
                        (v.x, v.y + v.height * 0.5)
                    };

                    path_d = format!(
                        "M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1}",
                        p_start.0, p_start.1, gutter_x, p_start.1, gutter_x, p_end.1, p_end.0, p_end.1
                    );

                    label_x = gutter_x + if use_right { 12.0 } else { -12.0 };
                    label_y = (p_start.1 + p_end.1) / 2.0;
                } else {
                    let p_start = (u.x + u.width * 0.5, u.y + u.height);
                    let p_end = (v.x + v.width * 0.5, v.y);

                    // Check if direct line between p_start and p_end collides with any intermediate obstacle
                    let line_y_min = p_start.1 + 8.0;
                    let line_y_max = p_end.1 - 8.0;
                    let line_x_center = (p_start.0 + p_end.0) / 2.0;

                    let mut hits_obstacle = false;
                    for obs in &obstacles {
                        if obs.id == u.id || obs.id == v.id {
                            continue;
                        }
                        // Skip enclosing cluster groups that contain both u and v (or either endpoint)
                        let is_enclosing_group = groups.iter().any(|g| {
                            g.id == obs.id && (g.member_nodes.contains(&u.id) || g.member_nodes.contains(&v.id))
                        });
                        if is_enclosing_group {
                            continue;
                        }

                        if obs.y < line_y_max && (obs.y + obs.height) > line_y_min {
                            let obs_left = obs.x - 5.0;
                            let obs_right = obs.x + obs.width + 5.0;
                            let x_min = p_start.0.min(p_end.0);
                            let x_max = p_start.0.max(p_end.0);
                            if (line_x_center >= obs_left && line_x_center <= obs_right)
                                || (x_max >= obs_left && x_min <= obs_right)
                            {
                                hits_obstacle = true;
                                break;
                            }
                        }
                    }

                    // Also check for intermediate nodes between u and v
                    if !hits_obstacle {
                        for other in nodes.values() {
                            if other.id == u.id || other.id == v.id {
                                continue;
                            }
                            if other.y < line_y_max && (other.y + other.height) > line_y_min {
                                let other_left = other.x - 4.0;
                                let other_right = other.x + other.width + 4.0;
                                let x_min = p_start.0.min(p_end.0);
                                let x_max = p_start.0.max(p_end.0);
                                if (line_x_center >= other_left && line_x_center <= other_right)
                                    || (x_max >= other_left && x_min <= other_right)
                                {
                                    hits_obstacle = true;
                                    break;
                                }
                            }
                        }
                    }

                    if hits_obstacle {
                        // Router avoids obstacle: detour via perimeter gutter through clear channels
                        let use_right = u.column > 0 || (u.column == 0 && v.column > 0);
                        let gutter_x = if use_right { gutter_right } else { gutter_left };

                        let y_out = p_start.1 + 12.0;
                        let y_in = p_end.1 - 12.0;

                        path_d = format!(
                            "M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1}",
                            p_start.0, p_start.1,
                            p_start.0, y_out,
                            gutter_x, y_out,
                            gutter_x, y_in,
                            p_end.0, y_in,
                            p_end.0, p_end.1
                        );
                        label_x = gutter_x + if use_right { 12.0 } else { -12.0 };
                        label_y = (y_out + y_in) / 2.0;
                    } else if (p_start.0 - p_end.0).abs() < 10.0 {
                        path_d = format!("M {:.1} {:.1} L {:.1} {:.1}", p_start.0, p_start.1, p_end.0, p_end.1);
                        label_x = p_start.0 + 12.0;
                        label_y = (p_start.1 + p_end.1) / 2.0;
                    } else {
                        let mid_y = (p_start.1 + p_end.1) / 2.0;
                        path_d = format!(
                            "M {:.1} {:.1} C {:.1} {:.1}, {:.1} {:.1}, {:.1} {:.1}",
                            p_start.0, p_start.1, p_start.0, mid_y, p_end.0, mid_y, p_end.0, p_end.1
                        );
                        label_x = (p_start.0 + p_end.0) / 2.0 + 14.0;
                        label_y = mid_y;
                    }
                }

                edges.push(StateEdge {
                    from: e.left.clone(),
                    to: e.right.clone(),
                    label: e.label.clone(),
                    color: e.color.clone(),
                    style: e.style.clone(),
                    path_d,
                    label_x,
                    label_y,
                    is_loopback: is_backward,
                    is_cross_boundary: false,
                });
            }
        }

        let max_w = if inter_group_idx > 0 {
            (gutter_right + 120.0 + (inter_group_idx as f64) * 16.0).max(860.0)
        } else {
            (gutter_right + 100.0).max(860.0)
        };
        let max_h = current_y + 60.0;

        let debug_bounding_boxes = canvas.debug.clone()
            .or_else(|| canvas.layout.as_ref().and_then(|l| l.get("debug")).map(|s| s.to_string()))
            .or_else(|| std::env::var("DEBUG_BBOX").ok());

        Self {
            nodes,
            groups,
            edges,
            width: max_w.max(860.0),
            height: max_h.max(600.0),
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
            type_registry: canvas.type_registry.clone(),
            debug_bounding_boxes,
        }
    }

    /// Renders the complete vector SVG
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(32 * 1024);
        let bg_color = self.background.as_deref().unwrap_or("#0f172a");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#1e293b");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#64748b");

        // SVG header
        svg.push_str(&format!(
            r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-state-svg" style="background-color: {}; font-family: system-ui, -apple-system, sans-serif;">
  <rect width="100%" height="100%" fill="{}"/>
"##,
            self.width, self.height, self.width, self.height, bg_color, bg_color
        ));

        // Defs (arrow markers, shadow filters)
        svg.push_str(r##"  <defs>
    <filter id="ds-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <marker id="ds-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
    </marker>
    <marker id="ds-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
    <marker id="ds-arrow-alert" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e"/>
    </marker>
  </defs>
"##);

        // Render Groups / Phase Clusters
        for grp in &self.groups {
            if grp.width > 0.0 && grp.height > 0.0 {
                let border_color = grp.color.as_deref().unwrap_or("#38bdf8");
                svg.push_str(&format!(
                    r##"  <!-- State Cluster Group: {} -->
  <g class="ds-group" id="group-{}">
    <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="14" ry="14" fill="{}" fill-opacity="0.08" stroke="{}" stroke-width="1.5" stroke-dasharray="6,4"/>
    <text x="{:.1}" y="{:.1}" font-size="12" font-weight="700" fill="{}" letter-spacing="0.5">{}</text>
  </g>
"##,
                    escape_xml(&grp.id),
                    escape_xml(&grp.id),
                    grp.x,
                    grp.y,
                    grp.width,
                    grp.height,
                    border_color,
                    border_color,
                    grp.x + 16.0,
                    grp.y + 20.0,
                    border_color,
                    escape_xml(&grp.label)
                ));
            }
        }

        // Render Edges (Transitions)
        svg.push_str("  <!-- Transitions -->\n  <g class=\"ds-edges\">\n");
        for e in self.edges.iter().filter(|e| !e.is_cross_boundary) {
            let stroke = e.color.as_deref().unwrap_or(default_edge_stroke);
            let marker = if e.is_loopback {
                "url(#ds-arrow-alert)"
            } else if e.color.is_some() {
                "url(#ds-arrow-active)"
            } else {
                "url(#ds-arrow)"
            };

            let is_dotted = e.style.as_deref().map(|s| s.contains("dotted") || s.contains('.')).unwrap_or(false);
            let is_dashed = e.style.as_deref().map(|s| s.contains("dashed") || s.contains('-')).unwrap_or(false);
            let dash_attr = if is_dotted {
                r#" stroke-dasharray="3,4""#
            } else if is_dashed {
                r#" stroke-dasharray="6,4""#
            } else {
                ""
            };

            svg.push_str(&format!(
                r##"    <path d="{}" fill="none" stroke="{}" stroke-width="1.8"{} marker-end="{}" class="ds-edge"/>
"##,
                e.path_d, stroke, dash_attr, marker
            ));

            // Edge label pill
            if let Some(ref lbl) = e.label {
                let clean_label = lbl.replace("\\n", " ");
                let text_w = clean_label.len() as f64 * 6.8 + 12.0;
                svg.push_str(&format!(
                    r##"    <g class="ds-edge-label" transform="translate({:.1}, {:.1})">
      <rect x="{:.1}" y="-10" width="{:.1}" height="20" rx="6" fill="#1e293b" fill-opacity="0.85" stroke="#334155" stroke-width="0.8"/>
      <text x="0" y="3.5" font-size="10" font-weight="500" fill="#94a3b8" text-anchor="middle">{}</text>
    </g>
"##,
                    e.label_x,
                    e.label_y,
                    -text_w / 2.0,
                    text_w,
                    escape_xml(&clean_label)
                ));
            }
        }
        svg.push_str("  </g>\n\n");

        // Render State Nodes
        svg.push_str("  <!-- States -->\n  <g class=\"ds-nodes\">\n");
        for node in self.nodes.values() {
            if node.is_composite {
                let fill = node.color.as_deref().unwrap_or(default_node_fill);
                let border_color = if node.is_start {
                    "#10b981"
                } else if node.is_end {
                    "#f43f5e"
                } else {
                    "#38bdf8"
                };

                svg.push_str(&format!(
                    r##"    <!-- Composite State: {} -->
    <g class="dl-node ds-composite-node" id="node-{}">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="14" ry="14" fill="{}" fill-opacity="0.18" stroke="{}" stroke-width="1.8" filter="url(#ds-shadow)"/>
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="1.0" stroke-opacity="0.4"/>
      <text x="{:.1}" y="{:.1}" font-size="13" font-weight="700" fill="{}">{}</text>
"##,
                    escape_xml(&node.id),
                    escape_xml(&node.id),
                    node.x, node.y, node.width, node.height,
                    fill, border_color,
                    node.x, node.y + 36.0, node.x + node.width, node.y + 36.0, border_color,
                    node.x + 18.0, node.y + 23.0, border_color, escape_xml(&node.id)
                ));

                if let Some(ref lbl) = node.composite_label {
                    let title_offset = node.id.len() as f64 * 8.5 + 28.0;
                    svg.push_str(&format!(
                        r##"      <text x="{:.1}" y="{:.1}" font-size="12" font-weight="500" fill="#94a3b8">[{}]</text>
"##,
                        node.x + title_offset, node.y + 23.0, escape_xml(lbl)
                    ));
                }

                if let Some(ref sub_svg) = node.composite_sub_svg {
                    let sub_dim = parse_svg_dimensions(sub_svg);
                    let sub_x = node.x + (node.width - sub_dim.0).max(0.0) / 2.0;
                    let sub_y = node.y + 44.0;
                    let clean_sub_svg = if sub_svg.contains("width=\"100%\"") {
                        sub_svg.replace("width=\"100%\"", &format!("width=\"{:.1}\"", sub_dim.0))
                    } else {
                        sub_svg.clone()
                    };
                    svg.push_str(&format!(
                        r##"      <g class="ds-poly-archetype-subgraph" transform="translate({:.1}, {:.1})">
{}
      </g>
"##,
                        sub_x, sub_y, clean_sub_svg
                    ));
                } else if !node.composite_tasks.is_empty() {
                    let tasks = &node.composite_tasks;
                    let n_tasks = tasks.len();
                    let task_w = 90.0f64;
                    let task_h = 36.0f64;
                    let body_y = node.y + 36.0;
                    let body_h = node.height - 36.0;
                    let ty = body_y + (body_h - task_h) / 2.0;

                    let total_tasks_w = n_tasks as f64 * task_w;
                    let avail_w = node.width - 40.0;
                    let gap = if n_tasks > 1 {
                        (avail_w - total_tasks_w) / (n_tasks as f64 - 1.0)
                    } else {
                        0.0
                    };

                    for (i, task_name) in tasks.iter().enumerate() {
                        let tx = node.x + 20.0 + i as f64 * (task_w + gap);
                        svg.push_str(&format!(
                            r##"      <g class="ds-sub-task" id="subtask-{}-{}">
        <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="8" ry="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="{:.1}" y="{:.1}" font-size="11" font-weight="600" fill="#f8fafc" text-anchor="middle" dominant-baseline="central">{}</text>
      </g>
"##,
                            escape_xml(&node.id),
                            escape_xml(task_name),
                            tx, ty, task_w, task_h,
                            tx + task_w / 2.0, ty + task_h / 2.0,
                            escape_xml(task_name)
                        ));

                        if i + 1 < n_tasks {
                            let next_tx = node.x + 20.0 + (i + 1) as f64 * (task_w + gap);
                            svg.push_str(&format!(
                                r##"      <path d="M {:.1} {:.1} L {:.1} {:.1}" stroke="#64748b" stroke-width="1.5" marker-end="url(#ds-arrow)"/>
"##,
                                tx + task_w, ty + task_h / 2.0, next_tx, ty + task_h / 2.0
                            ));
                        }
                    }
                }

                svg.push_str("    </g>\n");
            } else {
                let fill = node.color.as_deref().unwrap_or(default_node_fill);
                let text_color = node.textcolor.as_deref().unwrap_or("#f8fafc");
                let stroke = if node.is_start {
                    "#10b981"
                } else if node.is_end {
                    "#f43f5e"
                } else {
                    "#38bdf8"
                };

                render_svg_node(
                    &node.id,
                    &node.label,
                    &node.shape,
                    node.style.as_deref(),
                    node.image.as_deref(),
                    node.x,
                    node.y,
                    node.width,
                    node.height,
                    fill,
                    text_color,
                    stroke,
                    Some("url(#ds-shadow)"),
                    Some(&self.type_registry),
                    &mut svg,
                );
            }
        }
        svg.push_str("  </g>\n\n");

        // Render Cross-Boundary Inter-Group Edges (on top layer so lines & arrowheads entering containers are crisp)
        let cross_edges: Vec<&StateEdge> = self.edges.iter().filter(|e| e.is_cross_boundary).collect();
        if !cross_edges.is_empty() {
            svg.push_str("  <!-- Cross-Boundary Inter-Group Edges -->\n  <g class=\"ds-inter-group-edges\">\n");
            for e in cross_edges {
                let stroke = e.color.as_deref().unwrap_or("#38bdf8");
                let is_dotted = e.style.as_deref().map(|s| s.contains("dotted") || s.contains('.')).unwrap_or(false);
                let is_dashed = e.style.as_deref().map(|s| s.contains("dashed") || s.contains('-')).unwrap_or(false);
                let dash_attr = if is_dotted {
                    r#" stroke-dasharray="3,4""#
                } else if is_dashed {
                    r#" stroke-dasharray="6,4""#
                } else {
                    ""
                };

                svg.push_str(&format!(
                    r##"    <path d="{}" fill="none" stroke="{}" stroke-width="2.2"{} marker-end="url(#ds-arrow-active)" class="ds-edge ds-edge-cross-boundary"/>
"##,
                    e.path_d, stroke, dash_attr
                ));

                if let Some(ref lbl) = e.label {
                    let clean_label = lbl.replace("\\n", " ");
                    let text_w = clean_label.len() as f64 * 6.8 + 12.0;
                    svg.push_str(&format!(
                        r##"    <g class="ds-edge-label" transform="translate({:.1}, {:.1})">
      <rect x="{:.1}" y="-10" width="{:.1}" height="20" rx="6" fill="#1e293b" fill-opacity="0.85" stroke="#334155" stroke-width="0.8"/>
      <text x="0" y="3.5" font-size="10" font-weight="500" fill="#94a3b8" text-anchor="middle">{}</text>
    </g>
"##,
                        e.label_x,
                        e.label_y,
                        -text_w / 2.0,
                        text_w,
                        escape_xml(&clean_label)
                    ));
                }
            }
            svg.push_str("  </g>\n");
        }

        // Render Debug Bounding Boxes Overlay
        let (dbg_color, dbg_display) = if let Some(ref dbg_val) = self.debug_bounding_boxes {
            let c = if dbg_val.starts_with('#') { dbg_val.as_str() } else { "#f43f5e" };
            (c, "inline")
        } else {
            ("#f43f5e", "none")
        };

        svg.push_str(&format!(
            "  <!-- Debug Bounding Boxes Overlay -->\n  <g class=\"diagrammer-debug-bounding-boxes ds-debug-bounding-boxes\" style=\"display: {}; pointer-events: none;\">\n",
            dbg_display
        ));
        for grp in &self.groups {
            svg.push_str(&format!(
                r##"    <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="none" stroke="#ec4899" stroke-width="2.0" stroke-dasharray="6,4" />
<text x="{:.1}" y="{:.1}" font-size="10" font-weight="700" font-family="monospace" fill="#ec4899">group: {} [{:.1}, {:.1}, {:.1}, {:.1}]</text>
"##,
                grp.x, grp.y, grp.width, grp.height,
                grp.x + 6.0, grp.y + 14.0, grp.id, grp.x, grp.y, grp.width, grp.height
            ));
        }
        for node in self.nodes.values() {
            svg.push_str(&format!(
                r##"    <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="none" stroke="{}" stroke-width="1.5" stroke-dasharray="4,3" />
<text x="{:.1}" y="{:.1}" font-size="9" font-weight="600" font-family="monospace" fill="{}">node: {} [{:.1}, {:.1}, {:.1}, {:.1}]</text>
"##,
                node.x, node.y, node.width, node.height, dbg_color,
                node.x + 4.0, (node.y - 4.0).max(10.0), dbg_color, node.id, node.x, node.y, node.width, node.height
            ));
        }
        svg.push_str("  </g>\n\n");

        svg.push_str("</svg>\n");
        svg
    }
}
