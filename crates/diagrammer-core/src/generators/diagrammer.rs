use super::Generator;
use crate::ast::{
    EdgeRef, GraphCanvas, GraphGroup, GraphObject, NodeShapeBody,
};
use std::collections::HashSet;

pub struct DiagrammerGenerator;

impl Generator for DiagrammerGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        Self::generate_diagrammer(canvas)
    }
}

impl DiagrammerGenerator {
    pub fn generate_diagrammer(canvas: &GraphCanvas) -> String {
        let mut out = String::new();

        // 1. Top-level directives
        if let Some(ref vis) = canvas.visualizer {
            out.push_str(&format!("visualizer {}\n", vis));
        }
        if let Some(ref dir) = canvas.direction {
            let d = dir.to_lowercase();
            if d.contains("land") || d.contains("horiz") || d == "lr" {
                out.push_str("landscape\n");
            } else {
                out.push_str("portrait\n");
            }
        }
        if let Some(ref s) = canvas.start {
            out.push_str(&format!("start {}\n", s));
        }
        if let Some(ref sh) = canvas.shape {
            out.push_str(&format!("shape {}\n", sh));
        }
        if let Some(ref dbg) = canvas.debug {
            out.push_str(&format!("debug {}\n", dbg));
        }

        // 2. Global defaults
        if let Some(ref ec) = canvas.defaults.edgecolor {
            out.push_str(&format!("edge color {}\n", ec));
        }
        if let Some(ref etc) = canvas.defaults.edgetextcolor {
            out.push_str(&format!("edge textcolor {}\n", etc));
        }
        if let Some(ref vc) = canvas.defaults.vertexcolor {
            out.push_str(&format!("vertex color {}\n", vc));
        }
        if let Some(ref vtc) = canvas.defaults.vertextextcolor {
            out.push_str(&format!("vertex textcolor {}\n", vtc));
        }
        if let Some(ref gc) = canvas.defaults.groupcolor {
            out.push_str(&format!("group color {}\n", gc));
        }

        // Add a blank line if we had header directives
        if !out.is_empty() {
            out.push('\n');
        }

        // 3. Theme configuration block
        if let Some(ref theme) = canvas.theme {
            out.push_str("theme {\n");
            if let Some(ref f) = theme.font {
                out.push_str(&format!("    font: \"{}\";\n", f));
            }
            if let Some(ref fs) = theme.fontsize {
                out.push_str(&format!("    fontsize: {};\n", fs));
            }
            if let Some(ref c) = theme.color {
                out.push_str(&format!("    color: {};\n", c));
            }
            if let Some(ref bg) = theme.background {
                out.push_str(&format!("    background: {};\n", bg));
            }
            if let Some(ref vc) = theme.vertexcolor {
                out.push_str(&format!("    vertexcolor: {};\n", vc));
            }
            if let Some(ref vtc) = theme.vertextextcolor {
                out.push_str(&format!("    vertextextcolor: {};\n", vtc));
            }
            if let Some(ref ec) = theme.edgecolor {
                out.push_str(&format!("    edgecolor: {};\n", ec));
            }
            if let Some(ref etc) = theme.edgetextcolor {
                out.push_str(&format!("    edgetextcolor: {};\n", etc));
            }
            if let Some(ref gc) = theme.groupcolor {
                out.push_str(&format!("    groupcolor: {};\n", gc));
            }
            let mut sorted_props: Vec<_> = theme.properties.iter().collect();
            sorted_props.sort_by_key(|(k, _)| *k);
            for (k, v) in sorted_props {
                out.push_str(&format!("    {}: {};\n", k, v));
            }
            out.push_str("}\n\n");
        }

        // 4. Layout configuration block
        if let Some(ref layout) = canvas.layout {
            out.push_str("layout {\n");
            if let Some(ref e) = layout.engine {
                out.push_str(&format!("    engine: {};\n", e));
            }
            if let Some(ref d) = layout.direction {
                out.push_str(&format!("    direction: {};\n", d));
            }
            if let Some(ref p) = layout.padding {
                out.push_str(&format!("    padding: {};\n", p));
            }
            if let Some(ref ns) = layout.nodesep {
                out.push_str(&format!("    nodesep: {};\n", ns));
            }
            if let Some(ref rs) = layout.ranksep {
                out.push_str(&format!("    ranksep: {};\n", rs));
            }
            if let Some(ref es) = layout.edgesize {
                out.push_str(&format!("    edgesize: {};\n", es));
            }
            if let Some(ref m) = layout.margin {
                out.push_str(&format!("    margin: {};\n", m));
            }
            let mut sorted_props: Vec<_> = layout.properties.iter().collect();
            sorted_props.sort_by_key(|(k, _)| *k);
            for (k, v) in sorted_props {
                out.push_str(&format!("    {}: {};\n", k, v));
            }
            out.push_str("}\n\n");
        }

        // 5. Custom shape definitions
        let mut sorted_shapes: Vec<_> = canvas.type_registry.shapes.values().collect();
        sorted_shapes.sort_by_key(|s| &s.name);
        for template in sorted_shapes {
            let params = match (template.width, template.height) {
                (Some(w), Some(h)) => format!("(width={}, height={}) ", w, h),
                (Some(w), None) => format!("(width={}) ", w),
                (None, Some(h)) => format!("(height={}) ", h),
                (None, None) => String::new(),
            };
            out.push_str(&format!("define {} {}{{\n", template.name, params));
            match &template.body {
                NodeShapeBody::Svg(svg) => {
                    out.push_str(&format!("    {}\n", svg.trim()));
                }
                NodeShapeBody::Primitives(prims) => {
                    for p in prims {
                        let mut sorted_attrs: Vec<_> = p.attributes.iter().collect();
                        sorted_attrs.sort_by_key(|(k, _)| *k);
                        let attrs = sorted_attrs
                            .iter()
                            .map(|(k, v)| format!("{}={}", k, v))
                            .collect::<Vec<_>>()
                            .join(", ");
                        out.push_str(&format!("    {}({});\n", p.kind, attrs));
                    }
                }
            }
            out.push_str("}\n\n");
        }

        // 6. Custom operator definitions
        let mut sorted_ops: Vec<_> = canvas.type_registry.operators.values().collect();
        sorted_ops.sort_by_key(|op| &op.symbol);
        for op in sorted_ops {
            out.push_str(&format!("define operator {} {{\n", op.symbol));
            if let Some(ref t) = op.edge_type {
                out.push_str(&format!("    type: {};\n", t));
            }
            if let Some(ref s) = op.style {
                out.push_str(&format!("    style: {};\n", s));
            }
            if let Some(ref c) = op.color {
                out.push_str(&format!("    color: {};\n", c));
            }
            if let Some(ref a) = op.action {
                out.push_str(&format!("    action: {};\n", a));
            }
            if let Some(ref ah) = op.arrowhead {
                out.push_str(&format!("    arrowhead: {};\n", ah.shape));
            }
            out.push_str("}\n\n");
        }

        // 7. Includes
        for inc in &canvas.includes {
            out.push_str(&format!("include \"{}\"\n", inc));
        }
        if !canvas.includes.is_empty() {
            out.push('\n');
        }

        // 8. Canvas objects (Groups, Vertices, Edges)
        let all_edges = canvas.get_edges();
        Self::format_objects(&canvas.objects, &all_edges, None, 0, &mut out);

        out
    }

