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
        "dynamic_shapes.txt",
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
fn test_tree_engine_renders_fixtures() {
    let tree_gen = make_generator("tree").expect("Failed to create tree generator");
    let radial_gen = make_generator("radial").expect("Failed to create radial generator");

    let input_path = "../../tests/test_inputs/tree_dendrogram.txt";
    let fallback_path = "tests/test_inputs/tree_dendrogram.txt";
    let path = if Path::new(input_path).exists() {
        input_path
    } else if Path::new(fallback_path).exists() {
        fallback_path
    } else {
        return;
    };

    let input_code = fs::read_to_string(path).expect("Failed to read tree_dendrogram.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to build AST");

    // 1. Tidy tree
    let tree_svg = tree_gen.generate(&canvas);
    assert!(tree_svg.contains("class=\"diagrammer-tree-svg\""));
    assert!(tree_svg.contains("dt-edge"));
    assert!(tree_svg.contains("dt-node"));
    assert!(!tree_svg.contains("NaN"));

    // 2. Radial dendrogram
    let radial_svg = radial_gen.generate(&canvas);
    assert!(radial_svg.contains("class=\"diagrammer-tree-svg\""));
    assert!(radial_svg.contains("dt-edge"));
    assert!(!radial_svg.contains("NaN"));
}

#[test]
fn test_grid_engine_renders_fixtures() {
    let grid_gen = make_generator("grid").expect("Failed to create grid generator");

    let input_path = "../../tests/test_inputs/network_bus.txt";
    let fallback_path = "tests/test_inputs/network_bus.txt";
    let path = if Path::new(input_path).exists() {
        input_path
    } else if Path::new(fallback_path).exists() {
        fallback_path
    } else {
        return;
    };

    let input_code = fs::read_to_string(path).expect("Failed to read network_bus.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to build AST");

    let grid_svg = grid_gen.generate(&canvas);
    assert!(grid_svg.contains("class=\"diagrammer-grid-svg\""));
    assert!(grid_svg.contains("dg-bus-rail"));
    assert!(grid_svg.contains("dg-tap"));
    assert!(grid_svg.contains("dg-node"));
    assert!(!grid_svg.contains("NaN"));
}

