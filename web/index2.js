//afterbody
getSavedFiles();
result = document.getElementById("result");
var vtimer = null;
var vdelay = 1000;
function addLine(i) {
	var d = document.getElementById("editable");
	if (typeof i=="string"){
		d.value=d.value+i+"\n";
	}else
	switch (i) {
	case 1:
		d.value = d.value + "node#ff0000;Label here\n";
		break;
	case 2:
		d.value = d.value
				+ "group color #7722ee\ngroup NAME;Label the group\n//Nodes\n  group InnerGroup#00ff00;Inner group\n  xy\n  group end\ngroup end\n";
		break;
	case 3:
		d.value = d.value + "x#ff0000>#00ff00y#0000ff\n";
		break;
	case 4:
		d.value = d.value
				+ "a/barcode.png,b/basestation.png,c/battery.png>d/camera.png,e/cpu.png,f/documents.png\n"
				+ "a1/harddisk.png,b1/keyboard.png,c1/laptop.png>d1/laser.png,e1/monitor.png,f1/mouse.png\n"
				+ "a2/phone.png,b2/printer.png,c2/ram.png>d2/satellite.png,e2/scanner.png,f2/sim.png\n"
				+ "u/usbmemory.png>w/wifi.png\n"
				+ "a1/actor1.png>a2/actor2.png>a3/actor3.png";
		break;
	case 5:
		d.value = "start NODENAME\n" + d.value;
		break;
	case 6:
		d.value = d.value
				+ "//shapes: default, invis, record, dots, actor, cloud\n"
				+ "//beginpoint,endpoint,condition,database,terminator,input,loopin,loopout\n"
				+ "//square,ellipse,diamond,minidiamond,note,mail\n"
				+ "shape box\n";
		break;
	case 7:
		d.value = "equal node1,node2\n" + d.value;
		break;
	case 8:
		d.value = "$(color1:#12ede0)\nclr$(color1)\nclr2$(color1)\n" + d.value;
		break;
	case 9:
		d.value = "if something would happend then\n"
+"  a1>b1\n"
+"elseif something probably would not happen then\n"
+" a2>b2\n"
+"elseif or if i see a flying bird then\n"
+" a3>b3\n"
+"else\n"
+"  a4>b4\n"
+"endif\n"
 + d.value;
		break;
	}
	console.log("getSavedFilesChanged..parse");
	parse(document.getElementById("editable"), getGenerator());
	return false;
}
function reloadImg(id) {
	var obj = document.getElementById(id);
	var src = obj.src;
	var pos = src.indexOf('?');
	if (pos >= 0) {
		src = src.substr(0, pos);
	}
	var date = new Date();
	obj.src = src + '?v=' + date.getTime();
	return false;
}
// Get currently selected generator
function getGenerator() {
	var e = document.getElementById("generator");
	var gen = e.options[e.selectedIndex].value;
	if (gen.indexOf(":") > -1)
		return gen.split(":")[0];
	return gen;
}
function getVisualizer() {
	var e = document.getElementById("generator");
	var gen = e.options[e.selectedIndex].value;
	if (gen.indexOf(":") > -1) {
		console.log("Return visualizer " + gen.split(":")[1]);
		return gen.split(":")[1];
	}
	console.log("Return visualizer " + gen);
	return gen;
}
function cancelVTimer() {
	if (vtimer) {
		window.clearTimeout(vtimer);
	}
}
function highlight(tc) {
	var s = document.getElementById("editable");
	s.innerHTML = tc.replace("->", "->>").replace(".>", ".>>").replace("<-",
			"<<-").replace("<.", "<<.").replace("<", "<<").replace(">", ">>")
			.replace("->>", '<text id="event">-&gt;</text>').replace(".>>",
					'<text id="event">.&gt;</text>').replace("<<-",
					'<text id="event">&lt;-</text>').replace("<<.",
					'<text id="event">&lt;.</text>').replace(">>",
					'<text id="event">&gt;</text>').replace("<<",
					'<text id="event">&lt;</text>');
}
function parse(textArea, generator, visualizer) {
	console.log("parse " + generator + "," + visualizer);
	document.getElementById("error").innerText = "";
	parsingStarted = true;
	delete (parser.yy.GRAPHROOT);
	delete (parser.yy.LINKS);
	delete (parser.yy.OBJECTS);
	parser.yy.OUTPUT = generator;
	parser.yy.VISUALIZER = visualizer;
	console.log("Parse, set generator to " + parser.yy.OUTPUT
			+ " visualizer to " + parser.yy.VISUALIZER);
	parser.parse(textArea.value + "\n");
	/*
	 * var tc=textArea.textContent; parser.parse(tc+"\n"); highlight(tc);
	 */
	cancelVTimer();
	vtimer = window.setTimeout(function() {
		vtimer = null;
		console.log("Visualize now using " + parser.yy.VISUALIZER);
		visualize(parser.yy.VISUALIZER);
	}, vdelay);
}
function generatorChanged() {
	console.log("generatorChanged..parse");
	parse(document.getElementById("editable"), getGenerator(), getVisualizer());
}
function savedChanged() {
	// read the example...place to textArea(overwrite)
	var e = document.getElementById("saved");
	var doc = e.options[e.selectedIndex].value;
	var filename = document.getElementById("filename");
	var data = getSavedGraph();
	if (data[doc]) {
		document.getElementById("editable").value = data[doc];
		filename.value = doc;
		console.log("savedChanged..parse");
		parse(document.getElementById("editable"));
	}
}
function exampleChanged() {
	// read the example...place to textArea(overwrite)
	var e = document.getElementById("example");
	var doc = e.options[e.selectedIndex].value;
	$.ajax({
		url : "tests/"+doc,
		cache : false
	}).done(function(data) {
		document.getElementById("editable").value = data;
		console.log("exampleChanged..parse");
		parse(document.getElementById("editable"));
	});
}

function delayedKeypressCallback(obj, callback, delay) {
	var timer = null;
	var tt = obj;
	obj.onkeyup = function() {// onchange does not work on
								// chrome/mac(elsewhere?)
		if (timer) {
			window.clearTimeout(timer);
		}
		timer = window.setTimeout(function() {
			timer = null;
			callback(tt, getGenerator(), getVisualizer());
		}, delay);
	};
	obj = null;
}

delayedKeypressCallback(document.getElementById("editable"), parse, 150);
delayedKeypressCallback(document.getElementById("result"), visualize, 250);
