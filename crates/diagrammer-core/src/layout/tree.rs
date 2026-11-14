use crate::ast::{GraphCanvas, GraphObject};
use std::collections::{HashMap, HashSet, VecDeque};

/// A node positioned in the tree / dendrogram layout
#[derive(Debug, Clone)]
pub struct TreeNode {
    pub id: String,
    pub label: String,
    pub shape: String,
    pub style: Option<String>,
    pub image: Option<String>,
    pub x: f64,
    pub y: f64,
    pub depth: usize,
    pub width: f64,
    pub height: f64,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub angle: f64,
    pub radius: f64,
}

/// An edge routed between parent and child in the tree
#[derive(Debug, Clone)]
pub struct TreeEdge {
    pub from: String,
    pub to: String,
    pub label: Option<String>,
    pub color: Option<String>,
    pub path_d: String,
}

/// Standalone pure Rust tree and radial dendrogram layout engine
#[derive(Debug, Clone)]
pub struct TreeGraph {
    pub nodes: HashMap<String, TreeNode>,
    pub edges: Vec<TreeEdge>,
    pub width: f64,
    pub height: f64,
    pub is_radial: bool,
    pub background: Option<String>,
    pub default_node_color: Option<String>,
    pub default_edge_color: Option<String>,
}

impl TreeGraph {
    /// Builds tree coordinates for the given AST canvas
    pub fn build(canvas: &GraphCanvas, visualizer_hint: Option<&str>) -> Self {
        let is_radial = matches!(
            visualizer_hint.map(|s| s.to_lowercase()).as_deref(),
            Some("dendrogram") | Some("radial") | Some("fan")
        );

        let mut node_labels: HashMap<String, String> = HashMap::new();
        let mut node_colors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_textcolors: HashMap<String, Option<String>> = HashMap::new();
        let mut node_shapes: HashMap<String, String> = HashMap::new();
        let mut node_styles: HashMap<String, String> = HashMap::new();
        let mut node_images: HashMap<String, String> = HashMap::new();

        // 1. Collect vertices (both standalone and inside groups)
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
            if let Some(st) = obj.get_style() {
                node_styles.insert(name.clone(), st.to_string());
            }
            if let Some(img) = obj.get_image() {
                node_images.insert(name.clone(), img.to_string());
            }
        }

        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(g) = obj {
                if g.is_inner_graph || g.name.parse::<usize>().is_ok() {
                    continue;
                }
                if g.objects.is_empty() {
                    let lbl = g.label.clone().unwrap_or_else(|| g.name.clone());
                    node_labels.entry(g.name.clone()).or_insert(lbl);
                    node_colors.entry(g.name.clone()).or_insert_with(|| g.color.clone());
                    node_textcolors.entry(g.name.clone()).or_insert_with(|| g.textcolor.clone());
                }
            }
        }

        // 2. Build adjacency list (directed parent -> children)
        let mut adj: HashMap<String, Vec<String>> = HashMap::new();
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut raw_edges: Vec<(String, String, Option<String>, Option<String>)> = Vec::new();

        for e in canvas.get_edges() {
            let u = e.left.clone();
            let v = e.right.clone();
            if u.parse::<usize>().is_ok() || v.parse::<usize>().is_ok() {
                continue;
            }
            node_labels.entry(u.clone()).or_insert_with(|| u.clone());
            node_labels.entry(v.clone()).or_insert_with(|| v.clone());
            adj.entry(u.clone()).or_default().push(v.clone());
            *in_degree.entry(v.clone()).or_insert(0) += 1;
            raw_edges.push((u, v, e.label.clone(), e.color.clone()));
        }

        for id in node_labels.keys() {
            in_degree.entry(id.clone()).or_insert(0);
        }

        if node_labels.is_empty() {
            return Self {
                nodes: HashMap::new(),
                edges: Vec::new(),
                width: 300.0,
                height: 200.0,
                is_radial,
                background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
                default_node_color: canvas.defaults.vertexcolor.clone(),
                default_edge_color: canvas.defaults.edgecolor.clone(),
            };
        }

        // 3. Find root node (first node with in_degree == 0, or lowest in_degree)
        let root = node_labels
            .keys()
            .min_by_key(|k| in_degree.get(*k).copied().unwrap_or(0))
            .cloned()
            .unwrap();

        // 4. BFS to extract spanning tree (eliminate cycles)
        let mut tree_children: HashMap<String, Vec<String>> = HashMap::new();
        let mut visited: HashSet<String> = HashSet::new();
        let mut depths: HashMap<String, usize> = HashMap::new();
        let mut queue: VecDeque<String> = VecDeque::new();

        visited.insert(root.clone());
        depths.insert(root.clone(), 0);
        queue.push_back(root.clone());

        while let Some(curr) = queue.pop_front() {
            let curr_d = depths[&curr];
            if let Some(children) = adj.get(&curr) {
                for ch in children {
                    if visited.insert(ch.clone()) {
                        depths.insert(ch.clone(), curr_d + 1);
                        tree_children.entry(curr.clone()).or_default().push(ch.clone());
                        queue.push_back(ch.clone());
                    }
                }
            }
        }

        // Ensure all disconnected nodes are attached to root
        for id in node_labels.keys() {
            if !visited.contains(id) {
                visited.insert(id.clone());
                depths.insert(id.clone(), 1);
                tree_children.entry(root.clone()).or_default().push(id.clone());
            }
        }

        let max_depth = depths.values().copied().max().unwrap_or(0);
        let mut nodes: HashMap<String, TreeNode> = HashMap::new();
        let mut edges: Vec<TreeEdge> = Vec::new();

        let total_w: f64;
        let total_h: f64;

        if !is_radial {
            // Tidy Tree Layout (Reingold-Tilford bottom-up assignment)
            let mut leaf_order: Vec<String> = Vec::new();
            fn collect_leaves(
                u: &str,
                tree_children: &HashMap<String, Vec<String>>,
                leaves: &mut Vec<String>,
            ) {
                if let Some(children) = tree_children.get(u) {
                    if children.is_empty() {
                        leaves.push(u.to_string());
                    } else {
                        for ch in children {
                            collect_leaves(ch, tree_children, leaves);
                        }
                    }
                } else {
                    leaves.push(u.to_string());
                }
            }
            collect_leaves(&root, &tree_children, &mut leaf_order);

            let leaf_sep = 110.0;
            let level_h = 90.0;
            let margin = 50.0;

            let mut leaf_x: HashMap<String, f64> = HashMap::new();
            for (idx, leaf_id) in leaf_order.iter().enumerate() {
                leaf_x.insert(leaf_id.clone(), margin + (idx as f64) * leaf_sep);
            }

            // Post-order bottom-up compute X coordinates
            fn compute_x(
                u: &str,
                tree_children: &HashMap<String, Vec<String>>,
                leaf_x: &HashMap<String, f64>,
                node_x: &mut HashMap<String, f64>,
            ) -> f64 {
                if let Some(children) = tree_children.get(u) {
                    if children.is_empty() {
                        let x = leaf_x.get(u).copied().unwrap_or(50.0);
                        node_x.insert(u.to_string(), x);
                        x
                    } else {
                        let mut sum_x = 0.0;
                        for ch in children {
                            sum_x += compute_x(ch, tree_children, leaf_x, node_x);
                        }
                        let x = sum_x / (children.len() as f64);
                        node_x.insert(u.to_string(), x);
                        x
                    }
                } else {
                    let x = leaf_x.get(u).copied().unwrap_or(50.0);
                    node_x.insert(u.to_string(), x);
                    x
                }
            }

            let mut computed_x: HashMap<String, f64> = HashMap::new();
            compute_x(&root, &tree_children, &leaf_x, &mut computed_x);

            let max_x = computed_x.values().copied().fold(300.0, f64::max);
            total_w = max_x + margin + 60.0;
            total_h = margin * 2.0 + (max_depth as f64) * level_h + 50.0;

            for (id, lbl) in &node_labels {
                let d = depths.get(id).copied().unwrap_or(0);
                let x = computed_x.get(id).copied().unwrap_or(margin);
                let y = margin + (d as f64) * level_h;
                let shape = node_shapes.get(id).cloned().unwrap_or_else(|| "rounded".to_string());
                let style = node_styles.get(id).cloned();
                let image = node_images.get(id).cloned();
                let mut w = (lbl.len() as f64 * 8.0 + 28.0).max(80.0);
                let mut h = 36.0;

                if shape == "circle" || shape == "doublecircle" {
                    let sz = w.max(46.0);
                    w = sz;
                    h = sz;
                } else if shape == "diamond" || shape == "condition" {
                    w = (w * 1.15).max(64.0);
                    h = 44.0;
                } else if image.is_some() {
                    h = 52.0;
                    w = w.max(68.0);
                }

                nodes.insert(
                    id.clone(),
                    TreeNode {
                        id: id.clone(),
                        label: lbl.clone(),
                        shape,
                        style,
                        image,
                        x,
                        y,
                        depth: d,
                        width: w,
                        height: h,
                        color: node_colors.get(id).cloned().flatten(),
                        textcolor: node_textcolors.get(id).cloned().flatten(),
                        angle: 0.0,
                        radius: 0.0,
                    },
                );
            }

            // Route smooth cubic Bézier curves for tree edges
            for (u_id, children) in &tree_children {
                if let Some(u_node) = nodes.get(u_id) {
                    for v_id in children {
                        if let Some(v_node) = nodes.get(v_id) {
                            let p0 = (u_node.x, u_node.y + u_node.height / 2.0);
                            let p3 = (v_node.x, v_node.y - v_node.height / 2.0);
                            let mid_y = (p0.1 + p3.1) / 2.0;

                            let path_d = format!(
                                "M {:.1} {:.1} C {:.1} {:.1}, {:.1} {:.1}, {:.1} {:.1}",
                                p0.0, p0.1, p0.0, mid_y, p3.0, mid_y, p3.0, p3.1
                            );

                            edges.push(TreeEdge {
                                from: u_id.clone(),
                                to: v_id.clone(),
                                label: None,
                                color: None,
                                path_d,
                            });
                        }
                    }
                }
            }
        } else {
            // Radial Dendrogram Layout
            let size = ((max_depth as f64 + 1.0) * 160.0).max(500.0);
            total_w = size;
            total_h = size;
            let center_x = size / 2.0;
            let center_y = size / 2.0;
            let radius_step = (size / 2.0 - 60.0) / ((max_depth.max(1)) as f64);

            let mut leaf_order: Vec<String> = Vec::new();
            fn collect_radial_leaves(
                u: &str,
                tree_children: &HashMap<String, Vec<String>>,
                leaves: &mut Vec<String>,
            ) {
                if let Some(children) = tree_children.get(u) {
                    if children.is_empty() {
                        leaves.push(u.to_string());
                    } else {
                        for ch in children {
                            collect_radial_leaves(ch, tree_children, leaves);
                        }
                    }
                } else {
                    leaves.push(u.to_string());
                }
            }
            collect_radial_leaves(&root, &tree_children, &mut leaf_order);

            let num_leaves = leaf_order.len().max(1);
            let angle_step = std::f64::consts::TAU / (num_leaves as f64);

            let mut leaf_angles: HashMap<String, f64> = HashMap::new();
            for (idx, leaf_id) in leaf_order.iter().enumerate() {
                leaf_angles.insert(leaf_id.clone(), (idx as f64) * angle_step);
            }

            fn compute_angle(
                u: &str,
                tree_children: &HashMap<String, Vec<String>>,
                leaf_angles: &HashMap<String, f64>,
                node_angles: &mut HashMap<String, f64>,
            ) -> f64 {
                if let Some(children) = tree_children.get(u) {
                    if children.is_empty() {
                        let a = leaf_angles.get(u).copied().unwrap_or(0.0);
                        node_angles.insert(u.to_string(), a);
                        a
                    } else {
                        let mut sum_a = 0.0;
                        for ch in children {
                            sum_a += compute_angle(ch, tree_children, leaf_angles, node_angles);
                        }
                        let a = sum_a / (children.len() as f64);
                        node_angles.insert(u.to_string(), a);
                        a
                    }
                } else {
                    let a = leaf_angles.get(u).copied().unwrap_or(0.0);
                    node_angles.insert(u.to_string(), a);
                    a
                }
            }

            let mut computed_angles: HashMap<String, f64> = HashMap::new();
            compute_angle(&root, &tree_children, &leaf_angles, &mut computed_angles);

            for (id, lbl) in &node_labels {
                let d = depths.get(id).copied().unwrap_or(0);
                let angle = computed_angles.get(id).copied().unwrap_or(0.0);
                let radius = (d as f64) * radius_step;
                let x = center_x + radius * angle.cos();
                let y = center_y + radius * angle.sin();
                let shape = node_shapes.get(id).cloned().unwrap_or_else(|| "rounded".to_string());
                let style = node_styles.get(id).cloned();
                let image = node_images.get(id).cloned();
                let mut w = (lbl.len() as f64 * 7.5 + 24.0).max(64.0);
                let mut h = 30.0;

                if shape == "circle" || shape == "doublecircle" {
                    let sz = w.max(40.0);
                    w = sz;
                    h = sz;
                } else if image.is_some() {
                    h = 48.0;
                    w = w.max(56.0);
                }

                nodes.insert(
                    id.clone(),
                    TreeNode {
                        id: id.clone(),
                        label: lbl.clone(),
                        shape,
                        style,
                        image,
                        x,
                        y,
                        depth: d,
                        width: w,
                        height: h,
                        color: node_colors.get(id).cloned().flatten(),
                        textcolor: node_textcolors.get(id).cloned().flatten(),
                        angle,
                        radius,
                    },
                );
            }

            // Radial curved arcs
            for (u_id, children) in &tree_children {
                if let Some(u_node) = nodes.get(u_id) {
                    for v_id in children {
                        if let Some(v_node) = nodes.get(v_id) {
                            let p0 = (u_node.x, u_node.y);
                            let p3 = (v_node.x, v_node.y);
                            let mid_r = (u_node.radius + v_node.radius) / 2.0;
                            let c1 = (
                                center_x + mid_r * u_node.angle.cos(),
                                center_y + mid_r * u_node.angle.sin(),
                            );
                            let c2 = (
                                center_x + mid_r * v_node.angle.cos(),
                                center_y + mid_r * v_node.angle.sin(),
                            );

                            let path_d = format!(
                                "M {:.1} {:.1} C {:.1} {:.1}, {:.1} {:.1}, {:.1} {:.1}",
                                p0.0, p0.1, c1.0, c1.1, c2.0, c2.1, p3.0, p3.1
                            );

                            edges.push(TreeEdge {
                                from: u_id.clone(),
                                to: v_id.clone(),
                                label: None,
                                color: None,
                                path_d,
                            });
                        }
                    }
                }
            }
        }

        Self {
            nodes,
            edges,
            width: total_w,
            height: total_h,
            is_radial,
            background: canvas.theme.as_ref().and_then(|t| t.background.clone()),
            default_node_color: canvas.defaults.vertexcolor.clone(),
            default_edge_color: canvas.defaults.edgecolor.clone(),
        }
    }

    /// Renders vector SVG directly
    pub fn render_svg(&self) -> String {
        let mut svg = String::with_capacity(16 * 1024);
        let bg_color = self.background.as_deref().unwrap_or("#1e1e2e");
        let default_fill = self.default_node_color.as_deref().unwrap_or("#3b82f6");
        let default_stroke = self.default_edge_color.as_deref().unwrap_or("#64748b");

        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="{:.1}" height="{:.1}" class="diagrammer-tree-svg">
"#,
            self.width, self.height, self.width, self.height
        ));

        svg.push_str(&format!(
            r##"  <defs>
    <filter id="dt-shadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.3" flood-color="#000000" />
    </filter>
  </defs>

  <style>
    .dt-bg {{ fill: {}; }}
    .dt-edge {{ fill: none; stroke: {}; stroke-width: 2.0; stroke-linecap: round; opacity: 0.85; }}
    .dt-node-box {{ stroke-width: 1.5; rx: 6px; ry: 6px; }}
    .dt-node-label {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      fill: #ffffff;
      text-anchor: middle;
      dominant-baseline: central;
    }}
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" class="dt-bg" />

  <!-- Edges -->
  <g class="dt-edges">
"##,
            bg_color, default_stroke
        ));

        for e in &self.edges {
            let stroke = e.color.as_deref().unwrap_or(default_stroke);
            svg.push_str(&format!(
                r#"    <path d="{}" class="dt-edge" stroke="{}" />
"#,
                e.path_d, stroke
            ));
        }
        svg.push_str("  </g>\n\n  <!-- Nodes -->\n  <g class=\"dt-nodes\">\n");

        for node in self.nodes.values() {
            let fill = node.color.as_deref().unwrap_or(default_fill);
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
                Some("url(#dt-shadow)"),
                &mut svg,
            );
        }

        svg.push_str("  </g>\n</svg>\n");
        svg
    }
}