    fn format_objects(
        objects: &[GraphObject],
        all_edges: &[&EdgeRef],
        current_group: Option<&str>,
        indent_level: usize,
        out: &mut String,
    ) {
        let pad = "    ".repeat(indent_level);

        // Collect names of all nodes connected by edges in this container
        let mut edge_connected_nodes = HashSet::new();
        for edge in all_edges {
            if edge.parent.as_deref() == current_group {
                edge_connected_nodes.insert(edge.left.clone());
                edge_connected_nodes.insert(edge.right.clone());
            }
        }

        for obj in objects {
            match obj {
                GraphObject::Group(grp) => {
                    Self::format_group(grp, all_edges, indent_level, out);
                }
                GraphObject::Vertex(v) => {
                    let has_custom_attrs = v.shape.is_some()
                        || v.style.is_some()
                        || v.color.is_some()
                        || v.label.is_some()
                        || v.image.is_some();

                    if has_custom_attrs || !edge_connected_nodes.contains(&v.name) {
                        out.push_str(&pad);
                        Self::format_vertex_decl(
                            &v.name,
                            v.style.as_deref(),
                            v.shape.as_deref(),
                            v.color.as_deref(),
                            v.image.as_deref(),
                            v.label.as_deref(),
                            out,
                        );
                        out.push('\n');
                    }
                }
                GraphObject::VertexRef { vertex } => {
                    let has_custom_attrs = vertex.shape.is_some()
                        || vertex.style.is_some()
                        || vertex.color.is_some()
                        || vertex.label.is_some()
                        || vertex.image.is_some();

                    if has_custom_attrs || !edge_connected_nodes.contains(&vertex.name) {
                        out.push_str(&pad);
                        Self::format_vertex_decl(
                            &vertex.name,
                            vertex.style.as_deref(),
                            vertex.shape.as_deref(),
                            vertex.color.as_deref(),
                            vertex.image.as_deref(),
                            vertex.label.as_deref(),
                            out,
                        );
                        out.push('\n');
                    }
                }
                GraphObject::Edge { edge } => {
                    // Only emit if this edge belongs to the current container scope
                    if edge.parent.as_deref() == current_group {
                        out.push_str(&pad);
                        Self::format_edge(edge, out);
                        out.push('\n');
                    }
                }
                GraphObject::Reference(_) => {}
            }
        }

        // If this is an inner group, also emit any edges whose parent matches this group
        // that were stored at top-level canvas.objects
        if let Some(grp_name) = current_group {
            for edge in all_edges {
                if edge.parent.as_deref() == Some(grp_name) {
                    // Check if already in objects to avoid duplicate emit
                    let already_in_objects = objects.iter().any(|obj| match obj {
                        GraphObject::Edge { edge: e } => e.left == edge.left && e.right == edge.right && e.edge_type == edge.edge_type,
                        _ => false,
                    });
                    if !already_in_objects {
                        out.push_str(&pad);
                        Self::format_edge(edge, out);
                        out.push('\n');
                    }
                }
            }
        }
    }

