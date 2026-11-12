use super::style::LayeredStyler;
use super::{escape_xml, LayeredEdge, LayeredNode};

/// Default general-purpose layered DAG styler
#[derive(Debug, Default)]
pub struct DefaultStyler;

impl LayeredStyler for DefaultStyler {
    fn name(&self) -> &'static str {
        "default"
    }

    fn render_node(&self, node: &LayeredNode, default_node_fill: &str, out: &mut String) {
        let node_color = node.color.as_deref().unwrap_or(default_node_fill);
        let text_color = node.textcolor.as_deref().unwrap_or("#ffffff");

        crate::layout::shapes::render_svg_node(
            &node.id,
            &node.label,
            &node.shape,
            node.style.as_deref(),
            node.image.as_deref(),
            node.x,
            node.y,
            node.width,
            node.height,
            node_color,
            text_color,
            "#334155",
            Some("url(#dl-shadow)"),
            out,
        );
    }

    fn render_edge_label(&self, edge: &LayeredEdge, out: &mut String) {
        if let Some(ref lbl) = edge.label {
            let (lx, ly) = if edge.points.len() == 4 {
                let mid_x = (edge.points[1].0 + edge.points[2].0) / 2.0;
                let mid_y = edge.points[1].1 - 7.0;
                (mid_x, mid_y)
            } else {
                let mid_idx = edge.points.len() / 2;
                let mid_pt = edge.points[mid_idx];
                let prev_pt = edge.points[mid_idx.saturating_sub(1)];
                ((mid_pt.0 + prev_pt.0) / 2.0, (mid_pt.1 + prev_pt.1) / 2.0 - 7.0)
            };

            out.push_str(&format!(
                r#"    <text x="{:.1}" y="{:.1}" class="dl-edge-label">{}</text>
"#,
                lx, ly, escape_xml(lbl)
            ));
        }
    }
}
