use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::fs;
use std::path::Path;

#[test]
fn test_nwdiag_generator_parity() {
    let generator = make_generator("nwdiag").expect("Failed to create nwdiag generator");

    let test_cases = [
        "nwdiag_multiple_ips",
        "nwdiag5",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/nwdiag/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            eprintln!("Skipping {} - file not found", case);
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for NWDiag fixture: {}",
            case
        );
    }
}

#[test]
fn test_blockdiag_generator_parity() {
    let generator = make_generator("blockdiag").expect("Failed to create blockdiag generator");

    let test_cases = [
        "group_group_link",
        "state_group",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/blockdiag/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            eprintln!("Skipping {} - file not found", case);
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for BlockDiag fixture: {}",
            case
        );
    }
}

#[test]
fn test_actdiag_generator_parity() {
    let generator = make_generator("actdiag").expect("Failed to create actdiag generator");

    let test_cases = [
        "group_group_link",
        "state_group",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/actdiag/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for ActDiag fixture: {}",
            case
        );
    }
}

#[test]
fn test_seqdiag_generator_parity() {
    let generator = make_generator("seqdiag").expect("Failed to create seqdiag generator");

    let test_cases = [
        "state_conditionals",
        "state_sequence",
        "state_sequence2",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/seqdiag/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for SeqDiag fixture: {}",
            case
        );
    }
}

#[test]
fn test_dot_generator_parity() {
    let generator = make_generator("dot").expect("Failed to create dot generator");

    let test_cases = [
        "flow_control",
        "state_y_edge",
        "colors",
        "url",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/dot/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for Dot fixture: {}",
            case
        );
    }
}

#[test]
fn test_mscgen_generator_parity() {
    let generator = make_generator("mscgen").expect("Failed to create mscgen generator");

    let test_cases = [
        "events",
        "state_conditionals",
        "state_sequence",
        "state_sequence2",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/mscgen/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for MSCGen fixture: {}",
            case
        );
    }
}

#[test]
fn test_plantuml_sequence_generator_parity() {
    let generator = make_generator("plantuml_sequence").expect("Failed to create plantuml_sequence generator");

    let test_cases = [
        "events",
        "plantuml_context",
        "plantuml_context2",
        "state_conditionals",
        "state_sequence",
        "state_sequence2",
    ];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/plantuml_sequence/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for PlantUMLSequence fixture: {}",
            case
        );
    }
}

#[test]
fn test_layerbands_generator_parity() {
    let generator = make_generator("layerbands").expect("Failed to create layerbands generator");

    let test_cases = ["layerbands"];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/layerbands/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for LayerBands fixture: {}",
            case
        );
    }
}

#[test]
fn test_parsetree_generator_parity() {
    let generator = make_generator("parsetree").expect("Failed to create parsetree generator");

    let test_cases = ["parsetree"];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/parsetree/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for ParseTree fixture: {}",
            case
        );
    }
}

#[test]
fn test_sankey_generator_parity() {
    let generator = make_generator("sankey").expect("Failed to create sankey generator");

    let test_cases = ["sankey"];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/sankey/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for Sankey fixture: {}",
            case
        );
    }
}

#[test]
fn test_dendrogram_generator_parity() {
    let generator = make_generator("radialdendrogram").expect("Failed to create dendrogram generator");

    let test_cases = ["dendrogram"];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/radialdendrogram/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for RadialDendrogram fixture: {}",
            case
        );
    }
}

#[test]
fn test_umlclass_generator_parity() {
    let generator = make_generator("umlclass").expect("Failed to create umlclass generator");

    let test_cases = ["umlclass", "umlclass2", "umlclass_types"];

    for case in &test_cases {
        let input_path = format!("../../tests/test_inputs/{}.txt", case);
        let golden_path = format!("../../tests/testrun/previous/umlclass/{}.txt", case);

        if !Path::new(&input_path).exists() || !Path::new(&golden_path).exists() {
            continue;
        }

        let input_code = fs::read_to_string(&input_path).expect("Failed to read input");
        let expected_output = fs::read_to_string(&golden_path).expect("Failed to read golden");

        let canvas = AstBuilder::new()
            .build(&input_code)
            .unwrap_or_else(|e| panic!("Failed to build AST for {}: {}", case, e));

        let actual_output = generator.generate(&canvas);

        assert_eq!(
            actual_output, expected_output,
            "Mismatch in generator output for UMLClass fixture: {}",
            case
        );
    }
}