    fn format_group(grp: &GraphGroup, all_edges: &[&EdgeRef], indent_level: usize, out: &mut String) {
        let pad = "    ".repeat(indent_level);

        // Header: {Name Color; Label
        let safe_name = if !grp.name.is_empty() && grp.name.chars().all(|c| c.is_ascii_digit()) {
            format!("Group_{}", grp.name)
        } else {
            grp.name.clone()
        };

        out.push_str(&pad);
        out.push('{');
        if !safe_name.is_empty() {
            out.push_str(&safe_name);
        }
        if let Some(ref c) = grp.color {
            if !safe_name.is_empty() {
                out.push(' ');
            }
            out.push_str(c);
        }
        if let Some(ref l) = grp.label {
            out.push_str("; ");
            out.push_str(l);
        }
        out.push('\n');

        let inner_pad = "    ".repeat(indent_level + 1);

        // Inner visualizer if specified
        if let Some(ref vis) = grp.visualizer {
            out.push_str(&inner_pad);
            out.push_str(&format!("visualizer {}\n", vis));
        }

        // Inner group defaults
        if let Some(ref ec) = grp.defaults.edgecolor {
            out.push_str(&inner_pad);
            out.push_str(&format!("edge color {}\n", ec));
        }
        if let Some(ref vc) = grp.defaults.vertexcolor {
            out.push_str(&inner_pad);
            out.push_str(&format!("vertex color {}\n", vc));
        }

        // Format inner objects
        Self::format_objects(&grp.objects, all_edges, Some(&grp.name), indent_level + 1, out);

        out.push_str(&pad);
        out.push_str("}\n\n");
    }

    fn format_vertex_decl(
        name: &str,
        style: Option<&str>,
        shape: Option<&str>,
        color: Option<&str>,
        image: Option<&str>,
        label: Option<&str>,
        out: &mut String,
    ) {
        if let Some(s) = style {
            out.push_str(s);
            out.push(' ');
        }
        if let Some(sh) = shape {
            out.push_str(sh);
            out.push(' ');
        }
        out.push_str(name);
        if let Some(c) = color {
            out.push(' ');
            out.push_str(c);
        }
        if let Some(img) = image {
            out.push(' ');
            out.push_str(img);
        }
        if let Some(lbl) = label {
            out.push_str("; ");
            out.push_str(lbl);
        }
    }

    fn format_edge(edge: &crate::ast::EdgeRef, out: &mut String) {
        // Left node and compass
        let left_name = if !edge.left.is_empty() && edge.left.chars().all(|c| c.is_ascii_digit()) {
            format!("Group_{}", edge.left)
        } else {
            edge.left.clone()
        };
        out.push_str(&left_name);
        if let Some(ref lc) = edge.lcompass {
            if !lc.starts_with(':') {
                out.push(':');
            }
            out.push_str(lc);
        }
        out.push(' ');

        // Edge type and right compass
        out.push_str(&edge.edge_type);
        if let Some(ref rc) = edge.rcompass {
            if !rc.starts_with(':') {
                out.push(':');
            }
            out.push_str(rc);
        }
        out.push(' ');

        // Edge color if present
        if let Some(ref c) = edge.color {
            out.push_str(c);
            out.push(' ');
        }

        // Right node
        let right_name = if !edge.right.is_empty() && edge.right.chars().all(|c| c.is_ascii_digit()) {
            format!("Group_{}", edge.right)
        } else {
            edge.right.clone()
        };
        out.push_str(&right_name);

        // Edge label if present
        if let Some(ref lbl) = edge.label {
            out.push_str("; ");
            out.push_str(lbl);
        }
    }
}
