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
