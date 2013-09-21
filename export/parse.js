var fs=require("fs"),path=require("path"),myArgs=process.argv.slice(2);VERBOSE=!1,"verbose"===myArgs[0]&&(VERBOSE=!0,myArgs=myArgs.slice(1));var raw=fs.readFileSync(path.normalize("./"+myArgs[0]),"utf8"),errors=0;if("lex"===myArgs[1]){var lexer=require("./state.js"),st=lexer.state;st.setInput(raw);for(var h;"EOF"!=h&&1!=h;)h=st.lex(),console.log("State:"+h+"("+st.yytext+")")}else{var parser=require("./parser.js");parser.parser.yy.OUTPUT=myArgs[1],parser.parser.trace=function(r){console.log("TRACE:"+r)},parser.parser.yy.result=function(r){console.log(r)},parser.parser.yy.parseError=function(r,e){throw console.log("Parsing error:"),console.log(r),console.log(e),errors=1,new Error(r)},parser.parse(raw),1==errors&&(console.log("Errors...."),process.exit(9)),process.exit(0)}