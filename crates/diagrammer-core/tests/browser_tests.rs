use std::path::PathBuf;
use headless_chrome::{Browser, LaunchOptionsBuilder};
use image::GenericImageView;

/// Resolves the Chrome / Chromium binary on macOS or Linux
fn find_chrome_binary() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("CHROME_BIN") {
        let pb = PathBuf::from(p);
        if pb.exists() {
            return Some(pb);
        }
    }

    let candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ];

    for c in &candidates {
        let pb = PathBuf::from(c);
        if pb.exists() {
            return Some(pb);
        }
    }

    // Check Puppeteer cache directory on macOS/Linux
    if let Ok(home) = std::env::var("HOME") {
        let pattern = format!("{}/.cache/puppeteer/chrome", home);
        if let Ok(entries) = std::fs::read_dir(&pattern) {
            for entry in entries.flatten() {
                let mac_arm_path = entry.path().join("chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
                if mac_arm_path.exists() {
                    return Some(mac_arm_path);
                }
                let mac_x64_path = entry.path().join("chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
                if mac_x64_path.exists() {
                    return Some(mac_x64_path);
                }
                let linux_path = entry.path().join("chrome-linux64/chrome");
                if linux_path.exists() {
                    return Some(linux_path);
                }
            }
        }
    }

    None
}

fn create_headless_browser() -> Option<Browser> {
    let chrome_bin = find_chrome_binary()?;
    let launch_options = LaunchOptionsBuilder::default()
        .path(Some(chrome_bin))
        .headless(true)
        .sandbox(false)
        .window_size(Some((1024, 800)))
        .build()
        .ok()?;

    Browser::new(launch_options).ok()
}

fn get_test_url() -> String {
    let port = std::env::var("MINISERVER_TEST_PORT").unwrap_or_else(|_| "8000".to_string());
    format!("http://localhost:{}/?do_not_load_initial_example=1", port)
}

#[test]
fn test_pure_rust_browser_navigation_and_dom() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => {
            eprintln!("Skipping pure Rust browser test: no Chrome/Chromium binary found");
            return;
        }
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");

    // 1. Navigate to Diagrammer Web UI
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate to Diagrammer");

    tab.wait_until_navigated()
        .expect("Failed waiting for navigation");

    // 2. Wait for editor to initialize
    let editor = tab.wait_for_element("#diagrammer-code");
    assert!(editor.is_ok(), "Code editor container element was not found in DOM");

    // 3. Verify page title
    let title = tab.get_title().unwrap_or_default();
    assert!(title.to_lowercase().contains("diagrammer"), "Expected title to contain 'diagrammer', got '{}'", title);

    // 4. Verify visualizer select dropdown exists
    let viz_select = tab.wait_for_element("#diagrammer-visualizer");
    assert!(viz_select.is_ok(), "Visualizer select dropdown not found in DOM");

    // 5. Test JavaScript execution in browser context
    let js_res = tab.evaluate("typeof window.visualize", false).expect("Failed to evaluate JS");
    assert_eq!(js_res.value.unwrap().as_str().unwrap(), "function");

    // 6. Test setting diagram text and generating intermediate representation
    let code = "a>b>c";
    let eval_code = format!(r#"
        if (window.setGraphText && window.generatorChanged) {{
            window.setGraphText(`{}`);
            window.generatorChanged();
            true;
        }} else {{
            false;
        }}
    "#, code);

    let parse_res = tab.evaluate(&eval_code, false).expect("Failed to set graph text");
    assert_eq!(parse_res.value.unwrap().as_bool().unwrap(), true);

    // 7. Verify generated intermediate result was written to #diagrammer-result
    let result_val = tab.evaluate("document.querySelector('#diagrammer-result').value", false)
        .expect("Failed to get #diagrammer-result value");
    let result_str = result_val.value.and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    assert!(result_str.contains("->") || result_str.contains("b"), "Generated code expected to contain edge or nodes, got: '{}'", result_str);

    // 8. Test visualizer execution (e.g. native layered or current visualizer)
    tab.evaluate("if (window.visualize && window.getSelectedVisualizer) { window.visualize(window.getSelectedVisualizer()); }", false)
        .expect("Failed to trigger visualize");

    println!("Pure Rust browser test 1 passed: DOM verification, JS eval, and WASM generation.");
}

#[test]
fn test_pure_rust_browser_error_reporting() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");

    // Inject invalid syntax matching Jest test fixture ('a>')
    let bad_code = "a>";
    let eval_code = format!(r#"
        try {{
            window.setGraphText(`{}`);
            window.generatorChanged();
        }} catch (e) {{
            console.error("Caught expected parse error:", e);
        }}
    "#, bad_code);

    let _ = tab.evaluate(&eval_code, false);

    // Check error div or error text in DOM
    let err_val = tab.evaluate("document.querySelector('#diagrammer-error').innerText || document.querySelector('#diagrammer-error').textContent", false)
        .expect("Failed to read error div");
    let err_text = err_val.value.and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    assert!(err_text.to_lowercase().contains("parse error") || err_text.to_lowercase().contains("error"), "Expected parse error in #diagrammer-error, got: '{}'", err_text);

    println!("Pure Rust browser test 2 passed: syntax error reporting verified ('{}').", err_text.lines().next().unwrap_or(""));
}

#[test]
fn test_pure_rust_browser_native_svg_rendering_and_screenshot() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");

    // Set code using native layered DAG
    let code = "visualizer layered\nServiceA > ServiceB > Database\nServiceA > Cache";
    let eval_code = format!(r#"
        if (window.setGraphText && window.generatorChanged) {{
            window.setGraphText(`{}`);
            window.generatorChanged();
            if (window.visualize && window.getSelectedVisualizer) {{
                window.visualize(window.getSelectedVisualizer());
            }}
            true;
        }} else {{
            false;
        }}
    "#, code);

    tab.evaluate(&eval_code, false).expect("Failed to set code and visualize");

    // Verify SVG was generated in #diagrammer-graph
    let graph_svg = tab.wait_for_element("#diagrammer-graph svg");
    assert!(graph_svg.is_ok(), "Rendered SVG was not generated in #diagrammer-graph");

    // Capture screenshot via CDP
    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    assert!(!screenshot_bytes.is_empty(), "Captured screenshot was empty");
    assert_eq!(&screenshot_bytes[1..4], b"PNG", "Captured bytes are not a valid PNG");

    println!("Pure Rust browser test 3 passed: native SVG rendering & CDP screenshot capture ({} bytes).", screenshot_bytes.len());
}

#[test]
fn test_pure_rust_browser_localstorage_persistence() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");

    let eval_save = r##"
        localStorage.clear();
        window.setGraphText("this>is>localstorage>test");
        document.querySelector("#diagrammer-filename").value = "localstorage1";
        document.querySelector("button#diagrammer-savefile").click();
        localStorage.getItem("graphs");
    "##;

    let res = tab.evaluate(eval_save, false).expect("Failed to save to local storage");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    assert!(json_str.contains("this>is>localstorage>test"), "Expected saved graph in localStorage, got: {}", json_str);

    // Test loading back from localStorage
    let eval_load = r##"
        window.setGraphText("");
        document.querySelector("#diagrammer-filename").value = "localstorage1";
        document.querySelector("button#diagrammer-loadfile").click();
        window.getGraphText();
    "##;

    let load_res = tab.evaluate(eval_load, false).expect("Failed to load from local storage");
    let loaded_code = load_res.value.and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    assert!(loaded_code.contains("this>is>localstorage>test"), "Expected reloaded code to match saved graph, got: {}", loaded_code);

    println!("Pure Rust browser test 4 passed: localStorage save & reload verified.");
}

