use crate::ast::*;
use crate::{DiagrammerParser, Rule};
use pest::iterators::{Pair, Pairs};
use pest::Parser;

use std::collections::HashSet;

#[derive(Debug, Default, Clone)]
struct ParsedVertex {
    name: String,
    style: Option<String>,
    shape: Option<String>,
    color: Option<String>,
    image: Option<String>,
    label: Option<String>,
    edge_label: Option<String>,
}

pub struct AstBuilder {
    pub canvas: GraphCanvas,
    group_stack: Vec<GraphGroup>,
    context: ParsingContext,
    noedges: HashSet<String>,
}

impl Default for AstBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl AstBuilder {
    pub fn new() -> Self {
        let mut context = ParsingContext::default();
        context.current_container = Some("...GraphCanvas".to_string());
        context.container_exit = Some(1);
        context.graphinner_index = Some(1);
        context.group_ids = Some(1);

        Self {
            canvas: GraphCanvas::new(),
            group_stack: Vec::new(),
            context,
            noedges: HashSet::new(),
        }
    }

    pub fn build(mut self, input: &str) -> Result<GraphCanvas, String> {
        let pairs = DiagrammerParser::parse(Rule::diagram, input)
            .map_err(|e| format!("Parse error: {}", e))?;

        for pair in pairs {
            if pair.as_rule() == Rule::diagram {
                for inner in pair.into_inner() {
                    if inner.as_rule() == Rule::statement {
                        self.process_statement(inner.into_inner())?;
                    }
                }
            }
        }

        // Flush any unclosed groups back to canvas
        while let Some(group) = self.group_stack.pop() {
            if let Some(parent) = self.group_stack.last_mut() {
                parent.objects.push(GraphObject::Group(Box::new(group)));
            } else {
                self.canvas.objects.push(GraphObject::Group(Box::new(group)));
            }
        }

        self.canvas.parsing_context = Some(self.context);
        Ok(self.canvas)
    }

    fn active_defaults(&self) -> &AllowedDefaults {
        if let Some(grp) = self.group_stack.last() {
            &grp.defaults
        } else {
            &self.canvas.defaults
        }
    }

    fn active_defaults_mut(&mut self) -> &mut AllowedDefaults {
        if let Some(grp) = self.group_stack.last_mut() {
            &mut grp.defaults
        } else {
            &mut self.canvas.defaults
        }
    }

    fn push_object(&mut self, obj: GraphObject) {
        if let Some(grp) = self.group_stack.last_mut() {
            grp.objects.push(obj);
        } else {
            self.canvas.objects.push(obj);
        }
    }

    fn push_root_vertex(&mut self, obj: GraphObject) {
        if let Some(grp) = self.group_stack.last_mut() {
            grp.root_vertices.push(obj);
        } else {
            self.canvas.root_vertices.push(obj);
        }
    }

    fn maybe_remove_from_root_vertices(&mut self, name: &str) {
        if self.noedges.contains(name) {
            if let Some(grp) = self.group_stack.last_mut() {
                grp.root_vertices.retain(|obj| match obj {
                    GraphObject::VertexRef { vertex } => vertex.name != name,
                    GraphObject::Vertex(v) => v.name != name,
                    GraphObject::Reference(r) => r.name != name,
                    _ => true,
                });
            } else {
                self.canvas.root_vertices.retain(|obj| match obj {
                    GraphObject::VertexRef { vertex } => vertex.name != name,
                    GraphObject::Vertex(v) => v.name != name,
                    GraphObject::Reference(r) => r.name != name,
                    _ => true,
                });
            }
        }
    }

    fn object_exists_recursive(list: &[GraphObject], name: &str) -> bool {
        for obj in list {
            match obj {
                GraphObject::VertexRef { vertex } if vertex.name == name => return true,
                GraphObject::Vertex(v) if v.name == name => return true,
                GraphObject::Reference(r) if r.name == name => return true,
                GraphObject::Group(g) => {
                    if g.name == name || Self::object_exists_recursive(&g.objects, name) {
                        return true;
                    }
                }
                _ => {}
            }
        }
        false
    }

