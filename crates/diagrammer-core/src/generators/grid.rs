use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::grid::GridGraph;

pub struct GridGenerator;

impl Generator for GridGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        GridGraph::build(canvas).render_svg()
    }
}
