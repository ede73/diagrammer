use crate::ast::*;
use crate::{DiagrammerParser, Rule};
use pest::iterators::{Pair, Pairs};
use pest::Parser;

pub struct AstBuilder {
    pub canvas: GraphCanvas,
    group_stack: Vec<GraphGroup>,
    context: ParsingContext,
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

    fn remove_from_root_vertices(&mut self, name: &str) {
        if let Some(grp) = self.group_stack.last_mut() {
            grp.root_vertices.retain(|obj| match obj {
                GraphObject::VertexRef { vertex } => vertex.name != name,
                GraphObject::Vertex(v) => v.name != name,
                _ => true,
            });
        } else {
            self.canvas.root_vertices.retain(|obj| match obj {
                GraphObject::VertexRef { vertex } => vertex.name != name,
                GraphObject::Vertex(v) => v.name != name,
                _ => true,
            });
        }
    }

    fn object_exists_recursive(list: &[GraphObject], name: &str) -> bool {
        for obj in list {
            match obj {
                GraphObject::VertexRef { vertex } if vertex.name == name => return true,
                GraphObject::Vertex(v) if v.name == name => return true,
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

    fn ensure_vertex_exists(&mut self, name: &str) {
        if !self.object_exists(name) {
            self.push_object(GraphObject::VertexRef {
                vertex: VertexRef {
                    name: name.to_string(),
                },
            });
            self.push_root_vertex(GraphObject::VertexRef {
                vertex: VertexRef {
                    name: name.to_string(),
                },
            });
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
                let name = pair.into_inner().as_str().trim().to_lowercase();
                self.canvas.visualizer = Some(name);
            }
            Rule::start => {
                let name = pair.into_inner().as_str().trim().to_string();
                self.canvas.start = Some(name);
            }
            Rule::shape_decl => {
                let shape = pair.into_inner().as_str().trim().to_lowercase();
                self.canvas.shape = Some(shape);
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
                for item in pair.into_inner() {
                    let names = self.collect_vertex_names(item);
                    for name in names {
                        if let Some(grp) = self.group_stack.last_mut() {
                            grp.equal.push(GraphObject::VertexRef {
                                vertex: VertexRef { name },
                            });
                        } else {
                            self.canvas.equal.push(GraphObject::VertexRef {
                                vertex: VertexRef { name },
                            });
                        }
                    }
                }
            }
            Rule::VARIABLE => {
                self.handle_variable(pair.as_str());
            }
            Rule::event_chain => {
                self.handle_event_chain(pair)?;
            }
            Rule::vertex_target | Rule::list_item => {
                let names = self.collect_vertex_names(pair);
                for name in names {
                    self.ensure_vertex_exists(&name);
                }
            }
            Rule::while_stmt | Rule::do_stmt => {
                let id = self.context.group_ids.unwrap_or(1);
                self.context.group_ids = Some(id + 1);
                let loop_type = if pair.as_rule() == Rule::while_stmt { "while" } else { "do" };
                let label = pair.as_str().trim().trim_start_matches("while").trim_start_matches("do").trim();
                let mut group = GraphGroup::new(&id.to_string());
                group.conditional = Some(loop_type.to_string());
                if !label.is_empty() {
                    group.label = Some(label.to_string());
                }
                self.group_stack.push(group);
            }
            Rule::endwhile_stmt | Rule::until_stmt => {
                if let Some(mut group) = self.group_stack.pop() {
                    if pair.as_rule() == Rule::until_stmt {
                        let label = pair.as_str().trim().trim_start_matches("until").trim();
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
                group.conditional = Some("if".to_string());
                group.label = Some(label.to_string());
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
                group.conditional = Some(c_type.to_string());
                if is_elseif {
                    let label = pair.as_str().trim().trim_start_matches("else").trim().trim_start_matches("if").trim().trim_end_matches("then").trim();
                    group.label = Some(label.to_string());
                }
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
                group.label = label.or(name);
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

    fn handle_event_chain(&mut self, pair: Pair<Rule>) -> Result<(), String> {
        let mut elements: Vec<(Vec<String>, Option<String>)> = Vec::new();
        let mut current_nodes = Vec::new();

        for item in pair.into_inner() {
            match item.as_rule() {
                Rule::vertex_target
                | Rule::vertex_attrs
                | Rule::list_item
                | Rule::vertex_list
                | Rule::inner_graph => {
                    let names = self.collect_vertex_names(item);
                    for name in &names {
                        self.ensure_vertex_exists(name);
                    }
                    current_nodes = names;
                }
                Rule::edge_connector => {
                    let mut event_type = ">".to_string();
                    for ec in item.into_inner() {
                        if ec.as_rule() == Rule::EVENT {
                            event_type = ec.as_str().trim().to_string();
                        }
                    }
                    elements.push((std::mem::take(&mut current_nodes), Some(event_type)));
                }
                _ => {}
            }
        }

        if !current_nodes.is_empty() {
            elements.push((current_nodes, None));
        }

        for i in 0..elements.len().saturating_sub(1) {
            let (ref lhs_nodes, ref edge_type_opt) = elements[i];
            let (ref rhs_nodes, _) = elements[i + 1];
            let edge_type = edge_type_opt.as_deref().unwrap_or(">");

            for lhs in lhs_nodes {
                for rhs in rhs_nodes {
                    self.push_object(GraphObject::Edge {
                        edge: EdgeRef {
                            edge_type: edge_type.to_string(),
                            left: lhs.clone(),
                            right: rhs.clone(),
                        },
                    });
                    self.remove_from_root_vertices(rhs);
                }
            }
        }

        Ok(())
    }
}
