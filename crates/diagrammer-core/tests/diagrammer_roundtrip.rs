use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::diagrammer::DiagrammerGenerator;
use std::fs;
use std::path::Path;

#[test]
fn test_roundtrip_simple_nodes_and_edges() {
    let input = r#"
visualizer layered
landscape

nodeA #ff0000; "Node A Label"
nodeB; "Node B Label"

nodeA > nodeB; "connects"
"#;

    let ast1 = AstBuilder::new().build(input).expect("Failed parsing input");
    let generated = DiagrammerGenerator::generate_diagrammer(&ast1);
    println!("--- GENERATED CODE ---\n{}\n----------------------", generated);

    let ast2 = AstBuilder::new().build(&generated).expect("Failed parsing generated code");

    assert_eq!(ast1.visualizer, ast2.visualizer, "Visualizer must match");
    assert_eq!(ast1.direction, ast2.direction, "Direction must match");
    assert_eq!(ast1.get_edges().len(), ast2.get_edges().len(), "Edge count must match");
}

#[test]
fn test_roundtrip_groups_and_custom_shapes() {
    let input = r#"
visualizer state

{Group1 #112233; Cluster 1
    visualizer tree
    diamond NodeX #334455; Decision
    NodeY; Result
    NodeX > NodeY; passes
}

NodeZ; Exterior
Group1 > NodeZ
"#;

    let ast1 = AstBuilder::new().build(input).expect("Failed parsing input");
    let generated = DiagrammerGenerator::generate_diagrammer(&ast1);
    println!("--- GENERATED CODE ---\n{}\n----------------------", generated);

    let ast2 = AstBuilder::new().build(&generated).expect("Failed parsing generated code");

    assert_eq!(ast1.visualizer, ast2.visualizer);
    assert_eq!(ast1.objects.len(), ast2.objects.len());
}

#[test]
fn test_roundtrip_across_all_fixtures() {
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

    let mut success_count = 0;
    let mut failure_count = 0;
    let mut failures = Vec::new();

    for entry in &entries {
        let path = entry.path();
        let filename = path.file_name().unwrap().to_string_lossy().to_string();
        let content = fs::read_to_string(&path).expect("Failed reading file");

        let ast1 = match AstBuilder::new().build(&content) {
            Ok(ast) => ast,
            Err(_) => {
                // If fixture didn't parse in the first place, skip roundtrip
                continue;
            }
        };

        let generated = DiagrammerGenerator::generate_diagrammer(&ast1);

        match AstBuilder::new().build(&generated) {
            Ok(ast2) => {
                // Check structural parity:
                let edges1 = ast1.get_edges().len();
                let edges2 = ast2.get_edges().len();
                let unique_verts1: std::collections::HashSet<_> = ast1
                    .get_flattened_vertices()
                    .iter()
                    .map(|v| v.get_name())
                    .collect();
                let unique_verts2: std::collections::HashSet<_> = ast2
                    .get_flattened_vertices()
                    .iter()
                    .map(|v| v.get_name())
                    .collect();

                if edges1 == edges2 && unique_verts1 == unique_verts2 && ast1.visualizer == ast2.visualizer {
                    success_count += 1;
                } else {
                    failure_count += 1;
                    failures.push(format!(
                        "{} mismatch: edges({} vs {}), unique_verts({} vs {}), vis({:?} vs {:?})",
                        filename, edges1, edges2, unique_verts1.len(), unique_verts2.len(), ast1.visualizer, ast2.visualizer
                    ));
                }
            }
            Err(e) => {
                failure_count += 1;
                failures.push(format!("{} failed re-parsing generated code: {}", filename, e));
            }
        }
    }

    println!("\n=== ROUNDTRIP SUMMARY ===");
    println!("Successful roundtrips: {}", success_count);
    println!("Failures:              {}", failure_count);
    for f in failures.iter().take(20) {
        println!("  - {}", f);
    }

    // We want to see how high the initial pass rate is!
    assert!(
        success_count > 0,
        "Should have successful roundtrips"
    );
}
