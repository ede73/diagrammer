//! Native State Diagram & Statechart layout engine in pure Rust.
//!
//! Provides intelligent layout for finite state machines (FSMs), statecharts, and
//! lifecycle diagrams. Supports:
//! - Entry/terminal state identification and vertical lifecycle spine
//! - Multi-column parallel phase lanes (e.g. Active vs Passive close in TCP)
//! - Perimeter gutter routing for bypass, loopback, reset, and timeout transitions
//! - Composable Poly-Archetype Subgraph execution (groups with their own visualizer)

use std::collections::{HashMap, HashSet};
use crate::ast::{GraphCanvas, GraphObject};
use crate::layout::layered::escape_xml;
use crate::layout::shapes::render_svg_node;

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

        // 1. Collect all nodes from canvas and top-level groups
        let raw_vertices = canvas.get_flattened_vertices();
        let raw_edges = canvas.get_edges();

        // Map which nodes belong to which groups
        let mut node_to_group: HashMap<String, String> = HashMap::new();

        for obj in &canvas.objects {
            if let GraphObject::Group(grp) = obj {
                let mut member_names = Vec::new();
                for m in &grp.objects {
                    match m {
                        GraphObject::Vertex(v) => {
                            member_names.push(v.name.clone());
                            node_to_group.insert(v.name.clone(), grp.name.clone());
                        }
                        GraphObject::VertexRef { vertex } => {
                            member_names.push(vertex.name.clone());
                            node_to_group.insert(vertex.name.clone(), grp.name.clone());
                        }
                        GraphObject::Reference(r) => {
                            member_names.push(r.name.clone());
                            node_to_group.insert(r.name.clone(), grp.name.clone());
                        }
                        _ => {}
                    }
                }

                // Poly-archetype: Check if group declares its own visualizer
                let sub_svg = if let Some(ref sub_viz) = grp.visualizer {
                    if let Some(generator) = crate::generators::make_generator(sub_viz) {
                        // Construct scoped canvas for sub-group
                        let mut sub_canvas = canvas.clone();
                        sub_canvas.visualizer = Some(sub_viz.clone());
                        sub_canvas.objects = grp.objects.clone();
                        Some(generator.generate(&sub_canvas))
                    } else {
                        None
                    }
                } else {
                    None
                };

                let grp_label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
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
                    sub_svg,
                });
            }
        }

        // 2. Identify start and terminal nodes
        let explicit_start = canvas.start.as_deref();
        let mut in_degrees: HashMap<String, usize> = HashMap::new();
        let mut out_degrees: HashMap<String, usize> = HashMap::new();

        for e in &raw_edges {
            *in_degrees.entry(e.left.clone()).or_insert(0) += 0;
            *out_degrees.entry(e.left.clone()).or_insert(0) += 1;
            *in_degrees.entry(e.right.clone()).or_insert(0) += 1;
            *out_degrees.entry(e.right.clone()).or_insert(0) += 0;
        }

        for v in raw_vertices {
            let name = v.get_name().to_string();
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

            // Compute size based on lines in label
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

            let grp = node_to_group.get(&name).cloned();

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
                },
            );
        }

        // 3. Topological ranking & Lane assignment
        // Build forward adjacency
        let mut forward_adj: HashMap<String, Vec<String>> = HashMap::new();
        for e in &raw_edges {
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

        // Assign ranks via forward traversal
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
                        // Prevent loops from pushing ranks to infinity
                        if !visited.contains(s) {
                            visited.insert(s.clone());
                            queue.push_back((s.clone(), r + 1));
                        }
                    }
                }
            }
        }

        // Assign columns
        // Column 0 = Center spine
        // Column -1 = Left lane (e.g. ActiveClose or client path)
        // Column +1 = Right lane (e.g. PassiveClose or server path)
        let has_two_groups = groups.len() >= 2;
        if has_two_groups {
            // First group -> Left column (-1), Second group -> Right column (+1)
            let g0_name = groups[0].id.clone();
            let g1_name = groups[1].id.clone();

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

        // Heuristics for ungrouped nodes:
        // If an edge leads to Left column, place node in Left or Center
        // If an edge leads to Right column, place node in Right or Center
        let mut col_assignments: HashMap<String, i32> = HashMap::new();
        for n in nodes.values() {
            if n.column != 0 {
                col_assignments.insert(n.id.clone(), n.column);
            }
        }

        // Nodes named "listen" or "syn_received" on client/server branching
        for n in nodes.values_mut() {
            if n.column == 0 && !n.is_start && !n.is_end {
                let id_lower = n.id.to_lowercase();
                if id_lower.contains("listen") || id_lower.contains("rcvd") || id_lower.contains("received") {
                    n.column = -1;
                } else if id_lower.contains("sent") {
                    n.column = 1;
                }
            }
        }

        // 4. Coordinates Calculation
        let center_x = 450.0;
        let col_offset = 260.0;
        let rank_height = 85.0;
        let margin_top = 60.0;

        // Group rows and bounds
        let mut rank_nodes: HashMap<usize, Vec<String>> = HashMap::new();
        for (id, node) in &nodes {
            rank_nodes.entry(node.rank).or_default().push(id.clone());
        }

        // Sort ranks
        let mut sorted_ranks: Vec<usize> = rank_nodes.keys().copied().collect();
        sorted_ranks.sort();

        let mut current_y = margin_top;
        for r in &sorted_ranks {
            let node_ids = rank_nodes.get(r).unwrap();
            let mut max_h_in_rank = 44.0f64;

            for id in node_ids {
                if let Some(node) = nodes.get_mut(id) {
                    let col_x = center_x + (node.column as f64) * col_offset;
                    node.x = col_x - (node.width / 2.0);
                    node.y = current_y;
                    max_h_in_rank = max_h_in_rank.max(node.height);
                }
            }
            current_y += max_h_in_rank + rank_height;
        }

        // Compute group bounding boxes around their nodes
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
                grp.x = min_x - 24.0;
                grp.y = min_y - 36.0;
                grp.width = (max_x - min_x) + 48.0;
                grp.height = (max_y - min_y) + 54.0;
            }
        }

        // 5. Route Edges (Forward S-curves vs. Perimeter Gutter Loops)
        let min_canvas_x = nodes.values().map(|n| n.x).fold(center_x, f64::min);
        let max_canvas_x = nodes.values().map(|n| n.x + n.width).fold(center_x, f64::max);
        let gutter_left = (min_canvas_x - 70.0).max(40.0);
        let gutter_right = max_canvas_x + 70.0;

        let mut edges: Vec<StateEdge> = Vec::new();
        for e in &raw_edges {
            if let (Some(u), Some(v)) = (nodes.get(&e.left), nodes.get(&e.right)) {
                let is_self = e.left == e.right;
                let is_backward = u.y >= v.y || (u.is_end && !v.is_end);

                let path_d;
                let label_x;
                let label_y;

                if is_self {
                    // Self loop arc over top right
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
                    // Route via perimeter gutter (avoid slicing through intermediate state cards)
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
                    // Forward transition down
                    let p_start = (u.x + u.width * 0.5, u.y + u.height);
                    let p_end = (v.x + v.width * 0.5, v.y);

                    if (u.x - v.x).abs() < 10.0 {
                        // Straight vertical
                        path_d = format!("M {:.1} {:.1} L {:.1} {:.1}", p_start.0, p_start.1, p_end.0, p_end.1);
                        label_x = p_start.0 + 12.0;
                        label_y = (p_start.1 + p_end.1) / 2.0;
                    } else {
                        // Smooth S-curve
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

        // Canvas extents
        let max_w = gutter_right + 100.0;
        let max_h = current_y + 100.0;

        Self {
            nodes,
            groups,
            edges,
            width: max_w.max(800.0),
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
"##,
            self.width, self.height, self.width, self.height, bg_color
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

                // Poly-archetype: If sub-visualizer exists, embed sub-SVG
                if let Some(ref sub) = grp.sub_svg {
                    svg.push_str(&format!(
                        r##"  <g class="ds-poly-archetype-subgraph" transform="translate({:.1}, {:.1})">
{}
  </g>
"##,
                        grp.x + 16.0,
                        grp.y + 28.0,
                        sub
                    ));
                }
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
            let fill = node.color.as_deref().unwrap_or(default_node_fill);
            let text_color = node.textcolor.as_deref().unwrap_or("#f8fafc");
            let stroke = if node.is_start {
                "#10b981" // emerald for start
            } else if node.is_end {
                "#f43f5e" // rose for end
            } else {
                "#38bdf8" // sky blue
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
        svg.push_str("  </g>\n");

        svg.push_str("</svg>\n");
        svg
    }
}
