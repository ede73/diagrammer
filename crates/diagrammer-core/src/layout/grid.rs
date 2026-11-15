use crate::ast::{GraphCanvas, GraphObject};
use std::collections::HashMap;

/// A node positioned on a 2D grid matrix or connected to a network bus
#[derive(Debug, Clone)]
pub struct GridNode {
    pub id: String,
    pub label: String,
    pub shape: String,
    pub style: Option<String>,
    pub image: Option<String>,
    pub x: f64,
    pub y: f64,
    pub col: usize,
    pub row: usize,
    pub width: f64,
    pub height: f64,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub network_bus: Option<String>,
    pub address: Option<String>,
}

/// A network bus horizontal rail spanning across devices
#[derive(Debug, Clone)]
pub struct NetworkBus {
    pub name: String,
    pub label: String,
    pub y: f64,
    pub start_x: f64,
    pub end_x: f64,
    pub color: String,
}

/// An edge/tap in the grid layout
#[derive(Debug, Clone)]
pub struct GridEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub path_d: String,
    pub color: Option<String>,
}

/// Standalone 2D Block Grid and Network Bus layout engine in pure Rust
#[derive(Debug, Clone)]
pub struct GridGraph {
    pub nodes: HashMap<String, GridNode>,
    pub buses: Vec<NetworkBus>,
    pub edges: Vec<GridEdge>,
    pub width: f64,
    pub height: f64,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
    pub type_registry: crate::ast::TypeRegistry,
}

