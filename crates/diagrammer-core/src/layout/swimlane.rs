use std::collections::HashMap;

use crate::ast::{GraphCanvas, GraphObject};

pub struct SwimlaneNode {
    pub id: String,
    pub label: String,
    pub lane_idx: usize,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rank: usize,
    pub color: Option<String>,
    pub textcolor: Option<String>,
}

pub struct SwimlaneLane {
    pub name: String,
    pub label: String,
    pub color: String,
    pub textcolor: String,
    pub x: f64,
    pub width: f64,
    pub node_ids: Vec<String>,
}

pub struct SwimlaneEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub points: Vec<(f64, f64)>,
    pub color: Option<String>,
    pub is_cross_lane: bool,
}

pub struct SwimlaneGraph {
    pub lanes: Vec<SwimlaneLane>,
    pub nodes: HashMap<String, SwimlaneNode>,
    pub edges: Vec<SwimlaneEdge>,
    pub width: f64,
    pub height: f64,
}

const PALETTE: &[&str] = &[
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#6366f1", // Indigo
];

impl SwimlaneGraph {
    pub fn build(canvas: &GraphCanvas) -> Self {
        let mut lanes: Vec<SwimlaneLane> = Vec::new();
        let mut nodes: HashMap<String, SwimlaneNode> = HashMap::new();
        let mut edges: Vec<SwimlaneEdge> = Vec::new();
        let mut node_to_lane: HashMap<String, usize> = HashMap::new();

        // 1. Top-Level Groups are Swimlanes
        let top_objects = canvas.get_objects(false);
        for obj in &top_objects {
            if let GraphObject::Group(grp) = obj {
                let lane_idx = lanes.len();
                let color = grp.color.clone().unwrap_or_else(|| {
                    PALETTE[lane_idx % PALETTE.len()].to_string()
                });
                let textcolor = grp.textcolor.clone().unwrap_or_else(|| "#ffffff".to_string());
                let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());

                let mut node_ids = Vec::new();
                for inner in &grp.objects {
                    if inner.is_vertex() {
                        let id = inner.get_name().to_string();
                        let raw_lbl = inner.get_label().map(|s| s.to_string()).unwrap_or_else(|| {
                            if let Some(pos) = id.rfind('!') {
                                id[pos + 1..].to_string()
                            } else {
                                id.clone()
                            }
                        });
                        let w = ((raw_lbl.len() as f64) * 8.2 + 36.0).max(96.0);
                        nodes.insert(
                            id.clone(),
                            SwimlaneNode {
                                id: id.clone(),
                                label: raw_lbl,
                                lane_idx,
                                x: 0.0,
                                y: 0.0,
                                width: w,
                                height: 42.0,
                                rank: 0,
                                color: inner.get_color().map(|s| s.to_string()),
                                textcolor: inner.get_textcolor().map(|s| s.to_string()),
                            },
                        );
                        node_to_lane.insert(id.clone(), lane_idx);
                        node_ids.push(id);
                    }
                }

                lanes.push(SwimlaneLane {
                    name: grp.name.clone(),
                    label,
                    color,
                    textcolor,
                    x: 0.0,
                    width: 220.0,
                    node_ids,
                });
            }
        }

        // Catch any ungrouped top-level vertices and place them in a General lane
        let mut orphan_ids = Vec::new();
        for obj in &top_objects {
            if obj.is_vertex() {
                let id = obj.get_name().to_string();
                if !nodes.contains_key(&id) {
                    let raw_lbl = obj.get_label().map(|s| s.to_string()).unwrap_or_else(|| id.clone());
                    let w = ((raw_lbl.len() as f64) * 8.2 + 36.0).max(96.0);
                    let lane_idx = lanes.len();
                    nodes.insert(
                        id.clone(),
                        SwimlaneNode {
                            id: id.clone(),
                            label: raw_lbl,
                            lane_idx,
                            x: 0.0,
                            y: 0.0,
                            width: w,
                            height: 42.0,
                            rank: 0,
                            color: obj.get_color().map(|s| s.to_string()),
                            textcolor: obj.get_textcolor().map(|s| s.to_string()),
                        },
                    );
                    orphan_ids.push(id);
                }
            }
        }
        if !orphan_ids.is_empty() {
            let lane_idx = lanes.len();
            lanes.push(SwimlaneLane {
                name: "General".to_string(),
                label: "General".to_string(),
                color: "#64748b".to_string(),
                textcolor: "#ffffff".to_string(),
                x: 0.0,
                width: 220.0,
                node_ids: orphan_ids.clone(),
            });
            for id in orphan_ids {
                node_to_lane.insert(id, lane_idx);
            }
        }

