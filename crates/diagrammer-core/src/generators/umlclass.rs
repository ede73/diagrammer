use std::collections::HashMap;

use regex::Regex;
use serde::Serialize;

use super::Generator;
use crate::ast::{ArrowType, GraphCanvas, GraphEdge, GraphObject};

pub struct UMLClass;

#[derive(Serialize)]
struct ParameterType {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    r#type: Option<String>,
}

#[derive(Serialize)]
struct MethodDeclaration {
    name: String,
    visibility: String,
    r#type: String,
    parameters: Vec<ParameterType>,
}

#[derive(Serialize)]
struct MemberDeclaration {
    name: String,
    visibility: String,
    r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    default: Option<String>,
}

#[derive(Serialize)]
struct ClassDeclaration {
    key: usize,
    name: String,
    properties: Vec<MemberDeclaration>,
    methods: Vec<MethodDeclaration>,
}

#[derive(Serialize)]
struct Relationship {
    relationship: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    from: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    to: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    label: Option<String>,
    #[serde(rename = "tailLabel", skip_serializing_if = "Option::is_none")]
    tail_label: Option<String>,
    #[serde(rename = "headLabel", skip_serializing_if = "Option::is_none")]
    head_label: Option<String>,
}

impl Generator for UMLClass {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut groups: Vec<ClassDeclaration> = Vec::new();
        let mut edges: Vec<Relationship> = Vec::new();

        let method_regex =
            Regex::new(r"^(?P<visibility>[+#-]?)(?P<name>[^(]*)(?P<parameters>\([^)]*\))[:]{0,1}(?P<return>.*)").unwrap();

        let name_and_label = |ln: &GraphObject| -> String {
            let label = ln.get_label().unwrap_or("");
            let name = ln.get_name();
            if !name.is_empty() && label.starts_with(name) {
                label.to_string()
            } else {
                format!("{}{}", name, label)
            }
        };

        let mangle_name = |name: &str| -> String {
            name.trim_matches('_').to_string()
        };

        let get_members = |vertices: &[&GraphObject]| -> Vec<MemberDeclaration> {
            vertices
                .iter()
                .filter(|node| !name_and_label(node).contains(')'))
                .map(|member| {
                    let mut ret = MemberDeclaration {
                        name: mangle_name(member.get_name()),
                        visibility: String::new(),
                        r#type: String::new(),
                        default: None,
                    };

                    if let Some(label) = member.get_label() {
                        let mut vis = "";
                        let mut rest = label;
                        if let Some(ch) = rest.chars().next() {
                            if ch == '+' || ch == '-' || ch == '#' {
                                vis = &rest[..ch.len_utf8()];
                                rest = &rest[ch.len_utf8()..];
                            }
                        }
                        let (before_eq, def) = if let Some((b, a)) = rest.split_once('=') {
                            (b, Some(a))
                        } else {
                            (rest, None)
                        };
                        let (name, typ) = if let Some((n, t)) = before_eq.split_once(':') {
                            (n, t)
                        } else {
                            ("", before_eq)
                        };

                        match vis {
                            "+" => ret.visibility = "public".to_string(),
                            "-" => ret.visibility = "private".to_string(),
                            "#" => ret.visibility = "protected".to_string(),
                            _ => {}
                        }
                        if !name.is_empty() {
                            ret.name = name.to_string();
                        }
                        if !typ.is_empty() {
                            ret.r#type = typ.to_string();
                        }
                        if let Some(d) = def {
                            if !d.is_empty() {
                                ret.default = Some(d.to_string());
                            }
                        }
                    }
                    ret
                })
                .collect()
        };

