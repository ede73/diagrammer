use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::layered::LayeredGraph;

pub struct LayeredGenerator;

impl Generator for LayeredGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        LayeredGraph::build(canvas).render_svg()
    }
}
