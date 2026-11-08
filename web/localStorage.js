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
    try {
        return JSON.parse(graph);
    } catch (e) {
        return eval(`(${graph})`);
    }
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

// Logical files / Themes management (web-editable file store)
export function getLogicalFiles() {
    const stored = localStorage.getItem('logical_files');
    let files = {};
    if (stored) {
        try {
            files = JSON.parse(stored);
        } catch (e) {
            files = {};
        }
    }
    // Also include saved graphs so any saved graph is includable by name
    const saved = getSavedGraphs();
    for (const k in saved) {
        if (!files[k]) {
            files[k] = saved[k];
        }
    }
    // Default sample theme if not already present
    if (Object.keys(files).length === 0 || !files['theme.diag']) {
        files['theme.diag'] = `theme {\n    background: #1e1e2e\n    vertex-color: #3b82f6\n    vertex-textcolor: #ffffff\n    edge-color: #f59e0b\n}\n\nlayout {\n    direction: lr\n}\n`;
        localStorage.setItem('logical_files', JSON.stringify(files));
    }
    return files;
}

export function saveLogicalFile(filename, content) {
    const files = getLogicalFiles();
    files[filename] = content;
    localStorage.setItem('logical_files', JSON.stringify(files));
}

export function loadLogicalFile(filename) {
    const files = getLogicalFiles();
    return files[filename] || '';
}

export function deleteLogicalFile(filename) {
    const files = getLogicalFiles();
    delete files[filename];
    localStorage.setItem('logical_files', JSON.stringify(files));
}

export function getLogicalFilesAsOptionList() {
    const files = getLogicalFiles();
    let t = '';
    for (const k in files) {
        t += `<option value="${k}">${k}</option>`;
    }
    return t;
}
