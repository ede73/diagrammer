var fs = require('fs');
var path = require('path');
var myArgs = process.argv.slice(2);

var raw = fs.readFileSync(path.normalize("./" + myArgs[0]), 'utf8');
var s = require("./state.js");
//console.log(s)
var st = s.state
st.setInput(raw);
var h
while (h != "EOF" && h != 1) {
  h = st.lex()
  console.log("State:" + h + "(" + st.yytext + ")")
}
