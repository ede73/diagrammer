var fs         = require('fs');
var path       = require('path');
var raw = fs.readFileSync(path.normalize("./state.txt"), 'utf8');
var s=require("./state.js");
//console.log(s)
var st=s.state
st.setInput(raw);
var h
while(h!="EOF" && h!=1){
  h=st.lex()
  console.log("State:"+h+"("+st.yytext+")")
}
