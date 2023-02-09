
export function getSavedGraph() {
    let data = {};
    if (!localStorage.getItem("graphs")) {
        localStorage.setItem("graphs", JSON.stringify(data));
        return data;
    }
    const graph = localStorage.getItem("graphs");
    // console.log("Have graph"+graph);
    data = eval("(" + graph + ")");
    return data;
}

export function getSavedFiles() {
    let t = "";
    for (const k in getSavedGraph()) {
        console.log("Stored file:" + k);
        t += '<option value="' + k + '">' + k + '</option>';
    }
    const e = document.getElementById("saved"); // TODO: move up
    e.innerHTML = t;
}

export function saveCurrentGraph(filename, editable) {
    const data = getSavedGraph();
    data[filename] = editable;
    const jd = JSON.stringify(data);
    localStorage.setItem("graphs", jd);
    // clipboardData.setData("text",jd);
}

export function loadGraph(filename) {
    const data = getSavedGraph();
    if (data[filename]) {
        return data[filename];
    }
}