        let get_methods = |vertices: &[&GraphObject]| -> Vec<MethodDeclaration> {
            vertices
                .iter()
                .filter(|node| name_and_label(node).contains('('))
                .map(|method| {
                    let mut ret = MethodDeclaration {
                        name: mangle_name(method.get_name()),
                        visibility: String::new(),
                        r#type: String::new(),
                        parameters: Vec::new(),
                    };

                    if let Some(label) = method.get_label() {
                        if let Some(caps) = method_regex.captures(label) {
                            if let Some(vis) = caps.name("visibility") {
                                match vis.as_str() {
                                    "+" => ret.visibility = "public".to_string(),
                                    "-" => ret.visibility = "private".to_string(),
                                    "#" => ret.visibility = "protected".to_string(),
                                    _ => {}
                                }
                            }
                            if let Some(params) = caps.name("parameters") {
                                let param_str = params.as_str().trim_matches(|c| c == '(' || c == ')');
                                ret.parameters = param_str
                                    .split(',')
                                    .filter_map(|p| {
                                        let trimmed = p.trim();
                                        if trimmed.is_empty() {
                                            return None;
                                        }
                                        let mut parts = trimmed.split(':');
                                        let p_name = parts.next().unwrap_or("").trim().to_string();
                                        let p_type = parts.next().map(|s| s.trim().to_string());
                                        if !p_name.is_empty() || p_type.is_some() {
                                            Some(ParameterType {
                                                name: p_name,
                                                r#type: p_type,
                                            })
                                        } else {
                                            None
                                        }
                                    })
                                    .collect();
                                ret.name = mangle_name(method.get_name());
                            }
                            if let Some(ret_type) = caps.name("return") {
                                ret.r#type = ret_type.as_str().to_string();
                            }
                        }
                    }
                    ret
                })
                .collect()
        };

        let mut id = 1;
        let mut group_name_id_map: HashMap<String, usize> = HashMap::new();

        for node in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = node {
                let key = id;
                id += 1;
                group_name_id_map.insert(grp.name.clone(), key);
                let inner_objs = grp.get_objects(false);
                groups.push(ClassDeclaration {
                    key,
                    name: name_and_label(node),
                    properties: get_members(&inner_objs),
                    methods: get_methods(&inner_objs),
                });
            }
        }

        let links_to_interface = |edge: &GraphEdge| -> bool {
            let right_target = &edge.right;
            right_target.starts_with('I')
                || canvas
                    .objects
                    .iter()
                    .find(|o| o.get_name() == right_target)
                    .and_then(|o| o.get_label())
                    .map(|l| l.starts_with('I'))
                    .unwrap_or(false)
        };

        let has_tail_and_head_labels = |edge: &GraphEdge| -> bool {
            edge.label.as_ref().map(|l| l.split(':').count() >= 3).unwrap_or(false)
        };

        for edge in canvas.get_edges() {
            let from = group_name_id_map.get(&edge.left).copied();
            let to = group_name_id_map.get(&edge.right).copied();

            let left_arrow = edge.left_arrow_type();
            let right_arrow = edge.right_arrow_type();
            let lt = edge.line_type();

            let is_undir_or_bidir = (left_arrow == ArrowType::None && right_arrow == ArrowType::None)
                || (left_arrow != ArrowType::None && right_arrow != ArrowType::None);

            let is_dashed = lt == "dashed";
            let is_normal_line = lt != "dashed" && lt != "dotted";

            let relationship = if is_undir_or_bidir {
                "association"
            } else if is_dashed && !links_to_interface(edge) {
                "dependency"
            } else if is_dashed && links_to_interface(edge) {
                "realization"
            } else if is_normal_line && right_arrow == ArrowType::Normal {
                "generalization"
            } else if right_arrow == ArrowType::Double && has_tail_and_head_labels(edge) {
                "composition"
            } else if right_arrow == ArrowType::Double && !has_tail_and_head_labels(edge) {
                "aggregation"
            } else {
                "dependency"
            };

            let mut rel_label = edge.label.clone();
            let mut head_label = None;
            let mut tail_label = None;

            if let Some(ref l) = edge.label {
                if l.contains(':') {
                    let parts: Vec<&str> = l.split(':').collect();
                    if parts.len() >= 3 {
                        tail_label = Some(parts[0].to_string());
                        head_label = Some(parts[1].to_string());
                        rel_label = Some(parts[2..].join(":"));
                    }
                }
            }

            edges.push(Relationship {
                relationship: relationship.to_string(),
                from,
                to,
                label: rel_label,
                head_label,
                tail_label,
            });
        }

        let doc = (groups, edges);
        let mut out = serde_json::to_string(&doc).unwrap_or_default();
        out.push('\n');
        out
    }
}
