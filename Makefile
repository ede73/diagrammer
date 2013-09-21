#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js

state.js: state.lex
	@jison-lex $<
	@echo "exports.state=state;" >> state.js

state.all: state.lex lexmarker.txt state.grammar model/support.js model/model.js generators/*.js
	@cat $^ >$@

parser.js: state.all
	@jison $< -o $@
	#@uglifyjs tmp -c -m -o $@

all: state.js state.all parser.js
	@echo done