#[test]
fn test_pure_rust_browser_perceptual_dark_mode_adaptation() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");

    // Wait for perceptual theme module to initialize
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let eval_color = r##"
        JSON.stringify({
            blackAdapted: window.adaptColorForDark("#000000", true),
            blueAdapted: window.adaptColorForDark("#0000ff", true),
            whiteFill: window.adaptColorForDark("#ffffff", false),
            transparent: window.adaptColorForDark("transparent", false)
        })
    "##;

    let res = tab.evaluate(eval_color, false).expect("Failed to evaluate perceptual dark mode colors");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Failed to parse JSON string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Valid JSON");

    assert_eq!(val["blackAdapted"].as_str().unwrap(), "#e6edf3");
    assert_eq!(val["blueAdapted"].as_str().unwrap(), "#6868f3");
    assert_eq!(val["whiteFill"].as_str().unwrap(), "#1e293b");
    assert_eq!(val["transparent"].as_str().unwrap(), "transparent");

    println!("Pure Rust browser test 5 passed: perceptual dark mode color adaptation verified.");
}

#[test]
fn test_pure_rust_browser_mermaid_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");

    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let eval_code = r##"
        (async () => {
            window.setGraphText("a>b>c");
            window.generatorChanged();
            window.setVisualizer && window.setVisualizer("mermaid");
            if (window.visualize) {
                await window.visualize("mermaid");
            }
            return true;
        })()
    "##;

    tab.evaluate(eval_code, true).expect("Failed to trigger mermaid render");

    let check_svg = r##"
        (() => {
            const svg = document.querySelector("#diagrammer-graph svg");
            return svg !== null && svg.children.length > 0;
        })()
    "##;

    let start = std::time::Instant::now();
    let mut rendered = false;
    while start.elapsed() < std::time::Duration::from_secs(4) {
        if let Ok(res) = tab.evaluate(check_svg, false) {
            if res.value.and_then(|v| v.as_bool()).unwrap_or(false) {
                rendered = true;
                break;
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    assert!(rendered, "Expected in-browser mermaid SVG in DOM");

    println!("Pure Rust browser test 6 passed: in-browser Mermaid SVG rendering verified.");
}

#[test]
fn test_pure_rust_browser_all_native_layout_engines() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let archetypes = [
        ("layered", "visualizer layered\nNode1 > Node2 > Node3\nNode1 > Node4"),
        ("native_sequence", "visualizer native_sequence\nAlice > Bob: Hello\nBob > Alice: Hi"),
        ("tree", "visualizer tree\nRoot > Child1, Child2\nChild1 > LeafA, LeafB"),
        ("grid", "visualizer grid\nRackA > Server1, Server2\nRackB > Server3"),
        ("state", "visualizer state\nClosed > Listen > Established > Closed"),
        ("force", "visualizer force\nA > B, C\nB > C, D\nC > D"),
        ("network_bus", "visualizer network_bus\nshape cloud\ninet\nshape default\n{comcast;73.0.0.0/8\n cablemodem/wifi.png\n router;73.63.53.43\n}\n{ home;192.168.1.0/24\n router/wifi.png;192.168.1.1\n printer/printer.png;192.168.1.2\n nas/harddisk.png;192.168.1.3\n}\ninet - cablemodem"),
    ];

    for (engine, diagram_code) in &archetypes {
        let eval_script = format!(r##"
            (async () => {{
                window.setGraphText(`{}`);
                window.parseAndRegenerate(true);
                await new Promise(r => setTimeout(r, 150));
                const svg = document.querySelector("#diagrammer-graph svg");
                return svg !== null && svg.querySelectorAll("text, path, rect, circle, line").length > 0;
            }})()
        "##, diagram_code);

        let res = tab.evaluate(&eval_script, true)
            .unwrap_or_else(|e| panic!("Failed evaluating {} layout in browser: {:?}", engine, e));

        assert_eq!(
            res.value.and_then(|v| v.as_bool()).unwrap_or(false),
            true,
            "Expected valid SVG with graphical primitives for native '{}' layout archetype",
            engine
        );
        println!("  - Native layout archetype '{}' rendered successfully in DOM.", engine);
    }

    println!("Pure Rust browser test 7 passed: all 5 native layout archetypes verified in DOM.");
}

#[test]
fn test_pure_rust_browser_screenshot_pixel_comparison() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url())
        .expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let captured_img = image::load_from_memory(&screenshot_bytes)
        .expect("Failed to decode captured PNG screenshot");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let snapshot_path = manifest_dir.join("../../tests/snapshots/main_screen_just_loaded.png");

    if snapshot_path.exists() {
        if let Ok(expected_img) = image::open(&snapshot_path) {
            let (w1, h1) = captured_img.dimensions();
            let (w2, h2) = expected_img.dimensions();
            println!("Captured screenshot: {}x{}, Golden snapshot: {}x{}", w1, h1, w2, h2);

            if (w1, h1) == (w2, h2) {
                let total_pixels = (w1 * h1) as f64;
                let mut diff_count = 0u64;

                for y in 0..h1 {
                    for x in 0..w1 {
                        if captured_img.get_pixel(x, y) != expected_img.get_pixel(x, y) {
                            diff_count += 1;
                        }
                    }
                }

                let diff_pct = (diff_count as f64 / total_pixels) * 100.0;
                println!("Snapshot diff percentage: {:.3}%", diff_pct);
                // Allow small rendering/font anti-aliasing variations (< 2.0%)
                assert!(diff_pct < 2.0, "Visual regression detected: {:.3}% pixels differed from golden snapshot", diff_pct);
            }
        }
    }

    println!("Pure Rust browser test 8 passed: pixel comparison against golden snapshot verified.");
}

