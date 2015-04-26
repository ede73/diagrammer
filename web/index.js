console.log("Reset generator and visualizer");
VERBOSE = false;
parser.yy.parseError = function (str, hash) {
    var pe = "Parsing error:\n" + str + "\n" + hash;
    console.log("pe");
    document.getElementById("error").innerText = pe;
    cancelVTimer();
    throw new Error(str);
};
// called line by line...
parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("Parsing results coming in for " + parser.yy.OUTPUT + " / " + parser.yy.VISUALIZER);
        parsingStarted = false;
        result.value = "";
    }
    result.value = result.value + line + "\n";
}

parser.trace = function (x) {
    console.log("TRACE:" + x);
}

function openImage(imageUrl) {
    window.open(imageUrl + '?x=' + new Date().getTime());
}

function getSavedGraph() {
    var data = {};
    if (!localStorage.getItem("graphs")) {
        localStorage.setItem("graphs", JSON.stringify(data));
        return data;
    }
    var graph = localStorage.getItem("graphs");
    // console.log("Have graph"+graph);
    data = eval("(" + graph + ")");
    return data;
}

function getSavedFiles() {
    var t = "";
    for (var k in getSavedGraph()) {
        console.log("Stored file:" + k);
        t += '<option value="' + k + '">' + k + '</option>';
    }
    var e = document.getElementById("saved");
    e.innerHTML = t;
}

function save() {
    var filename = document.getElementById("filename").value;
    var editable = getText();
    var data = getSavedGraph();
    data[filename] = editable;
    var jd = JSON.stringify(data);
    localStorage.setItem("graphs", jd);
    // clipboardData.setData("text",jd);
}

function load() {
    var filename = document.getElementById("filename").value;
    var data = getSavedGraph();
    if (data[filename])
        setText(data[filename]);
}

function exportGraphs() {
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "web/saveExport.php",
        data: JSON.stringify(getSavedGraph()),
        contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            alert("Exported");
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });

}

function importGraphs() {
    $.ajax({
        type: "GET",
        async: true,
        cache: false,
        // url: "web/localstorage.json",
        url: "web/loadExport.php",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            // alert(JSON.stringify(msg));
            localStorage.setItem("graphs", JSON.stringify(msg));
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
}

function visualize(visualizer) {
    var statelang = document.getElementById("result").value;
    if (!visualizer)
        visualizer = getVisualizer();
    var visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: visualizeUrl,
        data: statelang,
        // data: {body:statelang},
        // contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            // UseReturnedData(msg.d);
            // alert(msg);
            document.getElementById("image").setAttribute("src", msg);
            reloadImg('image');
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
    if (visualizer == "dot") {
        try {
            document.getElementById('svg').innerHTML = Viz(statelang, 'svg');
        } catch (err) {
            console.log(err);
        }
        // try{
        // var canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
    } else if (visualizer == "dendrogram") {
	dendroit(result.value);
    } else {
        document.getElementById('svg').innerHTML = "only for dotty";
    }
}

function dendroit(parseResult) {
console.log(parseResult);
var radius = 250;
var root=JSON.parse(parseResult);

var margin = 120;
var angle = 360;
var cluster = d3.layout.cluster() 
 .size([angle, radius-margin]); 
 
var diagonal = d3.svg.diagonal.radial() 
 .projection (function(d) { return [d.y, d.x / 180* Math.PI];}); 
d3.select("#the_SVG_ID").remove();
var svg = d3.select("#dendrogram").append("svg") 
 .attr('id','the_SVG_ID')
 .attr("width",2*radius) 
 .attr("height",2*radius) 
 .append("g") 
 .attr("transform","translate("+radius + "," + radius + ")");
 
//d3.json("dendrogram02.json", function(error, root){ 
 var nodes = cluster.nodes(root); 
 var links = cluster.links(nodes); 
 var link = svg.selectAll(".link") 
 .data(links) 
 .enter().append("path") 
 .attr("class","link") 
 .attr("d", diagonal); 
 
 var node = svg.selectAll(".node") 
 .data(nodes) 
 .enter().append("g") 
 .attr("class","node")
 .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; }); 
 
 node.append("circle") 
 .attr("r", 4.5); 
 
 node.append("text")
 .attr("dy", ".31em")
 .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
 .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
 .text(function(d) { return d.name; }); 
//});
}
