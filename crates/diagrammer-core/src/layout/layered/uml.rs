use super::style::LayeredStyler;
use super::{escape_xml, LayeredEdge, LayeredNode};

/// UML Class & Object model presentation styler
#[derive(Debug, Default)]
pub struct UmlStyler;

impl LayeredStyler for UmlStyler {
    fn name(&self) -> &'static str {
        "uml"
    }

    fn render_node(&self, node: &LayeredNode, default_node_fill: &str, out: &mut String) {
        let node_color = node.color.as_deref().unwrap_or(default_node_fill);
        let text_color = node.textcolor.as_deref().unwrap_or("#ffffff");

        if node.shape == "uml_class" {
            let stroke_color = "#64748b";
            let has_members = !node.members.is_empty();
            let header_h = if has_members { 32.0 } else { node.height };

            if has_members {
                out.push_str(&format!(
                    r##"    <g class="dl-node dl-class-node" id="node-{}" filter="url(#dl-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" class="dl-class-box" fill="#0f172a" stroke="{}" />
      <!-- Class Title Header -->
      <path d="M {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} Z" fill="{}" />
      <text x="{:.1}" y="{:.1}" class="dl-class-header" fill="{}">{}</text>
      <!-- Separator Line -->
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="1" />
"##,
                    escape_xml(&node.id),
                    node.x, node.y, node.width, node.height, stroke_color,
                    node.x, node.y + header_h,
                    node.x, node.y + 4.0,
                    node.x, node.y, node.x + 4.0, node.y,
                    node.x + node.width - 4.0, node.y,
                    node.x + node.width, node.y, node.x + node.width, node.y + 4.0,
                    node_color,
                    node.x + node.width / 2.0, node.y + header_h / 2.0,
                    text_color, escape_xml(&node.label),
                    node.x, node.y + header_h, node.x + node.width, node.y + header_h, stroke_color
                ));

                let mut member_y = node.y + header_h + 14.0;
                for member in &node.members {
                    out.push_str(&format!(
                        r#"      <text x="{:.1}" y="{:.1}" class="dl-class-member">{}</text>
"#,
                        node.x + 12.0, member_y, escape_xml(member)
                    ));
                    member_y += 22.0;
                }
                out.push_str("    </g>\n");
            } else {
                out.push_str(&format!(
                    r##"    <g class="dl-node dl-class-node" id="node-{}" filter="url(#dl-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="4.0" ry="4.0" class="dl-class-box" fill="#0f172a" stroke="{}" />
      <!-- Class Title Header -->
      <path d="M {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} L {:.1} {:.1} Q {:.1} {:.1} {:.1} {:.1} Z" fill="{}" />
      <text x="{:.1}" y="{:.1}" class="dl-class-header" fill="{}">{}</text>
    </g>
"##,
                    escape_xml(&node.id),
                    node.x, node.y, node.width, node.height, stroke_color,
                    node.x, node.y + node.height - 4.0,
                    node.x, node.y + 4.0,
                    node.x, node.y, node.x + 4.0, node.y,
                    node.x + node.width - 4.0, node.y,
                    node.x + node.width, node.y, node.x + node.width, node.y + 4.0,
                    node.x + node.width, node.y + node.height - 4.0,
                    node.x + node.width, node.y + node.height, node.x + node.width - 4.0, node.y + node.height,
                    node.x + 4.0, node.y + node.height,
                    node.x, node.y + node.height, node.x, node.y + node.height - 4.0,
                    node_color,
                    node.x + node.width / 2.0, node.y + node.height / 2.0,
                    text_color, escape_xml(&node.label)
                ));
            }
        } else {
            out.push_str(&format!(
                r##"    <g class="dl-node" id="node-{}" filter="url(#dl-shadow)">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="8.0" ry="8.0" class="dl-node-box" fill="{}" stroke="#334155" />
      <text x="{:.1}" y="{:.1}" class="dl-node-label" fill="{}">{}</text>
    </g>
"##,
                escape_xml(&node.id),
                node.x, node.y, node.width, node.height,
                node_color,
                node.x + node.width / 2.0, node.y + node.height / 2.0,
                text_color, escape_xml(&node.label)
            ));
        }
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
