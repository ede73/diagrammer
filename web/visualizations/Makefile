include ../../Makefile.commands

CORES =

WEB_VISUALIZATION_TSS=$(shell find ../visualizations -maxdepth 1 -iname "*.ts")
WEB_VISUALIZATION_JSS:=$(WEB_VISUALIZATION_TSS:.ts=.js)

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean

all: web_visualizations

%.js: %.ts
web_visualizations: $(WEB_VISUALIZATION_JSS)

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

clean:
	@find ../visualizations -name "*.map" -or -name "*.js" -delete
