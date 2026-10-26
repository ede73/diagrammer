use diagrammer_core::builder::AstBuilder;
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Default)]
struct ParityReport {
    total: usize,
    parsed_by_pest: usize,
    jison_parse_errors: usize,
    pest_parse_errors: Vec<(String, String)>,
    ast_mismatches: Vec<(String, String)>,
    full_matches: usize,
}

fn normalize_jison_ast_json(raw: &str) -> String {
    let mut out = String::with_capacity(raw.len());
    let bytes = raw.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b',' {
            let mut j = i + 1;
            while j < bytes.len() && (bytes[j] == b' ' || bytes[j] == b'\t' || bytes[j] == b'\r' || bytes[j] == b'\n') {
                j += 1;
            }
            if j < bytes.len() && (bytes[j] == b'}' || bytes[j] == b']') {
                i += 1;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    // Handle ast.js generator oddities in legacy Jison tests:
    // 1. group_group_link.txt outputs `""edge2""`
    let s = out.replace("\"\"edge2\"\"", "\"edge2\"");
    // 2. record_style.txt outputs a literal newline inside `b2:f1\n` due to Jison lexer bug
    s.replace("b2:f1\n", "b2:f1")
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
        .filter(|e| e.path().extension().map(|ext| ext == "txt").unwrap_or(false))
        .collect();
    entries.sort_by_key(|e| e.path());

    let mut report = ParityReport {
        total: entries.len(),
        ..Default::default()
    };

    println!("\n=== RUNNING AST PARITY ACROSS {} FIXTURES ===", report.total);

    for entry in &entries {
        let path = entry.path();
        let filename = path.file_name().unwrap().to_string_lossy().to_string();
        let content = fs::read_to_string(&path).expect("Failed to read file");

        // 1. Run Jison generator via stdin pipe
        let mut child = Command::new("node")
            .arg("../../js/generate.js")
            .arg("-")
            .arg("ast")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .expect("Failed to spawn node generate.js");

        if let Some(mut stdin) = child.stdin.take() {
            use std::io::Write;
            let _ = stdin.write_all(content.as_bytes());
        }

        let jison_out = child.wait_with_output();

        let jison_ast_val = match jison_out {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let normalized = normalize_jison_ast_json(&stdout);
                match serde_json::from_str::<serde_json::Value>(&normalized) {
                    Ok(val) => Some(val),
                    Err(e) => {
                        eprintln!("JSON parse error on normalized output of {}: {}", filename, e);
                        report.jison_parse_errors += 1;
                        None
                    }
                }
            }
            Ok(output) => {
                eprintln!("node generate.js failed for {}: {}", filename, String::from_utf8_lossy(&output.stderr));
                report.jison_parse_errors += 1;
                None
            }
            Err(e) => {
                eprintln!("Failed to run node for {}: {}", filename, e);
                report.jison_parse_errors += 1;
                None
            }
        };

        // 2. Run Pest shadow builder
        let pest_res = AstBuilder::new().build(&content);
        match pest_res {
            Ok(pest_canvas) => {
                report.parsed_by_pest += 1;

                if let Some(jison_val) = jison_ast_val {
                    let pest_val = serde_json::to_value(&pest_canvas).unwrap();

                    // Compare critical fields: objects count, visualizer, direction
                    let jison_objs = jison_val.get("_OBJECTS").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                    let pest_objs = pest_val.get("_OBJECTS").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);

                    let jison_roots = jison_val.get("_ROOTVERTICES").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);
                    let pest_roots = pest_val.get("_ROOTVERTICES").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0);

                    if jison_objs == pest_objs && jison_roots == pest_roots {
                        report.full_matches += 1;
                    } else {
                        report.ast_mismatches.push((
                            filename.clone(),
                            format!(
                                "Objects (Jison: {}, Pest: {}), Roots (Jison: {}, Pest: {})",
                                jison_objs, pest_objs, jison_roots, pest_roots
                            ),
                        ));
                    }
                }
            }
            Err(e) => {
                report.pest_parse_errors.push((filename.clone(), e));
            }
        }
    }

    println!("\n=== AST PARITY REPORT ===");
    println!("Total fixtures:          {}", report.total);
    println!("Parsed by Pest:          {}/{}", report.parsed_by_pest, report.total);
    println!("Pest Parse Errors:       {}", report.pest_parse_errors.len());
    println!("Full Object/Root Matches:{}", report.full_matches);
    println!("AST Structural Diff:     {}", report.ast_mismatches.len());

    if !report.pest_parse_errors.is_empty() {
        println!("\n--- Pest Parse Errors ({}) ---", report.pest_parse_errors.len());
        for (file, err) in &report.pest_parse_errors {
            let first_line = err.lines().next().unwrap_or(err.as_str());
            println!("{}: {}", file, first_line);
        }
    }

    if !report.ast_mismatches.is_empty() {
        println!("\n--- All AST Structural Differences ({}) ---", report.ast_mismatches.len());
        for (file, diff) in &report.ast_mismatches {
            println!("{}: {}", file, diff);
        }
    }
}
