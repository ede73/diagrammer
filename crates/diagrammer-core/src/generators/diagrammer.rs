use super::Generator;
use crate::ast::{
    AllowedDefaults, EdgeRef, GraphCanvas, GraphGroup, GraphObject, NodeShapeBody,
};
use std::collections::{HashMap, HashSet};

pub struct DiagrammerGenerator;

impl Generator for DiagrammerGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        Self::generate_diagrammer(canvas)
    }
}

impl DiagrammerGenerator {
    pub fn generate_diagrammer(canvas: &GraphCanvas) -> String {
        let mut out = String::new();

        // Build variables maps
        let mut vars_map: HashMap<String, String> = HashMap::new();
        if let Some(ref pc) = canvas.parsing_context {
            vars_map = pc.variables.clone();
        }
        let mut color_to_var: HashMap<String, String> = HashMap::new();
        for (k, v) in &vars_map {
            color_to_var.insert(v.to_lowercase(), k.clone());
        }

        // 1. Top-level directives
        if let Some(ref vis) = canvas.visualizer {
            out.push_str(&format!("visualizer {}\n", vis));
        }
        if let Some(ref dir) = canvas.direction {
            let d = dir.to_lowercase();
            if d.contains("land") || d.contains("horiz") || d == "lr" {
                out.push_str("LANDSCAPE\n");
            } else {
                out.push_str("PORTRAIT\n");
            }
        }
        if let Some(ref s) = canvas.start {
            out.push_str(&format!("START {}\n", s));
        }
        if let Some(ref sh) = canvas.shape {
            out.push_str(&format!("SHAPE {}\n", sh));
        }
        if let Some(ref dbg) = canvas.debug {
            out.push_str(&format!("DEBUG {}\n", dbg));
        }

        // 2. Global defaults
        if let Some(ref ec) = canvas.defaults.edgecolor {
            out.push_str(&format!("EDGE COLOR {}\n", Self::format_color(ec, &color_to_var)));
        }
        if let Some(ref etc) = canvas.defaults.edgetextcolor {
            out.push_str(&format!("EDGE TEXTCOLOR {}\n", Self::format_color(etc, &color_to_var)));
        }
        if let Some(ref vc) = canvas.defaults.vertexcolor {
            out.push_str(&format!("VERTEX COLOR {}\n", Self::format_color(vc, &color_to_var)));
        }
        if let Some(ref vtc) = canvas.defaults.vertextextcolor {
            out.push_str(&format!("VERTEX TEXTCOLOR {}\n", Self::format_color(vtc, &color_to_var)));
        }
        if let Some(ref gc) = canvas.defaults.groupcolor {
            out.push_str(&format!("GROUP COLOR {}\n", Self::format_color(gc, &color_to_var)));
        }

        // 3. Emit variable definitions if any
        if !vars_map.is_empty() {
            let mut sorted_vars: Vec<(&String, &String)> = vars_map.iter().collect();
            sorted_vars.sort_by_key(|(k, _)| *k);
            for (k, v) in sorted_vars {
                out.push_str(&format!("$({}:{})\n", k, v));
            }
        }

        // 4. Equal directive if present
        if !canvas.equal.is_empty() {
            let eq_names: Vec<String> = canvas.equal.iter().map(|o| o.get_name().to_string()).collect();
            out.push_str(&format!("EQUAL {}\n", eq_names.join(", ")));
        }

        // Add a blank line if we had header directives
        if !out.is_empty() && !out.ends_with("\n\n") {
            out.push('\n');
        }

        // 5. Theme configuration block
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

        // 6. Layout configuration block
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

        // 7. Custom shape definitions
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

        // 8. Custom operator definitions
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
                out.push_str(&format!("    color: {};\n", Self::format_color(c, &color_to_var)));
            }
            if let Some(ref a) = op.action {
                out.push_str(&format!("    action: {};\n", a));
            }
            if let Some(ref ah) = op.arrowhead {
                out.push_str(&format!("    arrowhead: {};\n", ah.shape));
            }
            out.push_str("}\n\n");
        }

        // 9. Includes
        for inc in &canvas.includes {
            out.push_str(&format!("include \"{}\"\n", inc));
        }
        if !canvas.includes.is_empty() {
            out.push('\n');
        }

        // 10. Canvas objects (Groups, Vertices, Edges)
        let all_edges = canvas.get_edges();
        let mut handled_edges = HashSet::new();
        Self::format_objects(
            &canvas.objects,
            &all_edges,
            None,
            None,
            &canvas.defaults,
            canvas.shape.as_deref(),
            &color_to_var,
            &mut handled_edges,
            0,
            &mut out,
        );

        out
    }

    fn format_color(color: &str, color_to_var: &HashMap<String, String>) -> String {
        let trimmed = color.trim();
        if trimmed.starts_with("$(") {
            return trimmed.to_string();
        }
        if let Some(var_name) = color_to_var.get(&trimmed.to_lowercase()) {
            return format!("$({})", var_name);
        }
        trimmed.to_string()
    }

    fn format_objects(
        objects: &[GraphObject],
        all_edges: &[&EdgeRef],
        current_group: Option<&str>,
        active_scope: Option<&str>,
        defaults: &AllowedDefaults,
        default_shape: Option<&str>,
        color_to_var: &HashMap<String, String>,
        handled_edges: &mut HashSet<String>,
        indent_level: usize,
        out: &mut String,
    ) {
        let pad = "    ".repeat(indent_level);

        // Collect names of all nodes connected by ANY edge in the graph
        let mut edge_connected_nodes = HashSet::new();
        for edge in all_edges {
            edge_connected_nodes.insert(edge.left.clone());
            edge_connected_nodes.insert(edge.right.clone());
        }

        for obj in objects {
            match obj {
                GraphObject::Group(grp) => {
                    if grp.is_inner_graph {
                        // Check if this is a target list: e.g. Input > (Pass, Fail)
                        let inner_edges: Vec<&&EdgeRef> = all_edges
                            .iter()
                            .filter(|e| e.parent.as_deref() == Some(&grp.name))
                            .collect();

                        let is_target_list = !inner_edges.is_empty()
                            && inner_edges.iter().all(|e| {
                                e.left == inner_edges[0].left
                                    && e.edge_type == inner_edges[0].edge_type
                                    && e.color == inner_edges[0].color
                            })
                            && grp.objects.iter().all(|o| match o {
                                GraphObject::Vertex(_) | GraphObject::VertexRef { .. } => true,
                                _ => false,
                            });

                        if is_target_list {
                            let first_edge = inner_edges[0];
                            let targets: Vec<String> = inner_edges
                                .iter()
                                .map(|e| {
                                    handled_edges.insert(Self::edge_id(e));
                                    e.right.clone()
                                })
                                .collect();

                            out.push_str(&pad);
                            out.push_str(&first_edge.left);
                            out.push(' ');
                            out.push_str(&first_edge.edge_type);
                            if let Some(ref c) = first_edge.color {
                                let formatted_c = Self::format_color(c, color_to_var);
                                out.push(' ');
                                out.push_str(&formatted_c);
                            }
                            out.push_str(" (");
                            out.push_str(&targets.join(", "));
                            out.push(')');
                            if let Some(ref lbl) = first_edge.label {
                                out.push_str("; ");
                                out.push_str(lbl);
                            }
                            out.push('\n');
                            continue;
                        }

                        // Otherwise format as parenthesized inner graph
                        out.push_str(&pad);
                        out.push_str("(\n");
                        Self::format_objects(
                            &grp.objects,
                            all_edges,
                            Some(&grp.name),
                            active_scope,
                            defaults,
                            default_shape,
                            color_to_var,
                            handled_edges,
                            indent_level + 1,
                            out,
                        );
                        out.push_str(&pad);
                        out.push_str(")\n\n");
                    } else {
                        Self::format_group(
                            grp,
                            all_edges,
                            active_scope,
                            defaults,
                            default_shape,
                            color_to_var,
                            handled_edges,
                            indent_level,
                            out,
                        );
                    }
                }
                GraphObject::Vertex(v) => {
                    let has_custom_color = match (&v.color, &defaults.vertexcolor) {
                        (Some(c), Some(dc)) => !c.eq_ignore_ascii_case(dc),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_textcolor = match (&v.textcolor, &defaults.vertextextcolor) {
                        (Some(tc), Some(dtc)) => !tc.eq_ignore_ascii_case(dtc),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_shape = match (&v.shape, default_shape) {
                        (Some(s), _) if s.eq_ignore_ascii_case(&v.name) => false,
                        (Some(s), Some(ds)) => !s.eq_ignore_ascii_case(ds),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_attrs = has_custom_shape
                        || v.style.is_some()
                        || has_custom_color
                        || has_custom_textcolor
                        || v.label.is_some()
                        || v.image.is_some()
                        || v.url.is_some();

                    if has_custom_attrs || !edge_connected_nodes.contains(&v.name) {
                        let display_name = if let Some(scope) = active_scope {
                            v.name.strip_prefix(scope).unwrap_or(&v.name)
                        } else {
                            &v.name
                        };
                        // Avoid redundant label if it equals display_name
                        let label = match v.label.as_deref() {
                            Some(lbl) if lbl == display_name => None,
                            other => other,
                        };

                        out.push_str(&pad);
                        Self::format_vertex_decl(
                            display_name,
                            v.style.as_deref(),
                            v.shape.as_deref(),
                            if has_custom_color { v.color.as_deref() } else { None },
                            if has_custom_textcolor { v.textcolor.as_deref() } else { None },
                            v.image.as_deref(),
                            label,
                            v.url.as_deref(),
                            color_to_var,
                            out,
                        );
                        out.push('\n');
                    }
                }
                GraphObject::VertexRef { vertex } => {
                    let has_custom_color = match (&vertex.color, &defaults.vertexcolor) {
                        (Some(c), Some(dc)) => !c.eq_ignore_ascii_case(dc),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_textcolor = match (&vertex.textcolor, &defaults.vertextextcolor) {
                        (Some(tc), Some(dtc)) => !tc.eq_ignore_ascii_case(dtc),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_shape = match (&vertex.shape, default_shape) {
                        (Some(s), _) if s.eq_ignore_ascii_case(&vertex.name) => false,
                        (Some(s), Some(ds)) => !s.eq_ignore_ascii_case(ds),
                        (Some(_), None) => true,
                        (None, _) => false,
                    };
                    let has_custom_attrs = has_custom_shape
                        || vertex.style.is_some()
                        || has_custom_color
                        || has_custom_textcolor
                        || vertex.label.is_some()
                        || vertex.image.is_some()
                        || vertex.url.is_some();

                    if has_custom_attrs || !edge_connected_nodes.contains(&vertex.name) {
                        let display_name = if let Some(scope) = active_scope {
                            vertex.name.strip_prefix(scope).unwrap_or(&vertex.name)
                        } else {
                            &vertex.name
                        };
                        let label = match vertex.label.as_deref() {
                            Some(lbl) if lbl == display_name => None,
                            other => other,
                        };

                        out.push_str(&pad);
                        Self::format_vertex_decl(
                            display_name,
                            vertex.style.as_deref(),
                            vertex.shape.as_deref(),
                            if has_custom_color { vertex.color.as_deref() } else { None },
                            if has_custom_textcolor { vertex.textcolor.as_deref() } else { None },
                            vertex.image.as_deref(),
                            label,
                            vertex.url.as_deref(),
                            color_to_var,
                            out,
                        );
                        out.push('\n');
                    }
                }
                GraphObject::Edge { edge } => {
                    let eid = Self::edge_id(edge);
                    if !handled_edges.contains(&eid) {
                        if edge.parent.as_deref() == current_group {
                            handled_edges.insert(eid);
                            out.push_str(&pad);
                            Self::format_edge(edge, defaults, color_to_var, out);
                            out.push('\n');
                        }
                    }
                }
                GraphObject::Reference(_) => {}
            }
        }

        // Emit edges whose parent matches this group and were stored at top-level
        if let Some(grp_name) = current_group {
            for edge in all_edges {
                let eid = Self::edge_id(edge);
                if !handled_edges.contains(&eid) && edge.parent.as_deref() == Some(grp_name) {
                    handled_edges.insert(eid);
                    out.push_str(&pad);
                    Self::format_edge(edge, defaults, color_to_var, out);
                    out.push('\n');
                }
            }
        }
    }

    fn edge_id(edge: &EdgeRef) -> String {
        format!(
            "{}:{}:{}:{}:{}:{}",
            edge.left,
            edge.edge_type,
            edge.right,
            edge.color.as_deref().unwrap_or(""),
            edge.label.as_deref().unwrap_or(""),
            edge.parent.as_deref().unwrap_or("")
        )
    }

    fn format_group(
        grp: &GraphGroup,
        all_edges: &[&EdgeRef],
        parent_scope: Option<&str>,
        parent_defaults: &AllowedDefaults,
        parent_shape: Option<&str>,
        color_to_var: &HashMap<String, String>,
        handled_edges: &mut HashSet<String>,
        indent_level: usize,
        out: &mut String,
    ) {
        let pad = "    ".repeat(indent_level);

        // Check if group is referenced by edges
        let is_referenced = all_edges
            .iter()
            .any(|e| e.left == grp.name || e.right == grp.name);

        let safe_name = if !grp.name.is_empty() && grp.name.chars().all(|c| c.is_ascii_digit()) {
            if is_referenced {
                format!("Group_{}", grp.name)
            } else {
                String::new()
            }
        } else {
            grp.name.clone()
        };

        let has_custom_color = match (&grp.color, &parent_defaults.groupcolor) {
            (Some(c), Some(gc)) => !c.eq_ignore_ascii_case(gc),
            (Some(_), None) => true,
            (None, _) => false,
        };

        out.push_str(&pad);
        out.push('{');
        if grp.is_scoped {
            out.push('!');
        }
        if !safe_name.is_empty() {
            out.push_str(&safe_name);
        }
        if has_custom_color {
            if let Some(ref c) = grp.color {
                let formatted_c = Self::format_color(c, color_to_var);
                if !safe_name.is_empty() {
                    out.push(' ');
                }
                out.push_str(&formatted_c);
            }
        }
        if let Some(ref l) = grp.label {
            if l != &grp.name {
                out.push_str("; ");
                out.push_str(l);
            }
        }
        out.push('\n');

        let inner_pad = "    ".repeat(indent_level + 1);

        // Group visualizer if specified
        if let Some(ref vis) = grp.visualizer {
            out.push_str(&inner_pad);
            out.push_str(&format!("visualizer {}\n", vis));
        }

        // Merge group defaults
        let mut group_defaults = parent_defaults.clone();
        if let Some(ref ec) = grp.defaults.edgecolor {
            group_defaults.edgecolor = Some(ec.clone());
            out.push_str(&inner_pad);
            out.push_str(&format!("EDGE COLOR {}\n", Self::format_color(ec, color_to_var)));
        }
        if let Some(ref etc) = grp.defaults.edgetextcolor {
            group_defaults.edgetextcolor = Some(etc.clone());
            out.push_str(&inner_pad);
            out.push_str(&format!("EDGE TEXTCOLOR {}\n", Self::format_color(etc, color_to_var)));
        }
        if let Some(ref vc) = grp.defaults.vertexcolor {
            group_defaults.vertexcolor = Some(vc.clone());
            out.push_str(&inner_pad);
            out.push_str(&format!("VERTEX COLOR {}\n", Self::format_color(vc, color_to_var)));
        }
        if let Some(ref vtc) = grp.defaults.vertextextcolor {
            group_defaults.vertextextcolor = Some(vtc.clone());
            out.push_str(&inner_pad);
            out.push_str(&format!("VERTEX TEXTCOLOR {}\n", Self::format_color(vtc, color_to_var)));
        }
        if let Some(ref gc) = grp.defaults.groupcolor {
            group_defaults.groupcolor = Some(gc.clone());
            out.push_str(&inner_pad);
            out.push_str(&format!("GROUP COLOR {}\n", Self::format_color(gc, color_to_var)));
        }

        // Group equal
        if !grp.equal.is_empty() {
            let eq_names: Vec<String> = grp.equal.iter().map(|o| o.get_name().to_string()).collect();
            out.push_str(&inner_pad);
            out.push_str(&format!("EQUAL {}\n", eq_names.join(", ")));
        }

        // Update active scope if scoped
        let current_scope = if grp.is_scoped {
            let base = parent_scope.unwrap_or("");
            Some(format!("{}{}{}!", base, if base.is_empty() { "" } else { "!" }, grp.name))
        } else {
            parent_scope.map(|s| s.to_string())
        };

        // Format inner objects
        Self::format_objects(
            &grp.objects,
            all_edges,
            Some(&grp.name),
            current_scope.as_deref(),
            &group_defaults,
            parent_shape,
            color_to_var,
            handled_edges,
            indent_level + 1,
            out,
        );

        out.push_str(&pad);
        out.push_str("}\n\n");
    }

    fn format_vertex_decl(
        name: &str,
        style: Option<&str>,
        shape: Option<&str>,
        color: Option<&str>,
        textcolor: Option<&str>,
        image: Option<&str>,
        label: Option<&str>,
        url: Option<&str>,
        color_to_var: &HashMap<String, String>,
        out: &mut String,
    ) {
        if let Some(s) = style {
            out.push_str(s);
            out.push(' ');
        }
        if let Some(sh) = shape {
            if !sh.eq_ignore_ascii_case(name) {
                out.push_str(sh);
                out.push(' ');
            }
        }
        out.push_str(name);
        if let Some(c) = color {
            let formatted_c = Self::format_color(c, color_to_var);
            out.push(' ');
            out.push_str(&formatted_c);
        }
        if let Some(img) = image {
            out.push(' ');
            out.push_str(img);
        }
        if let Some(lbl) = label {
            out.push_str("; ");
            if let Some(tc) = textcolor {
                out.push_str(&Self::format_color(tc, color_to_var));
            }
            out.push_str(lbl);
            if let Some(u) = url {
                out.push('[');
                out.push_str(u);
                out.push(']');
            }
        } else if let Some(tc) = textcolor {
            out.push_str("; ");
            out.push_str(&Self::format_color(tc, color_to_var));
            if let Some(u) = url {
                out.push('[');
                out.push_str(u);
                out.push(']');
            }
        } else if let Some(u) = url {
            out.push_str("; [");
            out.push_str(u);
            out.push(']');
        }
    }

    fn format_edge(
        edge: &crate::ast::EdgeRef,
        defaults: &AllowedDefaults,
        color_to_var: &HashMap<String, String>,
        out: &mut String,
    ) {
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

        // Edge color if present and differs from default
        let has_custom_color = match (&edge.color, &defaults.edgecolor) {
            (Some(c), Some(dec)) => !c.eq_ignore_ascii_case(dec),
            (Some(_), None) => true,
            (None, _) => false,
        };
        if has_custom_color {
            if let Some(ref c) = edge.color {
                let formatted_c = Self::format_color(c, color_to_var);
                out.push(' ');
                out.push_str(&formatted_c);
            }
        }
        out.push(' ');

        // Right node
        let right_name = if !edge.right.is_empty() && edge.right.chars().all(|c| c.is_ascii_digit()) {
            format!("Group_{}", edge.right)
        } else {
            edge.right.clone()
        };
        out.push_str(&right_name);

        // Edge label, textcolor, and url if present
        if let Some(ref lbl) = edge.label {
            out.push_str("; ");
            if let Some(ref etc) = edge.textcolor {
                let has_custom_etc = match &defaults.edgetextcolor {
                    Some(detc) => !etc.eq_ignore_ascii_case(detc),
                    None => true,
                };
                if has_custom_etc {
                    out.push_str(&Self::format_color(etc, color_to_var));
                }
            }
            out.push_str(lbl);
            if let Some(ref u) = edge.url {
                out.push('[');
                out.push_str(u);
                out.push(']');
            }
        } else if let Some(ref etc) = edge.textcolor {
            let has_custom_etc = match &defaults.edgetextcolor {
                Some(detc) => !etc.eq_ignore_ascii_case(detc),
                None => true,
            };
            if has_custom_etc {
                out.push_str("; ");
                out.push_str(&Self::format_color(etc, color_to_var));
                if let Some(ref u) = edge.url {
                    out.push('[');
                    out.push_str(u);
                    out.push(']');
                }
            } else if let Some(ref u) = edge.url {
                out.push_str("; [");
                out.push_str(u);
                out.push(']');
            }
        } else if let Some(ref u) = edge.url {
            out.push_str("; [");
            out.push_str(u);
            out.push(']');
        }
    }
}
