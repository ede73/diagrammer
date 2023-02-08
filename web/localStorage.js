
function getSavedGraph() {
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

function getSavedFiles() {
    let t = "";
    for (const k in getSavedGraph()) {
        console.log("Stored file:" + k);
        t += '<option value="' + k + '">' + k + '</option>';
    }
    const e = document.getElementById("saved");
    e.innerHTML = t;
}

function save() {
    const filename = document.getElementById("filename").value;
    const editable = getText();
    const data = getSavedGraph();
    data[filename] = editable;
    const jd = JSON.stringify(data);
    localStorage.setItem("graphs", jd);
    // clipboardData.setData("text",jd);
}

function load() {
    const filename = document.getElementById("filename").value;
    const data = getSavedGraph();
    if (data[filename])
        setText(data[filename]);
}

