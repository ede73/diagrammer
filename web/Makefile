include ../Makefile.commands

CORES =

WEB_TSS=$(shell find ../web -maxdepth 1 -iname "*.ts")
WEB_JSS:=$(WEB_TSS:.ts=.js)

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean

all: web

%.js : %.ts
web: $(WEB_JSS)

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

clean:
	@find ../web -name "*.map" -or -name "*.js" -delete -maxdepth 1