    fn object_exists(&self, name: &str) -> bool {
        for grp in self.group_stack.iter().rev() {
            if grp.name == name || Self::object_exists_recursive(&grp.objects, name) {
                return true;
            }
        }
        Self::object_exists_recursive(&self.canvas.objects, name)
    }

    fn is_group(&self, name: &str) -> bool {
        fn check(list: &[GraphObject], name: &str) -> bool {
            for obj in list {
                if let GraphObject::Group(g) = obj {
                    if g.name == name || check(&g.objects, name) {
                        return true;
                    }
                }
            }
            false
        }
        for grp in self.group_stack.iter().rev() {
            if grp.name == name || check(&grp.objects, name) {
                return true;
            }
        }
        check(&self.canvas.objects, name)
    }

    fn set_vertex_label(&mut self, name: &str, label: &str) {
        fn set_in_list(list: &mut [GraphObject], name: &str, label: &str) -> bool {
            for obj in list {
                match obj {
                    GraphObject::VertexRef { vertex } if vertex.name == name => {
                        vertex.label = Some(label.to_string());
                        return true;
                    }
                    GraphObject::Vertex(v) if v.name == name => {
                        v.label = Some(label.to_string());
                        return true;
                    }
                    GraphObject::Group(g) => {
                        if set_in_list(&mut g.objects, name, label) {
                            return true;
                        }
                    }
                    _ => {}
                }
            }
            false
        }

        for grp in self.group_stack.iter_mut().rev() {
            if set_in_list(&mut grp.objects, name, label) {
                return;
            }
        }
        set_in_list(&mut self.canvas.objects, name, label);
    }

    fn ensure_vertex_exists(&mut self, name: &str) {
        if !self.object_exists(name) {
            self.noedges.insert(name.to_string());
            let mut vr = VertexRef::new(name);
            if let Some(ref c) = self.active_defaults().vertexcolor {
                vr.color = Some(c.clone());
            }
            self.push_object(GraphObject::VertexRef {
                vertex: vr.clone(),
            });
            self.push_root_vertex(GraphObject::VertexRef {
                vertex: vr,
            });
        } else if let Some(grp) = self.group_stack.last_mut() {
            if !grp.is_inner_graph {
                let already = grp.objects.iter().any(|obj| match obj {
                    GraphObject::VertexRef { vertex } => vertex.name == name,
                    GraphObject::Vertex(v) => v.name == name,
                    GraphObject::Reference(r) => r.name == name,
                    _ => false,
                });
                if !already {
                    let r = GraphReference::new(name);
                    grp.objects.push(GraphObject::Reference(r.clone()));
                    grp.root_vertices.push(GraphObject::Reference(r));
                }
            }
        }
    }

