console.log("Reset generator and visualizer");
const VERBOSE = false;

function visualize(visualizer) {
    const statelang = document.getElementById("result").value;
    if (!visualizer) {
        visualizer = getVisualizer();
    }
    const visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
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
        // const canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
    } else if (visualizer == "radialdendrogram") {
        console.log("Visualize using visualizeRadialDendrogram");
        visualizeRadialDendrogram(JSON.parse(result.value));
    } else if (visualizer == "circlepacked") {
        console.log("Visualize using visualizeCirclePacked");
        alert("TBD");
        visualizeCirclePacked(JSON.parse(result.value));
    } else if (visualizer == "reingoldtilford") {
        console.log("Visualize using visualizeReingoldTilford");
        visualizeReingoldTilford(JSON.parse(result.value));
    } else if (visualizer == "parsetree") {
        console.log("Visualize using visualizeParseTree");
        visualizeParseTree(JSON.parse(result.value));
    } else if (visualizer == "layerbands") {
        console.log("Visualize using visualizeLayerBands");
        visualizeLayerBands(JSON.parse(result.value));
    } else if (visualizer == "umlclass") {
        console.log("Visualize using visualizeUmlClass");
        visualizeUmlClass(JSON.parse(result.value));
    } else {
        console.log("Unkknown WEB UI visualizer " + visualizer);
        document.getElementById('svg').innerHTML = "only for dotty";
    }
}