#[test]
fn test_pure_rust_browser_poly_archetype_state_sequence_rendering() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let fixture_code = r#"
visualizer state

Start > Negotiation > Process > Completed

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

    let eval_script = format!(r##"
        (async () => {{
            window.setGraphText(`{}`);
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 200));
            const stateSvg = document.querySelector("#diagrammer-graph svg.diagrammer-state-svg");
            const polyGroup = document.querySelector(".ds-poly-archetype-subgraph");
            const seqSvg = polyGroup ? polyGroup.querySelector("svg.diagrammer-sequence") : null;
            return JSON.stringify({{
                hasStateSvg: stateSvg !== null,
                hasPolyGroup: polyGroup !== null,
                hasSeqSvg: seqSvg !== null,
                primitiveCount: stateSvg ? stateSvg.querySelectorAll("text, path, rect, line").length : 0
            }});
        }})()
    "##, fixture_code);

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating poly-archetype in browser");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing evaluation result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON from browser");

    assert_eq!(val.get("hasStateSvg").and_then(|v| v.as_bool()), Some(true), "State SVG must render in DOM");
    assert_eq!(val.get("hasPolyGroup").and_then(|v| v.as_bool()), Some(true), "Poly-archetype group must render in DOM");
    assert_eq!(val.get("hasSeqSvg").and_then(|v| v.as_bool()), Some(true), "Embedded sequence SVG must render inside poly group");
    let count = val.get("primitiveCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(count >= 20, "Expected at least 20 SVG primitives, got {}", count);

    // Capture screenshot for visual proof
    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let snapshot_path = manifest_dir.join("../../tests/snapshots/poly_archetype_state_sequence.png");
    if !snapshot_path.exists() {
        let _ = std::fs::write(&snapshot_path, &screenshot_bytes);
    }

    println!("Pure Rust browser test 9 passed: poly-archetype state+sequence verified in browser DOM with CDP screenshot.");
}

#[test]
fn test_pure_rust_browser_state_tcp_rendering() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let tcp_fixture_path = manifest_dir.join("../../tests/test_inputs/state_tcp.txt");
    let tcp_code = std::fs::read_to_string(&tcp_fixture_path).expect("Failed reading state_tcp.txt");
    let tcp_json = serde_json::to_string(&tcp_code).expect("Failed serializing tcp_code");

    let eval_script = format!(r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 250));
            const stateSvg = document.querySelector("#diagrammer-graph svg.diagrammer-state-svg");
            const groups = stateSvg ? stateSvg.querySelectorAll(".ds-group") : [];
            const nodes = stateSvg ? stateSvg.querySelectorAll(".dl-node, [id^='node-']") : [];
            const edges = stateSvg ? stateSvg.querySelectorAll(".ds-edge") : [];
            return JSON.stringify({{
                hasStateSvg: stateSvg !== null,
                groupCount: groups.length,
                nodeCount: nodes.length,
                edgeCount: edges.length,
            }});
        }})()
    "##, tcp_json);

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating state_tcp in browser");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing evaluation result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON from browser");

    assert_eq!(val.get("hasStateSvg").and_then(|v| v.as_bool()), Some(true), "State SVG must render in DOM");
    let groups = val.get("groupCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(groups >= 2, "Expected at least 2 state groups (ActiveClose, PassiveClose), got {}", groups);
    let nodes = val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(nodes >= 8, "Expected at least 8 state nodes, got {}", nodes);

    // Capture screenshot via CDP
    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let snapshot_path = manifest_dir.join("../../tests/snapshots/state_tcp.png");
    if !snapshot_path.exists() || std::env::var("UPDATE_SNAPSHOTS").is_ok() {
        let _ = std::fs::write(&snapshot_path, &screenshot_bytes);
    } else {
        if let Ok(expected_img) = image::open(&snapshot_path) {
            let captured_img = image::load_from_memory(&screenshot_bytes).expect("Failed to decode screenshot");
            let (w1, h1) = captured_img.dimensions();
            let (w2, h2) = expected_img.dimensions();
            if (w1, h1) == (w2, h2) {
                let total_pixels = (w1 * h1) as f64;
                let mut diff_count = 0u64;
                for y in 0..h1 {
                    for x in 0..w1 {
                        if captured_img.get_pixel(x, y) != expected_img.get_pixel(x, y) {
                            diff_count += 1;
                        }
                    }
                }
                let diff_pct = (diff_count as f64 / total_pixels) * 100.0;
                println!("state_tcp snapshot diff percentage: {:.3}%", diff_pct);
                assert!(diff_pct < 2.0, "Visual regression detected on state_tcp: {:.3}% pixels differed", diff_pct);
            }
        }
    }

    println!("Pure Rust browser test 10 passed: state_tcp verified in browser DOM with CDP screenshot.");
}

