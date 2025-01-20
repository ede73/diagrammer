include ../Makefile.commands

CORES =

GENERATOR_TSS=$(shell find ../generators -maxdepth 1 -iname "*.ts")
GENERATOR_JSS:=$(GENERATOR_TSS:.ts=.js)

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean

all: generators

%.js : %.ts
generators: $(GENERATOR_JSS)

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

clean:
	@find ../generators -name "*.map" -or -name "*.js" -delete
