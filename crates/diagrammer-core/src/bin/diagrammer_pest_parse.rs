use diagrammer_core::builder::AstBuilder;
use diagrammer_core::generators::make_generator;
use std::env;
use std::fs;
use std::io::{self, Read};
use std::path::Path;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    let mut input_file: Option<String> = None;
    let mut requested_generator: Option<String> = None;

    for arg in args.into_iter().skip(1) {
        if arg == "-" {
            // explicit stdin marker
        } else if Path::new(&arg).exists() && input_file.is_none() {
            input_file = Some(arg);
        } else if requested_generator.is_none() {
            requested_generator = Some(arg);
        }
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

    let canvas_res = if input.trim_start().starts_with("{\"__PSEUDOTYPE\":\"GraphCanvas\"") {
        serde_json::from_str::<diagrammer_core::ast::GraphCanvas>(&input)
            .map_err(|e| format!("Failed to parse AST JSON: {}", e))
    } else {
        AstBuilder::new().build(&input)
    };

    match canvas_res {
        Ok(canvas) => {
            if let Some(ref gen_name) = requested_generator {
                if let Some(generator) = make_generator(gen_name) {
                    print!("{}", generator.generate(&canvas));
                    return;
                } else {
                    eprintln!("Unknown generator '{}'", gen_name);
                    process::exit(4);
                }
            }

            match serde_json::to_string(&canvas) {
                Ok(json) => println!("{}", json),
                Err(e) => {
                    eprintln!("Serialization error: {}", e);
                    process::exit(2);
                }
            }
        }
        Err(e) => {
            eprintln!("Parse error: {}", e);
            process::exit(3);
        }
    }
}
