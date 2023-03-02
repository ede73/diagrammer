ace.define('ace/mode/state', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/matching_brace_outdent', 'ace/mode/state_highlight_rules', 'ace/mode/folding/cstyle'], function (require, exports, module) {
  const oop = require('../lib/oop')
  const TextMode = require('./text').Mode
  const Tokenizer = require('../tokenizer').Tokenizer
  const MatchingBraceOutdent = require('./matching_brace_outdent').MatchingBraceOutdent
  const StateHighlightRules = require('./state_highlight_rules').StateHighlightRules
  const StateFoldMode = require('./folding/cstyle').FoldMode

  const Mode = function () {
    const highlighter = new StateHighlightRules()
    this.$outdent = new MatchingBraceOutdent()
    this.foldingRules = new StateFoldMode()
    this.$tokenizer = new Tokenizer(highlighter.getRules())
  }
  oop.inherits(Mode, TextMode);

  (function () {
    this.lineCommentStart = ['//', '#']
    this.blockComment = { start: '/*', end: '*/' }

    this.getNextLineIndent = function (state, line, tab) {
      let indent = this.$getIndent(line)

      const tokenizedLine = this.$tokenizer.getLineTokens(line, state)
      const tokens = tokenizedLine.tokens
      const endState = tokenizedLine.state

      if (tokens.length && tokens[tokens.length - 1].type == 'comment') {
        return indent
      }

      if (state == 'start') {
        const match = line.match(/^.*(?:\bcase\b.*\:|[\{\(\[])\s*$/)
        if (match) {
          indent += tab
        }
      }

      return indent
    }

    this.checkOutdent = function (state, line, input) {
      return this.$outdent.checkOutdent(line, input)
    }

    this.autoOutdent = function (state, doc, row) {
      this.$outdent.autoOutdent(doc, row)
    }
  }).call(Mode.prototype)

  exports.Mode = Mode
})

ace.define('ace/mode/matching_brace_outdent', ['require', 'exports', 'module', 'ace/range'], function (require, exports, module) {
  const Range = require('../range').Range

  const MatchingBraceOutdent = function () {};

  (function () {
    this.checkOutdent = function (line, input) {
      if (!/^\s+$/.test(line)) { return false }

      return /^\s*\}/.test(input)
    }

    this.autoOutdent = function (doc, row) {
      const line = doc.getLine(row)
      const match = line.match(/^(\s*\})/)

      if (!match) return 0

      const column = match[1].length
      const openBracePos = doc.findMatchingBracket({ row, column })

      if (!openBracePos || openBracePos.row == row) return 0

      const indent = this.$getIndent(doc.getLine(openBracePos.row))
      doc.replace(new Range(row, 0, row, column - 1), indent)
    }

    this.$getIndent = function (line) {
      return line.match(/^\s*/)[0]
    }
  }).call(MatchingBraceOutdent.prototype)

  exports.MatchingBraceOutdent = MatchingBraceOutdent
})
ace.define('ace/mode/state_highlight_rules', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/lib/lang', 'ace/mode/text_highlight_rules', 'ace/mode/doc_comment_highlight_rules'], function (require, exports, module) {
/// ////////////
  // define(function(require, exports, module) {
  // "use strict";

  const oop = require('../lib/oop')
  const lang = require('../lib/lang')
  const TextHighlightRules = require('./text_highlight_rules').TextHighlightRules
  // const DocCommentHighlightRules = require('./doc_comment_highlight_rules').DocCommentHighlightRules

  const StateHighlightRules = function () {
    const keywords = lang.arrayToMap(
      ('generator|visualizer|group|landscape|horizontal|portrait|vertical|equal|shape|start|if|else|then|while').split('|')
    )
    const attributes = lang.arrayToMap(
      ('dotted|dashed|solid|bold|rounded|diagonals|invis|singularity|actor|beginpoint|box|circle|cloud|condition|database|default|diamond|dots|doublecircle|ellipse|endpoint|input|loopin|loopout|mail|minidiamond|minisquare|note|record|roundedbox|square|terminator|loop|loopend|loopstart|rect|rectangle').split('|')
    )
    const edges = lang.arrayToMap(
      ('<<>> << >> <=> <.> <-> <> |-| |-| |=| |. |- |= .| -| =| </ />  <- <. <= < => -> .> > = - .').split(' ')
    )

    this.$rules = {
      start: [
        {
          token: 'comment',
          regex: /\/\/.*$/
        }, {
          token: 'color',
          regex: /#[0-9A-Fa-f]{6}$/
        }, {
          token: 'text',
          regex: /;.*$/
        }, {
          token: 'comment', // multi line comment
          merge: true,
          regex: /\/\*/,
          next: 'comment'
        }, {
          token: 'string',
          regex: "'(?=.)",
          next: 'qstring'
        }, {
          token: 'string',
          regex: '"(?=.)',
          next: 'qqstring'
        }, {
          token: 'constant.numeric',
          regex: /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/
        }, {
          token: 'paren.lparen',
          regex: /[[{]/
        }, {
          token: 'paren.rparen',
          regex: /[\]}]/
        }, {
          token: 'keyword.operator',
          regex: /<[/]|[/]>|<[.]>|<->|<>|<-|<[.]|<|->|[.]>|>|[-]/
        }, {
          token: 'variable',
          regex: /\$\([^)]+\)/
        }, {
          token: 'compass',
          regex: /:nw|:ne|:sw|:se|:n|:s|:e|:w/,
          caseInsensitive: true
        }, {
          token: function (value) {
            return 'keyword'
          },
          regex: /do([ ]|$)|until|group[ ]*end|end[ ]*if|end[ ]*while|else[ ]*if|edge color[ ]*#[0-9a-f]{6}|edge textcolor[ ]*#[0-9a-f]{6}|vertex color[ ]*#[0-9a-f]{6}|vertex textcolor[ ]*#[0-9a-f]{6}|group color[ ]*#[0-9a-f]{6}|edge color[ ]*\$\([^)]+\)|edge textcolor[ ]*\$\([^)]+\)|vertex color[ ]*\$\([^)]+\)|vertex textcolor[ ]*\$\([^)]+\)|group color[ ]*\$\([^)]+\)/,
          caseInsensitive: true
        }, {
          token: function (value) {
            if (keywords.hasOwnProperty(value.toLowerCase())) {
              return 'keyword'
            } else if (attributes.hasOwnProperty(value.toLowerCase())) {
              return 'variable'
            } else if (edges.hasOwnProperty(value.toLowerCase())) {
              return 'edge'
            } else {
              return 'constant'
              //                        return "punctuation.operator";
              //                        return "vertex";
            }
          },
          regex: '\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*'
        }
      ],
      comment: [
        {
          token: 'comment', // closing comment
          regex: '.*?\\*\\/',
          merge: true,
          next: 'start'
        }, {
          token: 'comment', // comment spanning whole line
          merge: true,
          regex: '.+'
        }
      ],
      qqstring: [
        {
          token: 'string',
          regex: '[^"\\\\]+',
          merge: true
        }, {
          token: 'string',
          regex: '\\\\$',
          next: 'qqstring',
          merge: true
        }, {
          token: 'string',
          regex: '"|$',
          next: 'start',
          merge: true
        }
      ],
      qstring: [
        {
          token: 'string',
          regex: "[^'\\\\]+",
          merge: true
        }, {
          token: 'string',
          regex: '\\\\$',
          next: 'qstring',
          merge: true
        }, {
          token: 'string',
          regex: "'|$",
          next: 'start',
          merge: true
        }
      ]
    }
  }

  oop.inherits(StateHighlightRules, TextHighlightRules)

  exports.StateHighlightRules = StateHighlightRules
})

