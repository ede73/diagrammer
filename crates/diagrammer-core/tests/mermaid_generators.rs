use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::fs;
use std::path::Path;

#[test]
fn test_all_mermaid_generators_against_sample_inputs() {
    let generators = [
        "mermaid_flowchart",
        "mermaid_state",
        "mermaid_sequence",
        "mermaid_class",
        "mermaid_mindmap",
        "mermaid_er",
    ];

    let test_inputs = [
        "ast.txt",
        "umlclass.txt",
        "umlclass_types.txt",
        "state.txt",
        "state_tcp.txt",
        "dendrogram.txt",
        "landscape.txt",
        "two_linked_clusters.txt",
        "state_conditionals.txt",
        "state_innergroups.txt",
    ];

    for gen_name in &generators {
        let generator = make_generator(gen_name)
            .unwrap_or_else(|| panic!("Failed to create generator: {}", gen_name));

        for input_name in &test_inputs {
            let input_path = format!("../../tests/test_inputs/{}", input_name);
            let fallback_path = format!("tests/test_inputs/{}", input_name);
            let path = if Path::new(&input_path).exists() {
                input_path
            } else if Path::new(&fallback_path).exists() {
                fallback_path
            } else {
                continue;
            };

            let input_code = fs::read_to_string(&path)
                .unwrap_or_else(|e| panic!("Failed to read input {}: {}", path, e));

            let canvas = AstBuilder::new()
                .build(&input_code)
                .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", input_name, e));

            let output = generator.generate(&canvas);

            // Basic syntax invariant checks for each generator
            assert!(!output.trim().is_empty(), "Output should not be empty for {} on {}", gen_name, input_name);

            match *gen_name {
                "mermaid_flowchart" => {
                    assert!(output.starts_with("flowchart"), "Flowchart should start with flowchart header");
                }
                "mermaid_state" => {
                    assert!(output.starts_with("stateDiagram-v2"), "State diagram should start with stateDiagram-v2");
                }
                "mermaid_sequence" => {
                    assert!(output.starts_with("sequenceDiagram"), "Sequence diagram should start with sequenceDiagram");
                    // Ensure no unescaped reserved keywords like "end" or "link" used as bare actors
                    for line in output.lines() {
                        if line.trim().starts_with("participant ") {
                            let actor = line.trim().trim_start_matches("participant ").split_whitespace().next().unwrap_or("");
                            assert_ne!(actor, "end", "Actor id 'end' must be sanitized in sequence diagram");
                            assert_ne!(actor, "link", "Actor id 'link' must be sanitized in sequence diagram");
                        }
                    }
                }
                "mermaid_class" => {
                    assert!(output.starts_with("classDiagram"), "Class diagram should start with classDiagram");
                    // Ensure class names do not use bare single letter 'o' (Mermaid aggregation token)
                    for line in output.lines() {
                        let trimmed = line.trim();
                        if trimmed.starts_with("class ") {
                            let c_name = trimmed.trim_start_matches("class ").split_whitespace().next().unwrap_or("");
                            assert_ne!(c_name, "o", "Class name 'o' must be sanitized to avoid aggregation conflict");
                        }
                    }
                }
                "mermaid_mindmap" => {
                    assert!(output.starts_with("mindmap"), "Mindmap should start with mindmap header");
                }
                "mermaid_er" => {
                    assert!(output.starts_with("erDiagram"), "ER diagram should start with erDiagram");
                    // Ensure no attribute lines start with '#' (e.g. unquoted color strings)
                    for line in output.lines() {
                        let trimmed = line.trim();
                        if !trimmed.is_empty() && !trimmed.starts_with("erDiagram") && !trimmed.contains("||") && !trimmed.contains("}|") && !trimmed.contains('{') && !trimmed.contains('}') {
                            assert!(!trimmed.starts_with('#'), "ER attribute line must not start with '#': {}", trimmed);
                        }
                    }
                }
                _ => {}
            }
        }
    }
}