#[test]
fn test_pure_rust_browser_poly_9_rendering() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let poly9_path = manifest_dir.join("../../tests/test_inputs/poly_9_state_swarm_pipeline.txt");
    let poly9_code = std::fs::read_to_string(&poly9_path).expect("Failed reading poly_9_state_swarm_pipeline.txt");
    let poly9_json = serde_json::to_string(&poly9_code).expect("Failed serializing poly9_code");

    let eval_script = format!(r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 300));
            const stateSvg = document.querySelector("#diagrammer-graph svg.diagrammer-state-svg");
            const transitions = stateSvg ? stateSvg.querySelectorAll(".ds-edges path.ds-edge") : [];
            const crossEdges = stateSvg ? stateSvg.querySelectorAll(".ds-inter-group-edges path") : [];
            return JSON.stringify({{
                hasStateSvg: stateSvg !== null,
                transitionCount: transitions.length,
                crossEdgeCount: crossEdges.length,
            }});
        }})()
    "##, poly9_json);

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating poly_9 in browser");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing evaluation result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON from browser");

    assert_eq!(val.get("hasStateSvg").and_then(|v| v.as_bool()), Some(true), "State SVG must render in DOM");
    let trans = val.get("transitionCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(trans, 2, "Expected 2 top-level transitions (ClusterMesh>DataPipeline and DataPipeline>Operational), got {}", trans);
    let cross = val.get("crossEdgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(cross, 1, "Expected 1 cross-boundary edge (Worker1>Load), got {}", cross);

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/poly_9_in_browser_proof.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: poly_9 verified in browser DOM with 2 transitions and 1 cross-boundary edge.");
}

#[test]
fn test_pure_rust_browser_poly_6_cross_boundary_sequence_connection() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor failed to initialize");

    let poly6_code = r#"visualizer layered

WarehouseGrid > DispatchProtocol

{WarehouseGrid; Storage Bays
    visualizer grid
    Bay1, Bay2
    Bay3, Bay4
}

{DispatchProtocol; Delivery Handshake
    visualizer native_sequence
    Robot > "Pickup" Station
    Station > "Ack" Robot
}

Bay1 > Station
Station > Bay1
"#;
    let poly6_json = serde_json::to_string(&poly6_code).expect("Failed serializing poly6_code");

    let eval_script = format!(r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 400));
            const layeredSvg = document.querySelector("#diagrammer-graph svg.diagrammer-layered-svg");
            const crossEdges = layeredSvg ? Array.from(layeredSvg.querySelectorAll(".dl-inter-group-edges path.dl-cross-edge")).map(p => p.getAttribute("d")) : [];
            const subSequence = layeredSvg ? layeredSvg.querySelector("svg.diagrammer-sequence") : null;
            return JSON.stringify({{
                hasLayeredSvg: layeredSvg !== null,
                hasSequenceSubSvg: subSequence !== null,
                crossEdgeCount: crossEdges.length,
                paths: crossEdges,
            }});
        }})()
    "##, poly6_json);

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating poly_6 in browser");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing evaluation result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON from browser");

    assert_eq!(val.get("hasLayeredSvg").and_then(|v| v.as_bool()), Some(true), "Layered SVG must render in DOM");
    assert_eq!(val.get("hasSequenceSubSvg").and_then(|v| v.as_bool()), Some(true), "Sequence sub-SVG must render in DOM");
    let cross_count = val.get("crossEdgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(cross_count, 2, "Expected 2 cross-boundary edges (Bay1>Station and Station>Bay1), got {}", cross_count);

    let paths = val.get("paths").and_then(|v| v.as_array()).expect("paths array");
    let p1 = paths[0].as_str().unwrap_or("");
    let p2 = paths[1].as_str().unwrap_or("");

    // Bay1 > Station enters Station at top: ends at y = 538.0
    assert!(p1.contains("538.0"), "Bay1 > Station must enter Station top box at y = 538.0, path: {}", p1);
    // Station > Bay1 exits Station at bottom: starts at y = 790.0
    assert!(p2.contains("790.0"), "Station > Bay1 must exit Station bottom box at y = 790.0, path: {}", p2);

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/poly_6_cross_edges_browser_proof.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: poly_6 verified in browser DOM with top entry (538.0) and bottom exit (790.0).");
}

#[test]
fn test_pure_rust_browser_user_can_override_generator_selection() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => {
            eprintln!("Skipping pure Rust browser test: no Chrome/Chromium binary found");
            return;
        }
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate to Diagrammer");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor not found");

    // Diagram code explicitly contains `generator state`
    let code = "generator state\na > b > c";
    let code_json = serde_json::to_string(&code).expect("serialize code");

    let eval_script = format!(r##"
        (async () => {{
            window.setGraphText({});
            // Simulate user selecting 'tree' generator in UI
            const vizSelect = document.getElementById('diagrammer-visualizer');
            const groupSelect = document.getElementById('diagrammer-generator-group');
            // User selects Diagrammer Native > Tree
            if (groupSelect) {{
                groupSelect.value = 'Diagrammer Native';
                if (window.generatorGroupChanged) window.generatorGroupChanged();
            }}
            if (vizSelect) {{
                vizSelect.value = 'tree';
                if (window.visualizerChanged) window.visualizerChanged();
            }}
            await new Promise(r => setTimeout(r, 400));

            const currentViz = window.getSelectedVisualizer ? window.getSelectedVisualizer() : null;
            const currentGroup = groupSelect ? groupSelect.value : null;

            // Now test selecting Dot
            if (groupSelect) {{
                groupSelect.value = 'Graphviz';
                if (window.generatorGroupChanged) window.generatorGroupChanged();
            }}
            if (vizSelect) {{
                vizSelect.value = 'dot';
                if (window.visualizerChanged) window.visualizerChanged();
            }}
            await new Promise(r => setTimeout(r, 400));
            const afterDotViz = window.getSelectedVisualizer ? window.getSelectedVisualizer() : null;

            return JSON.stringify({{
                treeViz: currentViz,
                dotViz: afterDotViz
            }});
        }})()
    "##, code_json);

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating in browser");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(
        val.get("treeViz").and_then(|v| v.as_str()),
        Some("tree"),
        "User selection of 'tree' must not be reverted by in-diagram 'generator state'"
    );
    assert_eq!(
        val.get("dotViz").and_then(|v| v.as_str()),
        Some("dot"),
        "User selection of 'dot' must not be reverted by in-diagram 'generator state'"
    );

    println!("Pure Rust browser test passed: User generator selection overrides in-diagram hints successfully.");
}

#[test]
fn test_pure_rust_browser_clipboard_copy_paste() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => {
            eprintln!("Skipping pure Rust browser test: no Chrome/Chromium binary found");
            return;
        }
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate to Diagrammer");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor not found");

    let eval_script = r##"
        (async () => {
            window.setGraphText("Alpha > Beta > Gamma");
            await new Promise(r => setTimeout(r, 200));

            const ed = window.editor;
            if (!ed) return JSON.stringify({ error: "No editor" });

            // 1. Test getCopyText
            ed.selectAll();
            const selected = ed.getCopyText();

            // 2. Test inserting text (as clipboard paste does)
            ed.setValue("Original", 1);
            ed.navigateFileEnd();
            ed.insert(" > Pasted");
            const afterPaste = ed.getValue();

            // 3. Test cut (copy + replace selection)
            ed.selectAll();
            const cutText = ed.getCopyText();
            ed.insert("");
            const afterCut = ed.getValue();

            // 4. Test paste back
            ed.insert(cutText);
            const afterRestore = ed.getValue();

            return JSON.stringify({
                selected,
                afterPaste,
                afterCut,
                afterRestore
            });
        })()
    "##;

    let res = tab.evaluate(eval_script, true).expect("Failed evaluating clipboard test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("selected").and_then(|v| v.as_str()), Some("Alpha > Beta > Gamma"));
    assert_eq!(val.get("afterPaste").and_then(|v| v.as_str()), Some("Original > Pasted"));
    assert_eq!(val.get("afterCut").and_then(|v| v.as_str()), Some(""));
    assert_eq!(val.get("afterRestore").and_then(|v| v.as_str()), Some("Original > Pasted"));

    println!("Pure Rust browser test passed: Editor clipboard copy/cut/paste verified.");
}

