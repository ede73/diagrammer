use crate::ast::{GraphCanvas, GraphObject};
use std::collections::HashMap;

/// A node positioned in the 2D physics simulation
#[derive(Debug, Clone)]
pub struct ForceNode {
    pub id: String,
    pub label: String,
    pub group: Option<String>,
    pub shape: String,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub width: f64,
    pub height: f64,
    pub color: Option<String>,
    pub textcolor: Option<String>,
}

/// An edge between nodes in the force simulation
#[derive(Debug, Clone)]
pub struct ForceEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub color: Option<String>,
    pub edge_type: String,
}

/// Standalone pure Rust Force-Directed Spring-Electrical Layout Engine
#[derive(Debug, Clone)]
pub struct ForceGraph {
    pub nodes: HashMap<String, ForceNode>,
    pub edges: Vec<ForceEdge>,
    pub width: f64,
    pub height: f64,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
}

impl ForceGraph {
    /// Builds force simulation equilibrium coordinates
    pub fn build(canvas: &GraphCanvas) -> Self {
        let mut nodes: HashMap<String, ForceNode> = HashMap::new();
        let mut edges: Vec<ForceEdge> = Vec::new();

        let mut node_labels: HashMap<String, String> = HashMap::new();
        let mut node_colors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_textcolors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_shapes: HashMap<String, String> = HashMap::new();
        let mut node_groups: HashMap<String, String> = HashMap::new();

        // 1. Collect group memberships & container colors
        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                if grp.is_inner_graph || grp.name.parse::<usize>().is_ok() {
                    continue;
                }
                let grp_lbl = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                for inner in &grp.objects {
                    if inner.is_vertex() {
                        let name = inner.get_name().to_string();
                        node_groups.insert(name.clone(), grp_lbl.clone());
                        if grp.color.is_some() {
                            node_colors.entry(name.clone()).or_insert_with(|| grp.color.clone());
                        }
                    }
                }
                // If group is empty and named by user, allow group itself as an entity
                if grp.objects.is_empty() {
                    node_labels.insert(grp.name.clone(), grp_lbl);
                    node_colors.insert(grp.name.clone(), grp.color.clone());
                    node_textcolors.insert(grp.name.clone(), grp.textcolor.clone());
                }
            }
        }

        // 2. Collect flattened vertices (standalone and inside groups)
        for obj in canvas.get_flattened_vertices() {
            let name = obj.get_name().to_string();
            if name.parse::<usize>().is_ok() {
                continue;
            }
            let lbl = obj.get_label().unwrap_or(&name).to_string();
            node_labels.insert(name.clone(), lbl);
            if let Some(c) = obj.get_color() {
                node_colors.insert(name.clone(), Some(c.to_string()));
            }
            if let Some(tc) = obj.get_textcolor() {
                node_textcolors.insert(name.clone(), Some(tc.to_string()));
            }
            if let Some(sh) = obj.get_shape() {
                node_shapes.insert(name.clone(), sh.to_string());
            }
        }

        // 3. Collect ALL edges via canvas.get_edges()
        for e in canvas.get_edges() {
            let u = e.left.clone();
            let v = e.right.clone();
            if u.parse::<usize>().is_ok() || v.parse::<usize>().is_ok() {
                continue;
            }
            node_labels.entry(u.clone()).or_insert_with(|| u.clone());
            node_labels.entry(v.clone()).or_insert_with(|| v.clone());
            edges.push(ForceEdge {
                from: u,
                to: v,
                label: e.label.clone(),
                color: e.color.clone(),
                edge_type: e.edge_type.clone(),
            });
        }

        let num_nodes = node_labels.len().max(1);
        let base_size = ((num_nodes as f64).sqrt() * 130.0).max(480.0);
        let width = base_size;
        let height = base_size;
        let center_x = width / 2.0;
        let center_y = height / 2.0;

        // 4. Initial deterministic circular placement
        let angle_step = std::f64::consts::TAU / (num_nodes as f64);
        let init_radius = (base_size / 3.2).max(100.0);

        let mut sorted_ids: Vec<String> = node_labels.keys().cloned().collect();
        sorted_ids.sort();

        for (idx, id) in sorted_ids.iter().enumerate() {
            let angle = (idx as f64) * angle_step;
            let x = center_x + init_radius * angle.cos();
            let y = center_y + init_radius * angle.sin();
            let lbl = node_labels.get(id).cloned().unwrap_or_else(|| id.clone());
            let shape = node_shapes.get(id).cloned().unwrap_or_else(|| "rounded".to_string());
            let w = ((lbl.len() as f64) * 8.5 + 32.0).max(76.0);
            let h = 38.0;

            nodes.insert(
                id.clone(),
                ForceNode {
                    id: id.clone(),
                    label: lbl,
                    group: node_groups.get(id).cloned(),
                    shape,
                    x,
                    y,
                    vx: 0.0,
                    vy: 0.0,
                    width: w,
                    height: h,
                    color: node_colors.get(id).cloned().flatten(),
                    textcolor: node_textcolors.get(id).cloned().flatten(),
                },
            );
        }

        // 5. Fruchterman-Reingold Physics Simulation (100 iterations)
        let area = width * height;
        let k = ((area / (num_nodes as f64)).sqrt() * 0.75).max(70.0);
        let k2 = k * k;
        let mut temperature = width / 5.0;
        let iterations = 100;

        for _ in 0..iterations {
            let mut disp_x: HashMap<String, f64> = HashMap::new();
            let mut disp_y: HashMap<String, f64> = HashMap::new();

            for id in nodes.keys() {
                disp_x.insert(id.clone(), 0.0);
                disp_y.insert(id.clone(), 0.0);
            }

            // A. Coulomb Repulsion between all pairs
            let node_ids: Vec<String> = nodes.keys().cloned().collect();
            for i in 0..node_ids.len() {
                let u_id = &node_ids[i];
                let u_pos = (nodes[u_id].x, nodes[u_id].y);

                for j in (i + 1)..node_ids.len() {
                    let v_id = &node_ids[j];
                    let v_pos = (nodes[v_id].x, nodes[v_id].y);

                    let dx = u_pos.0 - v_pos.0;
                    let dy = u_pos.1 - v_pos.1;
                    let dist = (dx * dx + dy * dy).sqrt().max(1.0);

                    let rep_force = k2 / dist;
                    let fx = (dx / dist) * rep_force;
                    let fy = (dy / dist) * rep_force;

                    *disp_x.get_mut(u_id).unwrap() += fx;
                    *disp_y.get_mut(u_id).unwrap() += fy;
                    *disp_x.get_mut(v_id).unwrap() -= fx;
                    *disp_y.get_mut(v_id).unwrap() -= fy;
                }
            }

            // B. Hooke Spring Attraction along edges
            for edge in &edges {
                if let (Some(u), Some(v)) = (nodes.get(&edge.from), nodes.get(&edge.to)) {
                    let dx = u.x - v.x;
                    let dy = u.y - v.y;
                    let dist = (dx * dx + dy * dy).sqrt().max(1.0);

                    let att_force = (dist * dist) / k;
                    let fx = (dx / dist) * att_force;
                    let fy = (dy / dist) * att_force;

                    *disp_x.get_mut(&edge.from).unwrap() -= fx;
                    *disp_y.get_mut(&edge.from).unwrap() -= fy;
                    *disp_x.get_mut(&edge.to).unwrap() += fx;
                    *disp_y.get_mut(&edge.to).unwrap() += fy;
                }
            }

            // C. Cohesion for nodes sharing the same group container
            for i in 0..node_ids.len() {
                let u_id = &node_ids[i];
                if let Some(u_grp) = &nodes[u_id].group {
                    for j in (i + 1)..node_ids.len() {
                        let v_id = &node_ids[j];
                        if let Some(v_grp) = &nodes[v_id].group {
                            if u_grp == v_grp {
                                let dx = nodes[u_id].x - nodes[v_id].x;
                                let dy = nodes[u_id].y - nodes[v_id].y;
                                let dist = (dx * dx + dy * dy).sqrt().max(1.0);
                                let cluster_att = (dist * dist) / (k * 2.0);
                                let fx = (dx / dist) * cluster_att;
                                let fy = (dy / dist) * cluster_att;
                                *disp_x.get_mut(u_id).unwrap() -= fx;
                                *disp_y.get_mut(u_id).unwrap() -= fy;
                                *disp_x.get_mut(v_id).unwrap() += fx;
                                *disp_y.get_mut(v_id).unwrap() += fy;
                            }
                        }
                    }
                }
            }

            // D. Center gravity (pulls entire layout toward center with proportional tension)
            for (id, node) in &nodes {
                let gx = (center_x - node.x) * 0.12;
                let gy = (center_y - node.y) * 0.12;
                *disp_x.get_mut(id).unwrap() += gx;
                *disp_y.get_mut(id).unwrap() += gy;
            }

            // E. Displace nodes capped by temperature
            for (id, node) in &mut nodes {
                let dx = disp_x[id];
                let dy = disp_y[id];
                let disp_len = (dx * dx + dy * dy).sqrt().max(0.001);

                let limited_disp = disp_len.min(temperature);
                node.x += (dx / disp_len) * limited_disp;
                node.y += (dy / disp_len) * limited_disp;
            }

            // Cool temperature
            temperature *= 0.93;
        }

        // 6. Normalize layout bounds into well-proportioned canvas
        let min_x = nodes.values().map(|n| n.x - n.width / 2.0).fold(f64::INFINITY, f64::min);
        let max_x = nodes.values().map(|n| n.x + n.width / 2.0).fold(f64::NEG_INFINITY, f64::max);
        let min_y = nodes.values().map(|n| n.y - n.height / 2.0).fold(f64::INFINITY, f64::min);
        let max_y = nodes.values().map(|n| n.y + n.height / 2.0).fold(f64::NEG_INFINITY, f64::max);

        let padding = 70.0;
        let final_w = if min_x.is_finite() && max_x.is_finite() {
            (max_x - min_x + 2.0 * padding).max(400.0)
        } else {
            500.0
        };
        let final_h = if min_y.is_finite() && max_y.is_finite() {
            (max_y - min_y + 2.0 * padding).max(300.0)
        } else {
            400.0
        };

        let shift_x = if min_x.is_finite() { padding - min_x } else { 0.0 };
        let shift_y = if min_y.is_finite() { padding - min_y } else { 0.0 };

        for node in nodes.values_mut() {
            node.x += shift_x;
            node.y += shift_y;
        }

        Self {
            nodes,
            edges,
            width: final_w,
            height: final_h,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
        }
    }

    /// Renders vector SVG directly
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(32 * 1024);
        let bg_color = self.background.as_deref().unwrap_or("#111827");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#6366f1");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#64748b");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-force-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

        svg.push_str(&format!(
            r##"  <defs>
    <filter id="dforce-shadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-opacity="0.4" flood-color="#000000" />
    </filter>
    <marker id="dforce-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="{}" />
    </marker>
  </defs>

  <style>
    .dforce-bg {{ fill: {}; }}
    .dforce-edge {{ stroke-width: 1.8px; stroke-linecap: round; opacity: 0.8; }}
    .dforce-edge-label-bg {{ fill: #0f172a; stroke: #334155; stroke-width: 1; rx: 4px; }}
    .dforce-edge-label {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; font-weight: 500; fill: #cbd5e1; text-anchor: middle; dominant-baseline: central; }}
    .dforce-node-box {{
      stroke-width: 1.5;
      stroke: #312e81;
      rx: 18px;
      ry: 18px;
    }}
    .dforce-node-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
    .dforce-node-grp {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9px;
      font-weight: 500;
      fill: #94a3b8;
      text-anchor: middle;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dforce-bg" />

  <!-- Edges -->
  <g class="dforce-edges">
"##,
            default_edge_stroke, bg_color
        ));

        for e in &self.edges {
            if let (Some(u), Some(v)) = (self.nodes.get(&e.from), self.nodes.get(&e.to)) {
                let stroke = e.color.as_deref().unwrap_or(default_edge_stroke);
                let is_directed = e.edge_type.contains('>');
                let is_dashed = e.edge_type.contains('.') || e.edge_type.to_lowercase().contains("dash");

                let dx = v.x - u.x;
                let dy = v.y - u.y;
                let dist = (dx * dx + dy * dy).sqrt().max(1.0);
                let ux = dx / dist;
                let uy = dy / dist;

                let r_u = (u.width / 2.0).min(u.height / 2.0).max(16.0);
                let r_v = (v.width / 2.0).min(v.height / 2.0).max(16.0) + if is_directed { 8.0 } else { 0.0 };

                let x1 = u.x + ux * r_u;
                let y1 = u.y + uy * r_u;
                let x2 = v.x - ux * r_v;
                let y2 = v.y - uy * r_v;

                let dash_attr = if is_dashed { " stroke-dasharray=\"5,4\"" } else { "" };
                let marker_attr = if is_directed { " marker-end=\"url(#dforce-arrow)\"" } else { "" };

                svg.push_str(&format!(
                    r#"    <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" class="dforce-edge"{}{} />
"#,
                    x1, y1, x2, y2, stroke, dash_attr, marker_attr
                ));

                if let Some(lbl) = &e.label {
                    let mid_x = (x1 + x2) / 2.0;
                    let mid_y = (y1 + y2) / 2.0;
                    let lw = (lbl.len() as f64 * 6.5 + 12.0).max(24.0);
                    let lh = 16.0;
                    svg.push_str(&format!(
                        r##"    <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dforce-edge-label-bg" />
    <text x="{:.1}" y="{:.1}" class="dforce-edge-label">{}</text>
"##,
                        mid_x - lw / 2.0,
                        mid_y - lh / 2.0,
                        lw,
                        lh,
                        mid_x,
                        mid_y,
                        escape_xml(lbl)
                    ));
                }
            }
        }
        svg.push_str("  </g>\n\n  <!-- Nodes -->\n  <g class=\"dforce-nodes\">\n");

        for node in self.nodes.values() {
            let fill = node.color.as_deref().unwrap_or(default_node_fill);
            let text_fill = node.textcolor.as_deref().unwrap_or("#ffffff");
            let is_real_group = node.group.as_ref().map(|g| g.parse::<usize>().is_err() && !g.is_empty() && g != &node.label).unwrap_or(false);
            let label_y = if is_real_group { node.y - 3.0 } else { node.y };

            svg.push_str(&format!(
                r##"    <g class="dforce-node" filter="url(#dforce-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dforce-node-box" fill="{}" />
      <text x="{:.1}" y="{:.1}" class="dforce-node-label" fill="{}">{}</text>
"##,
                node.x - node.width / 2.0,
                node.y - node.height / 2.0,
                node.width,
                node.height,
                fill,
                node.x,
                label_y,
                text_fill,
                escape_xml(&node.label)
            ));

            if is_real_group {
                if let Some(grp) = &node.group {
                    svg.push_str(&format!(
                        r##"      <text x="{:.1}" y="{:.1}" class="dforce-node-grp">[{}]</text>
"##,
                        node.x,
                        node.y + 11.0,
                        escape_xml(grp)
                    ));
                }
            }

            svg.push_str("    </g>\n");
        }

        svg.push_str("  </g>\n</svg>\n");
        svg
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}
