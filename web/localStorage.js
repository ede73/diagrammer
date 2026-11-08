export function getSavedGraphs() {
    if (!localStorage.getItem('graphs')) {
        const data = {};
        localStorage.setItem('graphs', JSON.stringify(data));
        return data;
    }
    const graph = localStorage.getItem('graphs');
    if (graph === null) {
        return {};
    }
    return eval(`(${graph})`);
}
export function getSavedFilesAsOptionList() {
    let t = '';
    for (const k in getSavedGraphs()) {
        t += '<option value="' + k + '">' + k + '</option>';
    }
    return t;
}
export function saveCurrentGraph(filename, diagrammerCode) {
    const data = getSavedGraphs();
    data[filename] = diagrammerCode;
    const jd = JSON.stringify(data);
    localStorage.setItem('graphs', jd);
}
export function loadGraph(filename) {
    const data = getSavedGraphs();
    if (data[filename]) {
        return data[filename];
    }
}
