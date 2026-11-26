use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::layered::LayeredGraph;

pub struct LayeredGenerator;

impl Generator for LayeredGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let is_swimlane = canvas.visualizer.as_deref().map(|v| v.eq_ignore_ascii_case("swimlane")).unwrap_or(false)
            || canvas.layout.as_ref().map_or(false, |l| {
                l.get("swimlane").is_some() || l.get("mode").map_or(false, |m| m.eq_ignore_ascii_case("swimlane"))
            });
        if is_swimlane {
            return crate::layout::swimlane::SwimlaneGraph::build(canvas).render_svg();
        }
        let visualizer_hint = canvas.visualizer.as_deref().or_else(|| {
            canvas.layout.as_ref().and_then(|l| l.engine.as_deref())
        });
        LayeredGraph::build(canvas).render_svg_with_styler(visualizer_hint)
    }
}
