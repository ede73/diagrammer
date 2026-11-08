use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::env;
use std::fs;
use std::io::{self, BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::process::{self, Command, Stdio};

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 && args[1] == "serve" {
        let port: u16 = if args.len() > 2 {
            args[2].parse().unwrap_or(8000)
        } else {
            8000
        };
        run_server(port);
        return;
    }

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
                if let Err(e) = render_visualizer(effective_gen, &generated_text, format, output_file.as_deref()) {
                    eprintln!("{}", e);
                    process::exit(1);
                }
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

fn render_visualizer(visualizer: &str, code: &str, format: &str, output_path: Option<&str>) -> Result<Vec<u8>, String> {
    let mut cmd = match visualizer {
        "dot" | "digraph" | "circo" | "fdp" | "neato" | "osage" | "patchwork" | "twopi" | "sfdp" | "ast_record" => {
            let bin = if visualizer == "digraph" || visualizer == "ast_record" { "dot" } else { visualizer };
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
            return Err(format!("Direct CLI visualization not supported for '{}'", other));
        }
    };

    cmd.stdin(Stdio::piped());
    let redirect_stdout = output_path.is_none() || (visualizer != "actdiag" && visualizer != "blockdiag" && visualizer != "nwdiag" && visualizer != "seqdiag");
    if redirect_stdout {
        cmd.stdout(Stdio::piped());
    }

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn visualizer command: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(code.as_bytes()).map_err(|e| format!("Failed to write to visualizer stdin: {}", e))?;
    }

    let output = child.wait_with_output().map_err(|e| format!("Failed waiting for visualizer process: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    if let Some(out_path) = output_path {
        if visualizer != "actdiag" && visualizer != "blockdiag" && visualizer != "nwdiag" && visualizer != "seqdiag" {
            fs::write(out_path, &output.stdout).map_err(|e| format!("Failed to write output to '{}': {}", out_path, e))?;
        }
    } else {
        io::stdout().write_all(&output.stdout).map_err(|e| format!("Failed to write to stdout: {}", e))?;
    }

    Ok(output.stdout)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };
        out.push(CHARSET[(b0 >> 2) as usize] as char);
        out.push(CHARSET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            out.push(CHARSET[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(CHARSET[(b2 & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

fn get_mime_type(filename: &str) -> &'static str {
    if filename.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if filename.ends_with(".wasm") {
        "application/wasm"
    } else if filename.ends_with(".js") {
        "text/javascript; charset=utf-8"
    } else if filename.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if filename.ends_with(".png") {
        "image/png"
    } else if filename.ends_with(".ico") {
        "image/x-icon"
    } else if filename.ends_with(".svg") {
        "image/svg+xml"
    } else if filename.ends_with(".json") {
        "application/json"
    } else if filename.ends_with(".txt") {
        "text/plain; charset=utf-8"
    } else {
        "application/octet-stream"
    }
}

fn run_server(port: u16) {
    let addr = format!("0.0.0.0:{}", port);
    let listener = match TcpListener::bind(&addr) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind server to {}: {}", addr, e);
            process::exit(1);
        }
    };
    println!("Diagrammer native server running on http://localhost:{}", port);

    for stream in listener.incoming() {
        if let Ok(mut stream) = stream {
            let _ = handle_connection(&mut stream);
        }
    }
}

fn handle_connection(stream: &mut TcpStream) -> io::Result<()> {
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line)? == 0 {
        return Ok(());
    }

    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Ok(());
    }
    let method = parts[0];
    let full_path = parts[1];

    let mut content_length = 0;
    loop {
        let mut line = String::new();
        let bytes_read = reader.read_line(&mut line)?;
        if bytes_read == 0 || line == "\r\n" || line == "\n" {
            break;
        }
        let lower = line.to_lowercase();
        if lower.starts_with("content-length:") {
            if let Some(val) = line.split(':').nth(1) {
                content_length = val.trim().parse::<usize>().unwrap_or(0);
            }
        }
    }

    let mut body = vec![0u8; content_length];
    if content_length > 0 {
        reader.read_exact(&mut body)?;
    }

    let path_and_query: Vec<&str> = full_path.splitn(2, '?').collect();
    let path = path_and_query[0];
    let query_str = path_and_query.get(1).copied().unwrap_or("");

    let mut visualizer = "dot".to_string();
    for param in query_str.split('&') {
        let kv: Vec<&str> = param.splitn(2, '=').collect();
        if kv.len() == 2 && kv[0] == "visualizer" {
            visualizer = kv[1].to_string();
        }
    }

    let cors_headers = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: access-control-allow-origin, content-type\r\nCache-Control: no-cache, no-store, must-revalidate\r\n";

    if method == "OPTIONS" {
        let resp = format!("HTTP/1.1 200 OK\r\n{}Content-Length: 0\r\n\r\n", cors_headers);
        stream.write_all(resp.as_bytes())?;
        return Ok(());
    }

    if method == "POST" && path == "/parse" {
        let body_str = String::from_utf8_lossy(&body);
        let canvas_res = AstBuilder::new().build(&body_str);
        match canvas_res {
            Ok(canvas) => match make_generator(&visualizer) {
                Some(generator) => {
                    let out = generator.generate(&canvas);
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\n{}Content-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
                        cors_headers,
                        out.len(),
                        out
                    );
                    stream.write_all(resp.as_bytes())?;
                }
                None => {
                    let err = format!("Unknown generator: {}", visualizer);
                    let resp = format!(
                        "HTTP/1.1 400 Bad Request\r\n{}Content-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
                        cors_headers,
                        err.len(),
                        err
                    );
                    stream.write_all(resp.as_bytes())?;
                }
            },
            Err(e) => {
                let err = format!("Parse error: {}", e);
                let resp = format!(
                    "HTTP/1.1 500 Internal Server Error\r\n{}Content-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
                    cors_headers,
                    err.len(),
                    err
                );
                stream.write_all(resp.as_bytes())?;
            }
        }
        return Ok(());
    }

    if method == "POST" && path == "/visualize" {
        let body_str = String::from_utf8_lossy(&body);
        let canvas_res = AstBuilder::new().build(&body_str);
        match canvas_res {
            Ok(canvas) => {
                let tmp_png = format!(
                    "/tmp/diag_{}_{}.png",
                    process::id(),
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos()
                );
                let generator = make_generator(&visualizer);
                let code = if let Some(g) = generator {
                    g.generate(&canvas)
                } else {
                    body_str.to_string()
                };

                match render_visualizer(&visualizer, &code, "png", Some(&tmp_png)) {
                    Ok(_) => {
                        if let Ok(bytes) = fs::read(&tmp_png) {
                            let _ = fs::remove_file(&tmp_png);
                            let b64 = base64_encode(&bytes);
                            let resp = format!(
                                "HTTP/1.1 200 OK\r\n{}Content-Type: image/png\r\nContent-Length: {}\r\n\r\n{}",
                                cors_headers,
                                b64.len(),
                                b64
                            );
                            stream.write_all(resp.as_bytes())?;
                        } else {
                            let err = "Failed to read generated PNG file";
                            let resp = format!(
                                "HTTP/1.1 500 Internal Server Error\r\n{}Content-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
                                cors_headers,
                                err.len(),
                                err
                            );
                            stream.write_all(resp.as_bytes())?;
                        }
                    }
                    Err(e) => {
                        let err = format!("Visualization error: {}", e);
                        let resp = format!(
                            "HTTP/1.1 500 Internal Server Error\r\n{}Content-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
                            cors_headers,
                            err.len(),
                            err
                        );
                        stream.write_all(resp.as_bytes())?;
                    }
                }
            }
            Err(e) => {
                let err = format!("Parse error: {}", e);
                let resp = format!(
                    "HTTP/1.1 500 Internal Server Error\r\n{}Content-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
                    cors_headers,
                    err.len(),
                    err
                );
                stream.write_all(resp.as_bytes())?;
            }
        }
        return Ok(());
    }

    if method == "POST" && path == "/saveExport" {
        let _ = fs::create_dir_all("web/exported");
        let _ = fs::write("web/exported/localstorage_default.json", &body);
        let resp = format!("HTTP/1.1 200 OK\r\n{}Content-Length: 0\r\n\r\n", cors_headers);
        stream.write_all(resp.as_bytes())?;
        return Ok(());
    }

    if method == "GET" && path == "/loadExport" {
        let content = fs::read_to_string("web/exported/localstorage_default.json").unwrap_or_default();
        let resp = format!(
            "HTTP/1.1 200 OK\r\n{}Content-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
            cors_headers,
            content.len(),
            content
        );
        stream.write_all(resp.as_bytes())?;
        return Ok(());
    }

    if method == "GET" || method == "HEAD" {
        let file_path = if path == "/" || path == "/index.html" {
            if Path::new("web/index.html").exists() {
                "web/index.html".to_string()
            } else {
                "index.html".to_string()
            }
        } else {
            let p = path.trim_start_matches('/').to_string();
            if !Path::new(&p).exists() && Path::new(&format!("web/{}", p)).exists() {
                format!("web/{}", p)
            } else {
                p
            }
        };

        if file_path.contains("..") {
            let resp = "HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n";
            stream.write_all(resp.as_bytes())?;
            return Ok(());
        }

        if let Ok(content) = fs::read(&file_path) {
            let content_type = get_mime_type(&file_path);
            let resp = format!(
                "HTTP/1.1 200 OK\r\n{}Content-Type: {}\r\nContent-Length: {}\r\n\r\n",
                cors_headers,
                content_type,
                content.len()
            );
            stream.write_all(resp.as_bytes())?;
            if method == "GET" {
                stream.write_all(&content)?;
            }
            return Ok(());
        } else {
            let resp = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
            stream.write_all(resp.as_bytes())?;
            return Ok(());
        }
    }

    let resp = "HTTP/1.1 405 Method Not Allowed\r\nContent-Length: 0\r\n\r\n";
    stream.write_all(resp.as_bytes())?;
    Ok(())
}