    fn process_statement(&mut self, mut pairs: Pairs<Rule>) -> Result<(), String> {
        let Some(pair) = pairs.next() else { return Ok(()) };

        match pair.as_rule() {
            Rule::landscape => {
                self.canvas.direction = Some("landscape".to_string());
            }
            Rule::portrait => {
                self.canvas.direction = Some("portrait".to_string());
            }
            Rule::visualizer => {
                if let Some(p) = pair.into_inner().find(|p| p.as_rule() == Rule::NAME) {
                    self.canvas.visualizer = Some(p.as_str().trim().to_lowercase());
                }
            }
            Rule::start => {
                if let Some(p) = pair.into_inner().find(|p| p.as_rule() == Rule::NAME) {
                    self.canvas.start = Some(p.as_str().trim().to_string());
                }
            }
            Rule::shape_decl => {
                if let Some(p) = pair.into_inner().find(|p| p.as_rule() == Rule::NAME) {
                    self.canvas.shape = Some(p.as_str().trim().to_lowercase());
                }
            }
            Rule::vertex_color => {
                let color = self.extract_color_or_var(pair)?;
                self.active_defaults_mut().vertexcolor = Some(color);
            }
            Rule::vertex_text_color => {
                let color = self.extract_color_or_var(pair)?;
                self.active_defaults_mut().vertextextcolor = Some(color);
            }
            Rule::edge_color => {
                let color = self.extract_color_or_var(pair)?;
                self.active_defaults_mut().edgecolor = Some(color);
            }
            Rule::edge_text_color => {
                let color = self.extract_color_or_var(pair)?;
                self.active_defaults_mut().edgetextcolor = Some(color);
            }
            Rule::group_color => {
                let color = self.extract_color_or_var(pair)?;
                self.active_defaults_mut().groupcolor = Some(color);
            }
            Rule::equal => {
                let mut new_equal = Vec::new();
                for item in pair.into_inner() {
                    let names = self.collect_vertex_names(item);
                    for name in names {
                        new_equal.push(GraphObject::VertexRef {
                            vertex: VertexRef::new(name),
                        });
                    }
                }
                if let Some(grp) = self.group_stack.last_mut() {
                    grp.equal = new_equal;
                } else {
                    self.canvas.equal = new_equal;
                }
            }
            Rule::VARIABLE => {
                self.handle_variable(pair.as_str());
            }
            Rule::event_chain => {
                self.handle_event_chain(pair)?;
            }
            Rule::vertex_target | Rule::list_item => {
                let mut is_inner = false;
                for p in pair.clone().into_inner() {
                    if p.as_rule() == Rule::inner_graph {
                        self.process_inner_graph(p)?;
                        is_inner = true;
                        break;
                    }
                }
                if !is_inner {
                    let targets = self.collect_vertex_targets(pair);
                    for pv in targets {
                        self.ensure_vertex_exists(&pv.name);
                        self.update_vertex_attrs(&pv);
                    }
                }
            }
            Rule::while_stmt | Rule::do_stmt => {
                let id = self.context.group_ids.unwrap_or(1);
                self.context.group_ids = Some(id + 1);
                let label = pair.as_str().trim();
                let mut group = GraphGroup::new(&id.to_string());
                group.pseudo_type = "GraphLoop".to_string();
                if !label.is_empty() {
                    group.label = Some(label.to_string());
                }
                self.group_stack.push(group);
            }
            Rule::endwhile_stmt | Rule::until_stmt => {
                if let Some(mut group) = self.group_stack.pop() {
                    if pair.as_rule() == Rule::until_stmt {
                        let label = pair.as_str().trim();
                        if !label.is_empty() {
                            group.label = Some(label.to_string());
                        }
                    }
                    if let Some(parent) = self.group_stack.last_mut() {
                        parent.objects.push(GraphObject::Group(Box::new(group)));
                    } else {
                        self.canvas.objects.push(GraphObject::Group(Box::new(group)));
                    }
                }
            }
            Rule::if_stmt => {
                let id = self.context.group_ids.unwrap_or(1);
                self.context.group_ids = Some(id + 1);
                let label = pair.as_str().trim().trim_start_matches("if").trim_end_matches("then").trim();
                let mut group = GraphGroup::new(&id.to_string());
                group.pseudo_type = "GraphConditional".to_string();
                group.conditional = Some("if".to_string());
                group.label = Some(label.to_string());
                let exit_id = self.context.container_exit.unwrap_or(1);
                group.exitvertex = Some(exit_id);
                self.context.container_exit = Some(exit_id + 1);
                self.group_stack.push(group);
            }
            Rule::elseif_stmt | Rule::else_stmt => {
                // Exit previous conditional branch, enter new one
                if let Some(prev) = self.group_stack.pop() {
                    if let Some(parent) = self.group_stack.last_mut() {
                        parent.objects.push(GraphObject::Group(Box::new(prev)));
                    } else {
                        self.canvas.objects.push(GraphObject::Group(Box::new(prev)));
                    }
                }
                let id = self.context.group_ids.unwrap_or(1);
                self.context.group_ids = Some(id + 1);
                let is_elseif = pair.as_rule() == Rule::elseif_stmt;
                let c_type = if is_elseif { "elseif" } else { "else" };
                let mut group = GraphGroup::new(&id.to_string());
                group.pseudo_type = "GraphConditional".to_string();
                group.conditional = Some(c_type.to_string());
                if is_elseif {
                    let label = pair.as_str().trim().trim_start_matches("else").trim().trim_start_matches("if").trim().trim_end_matches("then").trim();
                    group.label = Some(label.to_string());
                } else {
                    group.label = Some("else".to_string());
                }
                let exit_id = self.context.container_exit.unwrap_or(1);
                group.exitvertex = Some(exit_id);
                self.context.container_exit = Some(exit_id + 1);
                self.group_stack.push(group);
            }
            Rule::endif_stmt => {
                if let Some(group) = self.group_stack.pop() {
                    if let Some(parent) = self.group_stack.last_mut() {
                        parent.objects.push(GraphObject::Group(Box::new(group)));
                    } else {
                        self.canvas.objects.push(GraphObject::Group(Box::new(group)));
                    }
                }
                let id = self.context.group_ids.unwrap_or(1);
                self.context.group_ids = Some(id + 1);
                let mut endif_group = GraphGroup::new(&id.to_string());
                endif_group.pseudo_type = "GraphConditional".to_string();
                endif_group.conditional = Some("endif".to_string());
                endif_group.label = Some("endif".to_string());
                let exit_id = self.context.container_exit.unwrap_or(1);
                endif_group.exitvertex = Some(exit_id);
                self.context.container_exit = Some(exit_id + 1);
                if let Some(parent) = self.group_stack.last_mut() {
                    parent.objects.push(GraphObject::Group(Box::new(endif_group)));
                } else {
                    self.canvas.objects.push(GraphObject::Group(Box::new(endif_group)));
                }
            }
            Rule::group_start => {
                let mut name = None;
                let mut label = None;
                let mut color = None;

                for p in pair.into_inner() {
                    match p.as_rule() {
                        Rule::NAME => name = Some(p.as_str().trim().to_string()),
                        Rule::LABEL => {
                            label = Some(p.as_str().trim_start_matches(';').trim().to_string())
                        }
                        Rule::color_or_variable => {
                            color = Some(self.extract_color_or_var(p)?);
                        }
                        _ => {}
                    }
                }

                let group_name = name.clone().unwrap_or_else(|| {
                    let id = self.context.group_ids.unwrap_or(1);
                    self.context.group_ids = Some(id + 1);
                    id.to_string()
                });

                let mut group = GraphGroup::new(&group_name);
                group.label = label;
                group.color = color;
                let exit_id = self.context.container_exit.unwrap_or(1);
                group.exitvertex = Some(exit_id);
                self.context.container_exit = Some(exit_id + 1);

                self.group_stack.push(group);
            }
            Rule::group_end => {
                if let Some(group) = self.group_stack.pop() {
                    if let Some(parent) = self.group_stack.last_mut() {
                        parent.objects.push(GraphObject::Group(Box::new(group)));
                    } else {
                        self.canvas.objects.push(GraphObject::Group(Box::new(group)));
                    }
                }
            }
            _ => {}
        }
        Ok(())
    }

