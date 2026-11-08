use super::Generator;
use crate::ast::GraphCanvas;
use crate::layout::sequence::SequenceLayoutEngine;

pub struct NativeSequence;

impl Generator for NativeSequence {
    fn generate(&self, canvas: &GraphCanvas) -> String {
        SequenceLayoutEngine::new().render_svg(canvas)
    }
}
