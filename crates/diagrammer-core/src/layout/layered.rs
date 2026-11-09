use crate::ast::{ArrowType, GraphCanvas, GraphObject};
use std::collections::HashMap;

/// A node positioned on a 2D layer canvas
#[derive(Debug, Clone)]
pub struct LayeredNode {
    pub id: String,
    pub label: String,
    pub shape: String,
    pub width: f64,
    pub height: f64,
    pub x: f64,
    pub y: f64,
    pub layer: usize,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub members: Vec<String>,
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
}

/// The complete laid-out DAG ready for rendering
#[derive(Debug, Clone)]
pub struct LayeredGraph {
    pub nodes: HashMap<String, LayeredNode>,
    pub edges: Vec<LayeredEdge>,
    pub width: f64,
    pub height: f64,
    pub direction: String,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
}

impl LayeredGraph {
    /// Builds and calculates coordinates for all nodes and edges in a GraphCanvas
    pub fn build(canvas: &GraphCanvas) -> Self {
        let direction = match canvas.direction.as_deref().map(|s| s.to_lowercase()).as_deref() {
            Some("landscape") | Some("lr") | Some("horizontal") => "LR".to_string(),
            _ => "TD".to_string(),
        };

        let mut nodes: HashMap<String, LayeredNode> = HashMap::new();
        let mut edges: Vec<LayeredEdge> = Vec::new();

        // 1. Extract nodes (both standalone vertices and container groups like UML classes)
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    let mut members = Vec::new();
                    for inner in &grp.objects {
                        if inner.is_vertex() {
                            let raw_lbl = inner.get_label().unwrap_or_else(|| inner.get_name());
                            members.push(raw_lbl.to_string());
                        }
                    }
                    let label = grp.label.clone().unwrap_or_else(|| grp.name.clone());
                    let max_member_len = members.iter().map(|m| m.len()).max().unwrap_or(0);
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
                            width: w,
                            height: h,
                            x: 0.0,
                            y: 0.0,
                            layer: 0,
                            color: grp.color.clone().or_else(|| canvas.defaults.vertexcolor.clone()),
                            textcolor: grp.textcolor.clone().or_else(|| canvas.defaults.vertextextcolor.clone()),
                            members,
                        },
                    );
                }
                _ => {
                    if obj.is_vertex() {
                        let name = obj.get_name().to_string();
                        if !nodes.contains_key(&name) {
                            let label = obj.get_label().unwrap_or(&name).to_string();
                            let shape = obj.get_shape().unwrap_or("rounded").to_string();
                            let w = ((label.len() as f64) * 8.8 + 36.0).max(84.0);
                            let h = 40.0;

                            nodes.insert(
                                name.clone(),
                                LayeredNode {
                                    id: name,
                                    label,
                                    shape,
                                    width: w,
                                    height: h,
                                    x: 0.0,
                                    y: 0.0,
                                    layer: 0,
                                    color: obj.get_color().map(|s| s.to_string()).or_else(|| canvas.defaults.vertexcolor.clone()),
                                    textcolor: obj.get_textcolor().map(|s| s.to_string()).or_else(|| canvas.defaults.vertextextcolor.clone()),
                                    members: Vec::new(),
                                },
                            );
                        }
                    }
                }
            }
        }

        // Ensure all edge endpoints exist as nodes
        for edge in canvas.get_edges() {
            for endpoint in [&edge.left, &edge.right] {
                if !nodes.contains_key(endpoint) {
                    let w = ((endpoint.len() as f64) * 8.8 + 36.0).max(84.0);
                    nodes.insert(
                        endpoint.clone(),
                        LayeredNode {
                            id: endpoint.clone(),
                            label: endpoint.clone(),
                            shape: "rounded".to_string(),
                            width: w,
                            height: 40.0,
                            x: 0.0,
                            y: 0.0,
                            layer: 0,
                            color: canvas.defaults.vertexcolor.clone(),
                            textcolor: canvas.defaults.vertextextcolor.clone(),
                            members: Vec::new(),
                        },
                    );
                }
            }
        }

        // 2. Extract edges and identify inheritance relationships
        for edge in canvas.get_edges() {
            let is_inh = edge.edge_type.contains('<') || edge.edge_type.contains('>');
            edges.push(LayeredEdge {
                from: edge.left.clone(),
                to: edge.right.clone(),
                label: edge.label.clone(),
                edge_type: edge.edge_type.clone(),
                color: edge.color.clone().or_else(|| canvas.defaults.edgecolor.clone()),
                textcolor: edge.textcolor.clone().or_else(|| canvas.defaults.edgetextcolor.clone()),
                points: Vec::new(),
                is_inheritance: is_inh,
                left_arrow: edge.left_arrow_type(),
                right_arrow: edge.right_arrow_type(),
                line_type: edge.line_type().to_string(),
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

        // 6. Phase 4: Edge Routing (Orthogonal Elbow Steps)
        for e in &mut edges {
            let from_node = nodes.get(&e.from);
            let to_node = nodes.get(&e.to);

            if let (Some(u), Some(v)) = (from_node, to_node) {
                if !is_lr {
                    // TD: Exit from bottom of source, enter at top of target
                    let exit = (u.x + u.width / 2.0, u.y + u.height);
                    let entry = (v.x + v.width / 2.0, v.y);

                    if (exit.0 - entry.0).abs() < 1.0 {
                        // Direct straight vertical line
                        e.points = vec![exit, entry];
                    } else {
                        // Orthogonal elbow routing: Exit -> MidY -> MidX -> Entry
                        let mid_y = (exit.1 + entry.1) / 2.0;
                        e.points = vec![exit, (exit.0, mid_y), (entry.0, mid_y), entry];
                    }
                } else {
                    // LR: Exit from right of source, enter at left of target
                    let exit = (u.x + u.width, u.y + u.height / 2.0);
                    let entry = (v.x, v.y + v.height / 2.0);

                    if (exit.1 - entry.1).abs() < 1.0 {
                        e.points = vec![exit, entry];
                    } else {
                        let mid_x = (exit.0 + entry.0) / 2.0;
                        e.points = vec![exit, (mid_x, exit.1), (mid_x, entry.1), entry];
                    }
                }
            }
        }

        // Calculate total canvas bounds
        let max_x: f64 = nodes.values().map(|n| n.x + n.width).fold(300.0, f64::max);
        let max_y: f64 = nodes.values().map(|n| n.y + n.height).fold(200.0, f64::max);
        let total_w = max_x + margin_x;
        let total_h = max_y + margin_y;

        Self {
            nodes,
            edges,
            width: total_w,
            height: total_h,
            direction,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
        }
    }

    /// Renders the calculated graph into a standalone, theme-adaptive vector SVG
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(16 * 1024);

        let bg_color = self.background.as_deref().unwrap_or("#1e1e2e");
        let default_node_fill = self.default_node_color.as_deref().unwrap_or("#3b82f6");
        let default_edge_stroke = self.default_edge_color.as_deref().unwrap_or("#94a3b8");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-layered-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

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
    <marker id="dl-arrow-inheritance" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <polygon points="0,1 12,6 0,11" fill="#ffffff" stroke="{}" stroke-width="1.5" />
    </marker>
  </defs>

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
    .dl-edge-path {{
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }}
    .dl-edge-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 500;
      fill: #e2e8f0;
      text-anchor: middle;
      dominant-baseline: central;
    }}
    .dl-edge-pill {{
      fill: #1e293b;
      stroke: #475569;
      stroke-width: 1;
      rx: 4px;
      ry: 4px;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dl-bg" />

"##,
            default_edge_stroke, default_edge_stroke, bg_color
        ));

        // 1. Render Edges
        svg.push_str("  <!-- Edges -->\n  <g class=\"dl-edges-group\">\n");
        for edge in &self.edges {
            if edge.points.len() < 2 {
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

            let marker = if edge.is_inheritance {
                "url(#dl-arrow-inheritance)"
            } else {
                "url(#dl-arrow)"
            };

            let dash_attr = if edge.line_type == "dashed" {
                " stroke-dasharray=\"6,4\""
            } else if edge.line_type == "dotted" {
                " stroke-dasharray=\"2,4\""
            } else {
                ""
            };

            svg.push_str(&format!(
                r#"    <path d="{}" class="dl-edge-path" stroke="{}" marker-end="{}"{} />
"#,
                path_d, edge_color, marker, dash_attr
            ));

            // Render Edge Label if present
            if let Some(ref lbl) = edge.label {
                let mid_idx = edge.points.len() / 2;
                let mid_pt = edge.points[mid_idx];
                let prev_pt = edge.points[mid_idx.saturating_sub(1)];
                let lx = (mid_pt.0 + prev_pt.0) / 2.0;
                let ly = (mid_pt.1 + prev_pt.1) / 2.0;

                let pill_w = (lbl.len() as f64 * 7.0 + 14.0).max(36.0);
                let pill_h = 18.0;

                svg.push_str(&format!(
                    r#"    <g class="dl-edge-label-group">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dl-edge-pill" />
      <text x="{:.1}" y="{:.1}" class="dl-edge-label">{}</text>
    </g>
"#,
                    lx - pill_w / 2.0, ly - pill_h / 2.0, pill_w, pill_h,
                    lx, ly,
                    escape_xml(lbl)
                ));
            }
        }
        svg.push_str("  </g>\n\n");

        // 2. Render Nodes
        svg.push_str("  <!-- Nodes -->\n  <g class=\"dl-nodes-group\">\n");
        let mut sorted_nodes: Vec<&LayeredNode> = self.nodes.values().collect();
        sorted_nodes.sort_by_key(|n| (n.layer, n.x as i64));

        for node in sorted_nodes {
            let node_color = node.color.as_deref().unwrap_or(default_node_fill);
            let text_color = node.textcolor.as_deref().unwrap_or("#ffffff");

            if node.shape == "uml_class" && !node.members.is_empty() {
                // Render UML Class / Structured Object Box
                let header_h = 32.0;
                let stroke_color = "#64748b";

                svg.push_str(&format!(
                    r##"    <g class="dl-node dl-class-node" id="node-{}" filter="url(#dl-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dl-class-box" fill="#0f172a" stroke="{}" />
      <!-- Class Title Header -->
      <path d="M {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} Z" fill="{}" />
      <text x="{:.1}" y="{:.1}" class="dl-class-header" fill="{}">{}</text>
      <!-- Separator Line -->
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="1" />
"##,
                    escape_xml(&node.id),
                    node.x, node.y, node.width, node.height, stroke_color,
                    node.x, node.y + header_h,
                    node.x, node.y + 4.0,
                    node.x, node.y,
                    node.x + 4.0, node.y,
                    node.x + node.width - 4.0, node.y,
                    node.x + node.width, node.y,
                    node.x + node.width, node.y + 4.0,
                    node_color,
                    node.x + node.width / 2.0, node.y + header_h / 2.0,
                    text_color, escape_xml(&node.label),
                    node.x, node.y + header_h, node.x + node.width, node.y + header_h, stroke_color
                ));

                // Render Member Lines
                let mut my = node.y + header_h + 14.0;
                for member in &node.members {
                    svg.push_str(&format!(
                        r#"      <text x="{:.1}" y="{:.1}" class="dl-class-member">{}</text>
"#,
                        node.x + 12.0, my, escape_xml(member)
                    ));
                    my += 22.0;
                }
                svg.push_str("    </g>\n");
            } else {
                // Render Standard Vertex / Flowchart Node
                let (rx, ry) = match node.shape.as_str() {
                    "circle" | "doublecircle" => (node.width / 2.0, node.height / 2.0),
                    "box" | "rect" => (2.0, 2.0),
                    _ => (8.0, 8.0),
                };

                let stroke_color = if node_color.starts_with('#') {
                    "#334155"
                } else {
                    "#475569"
                };

                svg.push_str(&format!(
                    r#"    <g class="dl-node" id="node-{}" filter="url(#dl-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="{:.1}" ry="{:.1}" class="dl-node-box" fill="{}" stroke="{}" />
      <text x="{:.1}" y="{:.1}" class="dl-node-label" fill="{}">{}</text>
    </g>
"#,
                    escape_xml(&node.id),
                    node.x, node.y, node.width, node.height, rx, ry,
                    node_color, stroke_color,
                    node.x + node.width / 2.0, node.y + node.height / 2.0,
                    text_color, escape_xml(&node.label)
                ));
            }
        }
        svg.push_str("  </g>\n\n");
        svg.push_str("</svg>\n");

        svg
    }
}

fn escape_xml(s: &str) -> String {
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
}
