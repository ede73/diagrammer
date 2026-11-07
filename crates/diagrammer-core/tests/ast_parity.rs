use diagrammer_core::builder::AstBuilder;
use std::fs;
use std::path::Path;

#[derive(Debug, Default)]
struct AstReport {
    total: usize,
    parsed_by_pest: usize,
    parse_errors: Vec<(String, String)>,
    valid_ast_count: usize,
}

#[test]
fn test_ast_parity_across_fixtures() {
    let inputs_dir = Path::new("../../tests/test_inputs");
    if !inputs_dir.exists() {
        eprintln!("tests/test_inputs directory not found at {:?}", inputs_dir);
        return;
    }

    let mut entries: Vec<_> = fs::read_dir(inputs_dir)
        .expect("Failed to read test_inputs directory")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "txt"))
        .collect();

    entries.sort_by_key(|e| e.file_name());

    let mut report = AstReport {
        total: entries.len(),
        ..Default::default()
    };

    println!("\n=== VALIDATING AST ACROSS {} FIXTURES ===", report.total);

    for entry in &entries {
        let path = entry.path();
        let filename = path.file_name().unwrap().to_string_lossy().to_string();
        let content = fs::read_to_string(&path).expect("Failed to read file");

        match AstBuilder::new().build(&content) {
            Ok(canvas) => {
                report.parsed_by_pest += 1;
                let val = serde_json::to_value(&canvas).unwrap();
                let objs = val.get("_OBJECTS").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                let roots = val.get("_ROOTVERTICES").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                if objs > 0 || roots > 0 {
                    report.valid_ast_count += 1;
                }
            }
            Err(e) => {
                report.parse_errors.push((filename.clone(), e));
            }
        }
    }

    println!("\n=== AST VALIDATION REPORT ===");
    println!("Total fixtures:     {}", report.total);
    println!("Parsed by Pest:     {}/{}", report.parsed_by_pest, report.total);
    println!("Valid AST count:    {}/{}", report.valid_ast_count, report.total);
    println!("Parse Errors:       {}", report.parse_errors.len());

    assert_eq!(
        report.parse_errors.len(),
        0,
        "Expected 0 parse errors across all fixtures, got {}",
        report.parse_errors.len()
    );
    assert_eq!(
        report.parsed_by_pest, report.total,
        "All fixtures should parse successfully"
    );
}
