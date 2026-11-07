use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::env;
use std::fs;
use std::io::{self, Read, Write};
use std::path::Path;
use std::process::{self, Command, Stdio};

fn main() {
    let args: Vec<String> = env::args().collect();
    let mut input_file: Option<String> = None;
    let mut requested_generator: Option<String> = None;
    let mut output_file: Option<String> = None;
    let mut output_format: Option<String> = None;
    let mut visualize: bool = false;

    let mut i = 1;
    while i < args.len() {
        let arg = &args[i];
        if arg == "-" {
            // explicit stdin marker
        } else if arg == "-o" || arg == "--output" {
            i += 1;
            if i < args.len() {
                output_file = Some(args[i].clone());
                visualize = true;
            }
        } else if arg.starts_with("-o") {
            output_file = Some(arg[2..].to_string());
            visualize = true;
        } else if arg == "-T" || arg == "--format" {
            i += 1;
            if i < args.len() {
                output_format = Some(args[i].clone());
                visualize = true;
            }
        } else if arg.starts_with("-T") {
            output_format = Some(arg[2..].to_string());
            visualize = true;
        } else if arg == "-V" || arg == "--visualize" {
            visualize = true;
        } else if Path::new(arg).exists() && input_file.is_none() {
            input_file = Some(arg.clone());
        } else if requested_generator.is_none() {
            requested_generator = Some(arg.clone());
        }
        i += 1;
    }

    let input = if let Some(ref path) = input_file {
        match fs::read_to_string(path) {
            Ok(content) => content,
            Err(e) => {
                eprintln!("Failed to read input file '{}': {}", path, e);
                process::exit(1);
            }
        }
    } else {
        let mut buf = String::new();
        if let Err(e) = io::stdin().read_to_string(&mut buf) {
            eprintln!("Failed to read from stdin: {}", e);
            process::exit(1);
        }
        buf
    };

    let trimmed = input.trim_start();
    let canvas_res = if trimmed.starts_with('{') && trimmed.contains("\"__PSEUDOTYPE\"") && trimmed.contains("\"GraphCanvas\"") {
        serde_json::from_str::<diagrammer_core::ast::GraphCanvas>(&input)
            .map_err(|e| format!("Failed to parse AST JSON: {}", e))
    } else {
        AstBuilder::new().build(&input)
    };

    match canvas_res {
        Ok(canvas) => {
            let effective_gen = requested_generator
                .as_deref()
                .or(canvas.visualizer.as_deref())
                .unwrap_or("dot");

            if effective_gen == "ast" {
                match serde_json::to_string(&canvas) {
                    Ok(json) => println!("{}", json),
                    Err(e) => {
                        eprintln!("Serialization error: {}", e);
                        process::exit(2);
                    }
                }
                return;
            }

            let generator = match make_generator(effective_gen) {
                Some(g) => g,
                None => {
                    eprintln!("Unknown generator '{}'", effective_gen);
                    process::exit(4);
                }
            };

            let generated_text = generator.generate(&canvas);

            if visualize {
                let format = output_format.as_deref().unwrap_or("png");
                render_visualizer(effective_gen, &generated_text, format, output_file.as_deref());
            } else {
                print!("{}", generated_text);
            }
        }
        Err(e) => {
            eprintln!("Parse error: {}", e);
            process::exit(3);
        }
    }
}

fn render_visualizer(visualizer: &str, code: &str, format: &str, output_path: Option<&str>) {
    let mut cmd = match visualizer {
        "dot" | "digraph" | "fdp" | "neato" | "osage" | "twopi" | "sfdp" => {
            let bin = if visualizer == "digraph" { "dot" } else { visualizer };
            let mut c = Command::new(bin);
            c.arg("-q").arg(format!("-T{}", format));
            c
        }
        "mscgen" => {
            let mut c = Command::new("mscgen");
            c.arg("-i-").arg("-o-").arg(format!("-T{}", format));
            c
        }
        "actdiag" | "blockdiag" | "nwdiag" | "seqdiag" => {
            let mut c = Command::new(visualizer);
            c.arg("-a").arg(format!("-T{}", format));
            if Path::new("fonts/dejavu-sans-bold.ttf").exists() {
                c.arg("-f").arg("fonts/dejavu-sans-bold.ttf");
            }
            c.arg("-");
            if let Some(out) = output_path {
                c.arg(format!("-o{}", out));
            } else {
                c.arg("-o-");
            }
            c
        }
        "plantuml_sequence" => {
            let mut c = Command::new("java");
            c.arg("-Djava.awt.headless=true")
                .arg("-Xmx2048m")
                .arg("-jar")
                .arg("ext/plantuml.jar")
                .arg(format!("-t{}", format))
                .arg("-p");
            c
        }
        "mermaid_sequence" => {
            let mut c = Command::new("mmdc");
            c.arg("-e").arg(format).arg("-i-").arg("-o-");
            c
        }
        other => {
            eprintln!("Direct CLI visualization not supported for '{}'", other);
            process::exit(5);
        }
    };

    cmd.stdin(Stdio::piped());
    let redirect_stdout = output_path.is_none() || (visualizer != "actdiag" && visualizer != "blockdiag" && visualizer != "nwdiag" && visualizer != "seqdiag");
    if redirect_stdout {
        cmd.stdout(Stdio::piped());
    }

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to spawn visualizer command: {}", e);
            process::exit(6);
        }
    };

    if let Some(mut stdin) = child.stdin.take() {
        if let Err(e) = stdin.write_all(code.as_bytes()) {
            eprintln!("Failed to write to visualizer stdin: {}", e);
            process::exit(7);
        }
    }

    let output = match child.wait_with_output() {
        Ok(out) => out,
        Err(e) => {
            eprintln!("Failed waiting for visualizer process: {}", e);
            process::exit(8);
        }
    };

    if !output.status.success() {
        eprintln!("{}", String::from_utf8_lossy(&output.stderr));
        process::exit(output.status.code().unwrap_or(1));
    }

    if let Some(out_path) = output_path {
        if visualizer != "actdiag" && visualizer != "blockdiag" && visualizer != "nwdiag" && visualizer != "seqdiag" {
            if let Err(e) = fs::write(out_path, &output.stdout) {
                eprintln!("Failed to write output to '{}': {}", out_path, e);
                process::exit(9);
            }
        }
    } else {
        if let Err(e) = io::stdout().write_all(&output.stdout) {
            eprintln!("Failed to write to stdout: {}", e);
            process::exit(10);
        }
    }
}
