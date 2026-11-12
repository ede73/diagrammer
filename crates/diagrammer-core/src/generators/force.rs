use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::force::ForceGraph;

pub struct ForceGenerator;

impl Generator for ForceGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        ForceGraph::build(canvas).render_svg()
    }
}
