pub mod ast;
pub mod builder;
pub mod generators;
pub mod layout;

use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "diagrammer.pest"]
pub struct DiagrammerParser;

use wasm_bindgen::prelude::*;

pub fn parse_and_generate(input: &str, visualizer: &str) -> Result<String, String> {
    let trimmed = input.trim_start();
    let canvas = if trimmed.starts_with('{') && trimmed.contains("\"__PSEUDOTYPE\"") && trimmed.contains("\"GraphCanvas\"") {
        serde_json::from_str::<ast::GraphCanvas>(input)
            .map_err(|e| format!("Failed to parse AST JSON: {}", e))?
    } else {
        builder::AstBuilder::new().build(input)?
    };

    if visualizer == "ast" {
        serde_json::to_string(&canvas)
            .map_err(|e| format!("Serialization error: {}", e))
    } else if let Some(generator) = generators::make_generator(visualizer) {
        Ok(generator.generate(&canvas))
    } else {
        Err(format!("Unknown visualizer '{}'", visualizer))
    }
}

#[wasm_bindgen]
pub fn wasm_parse_and_generate(input: &str, visualizer: &str) -> Result<String, JsValue> {
    parse_and_generate(input, visualizer).map_err(|e| JsValue::from_str(&e))
}

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

    #[test]
    fn test_parse_color_group() {
        let content = std::fs::read_to_string("../../tests/test_inputs/flow_control.txt").unwrap();
        let builder = builder::AstBuilder::new();
        let canvas = builder.build(&content).unwrap();
        println!("flow_control objects len: {}", canvas.objects.len());
        for obj in &canvas.objects {
            match obj {
                ast::GraphObject::Group(g) => println!("  Group: {} (cond={:?}, label={:?})", g.name, g.conditional, g.label),
                ast::GraphObject::VertexRef { vertex } => println!("  Vertex: {}", vertex.name),
                ast::GraphObject::Edge { edge } => println!("  Edge: {} -> {}", edge.left, edge.right),
                _ => {}
            }
        }
    }

    #[test]
    fn test_build_ast() {
        let input = "a > b > c";
        let builder = builder::AstBuilder::new();
        let canvas = builder.build(input).expect("Failed to build AST");
        assert_eq!(canvas.root_vertices.len(), 1);
        assert_eq!(canvas.objects.len(), 5); // 3 vertices + 2 edges
    }
}
