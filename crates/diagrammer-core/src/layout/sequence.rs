use crate::ast::{ArrowType, GraphCanvas};
use std::collections::HashMap;

/// Participant representation extracted from the canvas
#[derive(Debug, Clone)]
pub struct Participant {
    pub id: String,
    pub label: String,
    pub color: Option<String>,
    pub textcolor: Option<String>,
}

/// Message (interaction) representation extracted from the canvas
#[derive(Debug, Clone)]
pub struct Message {
    pub from_idx: usize,
    pub to_idx: usize,
    pub label: String,
    pub color: Option<String>,
    pub textcolor: Option<String>,
    pub is_dashed: bool,
    pub left_arrow: ArrowType,
    pub right_arrow: ArrowType,
}

pub struct SequenceLayoutEngine;

impl SequenceLayoutEngine {
    pub fn new() -> Self {
        Self
    }

    /// Renders a GraphCanvas into a standalone, modern SVG sequence diagram
    pub fn render_svg(&self, canvas: &GraphCanvas) -> String {
        let (participants, messages) = self.extract_model(canvas);

        if participants.is_empty() {
            return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 120\" width=\"100%\" height=\"120\">\n  <text x=\"200\" y=\"60\" text-anchor=\"middle\" fill=\"#94a3b8\" font-family=\"sans-serif\" font-size=\"14\">No participants defined in diagram</text>\n</svg>".to_string();
        }

        // Layout constants
        let margin_x = 48.0;
        let top_padding = 24.0;
        let header_height = 42.0;
        let header_bottom = top_padding + header_height;
        let step_height = 54.0;
        let self_step_height = 68.0;

        // Calculate participant box widths and centers
        let mut box_widths: Vec<f64> = Vec::new();
        for p in &participants {
            let label_len = p.label.chars().count();
            let estimated_width = (label_len as f64 * 8.5 + 36.0).max(110.0);
            box_widths.push(estimated_width);
        }

        // Distribute lifelines along X
        let mut center_xs: Vec<f64> = Vec::new();
        let mut current_x = margin_x;
        for (i, w) in box_widths.iter().enumerate() {
            if i == 0 {
                current_x += w / 2.0;
            } else {
                let prev_w = box_widths[i - 1];
                let gap = (prev_w / 2.0 + w / 2.0 + 44.0).max(150.0);
                current_x += gap;
            }
            center_xs.push(current_x);
        }

        let total_width = (center_xs.last().unwrap() + box_widths.last().unwrap() / 2.0 + margin_x).max(420.0);

        // Calculate Y positions for messages
        let mut message_ys: Vec<(f64, bool)> = Vec::new();
        let mut cur_y = header_bottom + 36.0;
        for msg in &messages {
            let is_self = msg.from_idx == msg.to_idx;
            message_ys.push((cur_y, is_self));
            if is_self {
                cur_y += self_step_height;
            } else {
                cur_y += step_height;
            }
        }

        let footer_top = (cur_y + 16.0).max(header_bottom + 100.0);
        let footer_bottom = footer_top + header_height;
        let total_height = footer_bottom + top_padding;

        // Build SVG
        let mut svg = String::with_capacity(4096);
        svg.push_str(&format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {:.1} {:.1}" width="100%" height="{:.1}" class="diagrammer-sequence">"#,
            total_width, total_height, total_height
        ));
        svg.push('\n');

