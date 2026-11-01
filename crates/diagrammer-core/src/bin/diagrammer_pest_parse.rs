use diagrammer_core::builder::AstBuilder;
use std::env;
use std::fs;
use std::io::{self, Read};
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    let input = if args.len() > 1 && args[1] != "-" {
        match fs::read_to_string(&args[1]) {
            Ok(content) => content,
            Err(e) => {
                eprintln!("Failed to read input file '{}': {}", args[1], e);
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

    match AstBuilder::new().build(&input) {
        Ok(canvas) => match serde_json::to_string(&canvas) {
            Ok(json) => println!("{}", json),
            Err(e) => {
                eprintln!("Serialization error: {}", e);
                process::exit(2);
            }
        },
        Err(e) => {
            eprintln!("Parse error: {}", e);
            process::exit(3);
        }
    }
}
