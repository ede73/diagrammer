include ../Makefile.commands

CORES =

JS_TSS=$(shell find ../js -maxdepth 1 -iname "*.ts" -and -not -name "go.d.ts")
JS_JSS:=$(JS_TSS:.ts=.js)

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean

all: js
	chmod u+x ./lex.js ./visualize.js ./generate.js ./runtests.js ./t.js

%.js : %.ts
js: $(JS_JSS)


 %.js: %.ts
	@$(TRANSPILE) $< $(S)

clean:
	@find ../js -name "*.map" -or -name "*.js" -delete
