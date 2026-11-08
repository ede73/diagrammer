use std::collections::HashSet;

use super::{Generator, OutputFormatter};
use crate::ast::{GraphCanvas, GraphObject};

pub struct PlantUMLSequence;

impl Generator for PlantUMLSequence {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("@startuml", None);
        formatter.lout("autonumber", Some(true));
        formatter.lout("skinparam defaultFontName SansSerif", None);

        let process_vertex = |obj: &GraphObject, formatter: &mut OutputFormatter| {
            let mut nattrs: Vec<String> = Vec::new();
            if let Some(style) = obj.get_style() {
                if style.contains("singularity") {
                    nattrs.push("shape=\"circle\"".to_string());
                    nattrs.push("label=\"\"".to_string());
                    nattrs.push("width=0.01".to_string());
                    nattrs.push("weight=0.01".to_string());
                } else {
                    let mut styles: Vec<&str> = style.split(',').collect();
                    styles.sort();
                    nattrs.push(format!("style=\"{}\"", styles.join(",")));
                }
            }
            if let Some(img) = obj.get_image() {
                nattrs.push(format!("image=\"icons{}\"", img));
            }
            if let Some(tc) = obj.get_textcolor() {
                nattrs.push(format!("fontcolor=\"{}\"", tc));
            }
            let t = if !nattrs.is_empty() {
                nattrs.sort();
                format!("[{}]", nattrs.join(","))
            } else {
                String::new()
            };
            let label_part = if let Some(lbl) = obj.get_label() {
                format!("\"{}\" as", lbl)
            } else {
                String::new()
            };
            formatter.lout(
                &format!("participant {} {} {}", label_part, obj.get_name(), t),
                None,
            );
        };

        if let Some(ref start) = canvas.start {
            if let Some(obj) = canvas
                .get_objects(false)
                .into_iter()
                .find(|o| o.get_name() == start)
            {
                process_vertex(obj, &mut formatter);
            }
        }

        let all_edges = canvas.get_edges();
        let mut printed_edge_indices: HashSet<usize> = HashSet::new();
        let mut active_nodes: HashSet<String> = HashSet::new();


        fn traverse(
            objects: &[GraphObject],
            canvas_objects: &[GraphObject],
            container_name: Option<&str>,
            is_sub_graph: bool,
            formatter: &mut OutputFormatter,
            printed: &mut HashSet<usize>,
            active: &mut HashSet<String>,
            all_edges: &[&crate::ast::GraphEdge],
        ) {
            for obj in objects {
                if obj.is_vertex() {
                    let mut nattrs: Vec<String> = Vec::new();
                    if let Some(style) = obj.get_style() {
                        if style.contains("singularity") {
                            nattrs.push("shape=\"circle\"".to_string());
                            nattrs.push("label=\"\"".to_string());
                            nattrs.push("width=0.01".to_string());
                            nattrs.push("weight=0.01".to_string());
                        } else {
                            let mut styles: Vec<&str> = style.split(',').collect();
                            styles.sort();
                            nattrs.push(format!("style=\"{}\"", styles.join(",")));
                        }
                    }
                    if let Some(img) = obj.get_image() {
                        nattrs.push(format!("image=\"icons{}\"", img));
                    }
                    if let Some(tc) = obj.get_textcolor() {
                        nattrs.push(format!("fontcolor=\"{}\"", tc));
                    }
                    let t = if !nattrs.is_empty() {
                        nattrs.sort();
                        format!("[{}]", nattrs.join(","))
                    } else {
                        String::new()
                    };
                    let label_part = if let Some(lbl) = obj.get_label() {
                        format!("\"{}\" as", lbl)
                    } else {
                        String::new()
                    };
                    formatter.lout(
                        &format!("participant {} {} {}", label_part, obj.get_name(), t),
                        None,
                    );
                }
            }

            print_edges_for(all_edges, canvas_objects, container_name, is_sub_graph, formatter, printed, active);

            for obj in objects {
                if let GraphObject::Group(grp) = obj {
                    if let Some(ref cond) = grp.conditional {
                        let c = match cond.as_str() {
                            "if" => "alt",
                            "elseif" | "else" => "else",
                            "endif" => "end",
                            other => other,
                        };
                        let cond_str = format!("{} {}", c, grp.label.as_deref().unwrap_or(""));
                        formatter.lout(&cond_str, None);
                    }

                    let node_is_sub_graph = grp.is_inner_graph;
                    traverse(
                        &grp.objects,
                        canvas_objects,
                        Some(&grp.name),
                        node_is_sub_graph,
                        formatter,
                        printed,
                        active,
                        all_edges,
                    );
                    print_edges_for(all_edges, canvas_objects, Some(&grp.name), node_is_sub_graph, formatter, printed, active);
                }
            }
        }

