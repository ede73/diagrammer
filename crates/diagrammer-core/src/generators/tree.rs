use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::tree::TreeGraph;

pub struct TreeGenerator;

impl Generator for TreeGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        let visualizer_hint = canvas.visualizer.as_deref().or_else(|| {
            canvas.layout.as_ref().and_then(|l| l.engine.as_deref())
        });
        TreeGraph::build(canvas, visualizer_hint).render_svg()
    }
}
