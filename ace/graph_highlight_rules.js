//https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode#wiki-commonTokens
//http://ace.ajax.org/tool/mode_creator.html
define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var JsonHighlightRules = function() {

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
    this.$rules = {
        "start" : [
            {
                token : "support.type", // shapes
                regex : /actor|beginpoint|box|circle|cloud|condition|database|default|diamond|dots|doublecircle|ellipse|endpoint|input|loopin|loopout|mail|minidiamond|minisquare|note|record|roundedbox|square|terminator|loop|loopend|loopstart|rect|rectangle/
            }, {
                token : "keyword.control",
                regex : /\{|\}|group end|equal|portait|landscape|lr|td|horizontal|vertical|generator|visualizer|start|group|shape/
            }, {
                /*styles*/
                token : "keyword.other",
                regex : /dotted|dashed|solid|bold|rounded|diagonals|invis|singularity/
            }, {
                token : "variable",
                regex : /\$\([^)]+\)/
            }, {
                token: "entity.other.attribute-name",
                regex: /[A-Za-z][A-Za-z_0-9]*/
            }, {
                token : "string", // single line
                regex : '"',
                next  : "string"
            }, {
                token : "comment.line.double-slash",
                regex : "^//[^\n]*"
            }, {
                token : "comment.line.double-slash",
                regex : ";[^\n]+"
            }, {
                token : "keyword.operator",
                regex : /<\/|\/>|<\.>|<->|<>|<-|<\.|<|->|.>|>|-|\./
            }, {
                token : "invalid.illegal", // single quoted strings are not allowed
                regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            }, {
                token : "invalid.illegal", // comments are not allowed
                regex : "\\/\\/.*$"
            }, {
                token : "paren.lparen",
                regex : "[[({]"
            }, {
                token : "paren.rparen",
                regex : "[\\])}]"
            }, {
                token : "text",
                regex : "\\s+"
            }
        ],
        "string" : [
            {
                token : "constant.language.escape",
                regex : /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
            }, {
                token : "string",
                regex : '[^"\\\\]+'
            }, {
                token : "string",
                regex : '"',
                next  : "start"
            }, {
                token : "string",
                regex : "",
                next  : "start"
            }
        ]
    };
    
};

oop.inherits(JsonHighlightRules, TextHighlightRules);

exports.JsonHighlightRules = JsonHighlightRules;
});