        // If no lanes found, create a fallback lane
        if lanes.is_empty() {
            lanes.push(SwimlaneLane {
                name: "Lane".to_string(),
                label: "Swimlane".to_string(),
                color: "#3b82f6".to_string(),
                textcolor: "#ffffff".to_string(),
                x: 0.0,
                width: 260.0,
                node_ids: Vec::new(),
            });
        }

        // 2. Topological DAG Leveling across all nodes
        let mut adj: HashMap<String, Vec<String>> = HashMap::new();
        let mut in_degrees: HashMap<String, usize> = HashMap::new();
        for id in nodes.keys() {
            adj.insert(id.clone(), Vec::new());
            in_degrees.insert(id.clone(), 0);
        }

        for edge in canvas.get_edges() {
            if nodes.contains_key(&edge.left) && nodes.contains_key(&edge.right) {
                adj.entry(edge.left.clone()).or_default().push(edge.right.clone());
                *in_degrees.entry(edge.right.clone()).or_default() += 1;
            }
        }

        let mut queue: std::collections::VecDeque<String> = in_degrees
            .iter()
            .filter(|(_, deg)| **deg == 0)
            .map(|(id, _)| id.clone())
            .collect();

        // Assign ranks (Longest Path in DAG)
        let mut processed = 0;
        while let Some(u) = queue.pop_front() {
            processed += 1;
            let current_rank = nodes.get(&u).map(|n| n.rank).unwrap_or(0);
            if let Some(neighbors) = adj.get(&u).cloned() {
                for v in neighbors {
                    if let Some(node_v) = nodes.get_mut(&v) {
                        node_v.rank = node_v.rank.max(current_rank + 1);
                    }
                    if let Some(deg) = in_degrees.get_mut(&v) {
                        *deg -= 1;
                        if *deg == 0 {
                            queue.push_back(v);
                        }
                    }
                }
            }
        }

        // If cycle exists, assign remaining ranks sequentially
        if processed < nodes.len() {
            let mut fallback_rank = 1;
            for node in nodes.values_mut() {
                if node.rank == 0 {
                    node.rank = fallback_rank;
                    fallback_rank += 1;
                }
            }
        }

        // 3. Compute Column Widths & X coordinates
        let header_height = 46.0;
        let lane_padding_x = 24.0;
        let mut current_x = 20.0;

        for lane in &mut lanes {
            let mut max_node_w = 0.0f64;
            for id in &lane.node_ids {
                if let Some(n) = nodes.get(id) {
                    max_node_w = max_node_w.max(n.width);
                }
            }
            let title_w = (lane.label.len() as f64) * 8.5 + 32.0;
            lane.width = max_node_w.max(title_w).max(180.0) + lane_padding_x * 2.0;
            lane.x = current_x;
            current_x += lane.width;
        }

        let total_w = current_x + 20.0;

        // 4. Compute Node Coordinates (Centered horizontally in lane, spaced vertically by rank)
        let rank_spacing = 84.0;
        let start_y = header_height + 36.0;
        let mut max_y = start_y;

        let mut lane_rank_counts: HashMap<(usize, usize), usize> = HashMap::new();
        let mut sorted_node_ids: Vec<String> = nodes.keys().cloned().collect();
        sorted_node_ids.sort();

