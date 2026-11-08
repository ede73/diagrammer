use super::{Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};
use std::collections::HashSet;

pub struct MermaidER;

impl Generator for MermaidER {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("erDiagram", Some(true));

        let mut defined_entities = HashSet::new();

        // 1. Entities from groups (if any)
        for obj in canvas.get_objects(false) {
            if let GraphObject::Group(grp) = obj {
                let entity_name = safe_entity_id(&grp.name);
                defined_entities.insert(entity_name.clone());

                let inners = grp.get_objects(false);
                if inners.is_empty() {
                    formatter.lout(&entity_name, None);
                } else {
                    formatter.lout(&format!("{} {{", entity_name), Some(true));
                    for inner in inners {
                        if inner.is_vertex() {
                            let f_name = safe_attribute_name(inner.get_name());
                            let raw_label = inner.get_label().unwrap_or("");

                            let (attr_type, comment) = if !raw_label.is_empty() {
                                let clean = raw_label.trim().trim_start_matches(|c| c == '+' || c == '-' || c == '#' || c == '~');
                                let first_word = clean.split(|c: char| c.is_whitespace() || c == ':' || c == ';').next().unwrap_or("");
                                let is_ident = !first_word.is_empty()
                                    && first_word.chars().all(|c| c.is_alphanumeric() || c == '_')
                                    && !first_word.chars().next().unwrap().is_ascii_digit();

                                if is_ident && (clean == first_word || clean.starts_with(&format!("{}:", first_word))) {
                                    (first_word.to_string(), None)
                                } else {
                                    ("string".to_string(), Some(safe_attribute_comment(raw_label)))
                                }
                            } else {
                                ("string".to_string(), None)
                            };

                            if let Some(comm) = comment {
                                if !comm.is_empty() {
                                    formatter.lout(&format!("{} {} \"{}\"", attr_type, f_name, comm), None);
                                } else {
                                    formatter.lout(&format!("{} {}", attr_type, f_name), None);
                                }
                            } else {
                                formatter.lout(&format!("{} {}", attr_type, f_name), None);
                            }
                        }
                    }
                    formatter.lout("}", Some(false));
                }
            }
        }

        // 2. Relationships from edges
        for edge in canvas.get_edges() {
            let left_id = safe_entity_id(&edge.left);
            let right_id = safe_entity_id(&edge.right);

            let raw_label = edge.label.as_deref().unwrap_or("relates_to");
            let clean_label = if raw_label.trim().is_empty() {
                "relates_to"
            } else {
                raw_label.trim()
            };

            // Detect cardinalities from label or arrowheads
            let rel = if clean_label.contains("1:n") || clean_label.contains("1..*") {
                "||--|{"
            } else if clean_label.contains("n:1") || clean_label.contains("*..1") {
                "}|--||"
            } else if clean_label.contains("m:n") || clean_label.contains("*..*") {
                "}|--|{"
            } else if clean_label.contains("1:1") {
                "||--||"
            } else {
                "||--o{"
            };

            let safe_label = clean_label
                .split(':')
                .next()
                .unwrap_or(clean_label)
                .trim()
                .replace('"', "")
                .replace("\\n", " ")
                .replace('\n', " ")
                .replace('\r', "");

            let label_out = if safe_label.is_empty() {
                "relates_to".to_string()
            } else {
                safe_label
            };

            formatter.lout(&format!("{} {} {} : \"{}\"", left_id, rel, right_id, label_out), None);
        }

        formatter.finish()
    }
}

fn safe_entity_id(name: &str) -> String {
    let reserved = [
        "end", "to", "style", "class", "classdef", "subgraph", "direction",
        "erdiagram", "title", "acc_title", "acc_descr", "optionally", "block"
    ];
    let lower = name.to_lowercase();
    let is_reserved = reserved.contains(&lower.as_str());

    let mut out = String::new();
    for ch in name.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if is_reserved || out.is_empty() || out.chars().next().unwrap().is_ascii_digit() {
        format!("e_{}", out)
    } else {
        out
    }
}

fn safe_attribute_name(name: &str) -> String {
    let mut out = String::new();
    for ch in name.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if out.is_empty() {
        "field".to_string()
    } else if out.chars().next().unwrap().is_ascii_digit() {
        format!("f_{}", out)
    } else {
        out
    }
}

fn safe_attribute_comment(comment: &str) -> String {
    comment
        .replace('"', "'")
        .replace("\\n", " ")
        .replace('\n', " ")
        .replace('\r', "")
        .trim()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_mermaid_er_relationships() {
        let input = r#"
Customer > "places:1:n" Order
Order > "contains:1..*" LineItem
"#;
        let canvas = AstBuilder::new().build(input).expect("Failed to parse");
        let output = MermaidER.generate(&canvas);

        assert!(output.contains("erDiagram"));
        assert!(output.contains("Customer ||--|{ Order : \"places\""));
        assert!(output.contains("Order ||--|{ LineItem : \"contains\""));
    }
}