#[test]
fn test_force_engine_renders_fixtures() {
    let force_gen = make_generator("force").expect("Failed to create force generator");

    let input_path = "../../tests/test_inputs/force_network.txt";
    let fallback_path = "tests/test_inputs/force_network.txt";
    let path = if Path::new(input_path).exists() {
        input_path
    } else if Path::new(fallback_path).exists() {
        fallback_path
    } else {
        return;
    };

    let input_code = fs::read_to_string(path).expect("Failed to read force_network.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to build AST");

    let force_svg = force_gen.generate(&canvas);
    assert!(force_svg.contains("class=\"diagrammer-force-svg\""));
    assert!(force_svg.contains("dforce-edge"));
    assert!(force_svg.contains("dforce-node"));
    assert!(!force_svg.contains("NaN"));
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

#[test]
fn test_native_node_shapes_styles_and_icons() {
    let engines = ["layered", "force", "tree", "grid"];
    let input_path = if Path::new("tests/test_inputs/nodes.txt").exists() {
        "tests/test_inputs/nodes.txt"
    } else if Path::new("../../tests/test_inputs/nodes.txt").exists() {
        "../../tests/test_inputs/nodes.txt"
    } else {
        panic!("tests/test_inputs/nodes.txt not found");
    };

    let input_code = fs::read_to_string(input_path).expect("Failed to read nodes.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to parse nodes.txt");

    for engine_name in &engines {
        let generator = make_generator(engine_name)
            .unwrap_or_else(|| panic!("Failed to create generator for {}", engine_name));
        let svg = generator.generate(&canvas);

        assert!(svg.starts_with("<svg"), "{} SVG must start with <svg", engine_name);
        assert!(svg.contains("</svg>"), "{} SVG must close with </svg>", engine_name);
        assert!(!svg.contains("NaN"), "{} SVG must not contain NaN coordinates", engine_name);

        // Assert shape rendering
        assert!(
            svg.contains("<circle"),
            "{} SVG must contain circle element for circle shapes in nodes.txt",
            engine_name
        );

        // Assert stroke styles
        assert!(
            svg.contains("stroke-dasharray=\"6,4\""),
            "{} SVG must contain dashed stroke style (6,4) from nodes.txt",
            engine_name
        );
        assert!(
            svg.contains("stroke-dasharray=\"2,3\""),
            "{} SVG must contain dotted stroke style (2,3) from nodes.txt",
            engine_name
        );
        assert!(
            svg.contains("stroke-width=\"3.0\"") || svg.contains("font-weight: 700"),
            "{} SVG must contain bold stroke style (stroke-width 3.0) or font-weight 700 from nodes.txt. Svg snippet: {}",
            engine_name,
            &svg[..svg.len().min(500)]
        );

        // Assert icon embedding
        assert!(
            svg.contains("<image href=\"web/icons/"),
            "{} SVG must embed modern web icons from nodes.txt",
            engine_name
        );
    }
}

#[test]
fn test_dynamic_node_type_definitions() {
    let input = r##"
define dude(width=80, height=60) {
  <svg viewBox="0 0 80 60">
    <circle cx="40" cy="22" r="14" fill="#38bdf8" />
    <path d="M 16 52 C 20 34, 60 34, 64 52" stroke="#38bdf8" stroke-width="3" fill="none" />
  </svg>
}

define auto(width=60, height=32) {
  rectangle(x=0, y=8, w=60, h=18, rx=4)
  polygon(12,8 20,0 42,0 50,8)
  circle(cx=15, cy=26, r=6)
  circle(cx=45, cy=26, r=6)
}

dude Alice > dude Bob; "Calls auto"
auto Taxi > auto Bus
Alice > Taxi; "Takes ride"
"##;

    let canvas = AstBuilder::new().build(input).expect("Failed to build AST for dynamic shapes");

    // 1. Verify AST TypeRegistry
    assert!(canvas.type_registry.has_shape("dude"), "TypeRegistry must contain 'dude'");
    assert!(canvas.type_registry.has_shape("auto"), "TypeRegistry must contain 'auto'");

    let dude_tpl = canvas.type_registry.get_shape("dude").unwrap();
    assert_eq!(dude_tpl.width, Some(80.0));
    assert_eq!(dude_tpl.height, Some(60.0));
    match &dude_tpl.body {
        diagrammer_core::ast::NodeShapeBody::Svg(s) => {
            assert!(s.contains("viewBox=\"0 0 80 60\""));
            assert!(s.contains("fill=\"#38bdf8\""));
        }
        _ => panic!("Expected SVG body for dude"),
    }

    let auto_tpl = canvas.type_registry.get_shape("auto").unwrap();
    assert_eq!(auto_tpl.width, Some(60.0));
    assert_eq!(auto_tpl.height, Some(32.0));
    match &auto_tpl.body {
        diagrammer_core::ast::NodeShapeBody::Primitives(prims) => {
            assert_eq!(prims.len(), 4);
            assert_eq!(prims[0].kind, "rectangle");
            assert_eq!(prims[1].kind, "polygon");
            assert_eq!(prims[1].attributes.get("points").map(|s| s.as_str()), Some("12,8 20,0 42,0 50,8"));
            assert_eq!(prims[2].kind, "circle");
            assert_eq!(prims[3].kind, "circle");
        }
        _ => panic!("Expected Primitives body for auto"),
    }

    // 2. Verify vertex shape resolution
    let vertices = canvas.get_flattened_vertices();
    let alice = vertices.iter().find(|v| v.get_name() == "Alice").expect("Alice node exists");
    assert_eq!(alice.get_shape(), Some("dude"));

    let bob = vertices.iter().find(|v| v.get_name() == "Bob").expect("Bob node exists");
    assert_eq!(bob.get_shape(), Some("dude"));

    let taxi = vertices.iter().find(|v| v.get_name() == "Taxi").expect("Taxi node exists");
    assert_eq!(taxi.get_shape(), Some("auto"));

    let bus = vertices.iter().find(|v| v.get_name() == "Bus").expect("Bus node exists");
    assert_eq!(bus.get_shape(), Some("auto"));

    // 3. Verify native SVG rendering across all native engines
    let engines = ["layered", "force", "tree", "grid"];
    for engine_name in &engines {
        let generator = make_generator(engine_name)
            .unwrap_or_else(|| panic!("Generator {} must exist", engine_name));
        let svg = generator.generate(&canvas);

        assert!(svg.starts_with("<svg"), "{} SVG must start with <svg", engine_name);
        assert!(svg.contains("</svg>"), "{} SVG must close with </svg>", engine_name);
        assert!(!svg.contains("NaN"), "{} SVG must not contain NaN", engine_name);

        // Verify custom SVG template injection
        assert!(
            svg.contains("0 0 80 60"),
            "{} SVG must contain dude's viewBox (0 0 80 60)",
            engine_name
        );
        assert!(
            svg.contains("fill=\"#38bdf8\""),
            "{} SVG must contain dude's SVG fill color #38bdf8",
            engine_name
        );

        // Verify geometry primitives
        assert!(
            svg.contains("<polygon points=\"12,8 20,0 42,0 50,8\""),
            "{} SVG must contain auto's polygon points",
            engine_name
        );
        assert!(
            svg.contains("<circle cx=\"15\" cy=\"26\" r=\"6\""),
            "{} SVG must contain auto's wheel circle",
            engine_name
        );

        // Verify labels
        assert!(svg.contains("Alice"), "{} SVG must render label Alice", engine_name);
        assert!(svg.contains("Taxi"), "{} SVG must render label Taxi", engine_name);
    }
}
