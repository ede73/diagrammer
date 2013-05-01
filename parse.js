
var fs         = require('fs');
var path       = require('path');
var myArgs =process.argv.slice(2);

VERBOSE=false;
if (myArgs[0]==="verbose") {
  VERBOSE=true;
  myArgs=myArgs.slice(1);
}
//var parserSource = generator.generate({moduleName: "state"});
//The moduleName you specify can also include a namespace, 
//var parserSource = parser.generate({moduleName: "myCalculator.parser"});
var raw = fs.readFileSync(path.normalize("./"+myArgs[0]), 'utf8');
var errors=0

if (myArgs[1]==="lex"){
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
	parser.parser.trace=function(x){console.log("TRACE:"+x);}
	parser.parser.yy.result=function(result){
		console.log(result);
	}

//this.parseError(errStr, 
//{text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
	parser.parser.yy.parseError=function(str,hash){
		console.log("Parsing error:");
		console.log(str);
		console.log(hash);
		errors=1
		throw new Error(str);
	};
	parser.parse(raw);
        if (errors==1){
		console.log("Errors....");
		process.exit(9)
	}
	process.exit(0)
}
