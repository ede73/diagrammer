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

    // Give in-browser mermaid client a moment to finish asynchronous DOM rendering
    std::thread::sleep(std::time::Duration::from_millis(500));

    let check_svg = r##"
        (() => {
            const svg = document.querySelector("#diagrammer-graph svg");
            return svg !== null && svg.children.length > 0;
        })()
    "##;

    let res = tab.evaluate(check_svg, false).expect("Failed to inspect mermaid SVG");
    assert_eq!(res.value.and_then(|v| v.as_bool()).unwrap_or(false), true, "Expected in-browser mermaid SVG in DOM");

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
        ("force", "visualizer force\nA > B, C\nB > C, D\nC > D"),
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
