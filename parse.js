var fs         = require('fs');
var path       = require('path');
var myArgs =process.argv.slice(2);

//var parserSource = generator.generate({moduleName: "state"});
//The moduleName you specify can also include a namespace, 
//var parserSource = parser.generate({moduleName: "myCalculator.parser"});
var raw = fs.readFileSync(path.normalize("./"+myArgs[0]), 'utf8');
var VERBOSE=false;


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
	VERBOSE=true;
	parser.parser.yy.OUTPUT=myArgs[1];
	parser.parser.trace=function(x){console.log("TRACE:"+x);}
//this.parseError(errStr, 
//{text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
	parser.parser.yy.parseError=function(str,hash){
		console.log("Parsing error:");
		console.log(str);
		console.log(hash);
		throw new Error(str);
	};
	parser.parse(raw);
}