    fn extract_color_or_var(&mut self, pair: Pair<Rule>) -> Result<String, String> {
        for inner in pair.clone().into_inner() {
            if inner.as_rule() == Rule::color_or_variable {
                let s = inner.as_str().trim();
                if s.starts_with("$(") {
                    return Ok(self.handle_variable(s));
                }
                return Ok(s.to_string());
            }
        }
        let s = pair.as_str().trim();
        if s.starts_with("$(") {
            return Ok(self.handle_variable(s));
        }
        Ok(s.to_string())
    }

    fn handle_variable(&mut self, text: &str) -> String {
        let trimmed = text.trim();
        let inner = trimmed.trim_start_matches("$(").trim_end_matches(')');
        if let Some((k, v)) = inner.split_once(':') {
            self.context
                .variables
                .insert(k.trim().to_string(), v.trim().to_string());
            v.trim().to_string()
        } else if let Some(v) = self.context.variables.get(inner.trim()) {
            v.clone()
        } else {
            inner.trim().to_string()
        }
    }

    fn collect_vertex_names(&self, pair: Pair<Rule>) -> Vec<String> {
        let mut names = Vec::new();
        match pair.as_rule() {
            Rule::inner_graph => {}
            Rule::NAME => names.push(pair.as_str().trim().to_string()),
            Rule::vertex_attrs => {
                for p in pair.into_inner() {
                    if p.as_rule() == Rule::NAME {
                        names.push(p.as_str().trim().to_string());
                    }
                }
            }
            _ => {
                for p in pair.into_inner() {
                    names.extend(self.collect_vertex_names(p));
                }
            }
        }
        names
    }

