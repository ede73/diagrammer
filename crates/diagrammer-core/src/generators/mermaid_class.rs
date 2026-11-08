use super::{Generator, OutputFormatter};
use crate::ast::{ArrowType, GraphCanvas, GraphObject};
use regex::Regex;
use std::collections::HashSet;

pub struct MermaidClass;

impl Generator for MermaidClass {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("classDiagram", Some(true));

        if canvas.direction.as_deref() == Some("landscape") {
            formatter.lout("direction LR", None);
        }

        let method_regex = Regex::new(
            r"^(?P<vis>[+#~-]?)(?P<name>[^(]*)(?P<params>\([^)]*\))[:]{0,1}(?P<ret>.*)"
        ).unwrap();

        let mut class_names = HashSet::new();

        // 1. Render class definitions from groups or styled vertices
        for obj in canvas.get_objects(false) {
            match obj {
                GraphObject::Group(grp) => {
                    let raw_name = grp.label.as_deref().unwrap_or(&grp.name);
                    let class_name = safe_class_id(raw_name);
                    class_names.insert(class_name.clone());

                    let inner_objs = grp.get_objects(false);
                    if inner_objs.is_empty() {
                        formatter.lout(&format!("class {}", class_name), None);
                    } else {
                        formatter.lout(&format!("class {} {{", class_name), Some(true));
                        for inner in inner_objs {
                            if inner.is_vertex() {
                                let v_name = inner.get_name();
                                let v_label = inner.get_label().unwrap_or(v_name);

                                if v_label.contains('(') || v_name.contains('(') {
                                    // Method
                                    let full = if v_label.contains('(') { v_label } else { v_name };
                                    if let Some(caps) = method_regex.captures(full) {
                                        let vis = caps.name("vis").map(|m| m.as_str()).unwrap_or("+");
                                        let parsed_name = caps.name("name").map(|m| m.as_str().trim()).unwrap_or("");
                                        let m_name = if parsed_name.is_empty() { v_name } else { parsed_name };
                                        let params = caps.name("params").map(|m| m.as_str().trim()).unwrap_or("()");
                                        let ret = caps.name("ret").map(|m| m.as_str().trim()).unwrap_or("");

                                        let clean_vis = if vis.is_empty() { "+" } else { vis };
                                        let clean_ret = sanitize_generics(ret);
                                        let clean_params = sanitize_parameters(params);

                                        if clean_ret.is_empty() {
                                            formatter.lout(&format!("{}{}{}", clean_vis, m_name, clean_params), None);
                                        } else {
                                            formatter.lout(&format!("{}{}{} {}", clean_vis, m_name, clean_params, clean_ret), None);
                                        }
                                    } else {
                                        formatter.lout(&format!("+{}", sanitize_generics(full)), None);
                                    }
                                } else {
                                    // Property / Field
                                    let mut vis = "+";
                                    let mut rest = v_label;
                                    if let Some(ch) = rest.chars().next() {
                                        if ch == '+' || ch == '-' || ch == '#' || ch == '~' {
                                            vis = &rest[..ch.len_utf8()];
                                            rest = &rest[ch.len_utf8()..];
                                        } else if ch == '_' {
                                            vis = "~";
                                            rest = &rest[ch.len_utf8()..];
                                        }
                                    }
                                    let (field_name, field_type) = if let Some((n, t)) = rest.split_once(':') {
                                        (n.trim(), t.trim())
                                    } else {
                                        (v_name, rest.trim())
                                    };

                                    let clean_type = sanitize_generics(field_type);
                                    if clean_type.is_empty() || clean_type == field_name {
                                        formatter.lout(&format!("{}{}", vis, field_name), None);
                                    } else {
                                        formatter.lout(&format!("{}{}: {}", vis, clean_type, field_name), None);
                                    }
                                }
                            }
                        }
                        formatter.lout("}", Some(false));
                    }
                }
                GraphObject::Vertex(v) => {
                    let name = &v.name;
                    if !name.is_empty() {
                        let id = safe_class_id(name);
                        if class_names.insert(id.clone()) {
                            formatter.lout(&format!("class {}", id), None);
                        }
                    }
                }
                _ => {}
            }
        }

        if class_names.is_empty() && canvas.get_edges().is_empty() {
            formatter.lout("class EmptyDiagram", None);
        }

