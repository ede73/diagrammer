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
        let mut composite_groups: HashMap<String, (Option<String>, Vec<String>, Option<String>, Option<String>, f64, f64)> = HashMap::new();
        let mut composite_member_nodes: HashSet<String> = HashSet::new();
        let mut node_to_cluster_group: HashMap<String, String> = HashMap::new();

        for obj in &canvas.objects {
            if let GraphObject::Group(grp) = obj {
                let is_composite = grp.visualizer.is_some() || top_level_endpoints.contains(&grp.name);
                let grp_label = grp.label.clone().unwrap_or_else(|| grp.name.clone());

                if is_composite {
                    // Collect member node names so we encapsulate them
                    let mut inner_tasks = Vec::new();
                    for m in &grp.objects {
                        match m {
                            GraphObject::Vertex(v) => {
                                composite_member_nodes.insert(v.name.clone());
                                inner_tasks.push(v.label.clone().unwrap_or_else(|| v.name.clone()));
                            }
                            GraphObject::VertexRef { vertex } => {
                                composite_member_nodes.insert(vertex.name.clone());
                                inner_tasks.push(vertex.label.clone().unwrap_or_else(|| vertex.name.clone()));
                            }
                            GraphObject::Reference(r) => {
                                composite_member_nodes.insert(r.name.clone());
                                inner_tasks.push(r.name.clone());
                            }
                            _ => {}
                        }
                    }

                    // Poly-archetype: Check if group declares its own visualizer
                    let (sub_svg, sub_w, sub_h) = if let Some(ref sub_viz) = grp.visualizer {
                        if let Some(generator) = crate::generators::make_generator(sub_viz) {
                            let mut sub_canvas = canvas.clone();
                            sub_canvas.visualizer = Some(sub_viz.clone());
                            let mut sub_objects = grp.objects.clone();
                            for obj in &canvas.objects {
                                if let GraphObject::Edge { edge } = obj {
                                    if composite_member_nodes.contains(&edge.left) && composite_member_nodes.contains(&edge.right) {
                                        sub_objects.push(obj.clone());
                                    }
                                }
                            }
                            sub_canvas.objects = sub_objects;
                            let rendered = generator.generate(&sub_canvas);
                            let (sw, sh) = parse_svg_dimensions(&rendered);
                            (Some(rendered), sw, sh)
                        } else {
                            (None, 420.0, 240.0)
                        }
                    } else {
                        (None, 420.0, 100.0)
                    };

                    composite_groups.insert(
                        grp.name.clone(),
                        (sub_svg, inner_tasks, Some(grp_label), grp.color.clone(), sub_w, sub_h),
                    );
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
            if composite_member_nodes.contains(&e.left) && composite_member_nodes.contains(&e.right) {
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
            if composite_member_nodes.contains(&name) {
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
                    composite_tasks: Vec::new(),
                    composite_label: None,
                },
            );
        }

        // Add composite groups as StateNodes
        let max_composite_w = composite_groups
            .values()
            .map(|(sub, tasks, _, _, sw, _)| {
                if sub.is_some() {
                    (*sw + 48.0).max(480.0)
                } else if !tasks.is_empty() {
                    ((tasks.len() as f64) * 110.0 + 80.0).max(480.0)
                } else {
                    480.0
                }
            })
            .fold(480.0, f64::max);

        for (grp_name, (sub_svg, tasks, lbl, clr, _sw, sh)) in composite_groups {
            let width = max_composite_w;

            let height = if sub_svg.is_some() {
                sh + 54.0
            } else if !tasks.is_empty() {
                116.0
            } else {
                80.0
            };

            let is_start = explicit_start == Some(&grp_name)
                || (in_degrees.get(&grp_name).copied().unwrap_or(0) == 0 && out_degrees.get(&grp_name).copied().unwrap_or(0) > 0);

            let is_end = out_degrees.get(&grp_name).copied().unwrap_or(0) == 0 && in_degrees.get(&grp_name).copied().unwrap_or(0) > 0;

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
                    composite_tasks: tasks,
                    composite_label: lbl,
                },
            );
        }

        // 4. Topological ranking & Lane assignment
        let mut forward_adj: HashMap<String, Vec<String>> = HashMap::new();
        for e in &raw_edges {
            if composite_member_nodes.contains(&e.left) && composite_member_nodes.contains(&e.right) {
                continue;
            }
            if e.left != e.right {
                forward_adj.entry(e.left.clone()).or_default().push(e.right.clone());
            }
        }

        // Determine Start node
        let start_node_id = nodes
            .values()
            .find(|n| n.is_start)
            .map(|n| n.id.clone())
            .or_else(|| nodes.keys().next().cloned());

        if let Some(ref root) = start_node_id {
            let mut visited = HashSet::new();
            let mut queue = std::collections::VecDeque::new();
            queue.push_back((root.clone(), 0usize));
            visited.insert(root.clone());

            while let Some((curr, r)) = queue.pop_front() {
                if let Some(node) = nodes.get_mut(&curr) {
                    node.rank = node.rank.max(r);
                }
                if let Some(succs) = forward_adj.get(&curr) {
                    for s in succs {
                        if !visited.contains(s) {
                            visited.insert(s.clone());
                            queue.push_back((s.clone(), r + 1));
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

        // 5. Dynamic Non-Overlapping Coordinates Calculation
        let mut max_w_by_col: HashMap<i32, f64> = HashMap::new();
        for node in nodes.values() {
            let entry = max_w_by_col.entry(node.column).or_insert(110.0);
            *entry = entry.max(node.width);
        }

        let w_left = max_w_by_col.get(&-1).copied().unwrap_or(0.0);
        let w_center = max_w_by_col.get(&0).copied().unwrap_or(480.0);
        let w_right = max_w_by_col.get(&1).copied().unwrap_or(0.0);

        let gutter_margin = 50.0f64;
        let column_gap = 60.0f64;

        // Dynamic column centers ensuring strictly non-overlapping columns
        let center_x = if w_left > 0.0 {
            gutter_margin + w_left + column_gap + w_center / 2.0
        } else {
            gutter_margin + w_center / 2.0 + 80.0
        };

        let left_col_x = center_x - (w_center / 2.0 + column_gap + w_left / 2.0);
        let right_col_x = center_x + (w_center / 2.0 + column_gap + w_right / 2.0);

        let rank_gap = 55.0;
        let margin_top = 50.0;

        let mut rank_nodes: HashMap<usize, Vec<String>> = HashMap::new();
        for (id, node) in &nodes {
            rank_nodes.entry(node.rank).or_default().push(id.clone());
        }

        let mut sorted_ranks: Vec<usize> = rank_nodes.keys().copied().collect();
        sorted_ranks.sort();

        let mut current_y = margin_top;
        for r in &sorted_ranks {
            let node_ids = rank_nodes.get(r).unwrap();
            let mut max_h_in_rank = 44.0f64;

            for id in node_ids {
                if let Some(node) = nodes.get_mut(id) {
                    let col_x = match node.column {
                        -1 => left_col_x,
                        1 => right_col_x,
                        _ => center_x,
                    };
                    node.x = col_x - (node.width / 2.0);
                    node.y = current_y;
                    max_h_in_rank = max_h_in_rank.max(node.height);
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

        let mut edges: Vec<StateEdge> = Vec::new();
        for e in &raw_edges {
            if composite_member_nodes.contains(&e.left) && composite_member_nodes.contains(&e.right) {
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
                        if obs.y < line_y_max && (obs.y + obs.height) > line_y_min {
                            if line_x_center >= (obs.x - 5.0) && line_x_center <= (obs.x + obs.width + 5.0) {
                                hits_obstacle = true;
                                break;
                            }
                        }
                    }

                    if hits_obstacle {
                        // Router avoids obstacle: detour via perimeter gutter
                        let use_right = u.column > 0 || (u.column == 0 && v.column > 0);
                        let gutter_x = if use_right { gutter_right } else { gutter_left };

                        let p0 = if use_right {
                            (u.x + u.width, u.y + u.height * 0.5)
                        } else {
                            (u.x, u.y + u.height * 0.5)
                        };
                        let p3 = if use_right {
                            (v.x + v.width, v.y + v.height * 0.5)
                        } else {
                            (v.x, v.y + v.height * 0.5)
                        };

                        path_d = format!(
                            "M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1}",
                            p0.0, p0.1, gutter_x, p0.1, gutter_x, p3.1, p3.0, p3.1
                        );
                        label_x = gutter_x + if use_right { 12.0 } else { -12.0 };
                        label_y = (p0.1 + p3.1) / 2.0;
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
                });
            }
        }

        let max_w = gutter_right + 100.0;
        let max_h = current_y + 60.0;

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

        // Render Edges
        svg.push_str("  <!-- Transitions -->\n  <g class=\"ds-edges\">\n");
        for e in &self.edges {
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
        svg.push_str("  </g>\n");

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
        svg.push_str("  </g>\n");

        svg.push_str("</svg>\n");
        svg
    }
}
