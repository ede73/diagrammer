import { removeAllChildNodes, removeOldVisualizations } from './d3support.js';
import { getHTMLElement, getInputElement, openImage } from './uiComponentAccess.js';
import { visualizations } from './config.js';
import { makeHTTPPost } from './ajax.js';
function _makeNewImageHolder(pngBase64) {
    var _a;
    const img = document.createElement('img');
    img.align = 'bottom';
    img.width = 400;
    img.height = 400;
    img.id = 'image';
    img.style.height = 'auto';
    img.src = `data:image/png;base64,${pngBase64}`;
    img.onclick = () => { openImage(`${pngBase64}`); };
    (_a = getHTMLElement('diagrammer-graph')) === null || _a === void 0 ? void 0 : _a.appendChild(img);
}
function beautifyJSON(generatedCode) {
    clearBeautified();
    const wrapper = document.getElementById('diagrammer-beautified');
    if (!wrapper) return;

    const trimmed = (generatedCode || '').trim();
    if (!trimmed) {
        wrapper.innerHTML = '<div class="beautified-empty">No generated result available.</div>';
        return;
    }

    let data;
    try {
        data = JSON.parse(trimmed);
    }
    catch (ex) {
        // Not a JSON result (e.g. dot, blockdiag, plantuml).
        // Provide a formatted, readable code display instead of leaving the tab blank.
        const notice = document.createElement('div');
        notice.className = 'beautified-notice';
        notice.textContent = 'Tree viewer is active for JSON outputs (e.g. AST, Sankey, Dendrogram). Formatted text view:';
        
        const pre = document.createElement('pre');
        pre.className = 'beautified-code-view';
        pre.textContent = trimmed;

        wrapper.appendChild(notice);
        wrapper.appendChild(pre);
        return;
    }

    try {
        if (typeof jsonTree !== 'undefined') {
            jsonTree.create(data, wrapper);
        } else {
            const pre = document.createElement('pre');
            pre.className = 'beautified-code-view';
            pre.textContent = JSON.stringify(data, null, 2);
            wrapper.appendChild(pre);
        }
    } catch (err) {
        console.error('Failed to create jsonTree:', err);
        const pre = document.createElement('pre');
        pre.className = 'beautified-code-view';
        pre.textContent = JSON.stringify(data, null, 2);
        wrapper.appendChild(pre);
    }
}
export function clearBeautified() {
    const result = getInputElement('diagrammer-beautified');
    removeAllChildNodes(result);
}
export function visualize(visualizer) {
    const result = getInputElement('diagrammer-result');
    const generatedResult = result.value;
    beautifyJSON(generatedResult);
    if (!visualizer) {
        throw new Error('Visualizer not defined');
    }
    removeOldVisualizations();
    const vizClass = visualizations.find(p => p.name === visualizer);
    if (!vizClass) {
        console.error(`O-o, could not find visualizer ${visualizer}`);
        return;
    }
    if (vizClass.visualization) {
        vizClass.visualization(generatedResult).catch(rej => { });
    }
    else {
        const visualizeUrl = `/visualize?visualizer=${visualizer}`;
        makeHTTPPost(visualizeUrl, generatedResult, (pngBase64) => {
            _makeNewImageHolder(pngBase64);
        }, (statusCode, statusText, responseText) => {
            alert(`Visualize failed, error: ${responseText} status: ${statusText}`);
        });
    }
}
