import { getError, getInputElement, getSelectedVisualizer, setError, setVisualizer, isLockHintsEnabled } from './uiComponentAccess.js';
import { makeHTTPPost } from './ajax.js';
import { getLogicalFiles } from './localStorage.js';
let wasmModule = null;
let wasmInitPromise = null;
async function loadWasm() {
    if (wasmModule)
        return wasmModule;
    if (!wasmInitPromise) {
        wasmInitPromise = (async () => {
            try {
                const mod = await import('../build/wasm/diagrammer_core.js');
                await mod.default('../build/wasm/diagrammer_core_bg.wasm');
                wasmModule = mod;
                console.debug('Diagrammer Rust WebAssembly core successfully initialized in browser!');
                return wasmModule;
            }
            catch (e) {
                console.warn('WASM module failed to initialize, falling back to server endpoint:', e);
                return null;
            }
        })();
    }
    return wasmInitPromise;
}
if (typeof window !== 'undefined') {
    loadWasm().catch(() => { });
}
function extractScriptVisualizer(diagrammerCode) {
    const match = diagrammerCode.match(/(?:^|\n)\s*(?:generator|visualizer)\s+([A-Za-z0-9_]+)/i);
    if (!match) return null;
    const viz = match[1].toLowerCase();
    return viz === 'sequence' ? 'native_sequence' : viz;
}
export function parse(diagrammerCode, successCallback, failureCallback, preferScriptSpecifiedVisualizer = false) {
    if (preferScriptSpecifiedVisualizer && !isLockHintsEnabled()) {
        const scriptVisualizer = extractScriptVisualizer(diagrammerCode);
        if (scriptVisualizer) {
            setVisualizer(scriptVisualizer);
            console.debug(`  .. changed visualizer to script visualizer: ${scriptVisualizer}`);
        }
    }
    const visualizer = getSelectedVisualizer();
    console.debug(`parse(${visualizer} ${preferScriptSpecifiedVisualizer ? 'preferScriptSpecifiedVisualizer' : ''})`);
    if (!visualizer) {
        throw new Error('Visualizer not defined');
    }
    if (wasmModule) {
        try {
            const filesJson = JSON.stringify(getLogicalFiles());
            const result = wasmModule.wasm_parse_and_generate_with_files
                ? wasmModule.wasm_parse_and_generate_with_files(diagrammerCode, visualizer, filesJson)
                : wasmModule.wasm_parse_and_generate(diagrammerCode, visualizer);
            const resultElem = getInputElement('diagrammer-result');
            if (resultElem) {
                resultElem.value = result;
            }
            setError('');
            try {
                successCallback(getSelectedVisualizer());
            }
            catch (ex) {
                setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`);
            }
            return;
        }
        catch (err) {
            const errStr = String(err);
            setError(errStr);
            failureCallback(errStr, new DOMException(errStr));
            throw err;
        }
    }
    loadWasm().then((wasm) => {
        if (wasm) {
            try {
                const filesJson = JSON.stringify(getLogicalFiles());
                const result = wasm.wasm_parse_and_generate_with_files
                    ? wasm.wasm_parse_and_generate_with_files(diagrammerCode, visualizer, filesJson)
                    : wasm.wasm_parse_and_generate(diagrammerCode, visualizer);
                const resultElem = getInputElement('diagrammer-result');
                if (resultElem) {
                    resultElem.value = result;
                }
                setError('');
                try {
                    successCallback(getSelectedVisualizer());
                }
                catch (ex) {
                    setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`);
                }
                return;
            }
            catch (err) {
                const errStr = String(err);
                setError(errStr);
                failureCallback(errStr, new DOMException(errStr));
                return;
            }
        }
        makeHTTPPost(`/parse?visualizer=${encodeURIComponent(visualizer)}`, diagrammerCode, (result) => {
            const resultElem = getInputElement('diagrammer-result');
            if (resultElem) {
                resultElem.value = result;
            }
            setError('');
            try {
                successCallback(getSelectedVisualizer());
            }
            catch (ex) {
                setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`);
            }
        }, (status, statusText, responseText) => {
            const err = `Rust engine error (${status}): ${responseText || statusText}`;
            setError(err);
            failureCallback(err, new DOMException(err));
        });
    });
}
