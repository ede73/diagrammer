#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js

state.js: state.lex
	@jison-lex $<
	@echo "exports.state=state;" >> $@
	@mv $@ a;uglifyjs a -c -m -o $@;rm a

state.all: state.lex lexmarker.txt state.grammar model/support.js model/model.js generators/*.js
	@cat $^ >$@

parser.js: state.all
	@jison $< -o $@
	@mv $@ a;uglifyjs a -c -m -o $@;rm a

all: state.js state.all parser.js
	@echo done

.PHONY: export
export: state.js parse.js parser.js
	@sed '/EXPORTREMOVE/{n;d;}' t.sh |grep -v '#EXPORTREMOVE' > export/t.sh
	@cp COPYRIGHT.txt export
	${foreach f,$^,$(shell uglifyjs $f -o export/$f -c -m)}
	@echo 'Add alias depict="~/state/t.sh silent " to your profile/bashrc etc.' >export/README.txt