        for id in &sorted_node_ids {
            let node = nodes.get_mut(id).unwrap();
            let count = lane_rank_counts.entry((node.lane_idx, node.rank)).or_insert(0);
            let intra_offset = (*count as f64) * (node.height + 18.0);
            *count += 1;

            let lane = &lanes[node.lane_idx];
            node.x = lane.x + (lane.width - node.width) / 2.0;
            node.y = start_y + (node.rank as f64) * rank_spacing + intra_offset;
            max_y = max_y.max(node.y + node.height);
        }

        let total_h = (max_y + 48.0).max(360.0);

        // 5. Build Edge Routes (Intra-lane vertical, Cross-lane orthogonal)
        for edge in canvas.get_edges() {
            if let (Some(u), Some(v)) = (nodes.get(&edge.left), nodes.get(&edge.right)) {
                let is_cross = u.lane_idx != v.lane_idx;
                let mut points = Vec::new();

                if !is_cross {
                    // Intra-lane vertical connection
                    let exit = (u.x + u.width / 2.0, u.y + u.height);
                    let entry = (v.x + v.width / 2.0, v.y);
                    if (exit.0 - entry.0).abs() < 1.0 {
                        points.push(exit);
                        points.push(entry);
                    } else {
                        let mid_y = (exit.1 + entry.1) / 2.0;
                        points.push(exit);
                        points.push((exit.0, mid_y));
                        points.push((entry.0, mid_y));
                        points.push(entry);
                    }
                } else {
                    // Cross-lane orthogonal connection
                    let u_lane = &lanes[u.lane_idx];
                    let v_lane = &lanes[v.lane_idx];
                    let target_is_right = v_lane.x > u_lane.x;

                    let exit = if target_is_right {
                        (u.x + u.width, u.y + u.height / 2.0)
                    } else {
                        (u.x, u.y + u.height / 2.0)
                    };

                    let entry = if target_is_right {
                        (v.x, v.y + v.height / 2.0)
                    } else {
                        (v.x + v.width, v.y + v.height / 2.0)
                    };

                    if (exit.1 - entry.1).abs() < 2.0 {
                        points.push(exit);
                        points.push(entry);
                    } else {
                        let mid_x = (exit.0 + entry.0) / 2.0;
                        points.push(exit);
                        points.push((mid_x, exit.1));
                        points.push((mid_x, entry.1));
                        points.push(entry);
                    }
                }

                edges.push(SwimlaneEdge {
                    from: edge.left.clone(),
                    to: edge.right.clone(),
                    label: edge.label.clone(),
                    points,
                    color: edge.color.clone().or_else(|| canvas.defaults.edgecolor.clone()),
                    is_cross_lane: is_cross,
                });
            }
        }

