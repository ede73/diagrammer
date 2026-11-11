use crate::ast::{GraphCanvas, GraphObject};
use std::collections::HashMap;

/// A node positioned in the 2D physics simulation
#[derive(Debug, Clone)]
pub struct ForceNode {
    pub id: String,
    pub label: String,
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

        // 1. Collect nodes
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Vertex(v) => {
                    let lbl = v.label.clone().unwrap_or_else(|| v.name.clone());
                    node_labels.insert(v.name.clone(), lbl);
                    node_colors.insert(v.name.clone(), v.color.clone());
                    node_textcolors.insert(v.name.clone(), v.textcolor.clone());
                }
                GraphObject::Group(g) => {
                    let lbl = g.label.clone().unwrap_or_else(|| g.name.clone());
                    node_labels.insert(g.name.clone(), lbl);
                    node_colors.insert(g.name.clone(), g.color.clone());
                    node_textcolors.insert(g.name.clone(), g.textcolor.clone());
                }
                _ => {}
            }
        }

        // 2. Collect edges
        for obj in canvas.get_objects(false) {
            if let GraphObject::Edge { edge: e } = obj {
                node_labels.entry(e.left.clone()).or_insert_with(|| e.left.clone());
                node_labels.entry(e.right.clone()).or_insert_with(|| e.right.clone());
                edges.push(ForceEdge {
                    from: e.left.clone(),
                    to: e.right.clone(),
                    label: e.label.clone(),
                    color: e.color.clone(),
                });
            }
        }

        let num_nodes = node_labels.len().max(1);
        let base_size = ((num_nodes as f64).sqrt() * 180.0).max(500.0);
        let width = base_size;
        let height = base_size;
        let center_x = width / 2.0;
        let center_y = height / 2.0;

        // 3. Initial circular placement
        let angle_step = std::f64::consts::TAU / (num_nodes as f64);
        let init_radius = (base_size / 3.0).max(100.0);

        let mut sorted_ids: Vec<String> = node_labels.keys().cloned().collect();
        sorted_ids.sort();

        for (idx, id) in sorted_ids.iter().enumerate() {
            let angle = (idx as f64) * angle_step;
            let x = center_x + init_radius * angle.cos();
            let y = center_y + init_radius * angle.sin();
            let lbl = node_labels.get(id).cloned().unwrap_or_else(|| id.clone());
            let w = (lbl.len() as f64 * 8.0 + 28.0).max(72.0);
            let h = 38.0;

            nodes.insert(
                id.clone(),
                ForceNode {
                    id: id.clone(),
                    label: lbl,
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

        // 4. Fruchterman-Reingold Physics Simulation (80 iterations)
        let area = width * height;
        let k = ((area / (num_nodes as f64)).sqrt()).max(60.0);
        let k2 = k * k;
        let mut temperature = width / 8.0;
        let iterations = 80;

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

            // C. Displace nodes capped by temperature
            for (id, node) in &mut nodes {
                let dx = disp_x[id];
                let dy = disp_y[id];
                let disp_len = (dx * dx + dy * dy).sqrt().max(0.001);

                let limited_disp = disp_len.min(temperature);
                node.x += (dx / disp_len) * limited_disp;
                node.y += (dy / disp_len) * limited_disp;

                // Soft boundary containment
                let margin = 50.0;
                node.x = node.x.clamp(margin, width - margin);
                node.y = node.y.clamp(margin, height - margin);
            }

            // Cool temperature
            temperature *= 0.94;
        }

        Self {
            nodes,
            edges,
            width,
            height,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
        }
    }

    /// Renders vector SVG directly
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(16 * 1024);
        let bg_color = self.background.as_deref().unwrap_or("#111827");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#6366f1");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#475569");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-force-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

        svg.push_str(&format!(
            r##"  <defs>
    <filter id="dforce-shadow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="3.0" flood-opacity="0.35" flood-color="#000000" />
    </filter>
  </defs>

  <style>
    .dforce-bg {{ fill: {}; }}
    .dforce-edge {{ stroke-width: 1.8px; stroke-linecap: round; opacity: 0.75; }}
    .dforce-node-box {{
      stroke-width: 1.5;
      stroke: #312e81;
      rx: 19px;
      ry: 19px;
    }}
    .dforce-node-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dforce-bg" />

  <!-- Edges -->
  <g class="dforce-edges">
"##,
            bg_color
        ));

        for e in &self.edges {
            if let (Some(u), Some(v)) = (self.nodes.get(&e.from), self.nodes.get(&e.to)) {
                let stroke = e.color.as_deref().unwrap_or(default_edge_stroke);
                svg.push_str(&format!(
                    r#"    <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" class="dforce-edge" />
"#,
                    u.x, u.y, v.x, v.y, stroke
                ));
            }
        }
        svg.push_str("  </g>\n\n  <!-- Nodes -->\n  <g class=\"dforce-nodes\">\n");

        for node in self.nodes.values() {
            let fill = node.color.as_deref().unwrap_or(default_node_fill);
            let text_fill = node.textcolor.as_deref().unwrap_or("#ffffff");

            svg.push_str(&format!(
                r##"    <g class="dforce-node" filter="url(#dforce-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dforce-node-box" fill="{}" />
      <text x="{:.1}" y="{:.1}" class="dforce-node-label" fill="{}">{}</text>
    </g>
"##,
                node.x - node.width / 2.0,
                node.y - node.height / 2.0,
                node.width,
                node.height,
                fill,
                node.x,
                node.y,
                text_fill,
                escape_xml(&node.label)
            ));
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