ace.define('ace/mode/doc_comment_highlight_rules', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text_highlight_rules'], function (require, exports, module) {
  const oop = require('../lib/oop')
  const TextHighlightRules = require('./text_highlight_rules').TextHighlightRules

  const DocCommentHighlightRules = function () {
    this.$rules = {
      start: [{
        token: 'comment.doc.tag',
        regex: '@[\\w\\d_]+' // TODO: fix email addresses
      }, {
        token: 'comment.doc.tag',
        regex: '\\bTODO\\b'
      }, {
        defaultToken: 'comment.doc'
      }]
    }
  }

  oop.inherits(DocCommentHighlightRules, TextHighlightRules)

  DocCommentHighlightRules.getStartRule = function (start) {
    return {
      token: 'comment.doc', // doc comment
      regex: '\\/\\*(?=\\*)',
      next: start
    }
  }

  DocCommentHighlightRules.getEndRule = function (start) {
    return {
      token: 'comment.doc', // closing comment
      regex: '\\*\\/',
      next: start
    }
  }

  exports.DocCommentHighlightRules = DocCommentHighlightRules
})

ace.define('ace/mode/folding/cstyle', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/range', 'ace/mode/folding/fold_mode'], function (require, exports, module) {
  const oop = require('../../lib/oop')
  const Range = require('../../range').Range
  const BaseFoldMode = require('./fold_mode').FoldMode

  const FoldMode = exports.FoldMode = function (commentRegex) {
    if (commentRegex) {
      this.foldingStartMarker = new RegExp(
        this.foldingStartMarker.source.replace(/\|[^|]*?$/, '|' + commentRegex.start)
      )
      this.foldingStopMarker = new RegExp(
        this.foldingStopMarker.source.replace(/\|[^|]*?$/, '|' + commentRegex.end)
      )
    }
  }
  oop.inherits(FoldMode, BaseFoldMode);

  (function () {
    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/
    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/

    this.getFoldWidgetRange = function (session, foldStyle, row) {
      const line = session.getLine(row)
      var match = line.match(this.foldingStartMarker)
      if (match) {
        var i = match.index

        if (match[1]) { return this.openingBracketBlock(session, match[1], row, i) }

        return session.getCommentFoldRange(row, i + match[0].length, 1)
      }

      if (foldStyle !== 'markbeginend') { return }

      var match = line.match(this.foldingStopMarker)
      if (match) {
        var i = match.index + match[0].length

        if (match[1]) { return this.closingBracketBlock(session, match[1], row, i) }

        return session.getCommentFoldRange(row, i, -1)
      }
    }
  }).call(FoldMode.prototype)
})
