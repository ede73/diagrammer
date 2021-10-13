//afterbody
getSavedFiles();
result = document.getElementById("result");
var vtimer = null;
var vdelay = 1000;

//Set to 0 to fall back to textarea(enable textarea in index.html)
var acemode = 1;

//get all
function getText() {
    if (acemode) {
        return editor.getSession().getValue();
    } else {
        return document.getElementById("editable").value;
    }
}

//replace all
function setText(data) {
    if (acemode) {
	//EDE:editor.destroy does not work reliably
        //editor.destroy();
	editor.selectAll();
        editor.insert(data);
    } else {
        document.getElementById("editable").value = data;
    }
}
//Add text to top of document
//try to maintain cursor position(TODO:fucked up)
function addTop(data) {
    if (acemode) {
        //using ace
        var cursor = editor.getCursorPosition();
        editor.navigateFileStart();
        editor.insert(data);
        //should roughly
        editor.getSession().getSelection().selectionLead.setPosition(cursor.column, cursor.row - data.split("\n").length + 1);
    } else {
        var comp = document.getElementById("editable");
        //using textarea
        comp.value = data + comp.value;
    }
}
//add text to current cursor position(on a new line how ever)
function appendLine(data,comp) {
    if (acemode) {
        //using ace insert text into wherever the cursor is pointing.
        editor.navigateLineEnd();
        //TODO: If this is empty line, no need for linefeed
        var cursor = editor.getCursorPosition();
        if (cursor.column > 1)
            editor.insert("\n");
        editor.insert(data.trim());
    } else {
        //using textarea
        comp.value = comp.value + data;
    }
}
function addLine(i) {
    if (typeof i == "string") {
        appendLine(i + "\n");
    } else
        switch (i) {
            case 1:
                appendLine("node#ff0000;Label here\n");
                break;
            case 2:
                appendLine("group color #7722ee\ngroup NAME;Label the group\n//Nodes\n  group InnerGroup#00ff00;Inner group\n  xy\n  group end\ngroup end\n");
                break;
            case 3:
                appendLine("x#ff0000>#00ff00y#0000ff\n");
                break;
            case 4:
                appendLine("a/barcode.png,b/basestation.png,c/battery.png>d/camera.png,e/cpu.png,f/documents.png\n" + "a1/harddisk.png,b1/keyboard.png,c1/laptop.png>d1/laser.png,e1/monitor.png,f1/mouse.png\n" + "a2/phone.png,b2/printer.png,c2/ram.png>d2/satellite.png,e2/scanner.png,f2/sim.png\n" + "u/usbmemory.png>w/wifi.png\n" + "a1/actor1.png>a2/actor2.png>a3/actor3.png");
                break;
            case 5:
                addTop("start NODENAME\n");
                break;
            case 6:
                appendLine("//shapes: default, invis, record, dots, actor, cloud\n" + "//beginpoint,endpoint,condition,database,terminator,input,loopin,loopout\n" + "//square,ellipse,diamond,minidiamond,note,mail\n" + "shape box\n");
                break;
            case 7:
                addTop("equal node1,node2\n");
                break;
            case 8:
                addTop("$(color1:#12ede0)\nclr$(color1)\nclr2$(color1)\n");
                break;
            case 9:
                appendLine("if something would happend then\n" + "  a1>b1\n" + "elseif something probably would not happen then\n" + " a2>b2\n" + "elseif or if i see a flying bird then\n" + " a3>b3\n" + "else\n" + "  a4>b4\n" + "endif\n");
                break;
        }
    console.log("getSavedFilesChanged..parse");
    parse(getText() + "\n", getGenerator());
    return false;
}

var win;
function openPicWindow() {
    win = window.open('web/result.png', 'extpic');
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
    if (win)
        win.location.reload();
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

/*
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
 */

function parse(generator, visualizer) {
    var data = getText() + "\n";
    console.log("parse " + generator + "," + visualizer);
    document.getElementById("error").innerText = "";
    parsingStarted = true;
    delete(parser.yy.GRAPHROOT);
    delete(parser.yy.LINKS);
    delete(parser.yy.OBJECTS);
    parser.yy.OUTPUT = generator;
    parser.yy.VISUALIZER = visualizer;
    console.log("Parse, set generator to " + parser.yy.OUTPUT + " visualizer to " + parser.yy.VISUALIZER);
    parser.parse(data);
    /*
     * var tc=textArea.textContent; parser.parse(tc+"\n"); highlight(tc);
     */
    cancelVTimer();
    vtimer = window.setTimeout(function () {
        vtimer = null;
        console.log("Visualize now using " + parser.yy.VISUALIZER);
        visualize(parser.yy.VISUALIZER);
    }, vdelay);
}

function generatorChanged() {
    console.log("generatorChanged..parse");
    parse(getGenerator(), getVisualizer());
}

function savedChanged() {
    // read the example...place to textArea(overwrite)
    var e = document.getElementById("saved");
    var doc = e.options[e.selectedIndex].value;
    var filename = document.getElementById("filename");
    var data = getSavedGraph();
    if (data[doc]) {
        setText(data[doc]);
        filename.value = doc;
        console.log("savedChanged..parse");
        parse();
    }
}

function exampleChanged() {
    // read the example...place to textArea(overwrite)
    var e = document.getElementById("example");
    var doc = e.options[e.selectedIndex].value;
    $.ajax({
        url: "tests/" + doc,
        cache: false
    }).done(function (data) {
            setText(data);
            console.log("exampleChanged..parse");
            parse();
        });
}

function textAreaOnChange(callback, delay) {
    var timer = null;
    document.getElementById("editable").onkeyup = function () { // onchange does not work on
        // chrome/mac(elsewhere?)
        if (timer) {
            window.clearTimeout(timer);
        }
        timer = window.setTimeout(function () {
            timer = null;
            callback(getGenerator(), getVisualizer());
        }, delay);
    };
    obj = null;
}
function visualizeOnChange(callback, delay) {
    var timer = null;
    var tt = document.getElementById("result");
    tt.onkeyup = function () { // onchange does not work on
        // chrome/mac(elsewhere?)
        if (timer) {
            window.clearTimeout(timer);
        }
        timer = window.setTimeout(function () {
            timer = null;
            callback(tt, getGenerator(), getVisualizer());
        }, delay);
    };
    obj = null;
}
textAreaOnChange(parse, 150);
visualizeOnChange(visualize, 250);
if (acemode) {
    var timer2 = null;
    // some init race condition, editor null on page load
    if (typeof editor != 'undefined') {
      editor.getSession().on('change', function () {
        // chrome/mac(elsewhere?)
          if (timer2) {
              window.clearTimeout(timer2);
          }
          timer = window.setTimeout(function () {
              timer2 = null;
              parse(getGenerator(), getVisualizer());
          }, delay);
      });
    }
}
