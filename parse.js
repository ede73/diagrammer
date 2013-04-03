var fs         = require('fs');
var path       = require('path');
var myArgs =process.argv.slice(2);

//var parserSource = generator.generate({moduleName: "state"});
//The moduleName you specify can also include a namespace, 
//var parserSource = parser.generate({moduleName: "myCalculator.parser"});
var raw = fs.readFileSync(path.normalize("./"+myArgs[0]), 'utf8');
if (false){
	var lexer=require("./state.js");
	//LEX
	var st=lexer.state
	st.setInput(raw);
	var h
	while(h!="EOF" && h!=1){
	  h=st.lex()
	  console.log("State:"+h+"("+st.yytext+")")
	}
}else{
	var parser=require("./parser.js");
	parser.parser.yy.OUTPUT=myArgs[1];
	parser.parser.trace=function(x){console.log(x);}
	parser.parse(raw);
}
