include ../Makefile.commands

CORES =

MODEL_TSS=$(shell find ../model -maxdepth 1 -iname "*.ts")
MODEL_JSS:=$(MODEL_TSS:.ts=.js)

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean

all: model

%.js : %.ts
model: $(MODEL_JSS)

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

clean:
	@find ../model -name "*.map" -or -name "*.js" -delete
