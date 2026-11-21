use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::swimlane::SwimlaneGraph;

pub struct SwimlaneGenerator;

impl Generator for SwimlaneGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        SwimlaneGraph::build(canvas).render_svg()
    }
}

