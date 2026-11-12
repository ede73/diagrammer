use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::layered::LayeredGraph;

pub struct LayeredGenerator;

impl Generator for LayeredGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let visualizer_hint = canvas.visualizer.as_deref().or_else(|| {
            canvas.layout.as_ref().and_then(|l| l.engine.as_deref())
        });
        LayeredGraph::build(canvas).render_svg_with_styler(visualizer_hint)
    }
}
