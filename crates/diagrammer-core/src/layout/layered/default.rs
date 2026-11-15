use super::style::LayeredStyler;
use super::{escape_xml, LayeredEdge, LayeredNode};

/// Default general-purpose layered DAG styler
#[derive(Debug, Default)]
pub struct DefaultStyler;

impl LayeredStyler for DefaultStyler {
    fn name(&self) -> &'static str {
        "default"
    }

    fn render_node(&self, node: &LayeredNode, default_node_fill: &str, custom_shapes: Option<&crate::ast::TypeRegistry>, out: &mut String) {
        if let Some((ref sub_svg, sub_w, _sub_h)) = node.embedded_subgraph {
            let stroke_c = node.color.as_deref().unwrap_or("#38bdf8");
            let left_x = node.x - node.width / 2.0;
            let top_y = node.y - node.height / 2.0;
            out.push_str(&format!(
                r##"    <!-- Poly-Archetype Subgraph Container: {} -->
    <g class="dl-node ds-composite-node" id="node-{}">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="14" ry="14" fill="#1e293b" fill-opacity="0.18" stroke="{}" stroke-width="1.8" filter="url(#dl-shadow)"/>
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="1.0" stroke-opacity="0.4"/>
      <text x="{:.1}" y="{:.1}" font-size="13" font-weight="700" fill="{}">{}</text>
      <g class="ds-poly-archetype-subgraph" transform="translate({:.1}, {:.1})">
{}
      </g>
    </g>
"##,
                escape_xml(&node.id),
                escape_xml(&node.id),
                left_x, top_y, node.width, node.height, stroke_c,
                left_x, top_y + 36.0, left_x + node.width, top_y + 36.0, stroke_c,
                left_x + 18.0, top_y + 23.0, stroke_c, escape_xml(&node.label),
                left_x + (node.width - sub_w) / 2.0, top_y + 44.0,
                sub_svg
            ));
            return;
        }

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
            custom_shapes,
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