impl GridGraph {
    /// Builds 2D grid coordinates and network bus rails
    pub fn build(canvas: &GraphCanvas) -> Self {
        let mut nodes: HashMap<String, GridNode> = HashMap::new();
        let mut buses: Vec<NetworkBus> = Vec::new();
        let mut edges: Vec<GridEdge> = Vec::new();

        let mut bus_order: Vec<String> = Vec::new();
        let mut bus_members: HashMap<String, Vec<String>> = HashMap::new();
        let mut bus_labels: HashMap<String, String> = HashMap::new();
        let mut bus_colors: HashMap<String, String> = HashMap::new();
        let mut node_addresses: HashMap<(String, String), String> = HashMap::new();

        let mut standalone_nodes: Vec<String> = Vec::new();
        let mut node_labels: HashMap<String, String> = HashMap::new();
        let mut node_colors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_textcolors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_shapes: HashMap<String, String> = HashMap::new();
        let mut node_styles: HashMap<String, String> = HashMap::new();
        let mut node_images: HashMap<String, String> = HashMap::new();

        // 1. Identify network buses (groups) and member devices
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    if !bus_order.contains(&grp.name) {
                        bus_order.push(grp.name.clone());
                    }
                    let b_label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                    bus_labels.insert(grp.name.clone(), b_label);
                    let b_color = grp.color.clone().unwrap_or_else(|| "#38bdf8".to_string());
                    bus_colors.insert(grp.name.clone(), b_color);

                    let mut members = Vec::new();
                    for inner in &grp.objects {
                        if inner.is_vertex() || inner.is_reference() {
                            let name = inner.get_name().to_string();
                            if let Some(lbl) = inner.get_label() {
                                if lbl.starts_with('.') || lbl.chars().any(|c| c.is_ascii_digit()) {
                                    node_addresses.insert((name.clone(), grp.name.clone()), lbl.to_string());
                                    node_labels.entry(name.clone()).or_insert_with(|| name.clone());
                                } else {
                                    node_labels.insert(name.clone(), lbl.to_string());
                                }
                            } else {
                                node_labels.entry(name.clone()).or_insert_with(|| name.clone());
                            }
                            if let Some(c) = inner.get_color() {
                                node_colors.insert(name.clone(), Some(c.to_string()));
                            }
                            if let Some(tc) = inner.get_textcolor() {
                                node_textcolors.insert(name.clone(), Some(tc.to_string()));
                            }
                            if let Some(sh) = inner.get_shape() {
                                node_shapes.insert(name.clone(), sh.to_string());
                            }
                            if let Some(st) = inner.get_style() {
                                node_styles.insert(name.clone(), st.to_string());
                            }
                            if let Some(img) = inner.get_image() {
                                node_images.insert(name.clone(), img.to_string());
                            }
                            if !members.contains(&name) {
                                members.push(name);
                            }
                        }
                    }
                    bus_members.insert(grp.name.clone(), members);
                }
                obj if obj.is_vertex() => {
                    let name = obj.get_name().to_string();
                    let lbl = obj.get_label().unwrap_or(&name).to_string();
                    node_labels.insert(name.clone(), lbl);
                    node_colors.insert(name.clone(), obj.get_color().map(|s| s.to_string()));
                    node_textcolors.insert(name.clone(), obj.get_textcolor().map(|s| s.to_string()));
                    if let Some(sh) = obj.get_shape() {
                        node_shapes.insert(name.clone(), sh.to_string());
                    }
                    if let Some(st) = obj.get_style() {
                        node_styles.insert(name.clone(), st.to_string());
                    }
                    if let Some(img) = obj.get_image() {
                        node_images.insert(name.clone(), img.to_string());
                    }
                    standalone_nodes.push(name);
                }
                _ => {}
            }
        }

        // Register any edge endpoints that weren't explicitly declared, or bus attachments
        for e in canvas.get_edges() {
            if bus_order.contains(&e.left) && !bus_order.contains(&e.right) {
                let bus = &e.left;
                let node = &e.right;
                if let Some(ref l) = e.label {
                    node_addresses.insert((node.clone(), bus.clone()), l.clone());
                }
                let m_list = bus_members.entry(bus.clone()).or_default();
                if !m_list.contains(node) {
                    m_list.push(node.clone());
                }
                node_labels.entry(node.clone()).or_insert_with(|| node.clone());
            } else if bus_order.contains(&e.right) && !bus_order.contains(&e.left) {
                let bus = &e.right;
                let node = &e.left;
                if let Some(ref l) = e.label {
                    node_addresses.insert((node.clone(), bus.clone()), l.clone());
                }
                let m_list = bus_members.entry(bus.clone()).or_default();
                if !m_list.contains(node) {
                    m_list.push(node.clone());
                }
                node_labels.entry(node.clone()).or_insert_with(|| node.clone());
            } else {
                node_labels.entry(e.left.clone()).or_insert_with(|| e.left.clone());
                node_labels.entry(e.right.clone()).or_insert_with(|| e.right.clone());
            }
        }

        // 2. Compute Layout Coordinates
        let col_w = 140.0;
        let row_h = 100.0;
        let margin_x = 60.0;
        let margin_y = 60.0;

        if !bus_order.is_empty() {
            // Multi-Homed Network Bus Mode: standalone devices first (e.g. inet upstream of cablemodem)
            let mut node_col: HashMap<String, usize> = HashMap::new();
            let mut next_col = 0;

            for s in &standalone_nodes {
                if !node_col.contains_key(s) {
                    node_col.insert(s.clone(), next_col);
                    next_col += 1;
                }
            }

            for bus_name in &bus_order {
                if let Some(members) = bus_members.get(bus_name) {
                    for m in members {
                        if !node_col.contains_key(m) {
                            node_col.insert(m.clone(), next_col);
                            next_col += 1;
                        }
                    }
                }
            }

            let rail_sep = 160.0;
            let mut bus_rail_y: HashMap<String, f64> = HashMap::new();
            for (idx, bus_name) in bus_order.iter().enumerate() {
                let r_y = margin_y + 60.0 + (idx as f64) * rail_sep;
                bus_rail_y.insert(bus_name.clone(), r_y);
            }

            for (id, &col) in &node_col {
                let device_x = margin_x + 50.0 + (col as f64) * col_w;
                let lbl = node_labels.get(id).cloned().unwrap_or_else(|| id.clone());
                let shape = node_shapes.get(id).cloned().unwrap_or_else(|| "rounded".to_string());
                let style = node_styles.get(id).cloned();
                let image = node_images.get(id).cloned();
                let mut w = 100.0;
                let mut h = 42.0;
                if let Some(template) = canvas.type_registry.get_shape(&shape) {
                    if let Some(tw) = template.width {
                        w = tw;
                    }
                    if let Some(th) = template.height {
                        h = th;
                    }
                } else if shape == "circle" || shape == "doublecircle" {
                    w = 48.0;
                    h = 48.0;
                } else if image.is_some() {
                    h = 52.0;
                    w = 70.0;
                }

                let attached_buses: Vec<&String> = bus_order
                    .iter()
                    .filter(|b| bus_members.get(*b).map(|m| m.contains(id)).unwrap_or(false))
                    .collect();

                let (device_y, primary_bus) = if attached_buses.len() > 1 {
                    // Multi-homed node: positioned in the inter-rail channel bridging between buses
                    let min_y = attached_buses.iter().map(|b| bus_rail_y[*b]).fold(f64::INFINITY, f64::min);
                    let max_y = attached_buses.iter().map(|b| bus_rail_y[*b]).fold(f64::NEG_INFINITY, f64::max);
                    ((min_y + max_y) / 2.0, attached_buses[0].clone())
                } else if let Some(&only_bus) = attached_buses.first() {
                    let b_idx = bus_order.iter().position(|b| b == only_bus).unwrap_or(0);
                    let r_y = bus_rail_y[only_bus];
                    let y = if b_idx == 0 && bus_order.len() > 1 {
                        r_y - 65.0
                    } else {
                        r_y + 65.0
                    };
                    (y, only_bus.clone())
                } else {
                    // Standalone node connected to an attached device
                    let target_y = canvas
                        .get_edges()
                        .iter()
                        .find(|e| &e.left == id || &e.right == id)
                        .and_then(|e| {
                            let other = if &e.left == id { &e.right } else { &e.left };
                            bus_order.iter().find(|b| bus_members.get(*b).map(|m| m.contains(other)).unwrap_or(false))
                        })
                        .map(|b| {
                            let r_y = bus_rail_y[b];
                            let b_idx = bus_order.iter().position(|x| x == b).unwrap_or(0);
                            if b_idx == 0 && bus_order.len() > 1 {
                                r_y - 65.0
                            } else {
                                r_y + 65.0
                            }
                        })
                        .unwrap_or(margin_y + 60.0);
                    (target_y, String::new())
                };

                for bus_name in &attached_buses {
                    let r_y = bus_rail_y[*bus_name];
                    let bus_col = bus_colors.get(*bus_name).cloned().unwrap_or_else(|| "#38bdf8".to_string());
                    let tap_addr = node_addresses.get(&(id.clone(), (*bus_name).clone())).cloned();

                    let path_d = if r_y < device_y {
                        format!("M {:.1} {:.1} L {:.1} {:.1}", device_x, r_y, device_x, device_y - h / 2.0)
                    } else {
                        format!("M {:.1} {:.1} L {:.1} {:.1}", device_x, r_y, device_x, device_y + h / 2.0)
                    };

                    edges.push(GridEdge {
                        from: (*bus_name).clone(),
                        to: id.clone(),
                        label: tap_addr,
                        path_d,
                        color: Some(bus_col),
                    });
                }

                nodes.insert(
                    id.clone(),
                    GridNode {
                        id: id.clone(),
                        label: lbl,
                        shape,
                        style,
                        image,
                        x: device_x,
                        y: device_y,
                        col,
                        row: 0,
                        width: w,
                        height: h,
                        color: node_colors.get(id).cloned().flatten(),
                        textcolor: node_textcolors.get(id).cloned().flatten(),
                        network_bus: if primary_bus.is_empty() { None } else { Some(primary_bus) },
                        address: attached_buses.first().and_then(|b| node_addresses.get(&(id.clone(), (*b).clone())).cloned()),
                    },
                );
            }

            for bus_name in &bus_order {
                let bus_label = bus_labels.get(bus_name).cloned().unwrap_or_else(|| bus_name.clone());
                let bus_color = bus_colors.get(bus_name).cloned().unwrap_or_else(|| "#38bdf8".to_string());
                let r_y = bus_rail_y[bus_name];

                let cols: Vec<usize> = bus_members
                    .get(bus_name)
                    .map(|m| m.iter().filter_map(|id| node_col.get(id)).copied().collect())
                    .unwrap_or_default();
                let min_c = cols.iter().min().copied().unwrap_or(0);
                let max_c = cols.iter().max().copied().unwrap_or(0);

                let start_x = margin_x.min(margin_x + 50.0 + (min_c as f64) * col_w - 40.0);
                let end_x = margin_x + 50.0 + (max_c as f64) * col_w + 60.0;

                buses.push(NetworkBus {
                    name: bus_name.clone(),
                    label: bus_label,
                    y: r_y,
                    start_x,
                    end_x,
                    color: bus_color,
                });
            }

            // Route any inter-node explicit edges
            for e in canvas.get_edges() {
                if !bus_order.contains(&e.left) && !bus_order.contains(&e.right) {
                    if let (Some(u), Some(v)) = (nodes.get(&e.left), nodes.get(&e.right)) {
                        let p0 = (u.x, u.y);
                        let p1 = (v.x, v.y);
                        let path_d = if (p0.1 - p1.1).abs() < 5.0 {
                            let (left_x, right_x) = if p0.0 < p1.0 {
                                (p0.0 + u.width / 2.0, p1.0 - v.width / 2.0)
                            } else {
                                (p0.0 - u.width / 2.0, p1.0 + v.width / 2.0)
                            };
                            format!("M {:.1} {:.1} L {:.1} {:.1}", left_x, p0.1, right_x, p1.1)
                        } else {
                            let mid_x = (p0.0 + p1.0) / 2.0;
                            format!(
                                "M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1}",
                                p0.0, p0.1, mid_x, p0.1, mid_x, p1.1, p1.0, p1.1
                            )
                        };

                        edges.push(GridEdge {
                            from: e.left.clone(),
                            to: e.right.clone(),
                            label: e.label.clone(),
                            path_d,
                            color: e.color.clone().or_else(|| canvas.defaults.edgecolor.clone()),
                        });
                    }
                }
            }
        } else {
            // General 2D Matrix Grid Mode
            let num_cols = (node_labels.len() as f64).sqrt().ceil() as usize;
            let num_cols = num_cols.max(3);

            let mut all_ids: Vec<String> = node_labels.keys().cloned().collect();
            all_ids.sort();

            for (idx, id) in all_ids.iter().enumerate() {
                let col = idx % num_cols;
                let row = idx / num_cols;
                let x = margin_x + (col as f64) * (col_w + 20.0);
                let y = margin_y + (row as f64) * row_h;
                let lbl = node_labels.get(id).cloned().unwrap_or_else(|| id.clone());
                let shape = node_shapes.get(id).cloned().unwrap_or_else(|| "rounded".to_string());
                let style = node_styles.get(id).cloned();
                let image = node_images.get(id).cloned();
                let mut w = 110.0;
                let mut h = 44.0;
                if let Some(template) = canvas.type_registry.get_shape(&shape) {
                    if let Some(tw) = template.width {
                        w = tw;
                    }
                    if let Some(th) = template.height {
                        h = th;
                    }
                } else if shape == "circle" || shape == "doublecircle" {
                    w = 48.0;
                    h = 48.0;
                } else if image.is_some() {
                    h = 52.0;
                    w = 70.0;
                }

                nodes.insert(
                    id.clone(),
                    GridNode {
                        id: id.clone(),
                        label: lbl,
                        shape,
                        style,
                        image,
                        x,
                        y,
                        col,
                        row,
                        width: w,
                        height: h,
                        color: node_colors.get(id).cloned().flatten(),
                        textcolor: node_textcolors.get(id).cloned().flatten(),
                        network_bus: None,
                        address: None,
                    },
                );
            }

            // Route inter-node matrix edges
            for e in canvas.get_edges() {
                if let (Some(u), Some(v)) = (nodes.get(&e.left), nodes.get(&e.right)) {
                    let p0 = (u.x, u.y);
                    let p1 = (v.x, v.y);
                    let mid_x = (p0.0 + p1.0) / 2.0;

                    edges.push(GridEdge {
                        from: e.left.clone(),
                        to: e.right.clone(),
                        label: e.label.clone(),
                        path_d: format!(
                            "M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1}",
                            p0.0, p0.1, mid_x, p0.1, mid_x, p1.1, p1.0, p1.1
                        ),
                        color: e.color.clone(),
                    });
                }
            }
        }

        let max_x = nodes.values().map(|n| n.x + n.width).fold(400.0, f64::max);
        let bus_max_x = buses.iter().map(|b| b.end_x).fold(400.0, f64::max);
        let max_y = nodes.values().map(|n| n.y + n.height).fold(250.0, f64::max);

        let total_w = max_x.max(bus_max_x) + margin_x;
        let total_h = max_y + margin_y;

        Self {
            nodes,
            buses,
            edges,
            width: total_w,
            height: total_h,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
            type_registry: canvas.type_registry.clone(),
        }
    }

    /// Renders vector SVG directly
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(16 * 1024);
        let bg_color = self.background.as_deref().unwrap_or("#0f172a");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#1e293b");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#475569");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-grid-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

        svg.push_str(&format!(
            r##"  <defs>
    <filter id="dg-shadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35" flood-color="#000000" />
    </filter>
  </defs>

  <style>
    .dg-bg {{ fill: {}; }}
    .dg-bus-rail {{ stroke-width: 4px; stroke-linecap: round; }}
    .dg-bus-tag {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      fill: #e2e8f0;
      dominant-baseline: central;
    }}
    .dg-tap {{ stroke-width: 2px; stroke-dasharray: 4,3; }}
    .dg-tap-label {{
      font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
      font-size: 10px;
      font-weight: 600;
      fill: #94a3b8;
      dominant-baseline: central;
    }}
    .dg-node-box {{
      stroke-width: 1.5;
      stroke: #334155;
      rx: 6px;
      ry: 6px;
    }}
    .dg-node-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
    .dg-node-ip {{
      font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
      font-size: 10px;
      fill: #94a3b8;
      text-anchor: middle;
      dominant-baseline: central;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dg-bg" />

  <!-- Network Buses -->
  <g class="dg-buses">
"##,
            bg_color
        ));

        for bus in &self.buses {
            let display_tag = if bus.label != bus.name && !bus.label.is_empty() {
                format!("{} ({})", bus.name, bus.label)
            } else {
                bus.label.clone()
            };
            svg.push_str(&format!(
                r#"    <g class="dg-bus" id="bus-{}">
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" class="dg-bus-rail" />
      <text x="{:.1}" y="{:.1}" class="dg-bus-tag">{}</text>
    </g>
"#,
                escape_xml(&bus.name),
                bus.start_x, bus.y, bus.end_x, bus.y, bus.color,
                bus.start_x + 10.0, bus.y - 12.0, escape_xml(&display_tag)
            ));
        }
        svg.push_str("  </g>\n\n  <!-- Edges & Drop Taps -->\n  <g class=\"dg-edges\">\n");

        for e in &self.edges {
            let stroke = e.color.as_deref().unwrap_or(default_edge_stroke);
            svg.push_str(&format!(
                r#"    <path d="{}" stroke="{}" class="dg-tap" fill="none" />
"#,
                e.path_d, stroke
            ));

            if let Some(ref lbl) = e.label {
                let parts: Vec<&str> = e.path_d.split_whitespace().collect();
                if parts.len() >= 6 && parts[0] == "M" && parts[3] == "L" {
                    if let (Ok(x), Ok(y1), Ok(y2)) = (parts[1].parse::<f64>(), parts[2].parse::<f64>(), parts[5].parse::<f64>()) {
                        let mid_y = (y1 + y2) / 2.0;
                        svg.push_str(&format!(
                            r##"    <text x="{:.1}" y="{:.1}" class="dg-tap-label" fill="#94a3b8">{}</text>
"##,
                            x + 6.0, mid_y, escape_xml(lbl)
                        ));
                    }
                }
            }
        }
        svg.push_str("  </g>\n\n  <!-- Grid Nodes -->\n  <g class=\"dg-nodes\">\n");

        for node in self.nodes.values() {
            let fill = node.color.as_deref().unwrap_or(default_node_fill);
            let text_fill = node.textcolor.as_deref().unwrap_or("#ffffff");

            crate::layout::shapes::render_svg_node(
                &node.id,
                &node.label,
                &node.shape,
                node.style.as_deref(),
                node.image.as_deref(),
                node.x - node.width / 2.0,
                node.y - node.height / 2.0,
                node.width,
                node.height,
                fill,
                text_fill,
                "#475569",
                Some("url(#dg-shadow)"),
                Some(&self.type_registry),
                &mut svg,
            );
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
