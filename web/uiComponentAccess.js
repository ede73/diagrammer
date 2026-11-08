import { findGeneratorForVisualization, visualizations } from './config.js';
export function getHTMLElement(name) {
    const element = document.getElementById(name);
    if (!element) {
        console.error(`Trying to load HTML Element named ${name} but one isn't found!`);
    }
    return element;
}
export function updateRuntimeBadge() {
    const badge = document.getElementById('diagrammer-runtime-badge');
    if (!badge) return;
    try {
        const current = getSelectedVisualizer();
        const viz = visualizations.find(p => p.name === current);
        if (!viz) return;

        if (viz.runtime === 'web') {
            badge.className = 'runtime-badge runtime-badge-web';
            badge.textContent = `⚡ Browser: ${viz.family}`;
            badge.title = `Engine: ${viz.engine}\nGenerator: ${viz.generator}\nRuns locally in your browser (WASM/JS).`;
        } else {
            badge.className = 'runtime-badge runtime-badge-cli';
            badge.textContent = `🖥️ CLI: ${viz.family}`;
            badge.title = `Engine: ${viz.engine}\nGenerator: ${viz.generator}\nRequires native backend CLI execution.`;
        }
    } catch (_) {}
}
export function setVisualizer(visualizer) {
    const select = document.querySelector('#diagrammer-generator');
    if (visualizer && select) {
        select.value = visualizer;
    }
    updateRuntimeBadge();
    if (getSelectedVisualizer() !== visualizer) {
        console.error(`Somewhy visualizer change did not go thru, we wanted ${visualizer} and have ${getSelectedVisualizer()}`);
    }
}
export function getInputElement(name) {
    return getHTMLElement(name);
}
export function getSelectElement(name) {
    return getHTMLElement(name);
}
export function getCurrentFilename() {
    return getInputElement('diagrammer-filename').value;
}
export function setError(text, exception) {
    const element = document.getElementById('diagrammer-error');
    if (text) {
        console.error(text);
        if (exception) {
            console.error(exception);
        }
    }
    element.innerText = text;
}
export function getError() {
    var _a, _b;
    return (_b = (_a = document.getElementById('diagrammer-error')) === null || _a === void 0 ? void 0 : _a.innerText) !== null && _b !== void 0 ? _b : '';
}
export function openImage(imageBase64) {
    const w = window.open('about:blank');
    if (!w)
        return;
    setTimeout(() => {
        w.document.body.appendChild(w.document.createElement('iframe')).src = `data:image/png;base64,${imageBase64}`;
        w.document.body.style.margin = '0';
        w.document.getElementsByTagName('iframe')[0].style.width = '100%';
        w.document.getElementsByTagName('iframe')[0].style.height = '100%';
        w.document.getElementsByTagName('iframe')[0].style.border = '0';
    }, 0);
}
export function openPicWindow() {
    window.open('web/result.png', 'extpic');
}
export function getSelectedGenerator() {
    const e = getSelectElement('diagrammer-generator');
    const viz = e.options[e.selectedIndex].value;
    return findGeneratorForVisualization(viz);
}
export function getSelectedVisualizer() {
    const e = getSelectElement('diagrammer-generator');
    const gen = e.options[e.selectedIndex].value;
    if (gen.includes(':')) {
        return gen.split(':')[1];
    }
    return gen;
}