        SwimlaneGraph {
            lanes,
            nodes,
            edges,
            width: total_w,
            height: total_h,
        }
    }

    pub fn render_svg(&self) -> String {
        let mut out = String::new();
        let header_h = 46.0;

        out.push_str(&format!(
            r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-swimlane-svg">
  <defs>
    <filter id="sw-shadow" x="-8%" y="-8%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25" flood-color="#000000" />
    </filter>
    <marker id="sw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#94a3b8" />
    </marker>
    <marker id="sw-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
    </marker>
  </defs>

  <style>
    .sw-bg {{ fill: #0f172a; }}
    .sw-lane-body-even {{ fill: rgba(30, 41, 59, 0.25); }}
    .sw-lane-body-odd {{ fill: rgba(15, 23, 42, 0.45); }}
    .sw-lane-divider {{ stroke: #334155; stroke-dasharray: 4,4; stroke-width: 1.2; }}
    .sw-lane-header {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }}
    .sw-node {{ cursor: pointer; transition: transform 0.15s ease; }}
    .sw-node:hover {{ filter: brightness(1.08); }}
    .sw-node-box {{ rx: 8px; ry: 8px; stroke-width: 1.5; }}
    .sw-node-label {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 600; text-anchor: middle; dominant-baseline: central; fill: #ffffff; }}
    .sw-edge-path {{ fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }}
    .sw-edge-label {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; font-weight: 600; fill: #cbd5e1; text-anchor: middle; dominant-baseline: central; paint-order: stroke fill; stroke: #0f172a; stroke-width: 3.5px; stroke-linejoin: round; }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="sw-bg" />

  <!-- Lanes -->
  <g class="sw-lanes-group">
"##,
            self.width, self.height, self.width, self.height
        ));

        // Render lane columns & headers
        for (i, lane) in self.lanes.iter().enumerate() {
            let body_cls = if i % 2 == 0 { "sw-lane-body-even" } else { "sw-lane-body-odd" };
            out.push_str(&format!(
                r##"    <!-- Lane: {} -->
    <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="{}" />
    <rect x="{:.1}" y="12.0" width="{:.1}" height="{:.1}" rx="6" fill="{}" stroke="#475569" stroke-width="1" />
    <text x="{:.1}" y="{:.1}" class="sw-lane-header" fill="{}">{}</text>
"##,
                escape_xml(&lane.name),
                lane.x, header_h + 12.0, lane.width, self.height - header_h - 24.0, body_cls,
                lane.x, lane.width, header_h, lane.color,
                lane.x + lane.width / 2.0, 12.0 + header_h / 2.0, lane.textcolor,
                escape_xml(&lane.label)
            ));

            if i > 0 {
                out.push_str(&format!(
                    r##"    <line x1="{:.1}" y1="12.0" x2="{:.1}" y2="{:.1}" class="sw-lane-divider" />
"##,
                    lane.x, lane.x, self.height - 12.0
                ));
            }
        }
        out.push_str("  </g>\n\n  <!-- Edges -->\n  <g class=\"sw-edges-group\">\n");

        // Render edges
        for edge in &self.edges {
            if edge.points.is_empty() {
                continue;
            }
            let stroke_color = edge.color.as_deref().unwrap_or(if edge.is_cross_lane { "#38bdf8" } else { "#94a3b8" });
            let marker = if edge.is_cross_lane { "url(#sw-arrow-active)" } else { "url(#sw-arrow)" };

            let mut d = format!("M {:.1} {:.1}", edge.points[0].0, edge.points[0].1);
            for p in &edge.points[1..] {
                d.push_str(&format!(" L {:.1} {:.1}", p.0, p.1));
            }

            out.push_str(&format!(
                r##"    <path d="{}" class="sw-edge-path" stroke="{}" marker-end="{}" />
"##,
                d, stroke_color, marker
            ));

            if let Some(ref lbl) = edge.label {
                if edge.points.len() >= 2 {
                    let mid_idx = edge.points.len() / 2;
                    let p_a = edge.points[mid_idx - 1];
                    let p_b = edge.points[mid_idx];
                    let lbl_x = (p_a.0 + p_b.0) / 2.0;
                    let lbl_y = (p_a.1 + p_b.1) / 2.0 - 7.0;
                    out.push_str(&format!(
                        r##"    <text x="{:.1}" y="{:.1}" class="sw-edge-label">{}</text>
"##,
                        lbl_x, lbl_y, escape_xml(lbl)
                    ));
                }
            }
        }
        out.push_str("  </g>\n\n  <!-- Nodes -->\n  <g class=\"sw-nodes-group\">\n");

        // Render nodes
        for node in self.nodes.values() {
            let fill = node.color.as_deref().unwrap_or("#1e293b");
            let text_fill = node.textcolor.as_deref().unwrap_or("#ffffff");
            out.push_str(&format!(
                r##"    <g class="sw-node" id="node-{}" filter="url(#sw-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="{}" stroke="#475569" class="sw-node-box" />
      <text x="{:.1}" y="{:.1}" class="sw-node-label" fill="{}">{}</text>
    </g>
"##,
                escape_xml(&node.id),
                node.x, node.y, node.width, node.height, fill,
                node.x + node.width / 2.0, node.y + node.height / 2.0, text_fill,
                escape_xml(&node.label)
            ));
        }

        out.push_str("  </g>\n</svg>\n");
        out
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
