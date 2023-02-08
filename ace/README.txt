//http://ace.c9.io/tool/mode_creator.html

//get form https://github.com/ajaxorg/ace-builds/archive/master.zip
//using dot as base

define(function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;

var DotHighlightRules = function() {

   var keywords = lang.arrayToMap(
        ("generator|visualizer|color|vertex|textcolor|group|color|group|end|group|link|color|link|textcolor|landscape|portrait|equal|shape|start").split("|")
   );
   var attributes = lang.arrayToMap(
        ("dotted|dashed|solid|bold|rounded|diagonals|invis|singularity|actor|beginpoint|box|circle|cloud|condition|database|default|diamond|dots|doublecircle|ellipse|endpoint|input|loopin|loopout|mail|minidiamond|minisquare|note|record|roundedbox|square|terminator|loop|loopend|loopstart|rect|rectangle").split("|")
   );
   var edges = lang.arrayToMap(
       ("</|/>|<.>|<->|<>|<-|<.|<|->|.>|>|-|.").split("|")
   );

   this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : /\/\/.*$/
            }, {
                token : "color",
                regex : /#[0-9A-Fa-f]{6}$/
            }, {
                token : "text",
                regex : /;.*$/
            }, {
                token : "comment", // multi line comment
                merge : true,
                regex : /\/\*/,
                next : "comment"
            }, {
                token : "string",
                regex : "'(?=.)",
                next  : "qstring"
            }, {
                token : "string",
                regex : '"(?=.)',
                next  : "qqstring"
            }, {
                token : "constant.numeric",
                regex : /[+\-]?\d+(?:(?:\.\d*)?(?:[eE][+\-]?\d+)?)?\b/
            }, {
                token : "keyword.operator",
                regex : /\+|=|\->/
            }, {
                token : "punctuation.operator",
                regex : /,|;/
            }, {
                token : "paren.lparen",
                regex : /[\[{]/
            }, {
                token : "paren.rparen",
                regex : /[\]}]/
            }, {
                token : "edge",
                regex : /<\/|\/>|<\.>|<->|<>|<-|<\.|<|->|\.>|>|-|\./
            }, {
                token : "variable",
                regex : /\$\([^\)]+\)/
            }, { 
                token: function(value) {
                    if (keywords.hasOwnProperty(value.toLowerCase())) {
                        return "keyword";
                    }
                    else if (attributes.hasOwnProperty(value.toLowerCase())) {
                        return "variable";
                    }
                    else if (edges.hasOwnProperty(value.toLowerCase())) {
                        return "edge";
                    }
                    else {
                        return "vertex";
                    }
                },
                regex: "\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*"
           }
        ],
        "comment" : [
            {
                token : "comment", // closing comment
                regex : ".*?\\*\\/",
                merge : true,
                next : "start"
            }, {
                token : "comment", // comment spanning whole line
                merge : true,
                regex : ".+"
            }
        ],
        "qqstring" : [
            {
                token : "string",
                regex : '[^"\\\\]+',
                merge : true
            }, {
                token : "string",
                regex : "\\\\$",
                next  : "qqstring",
                merge : true
            }, {
                token : "string",
                regex : '"|$',
                next  : "start",
                merge : true
            }
        ],
        "qstring" : [
            {
                token : "string",
                regex : "[^'\\\\]+",
                merge : true
            }, {
                token : "string",
                regex : "\\\\$",
                next  : "qstring",
                merge : true
            }, {
                token : "string",
                regex : "'|$",
                next  : "start",
                merge : true
            }
        ]
   };
};

oop.inherits(DotHighlightRules, TextHighlightRules);

exports.DotHighlightRules = DotHighlightRules;

});