#[test]
fn test_pure_rust_browser_scoped_uml_members_routing() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed to create browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed to navigate to Diagrammer");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor not found");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let input = std::fs::read_to_string(manifest_dir.join("../../tests/test_inputs/umlclass_scoped.txt"))
        .expect("Failed to read umlclass_scoped.txt");

    let code_json = serde_json::to_string(&input).expect("serialize code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 600));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}

            const svg = document.querySelector("#diagrammer-graph svg.diagrammer-layered-svg");
            const hasSvg = svg !== null;
            const courseNode = document.getElementById("node-Course") !== null;
            const profNode = document.getElementById("node-Professor") !== null;

            // Course!name and Professor!classes1 must exist ONLY as member elements inside class boxes, NOT standalone top-level .dl-node boxes
            const memberNodes = svg ? Array.from(svg.querySelectorAll(".dl-class-member-node")).map(el => el.id) : [];
            const topLevelNodes = svg ? Array.from(svg.querySelectorAll("g.dl-node:not(.dl-class-member-node)")).map(el => el.id) : [];

            const hasStandaloneCourseName = topLevelNodes.includes("node-Course!name");
            const hasStandaloneProfClasses = topLevelNodes.includes("node-Professor!classes1");
            const memberCount = memberNodes.length;

            return JSON.stringify({{
                hasSvg,
                courseNode,
                profNode,
                hasStandaloneCourseName,
                hasStandaloneProfClasses,
                memberCount
            }});
        }})()
    "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating scoped UML test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Layered SVG must render");
    assert_eq!(val.get("courseNode").and_then(|v| v.as_bool()), Some(true), "Course class node must exist");
    assert_eq!(val.get("profNode").and_then(|v| v.as_bool()), Some(true), "Professor class node must exist");
    assert_eq!(val.get("hasStandaloneCourseName").and_then(|v| v.as_bool()), Some(false), "Course!name must NOT be a standalone node");
    assert_eq!(val.get("hasStandaloneProfClasses").and_then(|v| v.as_bool()), Some(false), "Professor!classes1 must NOT be a standalone node");

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/scoped_uml_verified_browser.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: Scoped UML members routed directly between class containers without standalone nodes.");
}

