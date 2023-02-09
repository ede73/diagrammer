//Usage: (typically called from t.sh or CLI in general, web uses parser.js directly via index.js)
//Usage: node js/diagrammer.js [verbose] inputFile [lex] digraph|nwdiag|actdiag|blockdiag|plantuml_sequence >output
//Usage: node js/diagrammer.js verbose tests/state_group.txt ast

const fs = require('fs');
const path = require('path');
let myArgs = process.argv.slice(2);

VERBOSE = false;
if (myArgs[0] === "verbose") {
    VERBOSE = true;
    myArgs = myArgs.slice(1);
}

const raw = fs.readFileSync(path.normalize("./" + myArgs[0]), 'utf8');
let errors = 0

if (myArgs[1] === "lex") {
    const lexer = require("../build/state.js");
    //LEX
    const st = lexer.state
    st.setInput(raw);
    let h;
    while (h != "EOF" && h != 1) {
        h = st.lex()
        console.log("State:" + h + "(" + st.yytext + ")")
    }
} else {
    const parser = require("../build/parser.js");
    // TODO: MOVING TO GraphCanvas
    parser.parser.yy.USE_GENERATOR = myArgs[1];
    // TODO: MOVING TO GraphCanvas
    parser.parser.trace = function (x) {
        console.log("TRACE:" + x);
    }
    // TODO: MOVING TO GraphCanvas
    parser.parser.debug = function (x) {
        console.log("DEBUG:" + x);
    }
    // TODO: MOVING TO GraphCanvas
    parser.parser.yy.result = function (result) {
        console.log(result);
    }

    //this.parseError(errStr, 
    //{text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
    // TODO: MOVING TO GraphCanvas
    parser.parser.yy.parseError = function (str, hash) {
        console.log("Parsing error found:");
        console.log(str);
        console.log(hash);
        errors = 1
        throw new Error(str);
    };
    parser.parse(raw);
    if (errors == 1) {
        console.log("Errors....");
        process.exit(9)
    }
    process.exit(0)
}
