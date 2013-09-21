#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
OUT=export

state.js: state.lex
	@jison-lex $<
	@echo "exports.state=state;" >> $@

state.all: state.lex lexmarker.txt state.grammar model/support.js model/model.js generators/*.js
	@cat $^ >$@

parser.js: state.all
	@jison $< -o $@
	@mv $@ a;uglifyjs a -c -m -o $@;rm a

all: state.js state.all parser.js
	@echo done

.PHONY: export
export:
	for m in testStateLexer.js parse.js parser.js state.js; do uglifyjs $$m -o $$OUT/$m;done
	for m in generators/*js; do uglifyjs $$m -o $OUT/$$m;done

