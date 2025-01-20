CORES =

GRAMMAR_FILES = ./diagrammer.lex ./lexmarker.txt ./diagrammer.grammar

export PATH := $(CURDIR)/../node_modules/.bin:$(PATH)
TRANSPILER=tsc
TRANSPILEOPTIONS=--module es6 --esModuleInterop --target es2017 --allowJs --removeComments --strict --checkJs --skipLibCheck
TRANSPILE=$(TRANSPILER) $(TRANSPILEOPTIONS)
ESLINT=eslint -f stylish --fix
LEXER=jison-lex
OUTDIR=../build

.PHONY: clean

all: lexer_and_grammar

js/%.js : js/%.ts

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

# Not actively used, but you can build and test just the lexer while developing
$(OUTDIR)/diagrammer_lexer.js: diagrammer.lex
	@echo "  Build Lexer"
	@mkdir -p build
	$(LEXER) $< -o $@ >/dev/null
	@echo "exports.diagrammerLexer=diagrammerLexer;" >> $@
	@#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

# nicer to carry around than build target
just_lexer: $(OUTDIR)/diagrammer_lexer.js

# Jison considers lexer/parser separate, we combine to one file
$(OUTDIR)/diagrammer.all: $(GRAMMAR_FILES)
	@mkdir -p $(OUTDIR)
	@echo Compile $(OUTDIR)/diagrammer.all
	@cat $^ >$@

# nicer to carry around than build target
lexer_and_grammar: $(OUTDIR)/diagrammer.all just_lexer
	echo 'Build lexer and grammar'

clean:
	@find ../generators -name "*.map" -or -name "*.js" -delete
