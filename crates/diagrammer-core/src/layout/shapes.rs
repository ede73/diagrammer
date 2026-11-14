//! Common vector SVG shape, style, and icon rendering for native Diagrammer layout engines.

use crate::layout::layered::escape_xml;

/// Renders a full vector SVG node element according to shape, stroke style, and icon.
pub fn render_svg_node(
    id: &str,
    label: &str,
    shape: &str,
    style: Option<&str>,
    image: Option<&str>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    fill_color: &str,
    text_color: &str,
    stroke_color: &str,
    shadow_filter: Option<&str>,
    custom_shapes: Option<&crate::ast::TypeRegistry>,
    out: &mut String,
) {
    let shadow_attr = shadow_filter
        .map(|s| format!(r#" filter="{}""#, s))
        .unwrap_or_default();

    let is_bold = style.map(|s| s.contains("bold")).unwrap_or(false);
    let is_dashed = style.map(|s| s.contains("dashed")).unwrap_or(false);
    let is_dotted = style.map(|s| s.contains("dotted")).unwrap_or(false);
    let is_invis = style.map(|s| s.contains("invis")).unwrap_or(false);

    let stroke_width = if is_bold { "3.0" } else { "1.5" };
    let font_weight = if is_bold { "font-weight: 700; " } else { "" };

    let dash_attr = if is_dashed {
        r#" stroke-dasharray="6,4""#
    } else if is_dotted {
        r#" stroke-dasharray="2,3""#
    } else {
        ""
    };

    let invis_attr = if is_invis {
        r#" opacity="0""#
    } else {
        ""
    };

    let cx = x + width / 2.0;
    let cy = y + height / 2.0;
    let w = width;
    let h = height;

    out.push_str(&format!(
        r##"    <g class="dl-node" id="node-{}"{}{}>
"##,
        escape_xml(id),
        shadow_attr,
        invis_attr
    ));

    // Render underlying SVG geometric shape (custom template or built-in shape)
    if let Some(template) = custom_shapes.and_then(|reg| reg.get_shape(shape)) {
        let tw = template.width.unwrap_or(w);
        let th = template.height.unwrap_or(h);
        match &template.body {
            crate::ast::NodeShapeBody::Svg(raw_svg) => {
                render_custom_svg_template(
                    raw_svg,
                    x,
                    y,
                    w,
                    h,
                    tw,
                    th,
                    fill_color,
                    stroke_color,
                    stroke_width,
                    dash_attr,
                    out,
                );
            }
            crate::ast::NodeShapeBody::Primitives(primitives) => {
                render_custom_primitives_template(
                    primitives,
                    x,
                    y,
                    w,
                    h,
                    tw,
                    th,
                    fill_color,
                    stroke_color,
                    stroke_width,
                    dash_attr,
                    out,
                );
            }
        }
    } else {
        match shape {
        "circle" => {
            let r = (w.min(h) / 2.0).max(18.0);
            out.push_str(&format!(
                r##"      <circle cx="{:.1}" cy="{:.1}" r="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                cx, cy, r, fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "doublecircle" => {
            let r = (w.min(h) / 2.0).max(18.0);
            let inner_r = (r - 4.0).max(12.0);
            out.push_str(&format!(
                r##"      <circle cx="{:.1}" cy="{:.1}" r="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
      <circle cx="{:.1}" cy="{:.1}" r="{:.1}" fill="none" stroke="{}" stroke-width="{}"{} />
"##,
                cx, cy, r, fill_color, stroke_color, stroke_width, dash_attr,
                cx, cy, inner_r, stroke_color, stroke_width, dash_attr
            ));
        }
        "ellipse" => {
            let rx = (w / 2.0).max(20.0);
            let ry = (h / 2.0).max(16.0);
            out.push_str(&format!(
                r##"      <ellipse cx="{:.1}" cy="{:.1}" rx="{:.1}" ry="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                cx, cy, rx, ry, fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "diamond" | "condition" => {
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                cx, y, x + w, cy, cx, y + h, x, cy,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "database" => {
            let ry = 7.0;
            out.push_str(&format!(
                r##"      <path d="M {:.1} {:.1} L {:.1} {:.1} A {:.1} {:.1} 0 0 0 {:.1} {:.1} L {:.1} {:.1} Z" fill="{}" stroke="{}" stroke-width="{}"{} />
      <ellipse cx="{:.1}" cy="{:.1}" rx="{:.1}" ry="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y + ry, x, y + h - ry, w / 2.0, ry, x + w, y + h - ry, x + w, y + ry,
                fill_color, stroke_color, stroke_width, dash_attr,
                cx, y + ry, w / 2.0, ry,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "document" => {
            let fold = 12.0;
            out.push_str(&format!(
                r##"      <path d="M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} Z" fill="{}" stroke="{}" stroke-width="{}"{} />
      <polyline points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="none" stroke="{}" stroke-width="{}" />
"##,
                x, y, x + w, y, x + w, y + h - fold, x + w - fold, y + h, x, y + h,
                fill_color, stroke_color, stroke_width, dash_attr,
                x + w, y + h - fold, x + w - fold, y + h - fold, x + w - fold, y + h,
                stroke_color, stroke_width
            ));
        }
        "note" => {
            let fold = 12.0;
            out.push_str(&format!(
                r##"      <path d="M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} Z" fill="{}" stroke="{}" stroke-width="{}"{} />
      <polyline points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="none" stroke="{}" stroke-width="{}" />
"##,
                x, y, x + w - fold, y, x + w, y + fold, x + w, y + h, x, y + h,
                fill_color, stroke_color, stroke_width, dash_attr,
                x + w - fold, y, x + w - fold, y + fold, x + w, y + fold,
                stroke_color, stroke_width
            ));
        }
        "folder" | "mail" => {
            let tab_w = (w * 0.4).min(40.0);
            let tab_h = 7.0;
            out.push_str(&format!(
                r##"      <path d="M {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} L {:.1} {:.1} Z" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y + tab_h, x + tab_w, y + tab_h, x + tab_w + 6.0, y, x + w, y, x + w, y + h, x, y + h,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "cloud" => {
            // Octagonal cloud boundary with soft geometry
            let off = 10.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x + off, y, x + w - off, y, x + w, y + off, x + w, y + h - off,
                x + w - off, y + h, x + off, y + h, x, y + h - off, x, y + off,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "input" => {
            let skew = 14.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x + skew, y, x + w, y, x + w - skew, y + h, x, y + h,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "left" => {
            let tip = 14.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x + tip, y, x + w, y, x + w, y + h, x + tip, y + h, x, cy,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "right" | "actor" => {
            let tip = 14.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, x + w - tip, y, x + w, cy, x + w - tip, y + h, x, y + h,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "loop" => {
            let off = 14.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, x + w, y, x + w - off, y + h, x + off, y + h,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "loopin" => {
            let tip = 12.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                cx, y, x + w, y + tip, x + w, y + h, x, y + h, x, y + tip,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "loopout" => {
            let tip = 12.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, x + w, y, x + w, y + h - tip, cx, y + h, x, y + h - tip,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "preparation" => {
            let off = 14.0;
            out.push_str(&format!(
                r##"      <polygon points="{:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1} {:.1},{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x + off, y, x + w - off, y, x + w, cy, x + w - off, y + h, x + off, y + h, x, cy,
                fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        "subroutine" => {
            let inset = 8.0;
            out.push_str(&format!(
                r##"      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="{}"{} />
      <line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, w, h, fill_color, stroke_color, stroke_width, dash_attr,
                x + inset, y, x + inset, y + h, stroke_color, stroke_width, dash_attr,
                x + w - inset, y, x + w - inset, y + h, stroke_color, stroke_width, dash_attr
            ));
        }
        "dots" => {
            out.push_str(&format!(
                r##"      <circle cx="{:.1}" cy="{:.1}" r="3.5" fill="{}" />
"##,
                cx, cy, stroke_color
            ));
        }
        "rect" | "box" | "square" => {
            out.push_str(&format!(
                r##"      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, w, h, fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
        // "rounded", "roundedbox", "beginpoint", "endpoint", default
        _ => {
            let rx = if shape == "beginpoint" || shape == "endpoint" { 20.0 } else { 8.0 };
            out.push_str(&format!(
                r##"      <rect x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" rx="{:.1}" ry="{:.1}" fill="{}" stroke="{}" stroke-width="{}"{} />
"##,
                x, y, w, h, rx, rx, fill_color, stroke_color, stroke_width, dash_attr
            ));
        }
    }
    }

    // Render node image / icon if present
    if let Some(img_path) = image {
        let clean_name = img_path
            .trim_start_matches('/')
            .trim_start_matches("icons/")
            .trim_start_matches("web/icons/");

        let href = format!("web/icons/{}", clean_name);
        let icon_size = 28.0;

        let (icon_x, icon_y, text_y) = if label.is_empty() || label == id {
            (cx - icon_size / 2.0, cy - icon_size / 2.0, cy + 18.0)
        } else {
            (cx - icon_size / 2.0, y + 4.0, y + icon_size + 14.0)
        };

        out.push_str(&format!(
            r##"      <image href="{}" x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" preserveAspectRatio="xMidYMid meet" />
"##,
            escape_xml(&href), icon_x, icon_y, icon_size, icon_size
        ));

        if !label.is_empty() && label != id {
            out.push_str(&format!(
                r##"      <text x="{:.1}" y="{:.1}" class="dl-node-label" fill="{}" style="{}text-anchor: middle;">{}</text>
"##,
                cx, text_y, text_color, font_weight, escape_xml(label)
            ));
        }
    } else if shape != "dots" {
        out.push_str(&format!(
            r##"      <text x="{:.1}" y="{:.1}" class="dl-node-label" fill="{}" style="{}text-anchor: middle; dominant-baseline: central;">{}</text>
"##,
            cx, cy, text_color, font_weight, escape_xml(label)
        ));
    }

    out.push_str("    </g>\n");
}

fn render_custom_svg_template(
    raw_svg: &str,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    tw: f64,
    th: f64,
    fill_color: &str,
    stroke_color: &str,
    stroke_width: &str,
    dash_attr: &str,
    out: &mut String,
) {
    let trimmed = raw_svg.trim();
    let (viewbox, inner_content) = if let Some(start_idx) = trimmed.to_lowercase().find("<svg") {
        if let Some(tag_end) = trimmed[start_idx..].find('>') {
            let open_tag = &trimmed[start_idx..start_idx + tag_end];
            let after_open = &trimmed[start_idx + tag_end + 1..];
            let content = if let Some(close_idx) = after_open.to_lowercase().rfind("</svg>") {
                &after_open[..close_idx]
            } else {
                after_open
            };
            let vb = if let Some(vb_idx) = open_tag.to_lowercase().find("viewbox") {
                let rest = open_tag[vb_idx + 7..].trim_start();
                if let Some(eq_idx) = rest.find('=') {
                    let after_eq = rest[eq_idx + 1..].trim();
                    let quote_char = after_eq.chars().next().unwrap_or('"');
                    if quote_char == '"' || quote_char == '\'' {
                        let val = &after_eq[1..];
                        if let Some(end_q) = val.find(quote_char) {
                            Some(val[..end_q].to_string())
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };
            (vb.unwrap_or_else(|| format!("0 0 {:.1} {:.1}", tw, th)), content.trim())
        } else {
            (format!("0 0 {:.1} {:.1}", tw, th), trimmed)
        }
    } else {
        (format!("0 0 {:.1} {:.1}", tw, th), trimmed)
    };

    out.push_str(&format!(
        r##"      <svg x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" viewBox="{}">
        <g fill="{}" stroke="{}" stroke-width="{}"{}>
          {}
        </g>
      </svg>
"##,
        x, y, w, h, viewbox, fill_color, stroke_color, stroke_width, dash_attr, inner_content
    ));
}

fn render_custom_primitives_template(
    primitives: &[crate::ast::GeometryPrimitive],
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    tw: f64,
    th: f64,
    fill_color: &str,
    stroke_color: &str,
    stroke_width: &str,
    dash_attr: &str,
    out: &mut String,
) {
    out.push_str(&format!(
        r##"      <svg x="{:.1}" y="{:.1}" width="{:.1}" height="{:.1}" viewBox="0 0 {:.1} {:.1}">
        <g fill="{}" stroke="{}" stroke-width="{}"{}>
"##,
        x, y, w, h, tw, th, fill_color, stroke_color, stroke_width, dash_attr
    ));

    for prim in primitives {
        let p_fill = prim.attributes.get("fill").map(|s| s.as_str());
        let p_stroke = prim.attributes.get("stroke").map(|s| s.as_str());
        let p_sw = prim.attributes.get("stroke-width").map(|s| s.as_str());

        let fill_attr = p_fill.map(|f| format!(r#" fill="{}""#, f)).unwrap_or_default();
        let stroke_attr = p_stroke.map(|s| format!(r#" stroke="{}""#, s)).unwrap_or_default();
        let sw_attr = p_sw.map(|sw| format!(r#" stroke-width="{}""#, sw)).unwrap_or_default();

        match prim.kind.as_str() {
            "rectangle" | "rect" => {
                let px = prim.attributes.get("x").map(|s| s.as_str()).unwrap_or("0");
                let py = prim.attributes.get("y").map(|s| s.as_str()).unwrap_or("0");
                let pw = prim.attributes.get("w").or_else(|| prim.attributes.get("width")).map(|s| s.as_str()).unwrap_or("100%");
                let ph = prim.attributes.get("h").or_else(|| prim.attributes.get("height")).map(|s| s.as_str()).unwrap_or("100%");
                let rx_attr = prim.attributes.get("rx").map(|v| format!(r#" rx="{}""#, v)).unwrap_or_default();
                let ry_attr = prim.attributes.get("ry").or_else(|| prim.attributes.get("rx")).map(|v| format!(r#" ry="{}""#, v)).unwrap_or_default();
                out.push_str(&format!(
                    r##"          <rect x="{}" y="{}" width="{}" height="{}"{}{}{}{}{} />
"##,
                    px, py, pw, ph, rx_attr, ry_attr, fill_attr, stroke_attr, sw_attr
                ));
            }
            "circle" => {
                let cx = prim.attributes.get("cx").map(|s| s.as_str()).unwrap_or("0");
                let cy = prim.attributes.get("cy").map(|s| s.as_str()).unwrap_or("0");
                let r = prim.attributes.get("r").or_else(|| prim.attributes.get("radius")).map(|s| s.as_str()).unwrap_or("10");
                out.push_str(&format!(
                    r##"          <circle cx="{}" cy="{}" r="{}"{}{}{} />
"##,
                    cx, cy, r, fill_attr, stroke_attr, sw_attr
                ));
            }
            "ellipse" => {
                let cx = prim.attributes.get("cx").map(|s| s.as_str()).unwrap_or("0");
                let cy = prim.attributes.get("cy").map(|s| s.as_str()).unwrap_or("0");
                let rx = prim.attributes.get("rx").map(|s| s.as_str()).unwrap_or("10");
                let ry = prim.attributes.get("ry").map(|s| s.as_str()).unwrap_or("10");
                out.push_str(&format!(
                    r##"          <ellipse cx="{}" cy="{}" rx="{}" ry="{}"{}{}{} />
"##,
                    cx, cy, rx, ry, fill_attr, stroke_attr, sw_attr
                ));
            }
            "polygon" => {
                let pts = prim.attributes.get("points").map(|s| s.as_str()).unwrap_or("");
                out.push_str(&format!(
                    r##"          <polygon points="{}"{}{}{} />
"##,
                    pts, fill_attr, stroke_attr, sw_attr
                ));
            }
            "polyline" => {
                let pts = prim.attributes.get("points").map(|s| s.as_str()).unwrap_or("");
                let default_fill = if fill_attr.is_empty() { r#" fill="none""# } else { &fill_attr };
                out.push_str(&format!(
                    r##"          <polyline points="{}"{}{}{} />
"##,
                    pts, default_fill, stroke_attr, sw_attr
                ));
            }
            "line" => {
                let x1 = prim.attributes.get("x1").map(|s| s.as_str()).unwrap_or("0");
                let y1 = prim.attributes.get("y1").map(|s| s.as_str()).unwrap_or("0");
                let x2 = prim.attributes.get("x2").map(|s| s.as_str()).unwrap_or("0");
                let y2 = prim.attributes.get("y2").map(|s| s.as_str()).unwrap_or("0");
                out.push_str(&format!(
                    r##"          <line x1="{}" y1="{}" x2="{}" y2="{}"{}{}{} />
"##,
                    x1, y1, x2, y2, fill_attr, stroke_attr, sw_attr
                ));
            }
            "path" => {
                let d = prim.attributes.get("d").map(|s| s.as_str()).unwrap_or("");
                out.push_str(&format!(
                    r##"          <path d="{}"{}{}{} />
"##,
                    d, fill_attr, stroke_attr, sw_attr
                ));
            }
            _ => {}
        }
    }

    out.push_str("        </g>\n      </svg>\n");
}

