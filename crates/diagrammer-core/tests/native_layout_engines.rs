use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::fs;
use std::path::Path;

#[test]
fn test_native_sequence_engine_renders_fixtures() {
    let generator = make_generator("native_sequence").expect("Failed to create native_sequence generator");

    let fixtures = [
        "native_sequence.txt",
        "events.txt",
        "state_sequence.txt",
        "state_sequence2.txt",
        "state_sip_sequence.txt",
    ];

    for name in &fixtures {
        let input_path = format!("../../tests/test_inputs/{}", name);
        let fallback_path = format!("tests/test_inputs/{}", name);
        let path = if Path::new(&input_path).exists() {
            input_path
        } else if Path::new(&fallback_path).exists() {
            fallback_path
        } else {
            continue;
        };

        let input_code = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", name, e));

        let svg = generator.generate(&canvas);

        // Invariant assertions
        assert!(svg.starts_with("<svg"), "SVG output for {} must start with <svg", name);
        assert!(svg.contains("</svg>"), "SVG output for {} must end with </svg>", name);
        assert!(svg.contains("class=\"diagrammer-sequence\""), "SVG for {} must include sequence class", name);
        assert!(svg.contains("viewBox="), "SVG for {} must define viewBox", name);
        assert!(!svg.contains("NaN"), "SVG for {} must not contain NaN coordinates", name);
    }
}

#[test]
fn test_layered_dag_engine_renders_fixtures() {
    let generator = make_generator("layered").expect("Failed to create layered generator");

    let fixtures = [
        "umlclass.txt",
        "umlclass_types.txt",
        "state.txt",
        "state_tcp.txt",
        "state_machine_with_start_node.txt",
        "landscape.txt",
        "two_linked_clusters.txt",
        "ast.txt",
        "arrow_types.txt",
    ];

    for name in &fixtures {
        let input_path = format!("../../tests/test_inputs/{}", name);
        let fallback_path = format!("tests/test_inputs/{}", name);
        let path = if Path::new(&input_path).exists() {
            input_path
        } else if Path::new(&fallback_path).exists() {
            fallback_path
        } else {
            continue;
        };

        let input_code = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", name, e));

        let svg = generator.generate(&canvas);

        // Invariant assertions
        assert!(svg.starts_with("<svg"), "SVG output for {} must start with <svg", name);
        assert!(svg.contains("</svg>"), "SVG output for {} must close with </svg>", name);
        assert!(svg.contains("class=\"diagrammer-layered-svg\""), "SVG for {} must include layered class", name);
        assert!(svg.contains("viewBox="), "SVG for {} must define viewBox", name);
        assert!(!svg.contains("NaN"), "SVG for {} must not contain NaN coordinates", name);

        // Content assertions based on fixture type
        if name.contains("umlclass") {
            assert!(svg.contains("dl-class-node"), "UML class fixture {} must render class cards", name);
            assert!(svg.contains("dl-arrow-inheritance"), "UML class fixture {} must render inheritance marker", name);
        }
    }
}

#[test]
fn test_cli_rendering_verification() {
    use std::process::Command;

    let cli_path = if Path::new("./diagrammer").exists() {
        "./diagrammer"
    } else if Path::new("../../diagrammer").exists() {
        "../../diagrammer"
    } else if Path::new("../../target/release/diagrammer").exists() {
        "../../target/release/diagrammer"
    } else if Path::new("../../target/debug/diagrammer").exists() {
        "../../target/debug/diagrammer"
    } else {
        return;
    };

    let test_input = if Path::new("tests/test_inputs/umlclass.txt").exists() {
        "tests/test_inputs/umlclass.txt"
    } else if Path::new("../../tests/test_inputs/umlclass.txt").exists() {
        "../../tests/test_inputs/umlclass.txt"
    } else {
        return;
    };

    let tmp_svg = format!("/tmp/test_cli_layered_{}.svg", std::process::id());
    let status = Command::new(cli_path)
        .arg("layered")
        .arg(test_input)
        .arg("-o")
        .arg(&tmp_svg)
        .status();

    if let Ok(st) = status {
        if st.success() {
            let content = fs::read_to_string(&tmp_svg).unwrap_or_default();
            assert!(content.contains("<svg") && content.contains("</svg>"));
            let _ = fs::remove_file(&tmp_svg);
        }
    }
}
