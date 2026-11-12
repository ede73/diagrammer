use super::{LayeredEdge, LayeredNode};

/// Trait defining visual presentation and node/edge styling rules for Layered DAG visualizer subtypes
pub trait LayeredStyler {
    /// Identifier name of the styler
    fn name(&self) -> &'static str;

    /// Renders a single node's vector SVG elements
    fn render_node(&self, node: &LayeredNode, default_node_fill: &str, out: &mut String);

    /// Renders an edge's label if present
    fn render_edge_label(&self, edge: &LayeredEdge, out: &mut String);
}
