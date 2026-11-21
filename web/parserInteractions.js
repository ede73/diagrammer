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
export const FIXTURE_DEFAULT_VISUALIZERS = {
    // Sequence
    'events.txt': 'native_sequence',
    'native_sequence.txt': 'native_sequence',
    'seqdiag.txt': 'native_sequence',
    'sequence_control_flow.txt': 'native_sequence',
    'plantuml_context.txt': 'native_sequence',
    'plantuml_context2.txt': 'native_sequence',
    'state_sequence.txt': 'native_sequence',
    'state_sequence2.txt': 'native_sequence',
    'state_sip_sequence.txt': 'native_sequence',

    // State
    'state.txt': 'state',
    'state_tcp.txt': 'state',
    'state_machine_with_start_node.txt': 'state',
    'state_group.txt': 'state',
    'state_innergroups.txt': 'state',
    'state_dual_node.txt': 'state',
    'state_conditionals.txt': 'state',
    'state_ancestry.txt': 'state',
    'state_android.txt': 'state',
    'state_cluster_edge.txt': 'state',
    'state_nodelinktests.txt': 'state',
    'state_recursive_linking.txt': 'state',
    'state_y_edge.txt': 'state',
    'mars_rover_poly.txt': 'state',
    'poly_2_state_sequence_dag.txt': 'state',
    'poly_3_state_grid_tree.txt': 'state',
    'poly_5_fractal_3level.txt': 'state',
    'poly_7_state_uml_sequence.txt': 'state',
    'poly_9_state_swarm_pipeline.txt': 'state',
    'poly_archetype_state_sequence.txt': 'state',

    // Tree / Dendrogram
    'tree_dendrogram.txt': 'tree',
    'parsetree.txt': 'tree',
    'dendrogram.txt': 'reingoldtilford',
    'dendrogram_spec.txt': 'reingoldtilford',

    // Network Bus / Grid
    'network_bus.txt': 'network_bus',
    'network_multihome_enterprise.txt': 'network_bus',
    'nwdiag.txt': 'network_bus',
    'nwdiag2.txt': 'network_bus',
    'nwdiag3.txt': 'network_bus',
    'nwdiag5.txt': 'network_bus',
    'nwdiag_multiple_ips.txt': 'network_bus',

    // Force
    'force_network.txt': 'force',

    // Sankey
    'sankey.txt': 'sankey',
    'sankey2.txt': 'sankey',

    // Swimlane
    'poly_10_layered_swimlane_seq.txt': 'swimlane',
    'AAA.txt': 'swimlane',

    // Layered DAG (default for UML, shapes, operators, clusters)
    'dynamic_shapes.txt': 'layered',
    'dynamic_operators.txt': 'layered',
    'umlclass.txt': 'layered',
    'umlclass2.txt': 'layered',
    'umlclass_types.txt': 'layered',
    'umlclass_scoped.txt': 'layered',
    'layerbands.txt': 'layered',
    'landscape.txt': 'layered',
    'arrow_types.txt': 'layered',
    'arrow_types_showcase.txt': 'layered',
    'colors.txt': 'layered',
    'subgraph_linking.txt': 'layered',
    'group_group_link.txt': 'layered',
    'lhs_rhs_lists.txt': 'layered',
    'multiple_lhs_lists.txt': 'layered',
    'node_and_edge_coloring.txt': 'layered',
    'node_and_edge_coloring2.txt': 'layered',
    'nodes.txt': 'layered',
    'two_filled_linked_vertices.txt': 'layered',
    'two_linked_clusters.txt': 'layered',
    'two_linked_clusters_with_invisible_node.txt': 'layered',
    'url.txt': 'layered',
    'url_links.txt': 'layered',
    'poly_1_layered_sequence_tree.txt': 'layered',
    'poly_4_layered_force_state.txt': 'layered',
    'poly_6_layered_grid_sequence.txt': 'layered',
    'poly_8_layered_tree_state.txt': 'layered',
};

function extractScriptVisualizer(diagrammerCode) {
    const match = diagrammerCode.match(/(?:^|\n)\s*(?:generator|visualizer)\s+([A-Za-z0-9_]+)/i);
    return match ? match[1].toLowerCase() : null;
}
export function parse(diagrammerCode, successCallback, failureCallback, preferScriptSpecifiedVisualizer = false, filename = null) {
    if (preferScriptSpecifiedVisualizer && !isLockHintsEnabled()) {
        const basename = filename ? filename.replace(/^.*[\\\/]/, '') : '';
        const scriptVisualizer = extractScriptVisualizer(diagrammerCode)
            || (basename ? FIXTURE_DEFAULT_VISUALIZERS[basename] : null)
            || 'layered';
        setVisualizer(scriptVisualizer);
        console.debug(`  .. changed visualizer to: ${scriptVisualizer}`);
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
