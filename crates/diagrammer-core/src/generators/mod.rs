pub mod actdiag;
pub mod ast_record;
pub mod blockdiag;
pub mod dendrogram;
pub mod digraph;
pub mod layerbands;
pub mod mermaid_sequence;
pub mod mscgen;
pub mod nwdiag;
pub mod parsetree;
pub mod plantuml_sequence;
pub mod sankey;
pub mod seqdiag;
pub mod umlclass;

use crate::ast::GraphCanvas;

/// Generator trait producing target output text from a GraphCanvas AST
pub trait Generator {
    fn generate(&self, canvas: &GraphCanvas) -> String;
}

pub struct OutputFormatter {
    buffer: String,
    indent_level: usize,
}

impl Default for OutputFormatter {
    fn default() -> Self {
        Self::new()
    }
}

impl OutputFormatter {
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
            indent_level: 0,
        }
    }

    /// Output text with optional latent indentation (Some(true)) or dedentation beforehand (Some(false))
    pub fn lout(&mut self, text: &str, indent_or_dedent: Option<bool>) {
        if let Some(false) = indent_or_dedent {
            if self.indent_level > 0 {
                self.indent_level -= 1;
            }
        }

        for _ in 0..self.indent_level {
            self.buffer.push_str("    ");
        }
        self.buffer.push_str(text);
        self.buffer.push('\n');

        if let Some(true) = indent_or_dedent {
            self.indent_level += 1;
        }
    }

    pub fn dedent(&mut self) {
        if self.indent_level > 0 {
            self.indent_level -= 1;
        }
    }

    pub fn raw(&mut self, text: &str) {
        self.buffer.push_str(text);
        self.buffer.push('\n');
    }

    pub fn finish(self) -> String {
        self.buffer
    }
}

/// Helper matching model/support.ts multiAttrFmt:
/// Collects key-value attributes formatted with template "{0}",
/// appends non-empty extras, sorts them alphabetically, and returns "[ attr1, attr2 ]" or ""
pub fn multi_attr_fmt(attrs: &[(&str, Option<&str>, &str)], extras: &[String]) -> String {
    let mut formatted = Vec::new();
    for (_key, val_opt, fmt) in attrs {
        if let Some(val) = val_opt {
            if !val.trim().is_empty() {
                formatted.push(fmt.replace("{0}", val));
            }
        }
    }
    for extra in extras {
        if !extra.trim().is_empty() {
            formatted.push(extra.clone());
        }
    }
    if formatted.is_empty() {
        return String::new();
    }
    formatted.sort();
    format!("[ {} ]", formatted.join(", "))
}

/// Factory function to create a generator by visualizer name
pub fn make_generator(name: &str) -> Option<Box<dyn Generator>> {
    match name.to_lowercase().as_str() {
        "actdiag" => Some(Box::new(actdiag::ActDiag)),
        "ast_record" => Some(Box::new(ast_record::ASTRecord)),
        "blockdiag" => Some(Box::new(blockdiag::BlockDiag)),
        "circlepacked" | "dendrogram" | "radialdendrogram" | "reingoldtilford" => {
            Some(Box::new(dendrogram::Dendrogram))
        }
        "digraph" | "dot" => Some(Box::new(digraph::DiGraph)),
        "layerbands" => Some(Box::new(layerbands::LayerBands)),
        "mermaid_sequence" => Some(Box::new(mermaid_sequence::MermaidSequence)),
        "mscgen" => Some(Box::new(mscgen::MSCGen)),
        "nwdiag" => Some(Box::new(nwdiag::NWDiag)),
        "parsetree" => Some(Box::new(parsetree::ParseTree)),
        "plantuml_sequence" => Some(Box::new(plantuml_sequence::PlantUMLSequence)),
        "sankey" => Some(Box::new(sankey::Sankey)),
        "seqdiag" => Some(Box::new(seqdiag::SeqDiag)),
        "umlclass" => Some(Box::new(umlclass::UMLClass)),
        _ => None,
    }
}