        // Styles and Defs
        svg.push_str(r##"  <defs>
    <filter id="ds-shadow" x="-8%" y="-12%" width="120%" height="135%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="ds-part-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <marker id="ds-arrow-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="currentColor"/>
    </marker>
    <marker id="ds-arrow-left" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill="currentColor"/>
    </marker>
    <marker id="ds-arrow-open-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 1 2 L 8 5 L 1 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <style>
    .diagrammer-sequence {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }
    .ds-lifeline {
      stroke: #475569;
      stroke-width: 1.5;
      stroke-dasharray: 4 4;
      opacity: 0.65;
    }
    .ds-activation {
      fill: #1e293b;
      stroke: #38bdf8;
      stroke-width: 1.5;
      rx: 3px;
      ry: 3px;
    }
    .ds-note-box {
      fill: #1e293b;
      stroke: #f59e0b;
      stroke-width: 1.5;
      filter: url(#ds-shadow);
    }
    .ds-note-text {
      font-size: 11px;
      fill: #fef3c7;
      dominant-baseline: central;
      text-anchor: middle;
    }
    .ds-box {
      rx: 8px;
      ry: 8px;
      stroke-width: 1.5;
      filter: url(#ds-shadow);
    }
    .ds-part-text {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2px;
      dominant-baseline: central;
      text-anchor: middle;
    }
    .ds-msg-line {
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .ds-msg-label {
      font-size: 12px;
      font-weight: 500;
      dominant-baseline: central;
      text-anchor: middle;
    }
    .ds-pill-bg {
      rx: 5px;
      ry: 5px;
      opacity: 0.88;
    }
  </style>
"##);

        // 1. Draw lifelines
        svg.push_str("  <!-- Lifelines -->\n  <g class=\"ds-lifelines-group\">\n");
        for cx in &center_xs {
            svg.push_str(&format!(
                r#"    <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" class="ds-lifeline" />"#,
                cx, header_bottom, cx, footer_top
            ));
            svg.push('\n');
        }
        svg.push_str("  </g>\n\n");

        // 2. Draw messages
        svg.push_str("  <!-- Messages -->\n  <g class=\"ds-messages-group\">\n");
        for (i, msg) in messages.iter().enumerate() {
            let (y, is_self) = message_ys[i];
            let color = msg.color.as_deref().unwrap_or("#60a5fa");
            let text_color = msg.textcolor.as_deref().unwrap_or("#f1f5f9");
            let stroke_dash = if msg.is_dashed { r#" stroke-dasharray="5 4""# } else { "" };

            if is_self {
                let x = center_xs[msg.from_idx];
                let loop_w = 42.0;
                let loop_h = 24.0;
                let label_escaped = escape_xml(&msg.label);

                svg.push_str(&format!(
                    r#"    <g color="{color}">
      <path d="M {:.1} {:.1} C {:.1} {:.1}, {:.1} {:.1}, {:.1} {:.1}" fill="none" stroke="{color}" class="ds-msg-line"{stroke_dash} marker-end="url(#ds-arrow-right)" />"#,
                    x, y,
                    x + loop_w, y - 4.0,
                    x + loop_w, y + loop_h + 4.0,
                    x, y + loop_h
                ));
                svg.push('\n');

                if !msg.label.is_empty() {
                    let label_x = x + loop_w + 10.0;
                    let label_y = y + loop_h / 2.0;
                    let est_w = msg.label.chars().count() as f64 * 7.2 + 12.0;
                    svg.push_str(&format!(
                        r##"      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="18" fill="#0f172a" class="ds-pill-bg" />
      <text x="{:.1}" y="{:.1}" fill="{text_color}" class="ds-msg-label" text-anchor="start">{label_escaped}</text>
    </g>
"##,
                        label_x - 4.0, label_y - 9.0, est_w,
                        label_x, label_y
                    ));
                } else {
                    svg.push_str("    </g>\n");
                }
            } else {
                let x1 = center_xs[msg.from_idx];
                let x2 = center_xs[msg.to_idx];
                let going_right = x2 > x1;
                let offset = 4.0;
                let line_x1 = if going_right { x1 + offset } else { x1 - offset };
                let line_x2 = if going_right { x2 - offset } else { x2 + offset };

                let marker_end = if going_right {
                    if msg.right_arrow != ArrowType::None {
                        if msg.is_dashed { " marker-end=\"url(#ds-arrow-open-right)\"" } else { " marker-end=\"url(#ds-arrow-right)\"" }
                    } else { "" }
                } else {
                    if msg.right_arrow != ArrowType::None {
                        if msg.is_dashed { " marker-end=\"url(#ds-arrow-open-right)\"" } else { " marker-end=\"url(#ds-arrow-right)\"" }
                    } else { "" }
                };

                let marker_start = if msg.left_arrow != ArrowType::None {
                    " marker-start=\"url(#ds-arrow-left)\""
                } else {
                    ""
                };

                svg.push_str(&format!(
                    r#"    <g color="{color}">
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{color}" class="ds-msg-line"{stroke_dash}{marker_start}{marker_end} />"#,
                    line_x1, y, line_x2, y
                ));
                svg.push('\n');

                if !msg.label.is_empty() {
                    let mid_x = (x1 + x2) / 2.0;
                    let label_y = y - 11.0;
                    let est_w = (msg.label.chars().count() as f64 * 7.2 + 14.0).min((x2 - x1).abs() - 10.0).max(24.0);
                    let label_escaped = escape_xml(&msg.label);

                    svg.push_str(&format!(
                        r##"      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="18" fill="#0f172a" class="ds-pill-bg" />
      <text x="{:.1}" y="{:.1}" fill="{text_color}" class="ds-msg-label">{label_escaped}</text>
    </g>
"##,
                        mid_x - est_w / 2.0, label_y - 9.0, est_w,
                        mid_x, label_y
                    ));
                } else {
                    svg.push_str("    </g>\n");
                }
            }
        }
        svg.push_str("  </g>\n\n");

        // 3. Draw participant header and footer boxes
        svg.push_str("  <!-- Participants -->\n  <g class=\"ds-participants-group\">\n");
        for (i, p) in participants.iter().enumerate() {
            let cx = center_xs[i];
            let w = box_widths[i];
            let box_x = cx - w / 2.0;
            let border_color = p.color.as_deref().unwrap_or("#3b82f6");
            let text_color = p.textcolor.as_deref().unwrap_or("#f8fafc");
            let label_escaped = escape_xml(&p.label);

            // Top box
            svg.push_str(&format!(
                r#"    <!-- Participant: {} -->
    <g class="ds-part-node">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="url(#ds-part-grad)" stroke="{border_color}" class="ds-box" />
      <text x="{:.1}" y="{:.1}" fill="{text_color}" class="ds-part-text">{label_escaped}</text>
    </g>
"#,
                p.id, box_x, top_padding, w, header_height, cx, top_padding + header_height / 2.0
            ));

            // Bottom mirrored box
            svg.push_str(&format!(
                r#"    <g class="ds-part-node">
      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="url(#ds-part-grad)" stroke="{border_color}" class="ds-box" />
      <text x="{:.1}" y="{:.1}" fill="{text_color}" class="ds-part-text">{label_escaped}</text>
    </g>
"#,
                box_x, footer_top, w, header_height, cx, footer_top + header_height / 2.0
            ));
        }
        svg.push_str("  </g>\n</svg>\n");

        svg
    }

    /// Extracts participants and ordered messages from the GraphCanvas AST
    fn extract_model(&self, canvas: &GraphCanvas) -> (Vec<Participant>, Vec<Message>) {
        let group_names = canvas.get_group_names();
        let mut participants: Vec<Participant> = Vec::new();
        let mut part_indices: HashMap<String, usize> = HashMap::new();

        // 1. Collect explicitly defined vertices (recursively flattening groups)
        for obj in canvas.get_flattened_vertices() {
            let name = obj.get_name().to_string();
            if !name.is_empty() && !part_indices.contains_key(&name) {
                let label = obj.get_label().unwrap_or(&name).to_string();
                part_indices.insert(name.clone(), participants.len());
                participants.push(Participant {
                    id: name,
                    label,
                    color: obj.get_color().map(|s| s.to_string()),
                    textcolor: obj.get_textcolor().map(|s| s.to_string()),
                });
            }
        }

        // 2. Discover edge participants not yet declared (ignoring group containers)
        for edge in canvas.get_edges() {
            if group_names.contains(&edge.left) || group_names.contains(&edge.right) {
                continue;
            }
            if !edge.left.is_empty() && !part_indices.contains_key(&edge.left) {
                let idx = participants.len();
                part_indices.insert(edge.left.clone(), idx);
                participants.push(Participant {
                    id: edge.left.clone(),
                    label: edge.left.clone(),
                    color: None,
                    textcolor: None,
                });
            }
            if !edge.right.is_empty() && !part_indices.contains_key(&edge.right) {
                let idx = participants.len();
                part_indices.insert(edge.right.clone(), idx);
                participants.push(Participant {
                    id: edge.right.clone(),
                    label: edge.right.clone(),
                    color: None,
                    textcolor: None,
                });
            }
        }

        // 3. Extract vertex-to-vertex messages (ignoring group-to-group / group-to-node links)
        let mut messages: Vec<Message> = Vec::new();
        for edge in canvas.get_edges() {
            if group_names.contains(&edge.left) || group_names.contains(&edge.right) {
                continue;
            }
            if let (Some(&from_idx), Some(&to_idx)) = (part_indices.get(&edge.left), part_indices.get(&edge.right)) {
                let is_dashed = edge.line_type() == "dashed" || edge.line_type() == "dotted";
                messages.push(Message {
                    from_idx,
                    to_idx,
                    label: edge.label.clone().unwrap_or_default(),
                    color: edge.color.clone(),
                    textcolor: edge.textcolor.clone(),
                    is_dashed,
                    left_arrow: edge.left_arrow_type(),
                    right_arrow: edge.right_arrow_type(),
                });
            }
        }

        (participants, messages)
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::builder::AstBuilder;

    #[test]
    fn test_sequence_layout_svg_output() {
        let input = "Client > \"SYN\" Server\nServer > \"SYN-ACK\" Client\nClient > \"ACK\" Server";
        let canvas = AstBuilder::new().build(input).expect("Failed to build AST");
        let engine = SequenceLayoutEngine::new();
        let svg = engine.render_svg(&canvas);

        assert!(svg.starts_with("<svg"));
        assert!(svg.contains("Client"));
        assert!(svg.contains("Server"));
        assert!(svg.contains("SYN-ACK"));
        assert!(svg.contains("class=\"diagrammer-sequence\""));
    }

    #[test]
    fn test_sequence_self_call() {
        let input = "Worker > \"Processing\" Worker";
        let canvas = AstBuilder::new().build(input).expect("Failed to build AST");
        let engine = SequenceLayoutEngine::new();
        let svg = engine.render_svg(&canvas);

        assert!(svg.contains("Processing"));
        assert!(svg.contains("Worker"));
        assert!(svg.contains("ds-msg-line"));
    }
}