        fn find_first_vertex(objects: &[GraphObject], name: &str) -> String {
            for obj in objects {
                if let GraphObject::Group(grp) = obj {
                    if grp.name == name {
                        if let Some(first) = grp.get_objects(false).first() {
                            return first.get_name().to_string();
                        }
                    }
                }
            }
            name.to_string()
        }

        fn print_edges_for(
            all_edges: &[&crate::ast::GraphEdge],
            canvas_objects: &[GraphObject],
            container_name: Option<&str>,
            is_sub_graph: bool,
            formatter: &mut OutputFormatter,
            printed: &mut HashSet<usize>,
            active: &mut HashSet<String>,
        ) {
            for (idx, edge) in all_edges.iter().enumerate() {
                if printed.contains(&idx) {
                    continue;
                }
                if edge.parent.as_deref() != container_name {
                    break;
                }
                printed.insert(idx);

                let mut note = String::new();
                let mut label = String::new();
                if let Some(ref lbl) = edge.label {
                    if lbl.contains("::") {
                        let parts: Vec<&str> = lbl.split("::").collect();
                        note = parts[1].trim().to_string();
                        label = parts[0].trim().to_string();
                    } else {
                        label = lbl.trim().to_string();
                    }
                }

                let color = edge
                    .color
                    .as_ref()
                    .map(|c| format!("[{}]", c))
                    .unwrap_or_default();
                let lt = edge.line_type();
                let dot = lt == "dotted";
                let dash = lt == "dashed";

                let mut lhs = find_first_vertex(canvas_objects, &edge.left);
                let mut rhs = find_first_vertex(canvas_objects, &edge.right);

                let link_type: String;
                let mut swap = false;

                if edge.edge_type.contains('<') && edge.edge_type.contains('>') {
                    link_type = format!("{}-{}>", if dot { "-" } else { "" }, color);
                    swap = true;
                } else if edge.edge_type.contains('<') {
                    std::mem::swap(&mut lhs, &mut rhs);
                    link_type = format!("{}-{}>", if dot { "-" } else { "" }, color);
                } else if edge.edge_type.contains('>') {
                    link_type = format!("{}-{}>", if dot { "-" } else { "" }, color);
                } else if dot {
                    let lbl_fmt = if !label.is_empty() {
                        format!("...{}...", label)
                    } else {
                        "...".to_string()
                    };
                    formatter.lout(&lbl_fmt, None);
                    continue;
                } else if dash {
                    let lbl_fmt = if !label.is_empty() {
                        format!("=={}==", label)
                    } else {
                        "==".to_string()
                    };
                    formatter.lout(&lbl_fmt, None);
                    continue;
                } else {
                    link_type = format!("-{}>", color);
                }

                let label_suffix = if !label.is_empty() {
                    format!(":{}", label)
                } else {
                    String::new()
                };

                formatter.lout(
                    &format!("{}{}{}{}", lhs, link_type, rhs, label_suffix),
                    None,
                );
                if swap {
                    formatter.lout(
                        &format!("{}{}{}{}", rhs, link_type, lhs, label_suffix),
                        None,
                    );
                }

                if is_sub_graph {
                    if !active.contains(&rhs) {
                        formatter.lout(&format!("activate {}", rhs), Some(true));
                        active.insert(rhs.clone());
                    } else {
                        active.remove(&lhs);
                        formatter.lout(&format!("deactivate {}", lhs), Some(false));
                    }
                } else if active.contains(&lhs) {
                    active.remove(&lhs);
                    formatter.lout(&format!("deactivate {}", lhs), Some(false));
                }

                if !note.is_empty() {
                    formatter.lout(&format!("note over {}", rhs), None);
                    for line in note.split("\\n") {
                        formatter.raw(line);
                    }
                    formatter.lout("end note", None);
                }
            }
        }

        traverse(
            &canvas.objects,
            &canvas.objects,
            None,
            false,
            &mut formatter,
            &mut printed_edge_indices,
            &mut active_nodes,
            &all_edges,
        );

        print_edges_for(
            &all_edges,
            &canvas.objects,
            None,
            false,
            &mut formatter,
            &mut printed_edge_indices,
            &mut active_nodes,
        );

        formatter.lout("@enduml", Some(false));
        formatter.finish()
    }
}
