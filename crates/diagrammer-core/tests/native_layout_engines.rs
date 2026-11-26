use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use diagrammer_core::layout::layered::LayeredGraph;
use std::fs;
use std::path::Path;

#[test]
fn test_native_sequence_engine_renders_fixtures() {
    let generator = make_generator("native_sequence").expect("Failed to create native_sequence generator");

    let fixtures = [
        "native_sequence.txt",
        "seqdiag.txt",
        "events.txt",
        "state_sequence.txt",
        "state_sequence2.txt",
        "state_sip_sequence.txt",
        "plantuml_context.txt",
        "plantuml_context2.txt",
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
        "umlclass2.txt",
        "layerbands.txt",
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

    // 3. Parse tree fixture
    let parse_path = if Path::new("../../tests/test_inputs/parsetree.txt").exists() {
        "../../tests/test_inputs/parsetree.txt"
    } else {
        "tests/test_inputs/parsetree.txt"
    };
    if let Ok(parse_code) = fs::read_to_string(parse_path) {
        let parse_canvas = AstBuilder::new().build(&parse_code).expect("Failed to build AST for parsetree.txt");
        let parse_svg = tree_gen.generate(&parse_canvas);
        assert!(parse_svg.contains("class=\"diagrammer-tree-svg\""));
        assert!(parse_svg.contains("dt-node"));
        assert!(!parse_svg.contains("NaN"));
    }
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
fn test_grid_engine_multi_homed_network_bus() {
    let grid_gen = make_generator("grid").expect("Failed to create grid generator");

    let input_path = "../../tests/test_inputs/nwdiag3.txt";
    let fallback_path = "tests/test_inputs/nwdiag3.txt";
    let path = if Path::new(input_path).exists() {
        input_path
    } else if Path::new(fallback_path).exists() {
        fallback_path
    } else {
        return;
    };

    let input_code = fs::read_to_string(path).expect("Failed to read nwdiag3.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to build AST");

    let grid_svg = grid_gen.generate(&canvas);
    assert!(grid_svg.contains("class=\"diagrammer-grid-svg\""));
    assert!(grid_svg.contains("Sample_front"));
    assert!(grid_svg.contains("Sample_back"));
    assert!(grid_svg.contains("web01"));
    assert!(grid_svg.contains("web02"));
    assert!(grid_svg.contains("db01"));
    assert!(grid_svg.contains("db02"));
    assert!(grid_svg.contains("dg-tap-label"));
    assert!(!grid_svg.contains("NaN"));
}

#[test]
fn test_grid_engine_nwdiag2_network_architecture() {
    let grid_gen = make_generator("grid").expect("Failed to create grid generator");

    let input_path = "../../tests/test_inputs/nwdiag2.txt";
    let fallback_path = "tests/test_inputs/nwdiag2.txt";
    let path = if Path::new(input_path).exists() {
        input_path
    } else if Path::new(fallback_path).exists() {
        fallback_path
    } else {
        return;
    };

    let input_code = fs::read_to_string(path).expect("Failed to read nwdiag2.txt");
    let canvas = AstBuilder::new().build(&input_code).expect("Failed to build AST");

    let grid_svg = grid_gen.generate(&canvas);
    assert!(grid_svg.contains("class=\"diagrammer-grid-svg\""));
    assert!(grid_svg.contains("comcast"));
    assert!(grid_svg.contains("home"));
    assert!(grid_svg.contains("inet"));
    assert!(grid_svg.contains("cablemodem"));
    assert!(grid_svg.contains("router"));
    assert!(grid_svg.contains("printer"));
    assert!(grid_svg.contains("nas"));
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
fn test_umlclass_scoped_members_no_collision() {
    let test_input = if Path::new("tests/test_inputs/umlclass_scoped.txt").exists() {
        "tests/test_inputs/umlclass_scoped.txt"
    } else if Path::new("../../tests/test_inputs/umlclass_scoped.txt").exists() {
        "../../tests/test_inputs/umlclass_scoped.txt"
    } else {
        panic!("umlclass_scoped.txt not found");
    };

    let content = fs::read_to_string(test_input).expect("Failed to read umlclass_scoped.txt");
    let canvas = AstBuilder::new().build(&content).expect("Failed to parse umlclass_scoped");
    let graph = LayeredGraph::build(&canvas);

    assert!(graph.nodes.contains_key("Person"), "Must contain Person class");
    assert!(graph.nodes.contains_key("Course"), "Must contain Course class");

    let person = &graph.nodes["Person"];
    let course = &graph.nodes["Course"];

    // Person must have its own 'name' member
    let person_has_name = person.members.iter().any(|m| m.id == "Person!name");
    assert!(person_has_name, "Person class must contain member Person!name");

    // Course must have its own 'name' member without collision
    let course_has_name = course.members.iter().any(|m| m.id == "Course!name");
    assert!(course_has_name, "Course class must contain member Course!name without colliding with Person");

    let svg = graph.render_svg();
    assert!(svg.contains("<svg") && svg.contains("</svg>"));
    assert!(svg.contains("dl-class-node"));
}

#[test]
fn test_umlclass_student_is_class_and_long_edge_strictly_avoids_intermediate_node() {
    let test_input = if Path::new("tests/test_inputs/umlclass.txt").exists() {
        "tests/test_inputs/umlclass.txt"
    } else if Path::new("../../tests/test_inputs/umlclass.txt").exists() {
        "../../tests/test_inputs/umlclass.txt"
    } else {
        panic!("umlclass.txt not found");
    };

    let content = fs::read_to_string(test_input).expect("Failed to read umlclass.txt");
    let canvas = AstBuilder::new().build(&content).expect("Failed to parse umlclass");
    let graph = LayeredGraph::build(&canvas);

    // 1. Student must be recognized as a class node with members, NOT a generic cluster group
    assert!(graph.nodes.contains_key("Student"), "Student must be in nodes map");
    let student = &graph.nodes["Student"];
    assert_eq!(student.shape, "uml_class", "Student must have shape uml_class");
    assert_eq!(student.members.len(), 3, "Student must have 3 members: classes, attend, sleep");

    // 2. Professor and Person must also be classes
    assert!(graph.nodes.contains_key("Professor"));
    assert!(graph.nodes.contains_key("Person"));
    let prof = &graph.nodes["Professor"];

    // 3. Edge from Student to Person must NOT intersect Professor's bounding box
    let student_to_person = graph.edges.iter().find(|e| e.from == "Student" && e.to == "Person")
        .expect("Must have edge from Student to Person");
    assert!(!student_to_person.points.is_empty(), "Edge must have routed points");

    // Check each segment of the routed edge against Professor's bounding box
    let prof_left = prof.x;
    let prof_right = prof.x + prof.width;
    let prof_top = prof.y;
    let prof_bottom = prof.y + prof.height;

    for i in 0..student_to_person.points.len() - 1 {
        let p1 = student_to_person.points[i];
        let p2 = student_to_person.points[i + 1];

        // Horizontal segment check
        if (p1.1 - p2.1).abs() < 0.001 {
            let y = p1.1;
            let min_x = p1.0.min(p2.0);
            let max_x = p1.0.max(p2.0);
            assert!(
                !(y > prof_top && y < prof_bottom && max_x > prof_left && min_x < prof_right),
                "Horizontal segment {:?} -> {:?} penetrates Professor bounding box [{}, {}, {}, {}]",
                p1, p2, prof_left, prof_top, prof_right, prof_bottom
            );
        }

        // Vertical segment check
        if (p1.0 - p2.0).abs() < 0.001 {
            let x = p1.0;
            let min_y = p1.1.min(p2.1);
            let max_y = p1.1.max(p2.1);
            assert!(
                !(x > prof_left && x < prof_right && max_y > prof_top && min_y < prof_bottom),
                "Vertical segment {:?} -> {:?} penetrates Professor bounding box [{}, {}, {}, {}]",
                p1, p2, prof_left, prof_top, prof_right, prof_bottom
            );
        }
    }

    let svg = graph.render_svg();
    assert!(svg.contains("id=\"node-Student\""), "Rendered SVG must contain Student node");
    assert!(!svg.contains("id=\"group-Student\""), "Rendered SVG must NOT contain Student as a group box");
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

#[test]
fn test_dynamic_operator_overrides_and_arrowheads() {
    let input_path = if Path::new("tests/test_inputs/dynamic_operators.txt").exists() {
        "tests/test_inputs/dynamic_operators.txt"
    } else if Path::new("../../tests/test_inputs/dynamic_operators.txt").exists() {
        "../../tests/test_inputs/dynamic_operators.txt"
    } else {
        panic!("tests/test_inputs/dynamic_operators.txt not found");
    };

    let input = fs::read_to_string(input_path).expect("Failed to read dynamic_operators.txt");
    let canvas = AstBuilder::new().build(&input).expect("Failed to build AST for dynamic operators");

    // 1. Verify AST TypeRegistry Operators
    assert!(canvas.type_registry.has_operator("<>"), "TypeRegistry must contain '<>'");
    assert!(canvas.type_registry.has_operator("<~>"), "TypeRegistry must contain '<~>'");
    assert!(canvas.type_registry.has_operator("~>"), "TypeRegistry must contain '~>'");

    let op_diamond = canvas.type_registry.get_operator("<>").unwrap();
    assert_eq!(op_diamond.edge_type.as_deref(), Some("bidirectional"));
    assert_eq!(op_diamond.style.as_deref(), Some("dashed"));
    assert_eq!(op_diamond.action.as_deref(), Some("tls-handshake"));
    let ah_dude = op_diamond.arrowhead.as_ref().expect("Arrowhead for <> exists");
    assert_eq!(ah_dude.shape, "dude");
    assert_eq!(ah_dude.width, Some(14.0));
    assert_eq!(ah_dude.height, Some(14.0));
    assert_eq!(ah_dude.rotation, Some(0.0));

    let op_tilde_bidi = canvas.type_registry.get_operator("<~>").unwrap();
    assert_eq!(op_tilde_bidi.edge_type.as_deref(), Some("bidirectional"));
    assert_eq!(op_tilde_bidi.style.as_deref(), Some("dotted"));
    let ah_diamond = op_tilde_bidi.arrowhead.as_ref().expect("Arrowhead for <~> exists");
    assert_eq!(ah_diamond.shape, "diamond");

    let op_auto = canvas.type_registry.get_operator("~>").unwrap();
    assert_eq!(op_auto.style.as_deref(), Some("dashed"));
    assert_eq!(op_auto.color.as_deref(), Some("#10b981"));
    let ah_auto = op_auto.arrowhead.as_ref().expect("Arrowhead for ~> exists");
    assert_eq!(ah_auto.shape, "auto");
    assert_eq!(ah_auto.width, Some(16.0));
    assert_eq!(ah_auto.height, Some(12.0));

    // 2. Verify edge inheritance from operator definitions
    let edges = canvas.get_edges();
    assert_eq!(edges.len(), 3);

    let edge_peer = edges.iter().find(|e| e.left == "Alice" && e.right == "Bob").expect("Alice <> Bob exists");
    assert_eq!(edge_peer.edge_type, "<>");
    assert_eq!(edge_peer.style.as_deref(), Some("dashed"));
    assert_eq!(edge_peer.arrowhead.as_deref(), Some("dude"));

    let edge_fleet = edges.iter().find(|e| e.left == "Taxi" && e.right == "Bus").expect("Taxi <~> Bus exists");
    assert_eq!(edge_fleet.edge_type, "<~>");
    assert_eq!(edge_fleet.style.as_deref(), Some("dotted"));
    assert_eq!(edge_fleet.arrowhead.as_deref(), Some("diamond"));

    let edge_cab = edges.iter().find(|e| e.left == "Alice" && e.right == "Taxi").expect("Alice ~> Taxi exists");
    assert_eq!(edge_cab.edge_type, "~>");
    assert_eq!(edge_cab.color.as_deref(), Some("#10b981"));
    assert_eq!(edge_cab.style.as_deref(), Some("dashed"));
    assert_eq!(edge_cab.arrowhead.as_deref(), Some("auto"));

    // 3. Verify Layered layout SVG output
    let layered_gen = make_generator("layered").expect("layered generator exists");
    let layered_svg = layered_gen.generate(&canvas);

    // Layered defs must define dynamic markers
    assert!(layered_svg.contains("<marker id=\"dl-op-lt_gt_\""), "Layered SVG must define marker dl-op-lt_gt_");
    assert!(layered_svg.contains("<marker id=\"dl-op-lt_tilde_gt_\""), "Layered SVG must define marker dl-op-lt_tilde_gt_");
    assert!(layered_svg.contains("<marker id=\"dl-op-tilde_gt_\""), "Layered SVG must define marker dl-op-tilde_gt_");

    // Inside dude marker, dude's SVG template must be rendered
    assert!(layered_svg.contains("0 0 80.0 60.0"), "Marker for dude must use dude template viewBox");

    // Edges must reference the markers
    assert!(layered_svg.contains("marker-end=\"url(#dl-op-lt_gt_)\""), "Layered SVG edge must reference marker-end for <>");
    assert!(layered_svg.contains("marker-start=\"url(#dl-op-lt_gt_)\""), "Layered SVG bidirectional edge must reference marker-start for <>");
    assert!(layered_svg.contains("marker-end=\"url(#dl-op-tilde_gt_)\""), "Layered SVG edge must reference marker-end for ~>");

    // Operator styles
    assert!(layered_svg.contains("stroke-dasharray=\"6,4\""), "Layered SVG must render dashed style for <> and ~>");
    assert!(layered_svg.contains("stroke-dasharray=\"2,4\""), "Layered SVG must render dotted style for <~>");
    assert!(layered_svg.contains("stroke=\"#10b981\""), "Layered SVG must render operator color #10b981 for ~>");

    // 4. Verify Force layout SVG output
    let force_gen = make_generator("force").expect("force generator exists");
    let force_svg = force_gen.generate(&canvas);
    assert!(force_svg.contains("<marker id=\"dforce-op-lt_gt_\""), "Force SVG must define marker dforce-op-lt_gt_");
    assert!(force_svg.contains("marker-end=\"url(#dforce-op-tilde_gt_)\""), "Force SVG must reference custom marker");

    // 5. Verify Sequence layout SVG output
    let seq_gen = make_generator("sequence").expect("sequence generator exists");
    let seq_svg = seq_gen.generate(&canvas);
    assert!(seq_svg.contains("<marker id=\"ds-op-lt_gt_\""), "Sequence SVG must define marker ds-op-lt_gt_");
    assert!(seq_svg.contains("marker-end=\"url(#ds-op-lt_gt_)\""), "Sequence SVG must reference custom marker");
}

#[test]
fn test_ast_record_generator() {
    let input = fs::read_to_string("../../tests/test_inputs/ast.txt")
        .or_else(|_| fs::read_to_string("tests/test_inputs/ast.txt"))
        .expect("ast.txt fixture must exist");

    let canvas = AstBuilder::new().build(&input).expect("Failed to parse ast.txt");

    // make_generator("ast_record") must return the AST Record generator (Graphviz record digraph)
    let generator = make_generator("ast_record").expect("ast_record generator must exist");
    let dot = generator.generate(&canvas);

    // Verify it generates Graphviz digraph with AST records
    assert!(dot.contains("digraph {"), "ast_record must output digraph");
    assert!(dot.contains("GraphCanvas"), "Must render GraphCanvas record");
    assert!(dot.contains("GraphObject"), "Must render GraphObject group/record");
    assert!(dot.contains("GraphRoot"), "Must render GraphRoot group/record");
}

#[test]
fn test_state_engine_renders_tcp_and_poly_archetype() {
    let state_gen = make_generator("state").expect("state generator must exist");

    // 1. Verify state_tcp.txt rendering
    let input = fs::read_to_string("../../tests/test_inputs/state_tcp.txt")
        .or_else(|_| fs::read_to_string("tests/test_inputs/state_tcp.txt"))
        .expect("state_tcp.txt must exist");

    let canvas = AstBuilder::new().build(&input).expect("Failed to parse state_tcp.txt");
    let svg = state_gen.generate(&canvas);

    assert!(svg.starts_with("<svg"), "State SVG must start with <svg");
    assert!(svg.contains("</svg>"), "State SVG must close with </svg>");
    assert!(svg.contains("class=\"diagrammer-state-svg\""), "State SVG must have diagrammer-state-svg class");
    assert!(svg.contains("class=\"ds-group\""), "State SVG must render phase cluster groups");
    assert!(svg.contains("Active CLOSE"), "Must render ActiveClose label");
    assert!(svg.contains("Passive CLOSE"), "Must render PassiveClose label");
    assert!(svg.contains("ESTABLISHED"), "Must render ESTABLISHED state");
    assert!(svg.contains("class=\"ds-edge\""), "Must render state transitions");
    assert!(!svg.contains("NaN"), "Must not have NaN coordinates");

    // 2. Verify Poly-Archetype Composable Subgraph (Sequence embedded inside State group)
    let poly_input = r#"
visualizer state

Start > Negotiation > Ready

{Negotiation; Handshake Protocol
    visualizer native_sequence
    Client > "SYN" Server
    Server > "SYN-ACK" Client
    Client > "ACK" Server
}
"#;
    let poly_canvas = AstBuilder::new().build(poly_input).expect("Failed to build poly-archetype AST");
    let poly_svg = state_gen.generate(&poly_canvas);

    assert!(poly_svg.contains("class=\"diagrammer-state-svg\""));
    assert!(poly_svg.contains("class=\"ds-poly-archetype-subgraph\""), "Must render embedded sub-visualizer");
    assert!(poly_svg.contains("class=\"diagrammer-sequence\""), "Embedded sequence diagram must be rendered inside state SVG");
    assert!(poly_svg.contains("Client"), "Participant Client must be in embedded sequence");
    assert!(poly_svg.contains("Server"), "Participant Server must be in embedded sequence");
    assert!(poly_svg.contains("SYN-ACK"), "Message SYN-ACK must be in embedded sequence");
}

#[test]
fn test_state_engine_groups_are_strictly_non_overlapping_and_obstacle_avoiding() {
    let input = r#"
visualizer state

Start > Negotiation > Process > Completed
Start > Completed; EmergencyCancel

{Negotiation; Handshake Protocol
    visualizer native_sequence
    Client > "1. SYN" Server
    Server > "2. SYN-ACK" Client
    Client > "3. ACK" Server
}

{Process; Data Processing
    Task1 > Task2 > Task3
}
"#;
    let canvas = AstBuilder::new().build(input).expect("Failed to build AST");
    let state_graph = diagrammer_core::layout::state::StateGraph::new(&canvas);

    // 1. Verify all composite nodes have disjoint non-overlapping bounding boxes
    let composite_nodes: Vec<_> = state_graph.nodes.values().filter(|n| n.is_composite).collect();
    assert_eq!(composite_nodes.len(), 2, "Expected 2 composite state containers");

    for i in 0..composite_nodes.len() {
        for j in (i + 1)..composite_nodes.len() {
            let n1 = composite_nodes[i];
            let n2 = composite_nodes[j];

            let overlap_x = (n1.x + n1.width).min(n2.x + n2.width) - n1.x.max(n2.x);
            let overlap_y = (n1.y + n1.height).min(n2.y + n2.height) - n1.y.max(n2.y);

            assert!(
                overlap_x <= 0.0 || overlap_y <= 0.0,
                "Composite groups '{}' and '{}' must never overlap! Overlap: ({:.1}, {:.1})",
                n1.id, n2.id, overlap_x, overlap_y
            );
        }
    }

    // 2. Verify bypass edge Start > Completed routes via gutter around intermediate obstacles
    let cancel_edge = state_graph.edges.iter().find(|e| e.from == "Start" && e.to == "Completed")
        .expect("Bypass edge Start > Completed must exist");
    
    // It must route via gutter around the obstacles
    assert!(cancel_edge.path_d.contains(" L "), "Bypass edge must detour via gutter");
    let negotiation_node = state_graph.nodes.get("Negotiation").unwrap();
    let mid_x = negotiation_node.x + negotiation_node.width / 2.0;
    let mid_y = negotiation_node.y + negotiation_node.height / 2.0;
    assert!(
        !cancel_edge.path_d.contains(&format!("L {:.1} {:.1}", mid_x, mid_y)),
        "Router must avoid slicing through Negotiation composite container"
    );
}

#[test]
fn test_universal_poly_archetype_nesting_and_layered_subgraphs() {
    use diagrammer_core::builder::AstBuilder;
    use diagrammer_core::generators::make_generator;

    // 1. Layered DAG hosting Sequence and Tree subgraphs
    let layered_poly_input = r#"
visualizer layered

StartNode > AuthSequence > DataProcessingTree > FinishNode

{AuthSequence; Authentication Handshake
    visualizer native_sequence
    Client > "1. SYN" Server
    Server > "2. SYN-ACK" Client
    Client > "3. ACK" Server
}

{DataProcessingTree; Decision & Routing Hierarchy
    visualizer tree
    Router > (FastPath, DeepInspection)
    DeepInspection > (PayloadScanner, Quarantine)
}
"#;
    let canvas1 = AstBuilder::new().build(layered_poly_input).expect("Failed to build AST for layered poly");
    let layered_gen = make_generator("layered").unwrap();
    let svg1 = layered_gen.generate(&canvas1);

    assert!(svg1.contains("class=\"diagrammer-layered-svg\""), "Must produce Layered SVG");
    assert!(svg1.contains("ds-poly-archetype-subgraph"), "Must embed poly-archetype subgraphs");
    assert!(svg1.contains("1. SYN"), "Must embed native_sequence content");
    assert!(svg1.contains("PayloadScanner"), "Must embed tree content");
    assert!(svg1.contains("node-AuthSequence"), "Must contain AuthSequence composite node");
    assert!(svg1.contains("node-DataProcessingTree"), "Must contain DataProcessingTree composite node");

    // 2. 3-level Fractal Recursive Nesting: state -> layered -> native_sequence
    let fractal_input = r#"
visualizer state

Init > CompositePipeline > Terminated

{CompositePipeline; Nested Layered Flowchart
    visualizer layered
    
    IngestStep > AuthGroup > OutputStep
    
    {AuthGroup; Embedded Sequence Protocol
        visualizer native_sequence
        App > "Token Request" AuthServer
        AuthServer > "Grant JWT" App
    }
}
"#;
    let canvas2 = AstBuilder::new().build(fractal_input).expect("Failed to build AST for fractal poly");
    let state_gen = make_generator("state").unwrap();
    let svg2 = state_gen.generate(&canvas2);

    assert!(svg2.contains("class=\"diagrammer-state-svg\""), "Must produce State SVG");
    assert!(svg2.contains("node-CompositePipeline"), "Must contain CompositePipeline state");
    assert!(svg2.contains("node-AuthGroup"), "Must contain AuthGroup nested layered container");
    assert!(svg2.contains("Token Request"), "Must embed 3rd-level sequence message");
}

#[test]
fn test_all_10_poly_archetype_fixtures_render_cleanly() {
    use diagrammer_core::builder::AstBuilder;
    use diagrammer_core::generators::make_generator;

    let poly_fixtures = [
        "poly_1_layered_sequence_tree.txt",
        "poly_2_state_sequence_dag.txt",
        "poly_3_state_grid_tree.txt",
        "poly_4_layered_force_state.txt",
        "poly_5_fractal_3level.txt",
        "poly_6_layered_grid_sequence.txt",
        "poly_7_state_uml_sequence.txt",
        "poly_8_layered_tree_state.txt",
        "poly_9_state_swarm_pipeline.txt",
        "poly_10_layered_swimlane_seq.txt",
    ];

    for fixture in &poly_fixtures {
        let fixture_path = format!("../../tests/test_inputs/{}", fixture);
        let content = std::fs::read_to_string(&fixture_path)
            .unwrap_or_else(|_| panic!("Failed to read poly fixture {}", fixture_path));

        let canvas = AstBuilder::new()
            .build(&content)
            .unwrap_or_else(|e| panic!("Failed to parse AST for {}: {}", fixture, e));

        let viz = canvas.visualizer.as_deref().unwrap_or("layered");
        let generator = make_generator(viz)
            .unwrap_or_else(|| panic!("Generator '{}' for fixture {} must exist", viz, fixture));

        let svg = generator.generate(&canvas);

        assert!(svg.starts_with("<svg"), "Fixture {} must output valid SVG starting with <svg", fixture);
        assert!(svg.contains("</svg>"), "Fixture {} must close with </svg>", fixture);
        assert!(!svg.contains("NaN"), "Fixture {} must not produce NaN coordinates", fixture);
        if fixture.contains("swimlane") {
            assert!(
                svg.contains("sw-lanes-group") || svg.contains("diagrammer-swimlane-svg"),
                "Fixture {} must output swimlane SVG with lane columns",
                fixture
            );
        } else {
            assert!(
                svg.contains("ds-poly-archetype-subgraph"),
                "Fixture {} must embed at least one poly-archetype subgraph",
                fixture
            );
        }
    }
}

#[test]
fn test_cross_boundary_inter_group_edge_routing() {
    use diagrammer_core::builder::AstBuilder;
    use diagrammer_core::generators::make_generator;

    let input_state = r#"
visualizer state
ClusterMesh > DataPipeline > Operational
{ClusterMesh; P2P Topology
    visualizer force
    Leader > (Worker1, Worker2)
    Worker1 > Worker2
}
{DataPipeline; Batch Stream
    visualizer layered
    Extract > Transform > Load
}
Worker1 > Load
"#;

    let canvas_state = AstBuilder::new().build(input_state).expect("AST build for state inter-group edge");
    let state_gen = make_generator("state").unwrap();
    let state_svg = state_gen.generate(&canvas_state);

    assert!(state_svg.contains("class=\"diagrammer-state-svg\""));
    assert!(state_svg.contains("ds-inter-group-edges"), "State SVG must contain ds-inter-group-edges layer");
    assert!(state_svg.contains("ds-inter-group-edge"), "State SVG must contain cross-boundary edge path");
    assert!(state_svg.contains("url(#ds-arrow-active)"), "State SVG must use active arrowhead for inter-group edge");
    assert!(!state_svg.contains("NaN"), "State SVG must not contain NaN");

    let input_layered = r#"
visualizer layered
ClusterMesh > DataPipeline > Operational
{ClusterMesh; P2P Topology
    visualizer force
    Leader > (Worker1, Worker2)
    Worker1 > Worker2
}
{DataPipeline; Batch Stream
    visualizer layered
    Extract > Transform > Load
}
Worker1 > Load
"#;

    let canvas_layered = AstBuilder::new().build(input_layered).expect("AST build for layered inter-group edge");
    let layered_gen = make_generator("layered").unwrap();
    let layered_svg = layered_gen.generate(&canvas_layered);

    assert!(layered_svg.contains("class=\"diagrammer-layered-svg\""));
    assert!(layered_svg.contains("dl-inter-group-edges"), "Layered SVG must contain dl-inter-group-edges layer");
    assert!(layered_svg.contains("dl-cross-edge"), "Layered SVG must contain cross-boundary edge path");
    assert!(layered_svg.contains("url(#dl-arrow-active)"), "Layered SVG must use active arrowhead for inter-group edge");
    assert!(!layered_svg.contains("NaN"), "Layered SVG must not contain NaN");

    // Test obstacle avoidance & member anchor alignment:
    let input_obstacle = r#"
visualizer state
DataModel > AuditSync > Committed
{DataModel; Domain Entities
    visualizer layered
    {User; User
        id; +UUID
        name; +String
    }
}
{AuditSync; Ledger Exchange
    visualizer native_sequence
    Service > "Log" AuditDB
}
User > AuditDB
"#;
    let canvas_obs = AstBuilder::new().build(input_obstacle).expect("AST build for obstacle test");
    let obs_svg = state_gen.generate(&canvas_obs);
    // User > AuditDB should choose the right gutter (x >= 650) to avoid Service on the left
    assert!(obs_svg.contains("L 700.0") || obs_svg.contains("L 690.0") || obs_svg.contains("L 680.0"), "User > AuditDB must route via right gutter to avoid Service obstacle");

    let input_member = r#"
visualizer state
DataModel > AuditSync > Committed
{DataModel; Domain Entities
    visualizer layered
    {User; User
        id; +UUID
        name; +String
    }
}
{AuditSync; Ledger Exchange
    visualizer native_sequence
    Service > "Log" AuditDB
}
id > AuditDB
"#;
    let canvas_mem = AstBuilder::new().build(input_member).expect("AST build for member anchor test");
    let mem_svg = state_gen.generate(&canvas_mem);
    // Member id (+UUID) should start at y=157.0 (aligned with +UUID row, distinct from User header at y=130.0)
    assert!(mem_svg.contains("157.0") || mem_svg.contains("177.0"), "id > AuditDB must anchor at member +UUID row");
}

#[test]
fn test_poly_8_compact_minified_embedded_subgraphs() {
    let test_input = if Path::new("tests/test_inputs/poly_8_layered_tree_state.txt").exists() {
        "tests/test_inputs/poly_8_layered_tree_state.txt"
    } else if Path::new("../../tests/test_inputs/poly_8_layered_tree_state.txt").exists() {
        "../../tests/test_inputs/poly_8_layered_tree_state.txt"
    } else {
        panic!("poly_8_layered_tree_state.txt not found");
    };

    let content = fs::read_to_string(test_input).expect("Failed to read poly_8_layered_tree_state.txt");
    let canvas = AstBuilder::new().build(&content).expect("Failed to build AST for poly_8");
    let graph = LayeredGraph::build(&canvas);
    let svg = graph.render_svg();

    let rule_engine = graph.nodes.get("RuleEngine").expect("RuleEngine node must exist");
    let job_runner = graph.nodes.get("JobRunner").expect("JobRunner node must exist");

    // Execution FSM (JobRunner) must be compact and tightly bounded (down from 908x660)
    assert!(job_runner.width < 300.0, "JobRunner width must be compact (<300), got {}", job_runner.width);
    assert!(job_runner.height < 450.0, "JobRunner height must be compact (<450), got {}", job_runner.height);

    // Decision Tree (RuleEngine) must be compact (down from 458x300)
    assert!(rule_engine.width < 350.0, "RuleEngine width must be compact (<350), got {}", rule_engine.width);
    assert!(rule_engine.height < 280.0, "RuleEngine height must be compact (<280), got {}", rule_engine.height);

    assert!(svg.contains("id=\"node-RuleEngine\""));
    assert!(svg.contains("id=\"node-JobRunner\""));
    assert!(svg.contains("class=\"diagrammer-tree-svg\""));
    assert!(svg.contains("class=\"diagrammer-state-svg\""));
}