    fn collect_vertex_targets(&mut self, pair: Pair<Rule>) -> Vec<ParsedVertex> {
        let mut targets = Vec::new();
        match pair.as_rule() {
            Rule::inner_graph => {}
            Rule::NAME => {
                targets.push(ParsedVertex {
                    name: pair.as_str().trim().to_string(),
                    ..Default::default()
                });
            }
            Rule::list_item => {
                let mut edge_label = None;
                for p in pair.into_inner() {
                    match p.as_rule() {
                        Rule::INLINE_STRING => {
                            let s = p.as_str().trim();
                            let unquoted = s
                                .strip_prefix('"')
                                .and_then(|x| x.strip_suffix('"'))
                                .unwrap_or(s);
                            edge_label = Some(unquoted.to_string());
                        }
                        Rule::vertex_attrs => {
                            let mut v = self.parse_vertex_attrs(p);
                            v.edge_label = edge_label.clone();
                            targets.push(v);
                        }
                        _ => {}
                    }
                }
            }
            Rule::vertex_attrs => {
                targets.push(self.parse_vertex_attrs(pair));
            }
            _ => {
                for p in pair.into_inner() {
                    targets.extend(self.collect_vertex_targets(p));
                }
            }
        }
        targets
    }

    fn parse_vertex_attrs(&mut self, pair: Pair<Rule>) -> ParsedVertex {
        let mut pv = ParsedVertex::default();
        for p in pair.into_inner() {
            match p.as_rule() {
                Rule::STYLES => pv.style = Some(p.as_str().trim().to_string()),
                Rule::SHAPES => pv.shape = Some(p.as_str().trim().to_string()),
                Rule::NAME => pv.name = p.as_str().trim().to_string(),
                Rule::color_or_variable => {
                    if let Ok(c) = self.extract_color_or_var(p) {
                        pv.color = Some(c);
                    }
                }
                Rule::IMAGE => {
                    let s = p.as_str().trim();
                    let unquoted = s
                        .strip_prefix('"')
                        .and_then(|x| x.strip_suffix('"'))
                        .unwrap_or(s);
                    pv.image = Some(unquoted.to_string());
                }
                _ => {}
            }
        }
        pv
    }

    fn update_vertex_attrs(&mut self, pv: &ParsedVertex) {
        fn update_in_list(list: &mut [GraphObject], pv: &ParsedVertex) -> bool {
            for obj in list {
                match obj {
                    GraphObject::VertexRef { vertex } if vertex.name == pv.name => {
                        if let Some(ref s) = pv.style {
                            vertex.style = Some(s.clone());
                        }
                        if let Some(ref sh) = pv.shape {
                            vertex.shape = Some(sh.clone());
                        }
                        if let Some(ref c) = pv.color {
                            vertex.color = Some(c.clone());
                        }
                        if let Some(ref img) = pv.image {
                            vertex.image = Some(img.clone());
                        }
                        if let Some(ref lbl) = pv.label {
                            vertex.label = Some(lbl.clone());
                        }
                        return true;
                    }
                    GraphObject::Vertex(v) if v.name == pv.name => {
                        if let Some(ref s) = pv.style {
                            v.style = Some(s.clone());
                        }
                        if let Some(ref sh) = pv.shape {
                            v.shape = Some(sh.clone());
                        }
                        if let Some(ref c) = pv.color {
                            v.color = Some(c.clone());
                        }
                        if let Some(ref img) = pv.image {
                            v.image = Some(img.clone());
                        }
                        if let Some(ref lbl) = pv.label {
                            v.label = Some(lbl.clone());
                        }
                        return true;
                    }
                    GraphObject::Group(g) => {
                        if update_in_list(&mut g.objects, pv) {
                            return true;
                        }
                    }
                    _ => {}
                }
            }
            false
        }

        for grp in self.group_stack.iter_mut().rev() {
            if update_in_list(&mut grp.objects, pv) {
                return;
            }
        }
        update_in_list(&mut self.canvas.objects, pv);
    }