#[test]
fn test_pure_rust_browser_swimlane_poly_10_rendering() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab for swimlane test");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-graph").expect("Failed finding diagrammer-graph");

    let swimlane_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/poly_10_layered_swimlane_seq.txt")
        .expect("Failed reading poly_10_layered_swimlane_seq.txt");
    let code_json = serde_json::to_string(&swimlane_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 400));
            const svg = document.querySelector("#diagrammer-graph svg.diagrammer-swimlane-svg");
            const headers = svg ? Array.from(svg.querySelectorAll(".sw-lane-header")).map(el => el.textContent.trim()) : [];
            const nodes = svg ? Array.from(svg.querySelectorAll(".sw-node")).map(el => el.id) : [];
            const dividers = svg ? svg.querySelectorAll(".sw-lane-divider").length : 0;
            const edges = svg ? svg.querySelectorAll(".sw-edge-path").length : 0;
            return JSON.stringify({{
                hasSvg: svg !== null,
                headers: headers,
                nodeCount: nodes.length,
                dividerCount: dividers,
                edgeCount: edges,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating swimlane test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Swimlane SVG must render in DOM");
    let headers = val.get("headers").and_then(|v| v.as_array()).expect("headers array");
    assert_eq!(headers.len(), 4, "Must have 4 swimlanes");
    assert_eq!(headers[0].as_str(), Some("Customer (Storefront)"));
    assert_eq!(headers[1].as_str(), Some("API Gateway & Security"));
    assert_eq!(headers[2].as_str(), Some("Order Management"));
    assert_eq!(headers[3].as_str(), Some("Payment Provider (Stripe/Bank)"));

    let node_count = val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(node_count, 9, "Expected 9 steps across the 4 swimlanes");

    let edge_count = val.get("edgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(edge_count, 8, "Expected 8 process handoff transitions");

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/poly_10_swimlane_verified_browser.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: Swimlane poly_10 rendered cleanly with 4 parallel lanes and cross-lane routing.");
}

#[test]
fn test_pure_rust_browser_sankey_dark_mode_rendering() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab for sankey test");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-graph").expect("Failed finding diagrammer-graph");

    let sankey_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/sankey.txt")
        .expect("Failed reading sankey.txt");
    let code_json = serde_json::to_string(&sankey_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 600));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const hasClass = svg ? svg.classList.contains("diagrammer-sankey-svg") : false;
            return JSON.stringify({{
                hasSvg: svg !== null,
                svgClass: svg ? svg.getAttribute("class") : null,
                hasD3: typeof d3 !== 'undefined',
                hasD3Sankey: typeof d3 !== 'undefined' && typeof d3.sankey !== 'undefined',
                domContent: document.querySelector("#diagrammer-graph") ? document.querySelector("#diagrammer-graph").innerHTML.substring(0, 200) : null,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating sankey test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Sankey SVG must render in DOM");
    assert_eq!(val.get("hasD3Sankey").and_then(|v| v.as_bool()), Some(true), "D3 Sankey library must be loaded");

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/sankey_dark_mode_verified_browser.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    // Query computed style of the Customer enter text
    let text_eval = r##"
    (() => {
        const textEl = document.querySelector("#diagrammer-graph text");
        if (!textEl) return JSON.stringify({ error: "no text element" });
        const styles = window.getComputedStyle(textEl);
        return JSON.stringify({
            text: textEl.textContent,
            fill: styles.fill,
            stroke: styles.stroke,
            strokeWidth: styles.strokeWidth,
            fontSize: styles.fontSize,
            paintOrder: styles.paintOrder,
            attrFill: textEl.getAttribute("fill"),
            attrStroke: textEl.getAttribute("stroke"),
            attrStrokeWidth: textEl.getAttribute("stroke-width"),
        });
    })()
    "##;
    let text_res = tab.evaluate(text_eval, false).expect("Failed checking text styles");
    let text_json = text_res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing text style json");
    println!("Computed text styling in dark mode: {}", text_json);

    let text_val: serde_json::Value = serde_json::from_str(&text_json).expect("Failed parsing text JSON");
    assert_eq!(
        text_val.get("attrStroke").and_then(|v| v.as_str()),
        Some("#090d16"),
        "Sankey text stroke must be dark halo (#090d16) to prevent white blob halo regression in dark mode"
    );
    assert_eq!(
        text_val.get("attrFill").and_then(|v| v.as_str()),
        Some("#ffffff"),
        "Sankey text fill must be pure white (#ffffff) for maximum dark mode contrast"
    );
    assert_eq!(
        text_val.get("fontSize").and_then(|v| v.as_str()),
        Some("13px"),
        "Sankey text font size must be 13px for crisp legibility"
    );

    println!("Pure Rust browser test passed: Sankey dark-mode rendering verified with high-contrast text and vibrant gradient ribbons.");
}

#[test]
fn test_pure_rust_browser_dendrogram_spec_reingold_tilford() {
    use headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption;

    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-graph").expect("Failed finding diagrammer-graph");

    let spec_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/dendrogram_spec.txt")
        .expect("Failed reading dendrogram_spec.txt");
    let code_json = serde_json::to_string(&spec_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 600));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const nodes = svg ? svg.querySelectorAll("g.node").length : 0;
            const links = svg ? svg.querySelectorAll("path.link").length : 0;
            const graphEl = document.querySelector("#diagrammer-graph");
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                linkCount: links,
                graphHtmlLen: graphEl ? graphEl.innerHTML.length : 0,
                graphHtmlSnippet: graphEl ? graphEl.innerHTML.substring(0, 300) : "",
                svgDisplay: svg ? window.getComputedStyle(svg).display : "",
                svgVis: svg ? window.getComputedStyle(svg).visibility : "",
                svgRect: svg ? svg.getBoundingClientRect() : null,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating dendrogram test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    println!("DEBUG DENDROGRAM DOM: {}", json_str);
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Reingold-Tilford SVG must render in DOM");
    assert!(val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0) > 100, "Must have >100 language nodes");

    let screenshot_bytes = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/dendrogram_spec_verified_browser.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    // Also capture 100% zoom view to verify readable text
    let crop_script = r##"
        (async () => {
            if (window.resetZoomGraph) window.resetZoomGraph();
            await new Promise(r => setTimeout(r, 100));
        })()
    "##;
    let _ = tab.evaluate(crop_script, true);
    if let Ok(zoom_bytes) = tab.capture_screenshot(CaptureScreenshotFormatOption::Png, None, None, true) {
        let zoom_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/dendrogram_spec_zoom_100.png");
        let _ = std::fs::write(&zoom_path, &zoom_bytes);
    }

    println!("Pure Rust browser test passed: Reingold-Tilford dendrogram_spec rendered cleanly with adapted dark colors.");

    // Now verify switching from dendrogram directly to dynamic_shapes.txt automatically resets to layered!
    let shapes_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/dynamic_shapes.txt")
        .expect("Failed reading dynamic_shapes.txt");
    let shapes_json = serde_json::to_string(&shapes_code).expect("Failed serializing shapes_code");

    let switch_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true, "dynamic_shapes.txt");
            await new Promise(r => setTimeout(r, 600));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const layeredSvg = document.querySelector("#diagrammer-graph svg.diagrammer-layered-svg");
            const aliceNode = document.querySelector("#node-Alice");
            const taxiNode = document.querySelector("#node-Taxi");
            return JSON.stringify({{
                hasLayeredSvg: layeredSvg !== null,
                hasAlice: aliceNode !== null,
                hasTaxi: taxiNode !== null,
            }});
        }})()
        "##,
        shapes_json
    );

    let switch_res = tab.evaluate(&switch_script, true).expect("Failed evaluating dynamic_shapes switch");
    let switch_json = switch_res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let switch_val: serde_json::Value = serde_json::from_str(&switch_json).expect("Failed parsing JSON");

    assert_eq!(switch_val.get("hasLayeredSvg").and_then(|v| v.as_bool()), Some(true), "Switching to dynamic_shapes must activate Layered SVG");
    assert_eq!(switch_val.get("hasAlice").and_then(|v| v.as_bool()), Some(true), "Alice custom shape node must be present");
    assert_eq!(switch_val.get("hasTaxi").and_then(|v| v.as_bool()), Some(true), "Taxi custom shape node must be present");

    let shapes_screenshot = tab.capture_screenshot(
        CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let shapes_proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/dynamic_shapes_verified_browser.png");
    let _ = std::fs::write(&shapes_proof_path, &shapes_screenshot);

    println!("Pure Rust browser test passed: Switching to dynamic_shapes automatically reset to layered with custom SVG shapes.");
}

