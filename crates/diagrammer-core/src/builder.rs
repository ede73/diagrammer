use crate::ast::*;
use crate::{DiagrammerParser, Rule};
use pest::iterators::{Pair, Pairs};
use pest::Parser;

pub struct AstBuilder {
    pub canvas: GraphCanvas,
    container_stack: Vec<usize>, // indices or IDs of nested groups
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
            container_stack: Vec::new(),
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

        self.canvas.parsing_context = Some(self.context);
        Ok(self.canvas)
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
                self.canvas.defaults.vertexcolor = Some(color);
            }
            Rule::vertex_text_color => {
                let color = self.extract_color_or_var(pair)?;
                self.canvas.defaults.vertextextcolor = Some(color);
            }
            Rule::edge_color => {
                let color = self.extract_color_or_var(pair)?;
                self.canvas.defaults.edgecolor = Some(color);
            }
            Rule::edge_text_color => {
                let color = self.extract_color_or_var(pair)?;
                self.canvas.defaults.edgetextcolor = Some(color);
            }
            Rule::group_color => {
                let color = self.extract_color_or_var(pair)?;
                self.canvas.defaults.groupcolor = Some(color);
            }
            Rule::equal => {
                // equal vertices
                for item in pair.into_inner() {
                    let names = self.collect_vertex_names(item);
                    for name in names {
                        self.canvas.equal.push(GraphObject::VertexRef {
                            vertex: VertexRef { name },
                        });
                    }
                }
            }
            Rule::VARIABLE => {
                self.handle_variable(pair.as_str());
            }
            Rule::event_chain => {
                self.handle_event_chain(pair)?;
            }
            Rule::vertex_group_or_attrs => {
                let names = self.collect_vertex_names(pair);
                for name in names {
                    self.ensure_vertex_exists(&name);
                }
            }
            Rule::group_start => {
                let mut name = None;
                let mut label = None;
                for p in pair.into_inner() {
                    match p.as_rule() {
                        Rule::NAME => name = Some(p.as_str().to_string()),
                        Rule::LABEL => label = Some(p.as_str().trim_start_matches(';').trim().to_string()),
                        _ => {}
                    }
                }
                let group_name = name.unwrap_or_else(|| {
                    let id = self.context.group_ids.unwrap_or(1);
                    self.context.group_ids = Some(id + 1);
                    id.to_string()
                });
                let mut group = GraphGroup::new(&group_name);
                group.label = label;
                self.canvas.objects.push(GraphObject::Group(Box::new(group)));
            }
            Rule::group_end => {
                // Exit current group
            }
            _ => {}
        }
        Ok(())
    }

    fn extract_color_or_var(&mut self, pair: Pair<Rule>) -> Result<String, String> {
        for inner in pair.into_inner() {
            if inner.as_rule() == Rule::color_or_variable {
                let s = inner.as_str().trim();
                if s.starts_with("$(") {
                    return Ok(self.handle_variable(s));
                }
                return Ok(s.to_string());
            }
        }
        Ok(String::new())
    }

    fn handle_variable(&mut self, text: &str) -> String {
        let trimmed = text.trim();
        let inner = trimmed.trim_start_matches("$(").trim_end_matches(')');
        if let Some((k, v)) = inner.split_once(':') {
            self.context.variables.insert(k.trim().to_string(), v.trim().to_string());
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

    fn ensure_vertex_exists(&mut self, name: &str) {
        let exists = self.canvas.objects.iter().any(|obj| match obj {
            GraphObject::VertexRef { vertex } => vertex.name == name,
            GraphObject::Vertex(v) => v.name == name,
            _ => false,
        });

        if !exists {
            self.canvas.objects.push(GraphObject::VertexRef {
                vertex: VertexRef {
                    name: name.to_string(),
                },
            });
            self.canvas.root_vertices.push(GraphObject::VertexRef {
                vertex: VertexRef {
                    name: name.to_string(),
                },
            });
        }
    }

    fn remove_from_root_vertices(&mut self, name: &str) {
        self.canvas.root_vertices.retain(|obj| match obj {
            GraphObject::VertexRef { vertex } => vertex.name != name,
            GraphObject::Vertex(v) => v.name != name,
            _ => true,
        });
    }

    fn handle_event_chain(&mut self, pair: Pair<Rule>) -> Result<(), String> {
        let mut elements: Vec<(Vec<String>, Option<String>)> = Vec::new(); // (vertices, edge_connector)
        let mut current_nodes = Vec::new();

        for item in pair.into_inner() {
            match item.as_rule() {
                Rule::vertex_group_or_attrs | Rule::vertex_attrs | Rule::vertex_group => {
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

        // Link elements in chain: elem[i] -> elem[i+1]
        for i in 0..elements.len().saturating_sub(1) {
            let (ref lhs_nodes, ref edge_type_opt) = elements[i];
            let (ref rhs_nodes, _) = elements[i + 1];
            let edge_type = edge_type_opt.as_deref().unwrap_or(">");

            for lhs in lhs_nodes {
                for rhs in rhs_nodes {
                    self.canvas.objects.push(GraphObject::Edge {
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
