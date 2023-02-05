#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
all: build/state.js build/state.all parser.js Makefile
	@echo Make ALL
	@echo done

build/state.js: state.lex
	@echo Make build/state.js from LEX
	@jison-lex $< -o $@
	@echo "exports.state=state;" >> $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

build/state.all: state.lex lexmarker.txt grammar/state.grammar model/support.js model/model.js model/graphobject.js model/node.js model/group.js model/graphroot.js model/link.js model/shapes.js model/subgraph.js model/tree.js generators/*.js
	@echo Compile build/state.all
	@cat $^ >$@

parser.js: build/state.all
	@echo make parser
	@jison $< -o $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

.PHONY: export
export: build/state.js parse.js parser.js
	@sed '/EXPORTREMOVE/{n;d;}' scripts/t.sh |grep -v -E '(^#|^[[:space:]]*$$)' > export/t.sh
	@cp COPYRIGHT.txt export
	${foreach f,$^,$(shell uglifyjs $f -o export/$f -c -m)}
	@echo 'Add alias depict="~/state/t.sh silent " to your profile/bashrc etc.\nYou need (depending) visualizers graphviz,mscgen,plantuml.jar,nwdiag,blockdiag,actdiag.\nplantuml requires java\nblockdiag etc. in http://blockdiag.com/en/blockdiag/introduction.html\nPlantuml from http://plantuml.sourceforge.net/\n' >export/README.txt

.PHONY: test
test: all
	./scripts/runtests.sh
	#Shortcut without need to define every occurance of test files
	@echo matches are "$(MATCHES)" dirnames are "$(DIRNAMES)"

clean:
	rm -f build/state.js build/state.all parser.js
