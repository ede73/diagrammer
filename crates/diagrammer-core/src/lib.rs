pub mod ast;

use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "diagrammer.pest"]
pub struct DiagrammerParser;

#[cfg(test)]
mod tests {
    use super::*;
    use pest::Parser;

    #[test]
    fn test_parse_simple_edge() {
        let result = DiagrammerParser::parse(Rule::diagram, "a > b");
        assert!(result.is_ok(), "Failed to parse 'a > b': {:?}", result.err());
    }

    #[test]
    fn test_parse_shape_and_color() {
        let input = "shape cloud\nvertex color #ff0000";
        let result = DiagrammerParser::parse(Rule::diagram, input);
        assert!(result.is_ok(), "Failed to parse: {:?}", result.err());
    }

    #[test]
    fn test_parse_chain_with_groups() {
        let input = "node > (a, b, c)";
        let result = DiagrammerParser::parse(Rule::diagram, input);
        assert!(result.is_ok(), "Failed to parse: {:?}", result.err());
    }

    #[test]
    fn test_parse_reverse_chain() {
        let input = "(a, b, c) > node";
        let result = DiagrammerParser::parse(Rule::diagram, input);
        assert!(result.is_ok(), "Failed to parse: {:?}", result.err());
    }

    #[test]
    fn test_parse_group_block() {
        let input = "{\n  router web01 web02\n}";
        let result = DiagrammerParser::parse(Rule::diagram, input);
        assert!(result.is_ok(), "Failed to parse: {:?}", result.err());
    }

    #[test]
    fn test_parse_complex_labeled_chain() {
        let input = "dashed rect a #ff0000 ;dashed red rectangle\nnode > linkedtoanothernode;AndEdgeLabel";
        let result = DiagrammerParser::parse(Rule::diagram, input);
        assert!(result.is_ok(), "Failed to parse: {:?}", result.err());
    }
}