    fn process_inner_graph(&mut self, pair: Pair<Rule>) -> Result<(Vec<String>, String, Vec<GraphObject>), String> {
        let inner_id = self.context.graphinner_index.unwrap_or(1);
        self.context.graphinner_index = Some(inner_id + 1);
        let exit_id = self.context.container_exit.unwrap_or(1);
        self.context.container_exit = Some(exit_id + 1);
        let mut inner_grp = GraphGroup::new(&inner_id.to_string());
        inner_grp.pseudo_type = "GraphInner".to_string();
        inner_grp.is_inner_graph = true;
        inner_grp.exitvertex = Some(exit_id);

        self.group_stack.push(inner_grp);

        let start_obj_len = self.canvas.objects.len();

        for stmt in pair.into_inner() {
            if stmt.as_rule() == Rule::statement {
                self.process_statement(stmt.into_inner())?;
            }
        }

        let finished_inner = self.group_stack.pop().unwrap();
        let root_names: Vec<String> = finished_inner
            .root_vertices
            .iter()
            .filter_map(|obj| match obj {
                GraphObject::VertexRef { vertex } => Some(vertex.name.clone()),
                GraphObject::Vertex(v) => Some(v.name.clone()),
                _ => None,
            })
            .collect();

        self.push_object(GraphObject::Group(Box::new(finished_inner)));

        let inner_edges: Vec<GraphObject> = if self.canvas.objects.len() > start_obj_len {
            self.canvas.objects.drain(start_obj_len..).collect()
        } else {
            Vec::new()
        };

        Ok((root_names, inner_id.to_string(), inner_edges))
    }