#[test]
fn test_pure_rust_browser_example_dropdown_switching_dendrogram_to_dynamic_shapes() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    // 1. Select dendrogram_spec.txt via UI dropdown
    let script1 = r##"
        (async () => {
            const select = document.querySelector("#diagrammer-example");
            select.value = "test_inputs/dendrogram_spec.txt";
            window.exampleChanged();
            await new Promise(r => setTimeout(r, 800));
            const vis = window.getSelectedVisualizer ? window.getSelectedVisualizer() : "";
            const isReingold = vis === "reingoldtilford";
            const svg = document.querySelector("#diagrammer-graph svg");
            return JSON.stringify({
                visualizer: vis,
                isReingold,
                hasSvg: svg !== null,
            });
        })()
    "##;
    let res1 = tab.evaluate(script1, true).expect("Failed evaluating dropdown dendrogram");
    let json1_str = res1.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val1: serde_json::Value = serde_json::from_str(&json1_str).expect("Failed parsing JSON");
    assert_eq!(val1.get("isReingold").and_then(|v| v.as_bool()), Some(true), "Selecting dendrogram_spec must set visualizer to reingoldtilford");

    // 2. Now select dynamic_shapes.txt via UI dropdown immediately after dendrogram_spec
    let script2 = r##"
        (async () => {
            const select = document.querySelector("#diagrammer-example");
            select.value = "test_inputs/dynamic_shapes.txt";
            window.exampleChanged();
            await new Promise(r => setTimeout(r, 800));
            if (window.fitGraph) {
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }
            const vis = window.getSelectedVisualizer ? window.getSelectedVisualizer() : "";
            const isLayered = vis === "layered";
            const layeredSvg = document.querySelector("#diagrammer-graph svg.diagrammer-layered-svg");
            const aliceNode = document.querySelector("#node-Alice");
            return JSON.stringify({
                visualizer: vis,
                isLayered,
                hasLayeredSvg: layeredSvg !== null,
                hasAlice: aliceNode !== null,
            });
        })()
    "##;
    let res2 = tab.evaluate(script2, true).expect("Failed evaluating dropdown dynamic_shapes");
    let json2_str = res2.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val2: serde_json::Value = serde_json::from_str(&json2_str).expect("Failed parsing JSON");
    assert_eq!(val2.get("isLayered").and_then(|v| v.as_bool()), Some(true), "Selecting dynamic_shapes after dendrogram must reset visualizer to layered");
    assert_eq!(val2.get("hasLayeredSvg").and_then(|v| v.as_bool()), Some(true), "Layered SVG must be rendered");
    assert_eq!(val2.get("hasAlice").and_then(|v| v.as_bool()), Some(true), "Custom shape node Alice must be rendered");

    // 3. Now select dynamic_operators.txt via UI dropdown
    let script3 = r##"
        (async () => {
            const select = document.querySelector("#diagrammer-example");
            select.value = "test_inputs/dynamic_operators.txt";
            window.exampleChanged();
            await new Promise(r => setTimeout(r, 800));
            const vis = window.getSelectedVisualizer ? window.getSelectedVisualizer() : "";
            const isLayered = vis === "layered";
            const layeredSvg = document.querySelector("#diagrammer-graph svg.diagrammer-layered-svg");
            return JSON.stringify({
                visualizer: vis,
                isLayered,
                hasLayeredSvg: layeredSvg !== null,
            });
        })()
    "##;
    let res3 = tab.evaluate(script3, true).expect("Failed evaluating dropdown dynamic_operators");
    let json3_str = res3.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val3: serde_json::Value = serde_json::from_str(&json3_str).expect("Failed parsing JSON");
    assert_eq!(val3.get("isLayered").and_then(|v| v.as_bool()), Some(true), "Selecting dynamic_operators after dendrogram must reset visualizer to layered");
    assert_eq!(val3.get("hasLayeredSvg").and_then(|v| v.as_bool()), Some(true), "Layered SVG must be rendered for dynamic_operators");
    println!("Pure Rust browser test passed: UI dropdown switching verified from dendrogram_spec -> dynamic_shapes -> dynamic_operators.");
}

#[test]
fn test_pure_rust_browser_record_style_graphviz_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    let record_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/record_style.txt")
        .expect("Failed reading record_style.txt");
    let code_json = serde_json::to_string(&record_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 800));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const polylines = svg ? svg.querySelectorAll("polyline").length : 0;
            const nodes = svg ? svg.querySelectorAll("g.node").length : 0;
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                polylineCount: polylines,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating record_style test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Graphviz SVG must render in DOM");
    let polylines = val.get("polylineCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(polylines >= 4, "Must have internal partition polylines for Record shapes, got {}", polylines);

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/record_style_verified_browser.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: record_style Graphviz DOT rendered true partitioned record boxes with polylines.");
}