        // 2. Render relationships
        for edge in canvas.get_edges() {
            let left_id = safe_class_id(&edge.left);
            let right_id = safe_class_id(&edge.right);

            let left_arr = edge.left_arrow_type();
            let right_arr = edge.right_arrow_type();
            let lt = edge.line_type();

            let is_dashed = lt == "dashed";
            let is_dotted = lt == "dotted";

            // Infer relationship type
            let (rel_symbol, lhs, rhs) = if right_arr == ArrowType::Normal && !is_dashed {
                // Inheritance / Generalization: Child > Parent => Parent <|-- Child
                ("<|--", right_id.clone(), left_id.clone())
            } else if left_arr == ArrowType::Normal && !is_dashed {
                ("<|--", left_id.clone(), right_id.clone())
            } else if is_dashed && (edge.right.starts_with('I') || edge.right.contains("Interface")) {
                // Realization: Class ..|> Interface
                ("<|..", right_id.clone(), left_id.clone())
            } else if is_dashed {
                // Dependency: Class ..> Dependency
                ("..>", left_id.clone(), right_id.clone())
            } else if right_arr == ArrowType::Double {
                // Composition: Container *-- Part
                let is_composition = edge.label.as_deref().map(|l| l.contains("composition") || l.contains("filled")).unwrap_or(false);
                if is_composition {
                    ("*--", right_id.clone(), left_id.clone())
                } else {
                    ("o--", right_id.clone(), left_id.clone())
                }
            } else if is_dotted || lt == "none" || (left_arr == ArrowType::None && right_arr == ArrowType::None) {
                ("..", left_id.clone(), right_id.clone())
            } else {
                ("-->", left_id.clone(), right_id.clone())
            };

            let label = edge.label.as_deref().map(|s| s.trim()).unwrap_or("");
            if !label.is_empty() {
                let clean_label = label
                    .split("::")
                    .next()
                    .unwrap_or(label)
                    .replace(':', " ")
                    .replace('[', "(")
                    .replace(']', ")")
                    .replace('"', "")
                    .replace("\\n", " ")
                    .replace('\n', " ")
                    .trim()
                    .to_string();
                if !clean_label.is_empty() {
                    formatter.lout(&format!("{} {} {} : {}", lhs, rel_symbol, rhs, clean_label), None);
                } else {
                    formatter.lout(&format!("{} {} {}", lhs, rel_symbol, rhs), None);
                }
            } else {
                formatter.lout(&format!("{} {} {}", lhs, rel_symbol, rhs), None);
            }
        }

        formatter.finish()
    }
}

fn safe_class_id(name: &str) -> String {
    let reserved = [
        "style", "class", "classdef", "direction", "namespace", "callback", "link", "click", "o"
    ];
    let clean = name.trim().split_whitespace().next().unwrap_or(name);
    let mut out = String::new();
    for ch in clean.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            out.push(ch);
        }
    }
    let lower = out.to_lowercase();
    if reserved.contains(&lower.as_str()) || out.is_empty() || out.chars().next().unwrap().is_ascii_digit() {
        format!("c_{}", out)
    } else {
        out
    }
}

fn sanitize_parameters(params: &str) -> String {
    let inner = params.trim_matches(|c| c == '(' || c == ')');
    if inner.trim().is_empty() {
        return "()".to_string();
    }
    let parts: Vec<String> = inner
        .split(',')
        .map(|p| {
            let trimmed = p.trim();
            if trimmed.contains(' ') && !trimmed.contains(':') {
                trimmed.replace(' ', "_")
            } else {
                trimmed.to_string()
            }
        })
        .collect();
    format!("({})", sanitize_generics(&parts.join(", ")))
}

fn sanitize_generics(s: &str) -> String {
    s.replace('<', "~").replace('>', "~")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_mermaid_class_simple() {
        let input = r#"
{Person;Person
name;+String
birth;#Date
getCurrentAge;+(): int
}
{Student;Student
classes;_List<Class>
attend;-(class: Course)
}
Student > Person
"#;
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidClass.generate(&canvas);

        assert!(output.contains("classDiagram"));
        assert!(output.contains("class Person {"));
        assert!(output.contains("+String: name"));
        assert!(output.contains("+getCurrentAge() int"));
        assert!(output.contains("class Student {"));
        assert!(output.contains("Person <|-- Student"));
    }
}
