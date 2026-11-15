use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::state::StateGraph;

pub struct StateGenerator;

impl Generator for StateGenerator {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        StateGraph::new(canvas).render_svg()
    }
}