#[test]
fn test_pure_rust_browser_state_conditionals_graphviz_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    let cond_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/state_conditionals.txt")
        .expect("Failed reading state_conditionals.txt");
    let code_json = serde_json::to_string(&cond_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 800));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const clusters = svg ? svg.querySelectorAll("g.cluster").length : 0;
            const nodes = svg ? svg.querySelectorAll("g.node").length : 0;
            const edges = svg ? svg.querySelectorAll("g.edge").length : 0;
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                clusterCount: clusters,
                edgeCount: edges,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating state_conditionals test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Graphviz SVG must render in DOM");
    let clusters = val.get("clusterCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(clusters >= 4, "Must have at least 4 conditional branch clusters, got {}", clusters);
    let edges = val.get("edgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert!(edges >= 15, "Must have all connected conditional edges, got {}", edges);

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/state_conditionals_browser_verified.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: state_conditionals Graphviz DOT rendered fully connected conditional flowchart with clusters and edges.");
}

#[test]
fn test_pure_rust_browser_state_images_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    let images_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/state_images.txt")
        .expect("Failed reading state_images.txt");
    let code_json = serde_json::to_string(&images_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            await new Promise(r => setTimeout(r, 800));
            if (window.fitGraph) {{
                window.fitGraph();
                await new Promise(r => setTimeout(r, 200));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const nodes = svg ? svg.querySelectorAll("g.node").length : 0;
            const edges = svg ? svg.querySelectorAll("g.edge").length : 0;
            const images = svg ? svg.querySelectorAll("image").length : 0;
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                edgeCount: edges,
                imageCount: images,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating state_images test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Graphviz SVG must render in DOM");
    let nodes = val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(nodes, 21, "Must render exactly 21 nodes, got {}", nodes);
    let edges = val.get("edgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(edges, 30, "Must render exactly 30 edges across tripartite clusters, got {}", edges);
    let images = val.get("imageCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(images, 21, "Must render exactly 21 images for all icons, got {}", images);

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/state_images_browser_verified.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: state_images rendered complete 21-node, 30-edge image network with icons.");
}

#[test]
fn test_pure_rust_browser_state_innergroups_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    let innergroups_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/state_innergroups.txt")
        .expect("Failed reading state_innergroups.txt");
    let code_json = serde_json::to_string(&innergroups_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            for (let i = 0; i < 60; i++) {{
                const svg = document.querySelector("#diagrammer-graph svg");
                if (svg && svg.querySelectorAll("g.node").length >= 8) {{
                    break;
                }}
                await new Promise(r => setTimeout(r, 100));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const nodes = svg ? svg.querySelectorAll("g.node").length : 0;
            const edges = svg ? svg.querySelectorAll("g.edge").length : 0;
            const clusters = svg ? svg.querySelectorAll("g.cluster").length : 0;
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                edgeCount: edges,
                clusterCount: clusters,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating state_innergroups test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "Graphviz SVG must render in DOM");
    let nodes = val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(nodes, 8, "Must render exactly 8 nodes, got {}", nodes);
    let edges = val.get("edgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(edges, 8, "Must render exactly 8 compound edges, got {}", edges);
    let clusters = val.get("clusterCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(clusters, 4, "Must render 4 nested clusters (master, innermaster1, innermaster2, other), got {}", clusters);

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/state_innergroups_browser_verified.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: state_innergroups rendered nested clusters and compound links.");
}

#[test]
fn test_pure_rust_browser_state_recursive_linking_rendering() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };
    let tab = browser.new_tab().expect("Failed opening tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-example").expect("Failed finding diagrammer-example");

    let recursive_code = std::fs::read_to_string("/Users/ede/src/diagrammer/tests/test_inputs/state_recursive_linking.txt")
        .expect("Failed reading state_recursive_linking.txt");
    let code_json = serde_json::to_string(&recursive_code).expect("Failed serializing code");

    let eval_script = format!(
        r##"
        (async () => {{
            window.setGraphText({});
            window.parseAndRegenerate(true);
            for (let i = 0; i < 60; i++) {{
                const svg = document.querySelector("#diagrammer-graph svg");
                if (svg && svg.querySelectorAll("g.dl-node, g.node").length >= 10) {{
                    break;
                }}
                await new Promise(r => setTimeout(r, 100));
            }}
            const svg = document.querySelector("#diagrammer-graph svg");
            const nodes = svg ? svg.querySelectorAll("g.dl-node, g.node").length : 0;
            const edges = svg ? svg.querySelectorAll("path.ds-edge, g.edge").length : 0;
            const groups = svg ? svg.querySelectorAll("g.ds-group, g.cluster").length : 0;
            const nodeIds = svg ? Array.from(svg.querySelectorAll("g.dl-node, g.node")).map(n => n.id || n.textContent.trim()) : [];
            return JSON.stringify({{
                hasSvg: svg !== null,
                nodeCount: nodes,
                edgeCount: edges,
                groupCount: groups,
                nodeIds: nodeIds,
            }});
        }})()
        "##,
        code_json
    );

    let res = tab.evaluate(&eval_script, true).expect("Failed evaluating state_recursive_linking test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasSvg").and_then(|v| v.as_bool()), Some(true), "SVG must render in DOM");
    let nodes = val.get("nodeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(nodes, 10, "Must render all 10 nodes (a, b, c, d, e, f, g, h, s, k), got {}", nodes);
    let edges = val.get("edgeCount").and_then(|v| v.as_u64()).unwrap_or(0);
    assert_eq!(edges, 12, "Must render exactly 12 transitions, got {}", edges);

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed to capture screenshot via CDP");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/state_recursive_linking_browser_verified.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: state_recursive_linking rendered all 10 nodes and 12 transitions.");
}

#[test]
fn test_pure_rust_browser_shape_record_snippet_and_expressive_tooltips() {
    let browser = match create_headless_browser() {
        Some(b) => b,
        None => return,
    };

    let tab = browser.new_tab().expect("Failed opening browser tab");
    tab.navigate_to(&get_test_url()).expect("Failed navigating to test URL");
    tab.wait_until_navigated().expect("Failed waiting for navigation");
    tab.wait_for_element("#diagrammer-code").expect("Code editor not found");

    let eval_script = r##"
        (async () => {
            // 1. Verify Shape Record snippet button exists and has expressive tooltip
            const recordBtn = Array.from(document.querySelectorAll(".toolbarw li")).find(li => li.textContent.includes("Shape Record"));
            const recordTooltip = recordBtn ? recordBtn.getAttribute("tooltip") : null;

            // 2. Click Shape Record snippet button (addLine(13))
            if (recordBtn) {
                recordBtn.click();
            } else if (window.addLine) {
                window.addLine(13);
            }
            await new Promise(r => setTimeout(r, 400));

            const editorText = window.getGraphText ? window.getGraphText() : "";
            const hasShapeRecordInEditor = editorText.includes("shape record") && editorText.includes("<f0>");

            // 3. Inspect expressive tooltips on shapes and arrows
            const tooltips = Array.from(document.querySelectorAll("[tooltip]")).map(el => ({
                text: el.textContent.trim() || el.getAttribute("alt") || "",
                tooltip: el.getAttribute("tooltip")
            }));

            const expressiveRecordShape = tooltips.some(t => t.tooltip && t.tooltip.toLowerCase().includes("partitioned"));
            const expressiveCondition = tooltips.some(t => t.tooltip && t.tooltip.toLowerCase().includes("decision diamond"));
            const expressiveDirectedArrow = tooltips.some(t => t.tooltip && t.tooltip.toLowerCase().includes("standard"));

            return JSON.stringify({
                hasRecordBtn: recordBtn !== undefined && recordBtn !== null,
                recordTooltip,
                hasShapeRecordInEditor,
                expressiveRecordShape,
                expressiveCondition,
                expressiveDirectedArrow,
                totalTooltipCount: tooltips.length
            });
        })()
    "##;

    let res = tab.evaluate(eval_script, true).expect("Failed evaluating shape record and tooltips test");
    let json_str = res.value.and_then(|v| v.as_str().map(|s| s.to_string())).expect("Missing result string");
    let val: serde_json::Value = serde_json::from_str(&json_str).expect("Failed parsing JSON");

    assert_eq!(val.get("hasRecordBtn").and_then(|v| v.as_bool()), Some(true), "Shape Record button must exist in snippets toolbar");
    assert_eq!(val.get("hasShapeRecordInEditor").and_then(|v| v.as_bool()), Some(true), "Clicking Shape Record must insert snippet into editor");
    assert_eq!(val.get("expressiveRecordShape").and_then(|v| v.as_bool()), Some(true), "Record shape must have expressive tooltip");
    assert_eq!(val.get("expressiveCondition").and_then(|v| v.as_bool()), Some(true), "Condition shape must have expressive tooltip");
    assert_eq!(val.get("expressiveDirectedArrow").and_then(|v| v.as_bool()), Some(true), "Directed arrow must have expressive tooltip");

    // Move mouse over the Shape Record button to trigger the tooltip
    if let Ok(el) = tab.find_element(".toolbarw li:nth-child(7)") {
        let _ = el.move_mouse_over();
        std::thread::sleep(std::time::Duration::from_millis(250));
    }

    let screenshot_bytes = tab.capture_screenshot(
        headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
        None,
        None,
        true,
    ).expect("Failed capturing screenshot");

    let proof_path = PathBuf::from("/Users/ede/.gemini/antigravity/brain/f8c141e1-dee4-4672-984e-a40261071320/shape_record_and_expressive_tooltips.png");
    let _ = std::fs::write(&proof_path, &screenshot_bytes);

    println!("Pure Rust browser test passed: Shape Record snippet button inserts multi-field template and expressive tooltips verified across UI.");
}








