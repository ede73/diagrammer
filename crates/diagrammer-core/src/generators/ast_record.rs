use crate::ast::{GraphCanvas, GraphObject};
use crate::generators::{Generator, OutputFormatter};

pub struct ASTRecord;

impl Generator for ASTRecord {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let mut formatter = OutputFormatter::new();
        formatter.lout("digraph {", Some(true));
        formatter.lout("compound=true;", None);
        if matches!(
            canvas.direction.as_deref().map(|s| s.to_lowercase()).as_deref(),
            Some("landscape") | Some("lr") | Some("horizontal")
        ) {
            formatter.lout("rankdir=LR;", None);
        } else {
            formatter.lout("rankdir=TD;", None);
        }
        formatter.lout("node[fontsize=\"9\"];", None);
        formatter.lout("edge[fontsize=\"9\"];", None);
        formatter.lout("subgraph cluster_canvas {", Some(true));
        formatter.lout("color=yellow;", None);

        let canvas_props = collect_canvas_properties(canvas);
        let canvas_record = make_record("GraphCanvas", "magenta", &canvas_props);
        formatter.lout(&format!("GraphCanvas[shape=plaintext, label=<\n\t{}\n\t>];", canvas_record.join("\n\t\t")), None);

        for obj in canvas.get_objects(false) {
            render_object(&mut formatter, obj);
        }

        for edge in canvas.get_edges() {
            let mut parts = vec![
                format!("edgeType={}", edge.edge_type),
                format!("left={}", edge.left),
                format!("right={}", edge.right),
            ];
            if let Some(ref c) = edge.color {
                parts.push(format!("color={}", c));
            }
            let label = format!("GraphEdge\\n{}", parts.join("\\n"));
            formatter.lout(&format!("{} -> {}[label=\"{}\"];", edge.left, edge.right, label), None);
        }

        formatter.lout("}", Some(false));
        formatter.lout("}", Some(false));
        formatter.finish()
    }
}

fn collect_canvas_properties(canvas: &GraphCanvas) -> Vec<(String, String)> {
    let mut props = Vec::new();
    props.push(("name".to_string(), canvas.name.clone()));
    if let Some(ref dir) = canvas.direction {
        props.push(("direction".to_string(), dir.clone()));
    }
    if let Some(ref vis) = canvas.visualizer {
        props.push(("visualizer".to_string(), vis.clone()));
    }
    if let Some(ref theme) = canvas.theme {
        if let Some(ref bg) = theme.background {
            props.push(("theme.background".to_string(), bg.clone()));
        }
        if let Some(ref vc) = theme.vertexcolor {
            props.push(("theme.vertexcolor".to_string(), vc.clone()));
        }
        if let Some(ref vtc) = theme.vertextextcolor {
            props.push(("theme.vertextextcolor".to_string(), vtc.clone()));
        }
        if let Some(ref ec) = theme.edgecolor {
            props.push(("theme.edgecolor".to_string(), ec.clone()));
        }
    }
    if let Some(ref layout) = canvas.layout {
        if let Some(ref dir) = layout.direction {
            props.push(("layout.direction".to_string(), dir.clone()));
        }
    }
    let objects_str = canvas.objects.iter().map(|o| o.get_name()).collect::<Vec<_>>().join(", ");
    props.push(("_OBJECTS".to_string(), objects_str));
    props
}

fn make_record(title: &str, color: &str, params: &[(String, String)]) -> Vec<String> {
    let mut ret = Vec::new();
    ret.push(format!("<table style=\"rounded\" bgcolor=\"{}\" border='1' cellborder='0' cellspacing='0'>", color));
    ret.push(format!("<tr><td>{}</td><td></td></tr>", title));
    for (k, v) in params {
        ret.push(format!("<tr><td>{}</td><td>{}</td></tr>", k, v.replace('"', "'")));
    }
    ret.push("</table>".to_string());
    ret
}

fn render_object(formatter: &mut OutputFormatter, obj: &GraphObject) {
    match obj {
        GraphObject::Group(grp) => {
            let color = if grp.is_inner_graph { "blue" } else { "brown" };
            let title = if grp.is_inner_graph { "GraphInner" } else { "GraphGroup" };
            let mut props = vec![("name".to_string(), grp.name.clone())];
            let objs = grp.objects.iter().map(|o| o.get_name()).collect::<Vec<_>>().join(", ");
            props.push(("_OBJECTS".to_string(), objs));
            let record = make_record(title, color, &props);

            formatter.lout(&format!("subgraph cluster_{} {{", grp.name), Some(true));
            formatter.lout("color=blue;", None);
            formatter.lout(&format!("{}[shape=plaintext, label=<\n\t{}\t\n>];", grp.name, record.join("\n\t\t")), None);

            for child in &grp.objects {
                render_object(formatter, child);
            }
            formatter.lout("}", Some(false));
        }
        GraphObject::VertexRef { vertex } => {
            let props = vec![("name".to_string(), vertex.name.clone())];
            let record = make_record("GraphReference", "darkgreen", &props);
            formatter.lout(&format!("inner_{}[shape=plaintext, label=<\n\t{}\t\n>];", vertex.name, record.join("\n\t\t")), None);
        }
        GraphObject::Vertex(v) => {
            let mut props = vec![("name".to_string(), v.name.clone())];
            if let Some(ref l) = v.label {
                props.push(("label".to_string(), l.clone()));
            }
            if let Some(ref c) = v.color {
                props.push(("color".to_string(), c.clone()));
            }
            if let Some(ref s) = v.shape {
                props.push(("shape".to_string(), s.clone()));
            }
            let record = make_record("GraphVertex", "maroon", &props);
            formatter.lout(&format!("{}[shape=plaintext, label=<\n\t{}\t\n>];", v.name, record.join("\n\t\t")), None);
        }
        _ => {}
    }
}