    fn handle_event_chain(&mut self, pair: Pair<Rule>) -> Result<(), String> {
        #[derive(Default, Clone)]
        struct ConnectorData {
            event_type: String,
            color: Option<String>,
            label: Option<String>,
            lcompass: Option<String>,
            rcompass: Option<String>,
        }

        #[derive(Default, Clone)]
        struct ChainNode {
            incoming: Vec<ParsedVertex>,
            outgoing: Vec<String>,
            connector: Option<ConnectorData>,
            inner_id: Option<String>,
            inner_edges: Vec<GraphObject>,
        }

        let mut elements: Vec<ChainNode> = Vec::new();
        let mut current_incoming: Vec<ParsedVertex> = Vec::new();
        let mut current_outgoing = Vec::new();
        let mut current_inner_id = None;
        let mut current_inner_edges = Vec::new();
        let mut common_chain_label: Option<String> = None;

        for item in pair.into_inner() {
            match item.as_rule() {
                Rule::inner_graph => {
                    let (roots, id, inner_edges) = self.process_inner_graph(item)?;
                    current_incoming = roots
                        .iter()
                        .map(|n| ParsedVertex {
                            name: n.clone(),
                            ..Default::default()
                        })
                        .collect();
                    current_outgoing = roots;
                    current_inner_id = Some(id);
                    current_inner_edges = inner_edges;
                }
                Rule::vertex_target
                | Rule::vertex_attrs
                | Rule::list_item
                | Rule::vertex_list => {
                    let mut found_inner = None;
                    for p in item.clone().into_inner() {
                        if p.as_rule() == Rule::inner_graph {
                            found_inner = Some(p);
                            break;
                        }
                    }
                    if let Some(inner_pair) = found_inner {
                        let (roots, id, inner_edges) = self.process_inner_graph(inner_pair)?;
                        current_incoming = roots
                            .iter()
                            .map(|n| ParsedVertex {
                                name: n.clone(),
                                ..Default::default()
                            })
                            .collect();
                        current_outgoing = roots;
                        current_inner_id = Some(id);
                        current_inner_edges = inner_edges;
                    } else {
                        let targets = self.collect_vertex_targets(item);
                        let mut names = Vec::new();
                        for pv in &targets {
                            self.ensure_vertex_exists(&pv.name);
                            self.update_vertex_attrs(pv);
                            names.push(pv.name.clone());
                        }
                        current_incoming = targets;
                        current_outgoing = names;
                    }
                }
                Rule::edge_connector => {
                    let mut conn = ConnectorData {
                        event_type: ">".to_string(),
                        ..Default::default()
                    };
                    let mut seen_event = false;
                    for ec in item.into_inner() {
                        match ec.as_rule() {
                            Rule::EVENT => {
                                conn.event_type = ec.as_str().trim().to_string();
                                seen_event = true;
                            }
                            Rule::COMPASS => {
                                let c = ec.as_str().trim().to_string();
                                if !seen_event {
                                    conn.lcompass = Some(c);
                                } else {
                                    conn.rcompass = Some(c);
                                }
                            }
                            Rule::color_or_variable => {
                                conn.color = Some(self.extract_color_or_var(ec)?);
                            }
                            Rule::INLINE_STRING => {
                                let s = ec.as_str().trim();
                                let unquoted = s
                                    .strip_prefix('"')
                                    .and_then(|x| x.strip_suffix('"'))
                                    .unwrap_or(s);
                                conn.label = Some(unquoted.to_string());
                            }
                            _ => {}
                        }
                    }
                    elements.push(ChainNode {
                        incoming: std::mem::take(&mut current_incoming),
                        outgoing: std::mem::take(&mut current_outgoing),
                        connector: Some(conn),
                        inner_id: current_inner_id.take(),
                        inner_edges: std::mem::take(&mut current_inner_edges),
                    });
                }
                Rule::LABEL => {
                    let s = item.as_str().trim_start_matches(';').trim();
                    common_chain_label = Some(s.to_string());
                }
                _ => {}
            }
        }

        if !current_incoming.is_empty() || !current_outgoing.is_empty() {
            elements.push(ChainNode {
                incoming: current_incoming,
                outgoing: current_outgoing,
                connector: None,
                inner_id: current_inner_id,
                inner_edges: current_inner_edges,
            });
        }

        if elements.is_empty() {
            return Ok(());
        }

        if elements.len() == 1 {
            if let Some(ref lbl) = common_chain_label {
                for pv in &elements[0].incoming {
                    self.set_vertex_label(&pv.name, lbl);
                }
            }
            return Ok(());
        }

        if let Some(first) = elements.first() {
            if !first.inner_edges.is_empty() {
                self.canvas.objects.extend(first.inner_edges.clone());
            }
        }

        let mut current_lhs = elements[0].outgoing.clone();

        for i in 0..elements.len().saturating_sub(1) {
            let default_conn = ConnectorData {
                event_type: ">".to_string(),
                ..Default::default()
            };
            let conn = elements[i].connector.as_ref().unwrap_or(&default_conn);
            let ref rhs_targets = elements[i + 1].incoming;

            let parent = if let Some(ref inner_id) = elements[i + 1].inner_id {
                Some(inner_id.clone())
            } else {
                self.group_stack.last().map(|g| g.name.clone())
            };

            for lhs in &current_lhs {
                for rhs in rhs_targets {
                    let mut edge = EdgeRef::new(
                        conn.event_type.clone(),
                        lhs.clone(),
                        rhs.name.clone(),
                    );
                    edge.color = conn.color.clone();
                    edge.lcompass = conn.lcompass.clone();
                    edge.rcompass = conn.rcompass.clone();
                    let edge_label = if self.is_group(&rhs.name) {
                        None
                    } else {
                        rhs.edge_label.clone()
                    };
                    edge.label = edge_label
                        .or_else(|| conn.label.clone())
                        .or_else(|| common_chain_label.clone());
                    edge.parent = parent.clone();

                    self.canvas.objects.push(GraphObject::Edge { edge });
                    self.maybe_remove_from_root_vertices(&rhs.name);
                    self.noedges.remove(lhs);
                    self.noedges.remove(&rhs.name);
                }
            }

            if !elements[i + 1].inner_edges.is_empty() {
                self.canvas.objects.extend(elements[i + 1].inner_edges.clone());
            }

            if let Some(last_out) = elements[i + 1].outgoing.last() {
                current_lhs = vec![last_out.clone()];
            }
        }

        Ok(())
    }
}
