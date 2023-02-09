const fs = require('fs');
const path = require('path');
const myArgs = process.argv.slice(2);

const raw = fs.readFileSync(path.normalize("./" + myArgs[0]), 'utf8');
const lexer = require("../build/diagrammer_lexer.js");
console.log(lexer);
const st = lexer.diagrammer_lexer;
st.setInput(raw);
let h
while (h != "EOF" && h != 1) {
  h = st.lex()
  console.log("State:" + h + "(" + st.yytext + ")")
}
