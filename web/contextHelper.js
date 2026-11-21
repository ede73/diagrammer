/**
 * Context-Sensitive Visualizer Helper for Diagrammer
 * Dynamically provides syntax guidance, format tips, and quick-action snippet insertion
 * customized for the currently active visualizer / generator family.
 */

import { getGraphText, setGraphText, parseAndRegenerate } from './editorInteractions.js';

export const CONTEXT_HELP_DATA = {
    sankey: {
        title: 'Sankey Flow Diagram',
        badge: 'D3.js Flow',
        syntax: '<code>"weight"Source &gt; "weight"Target</code> (e.g. <code>"100"enter &gt; "75"browse</code>)',
        tip: 'Weighted flows: quote numbers before node names. Multi-splits use comma lists.',
        actions: [
            {
                label: '+ Add Weighted Flow',
                tooltip: 'Insert a weighted link between two nodes',
                snippet: '"100"source_node > "100"target_node;\n'
            },
            {
                label: '+ 1-to-2 Flow Split',
                tooltip: 'Split a weighted flow into two downstream targets',
                snippet: '"100"incoming > "60"branch_alpha, "40"branch_beta;\n'
            },
            {
                label: '+ 3-Stage Pipeline',
                tooltip: 'Insert a 3-stage weighted conversion pipeline',
                snippet: '"100"visitors > "50"signups, "50"bounce;\n"50"signups > "20"paid_tier, "30"free_tier;\n'
            }
        ]
    },
    mscgen: {
        title: 'Message Sequence Chart (MSC)',
        badge: 'Sequence',
        syntax: '<code>a &gt; b: "sync call";</code> | <code>a -&gt; b: "async return";</code> | <code>--- "divider" ---;</code>',
        tip: 'Lifelines communicate via sync/async messages. Notes: <code>box</code>, <code>rbox</code>, <code>abox</code>.',
        actions: [
            {
                label: '+ Sync Call',
                tooltip: 'Insert synchronous message call',
                snippet: 'Client > Server: "GET /api/v1/resource";\n'
            },
            {
                label: '+ Async Return',
                tooltip: 'Insert asynchronous reply/response',
                snippet: 'Server -> Client: "200 OK (payload JSON)";\n'
            },
            {
                label: '+ Phase Divider',
                tooltip: 'Insert horizontal phase divider line across all lifelines',
                snippet: '--- "Authentication Completed" ---;\n'
            },
            {
                label: '+ Lifeline Note',
                tooltip: 'Attach a descriptive note box to a lifeline',
                snippet: 'Server box Server: "Verify auth token & query DB";\n'
            }
        ]
    },
    native_sequence: {
        alias: 'mscgen'
    },
    umlclass: {
        title: 'UML Class Diagram',
        badge: 'Layered UML',
        syntax: '<code>{!Class; +member; -field}</code> | <code>Class!method &gt; Target!method</code>',
        tip: 'Enclose class bodies in <code>{!Name; ... }</code>. Link directly to methods with <code>Class!method</code>.',
        actions: [
            {
                label: '+ Class Box',
                tooltip: 'Insert scoped UML class declaration with fields and methods',
                snippet: '{!User;\n  +id: int\n  +username: string\n  +login(pass): bool\n}\n'
            },
            {
                label: '+ Scoped Member Link',
                tooltip: 'Route direct edge from specific class member to target member',
                snippet: 'User!login > AuthService!validateCredentials;\n'
            },
            {
                label: '+ Inheritance',
                tooltip: 'Add class inheritance relationship',
                snippet: 'AdminUser > User;\n'
            }
        ]
    },
    layered: {
        alias: 'umlclass'
    },
    dot: {
        title: 'Graphviz Directed Graph',
        badge: 'Graphviz DOT',
        syntax: '<code>shape record; node;&lt;f0&gt; a | &lt;f1&gt; b</code> | <code>node:f0 &gt; target:f1</code>',
        tip: 'Supports custom node shapes, record partition ports, HTML labels, and subgraphs.',
        actions: [
            {
                label: '+ Shape Record',
                tooltip: 'Insert record node with multi-field port anchors',
                snippet: 'shape record;\nnode1;<f0> Left | { <f1> Top | <f2> Bottom } | <f3> Right;\nnode2;OutputField;\nnode1:f1 > node2;\n'
            },
            {
                label: '+ Cluster Group',
                tooltip: 'Group nodes inside a styled subgraph boundary',
                snippet: 'group cluster_backend;\n  label = "Backend Services";\n  api_gateway > database;\ngroup end;\n'
            },
            {
                label: '+ Port-to-Port Link',
                tooltip: 'Connect specific port anchor of source to target',
                snippet: 'node1:f0 > target:portA;\n'
            }
        ]
    },
    ast_record: {
        alias: 'dot'
    },
    graphviz: {
        alias: 'dot'
    },
    state: {
        title: 'State Transition Diagram',
        badge: 'State Machine',
        syntax: '<code>[*] &gt; State1</code> | <code>State1 &gt; State2; event[guard] / action</code>',
        tip: 'Use <code>[*]</code> for initial/final states and <code>[Composite (s1 &gt; s2)]</code> for nested states.',
        actions: [
            {
                label: '+ Initial State',
                tooltip: 'Transition from start vertex to initial state',
                snippet: '[*] > Idle;\n'
            },
            {
                label: '+ Guarded Transition',
                tooltip: 'Transition triggered by event with conditional guard',
                snippet: 'Idle > Active; submit[isValid == true] / startTimer();\n'
            },
            {
                label: '+ Composite State',
                tooltip: 'Nest concurrent or nested substate flow',
                snippet: '[Processing (Validating > Running > Finalizing)]\n'
            },
            {
                label: '+ Final State',
                tooltip: 'Transition to accepting/final state',
                snippet: 'Completed > [*];\n'
            }
        ]
    },
    dendrogram: {
        title: 'Hierarchical Dendrogram / Tree',
        badge: 'D3.js Tree',
        syntax: '<code>Root &gt; (BranchA, BranchB &gt; (Leaf1, Leaf2))</code>',
        tip: 'Parentheses group child nodes. Reingold-Tilford aesthetic tree layout.',
        actions: [
            {
                label: '+ 2-Level Subtree',
                tooltip: 'Add parent node branching into two children',
                snippet: 'ParentNode > (ChildA, ChildB);\n'
            },
            {
                label: '+ 3-Level Hierarchy',
                tooltip: 'Insert balanced multi-level hierarchical tree',
                snippet: 'Root > (BranchAlpha > (Leaf1, Leaf2), BranchBeta > (Leaf3, Leaf4));\n'
            }
        ]
    },
    reingold_tilford: {
        alias: 'dendrogram'
    },
    grid: {
        title: 'Network Bus & Grid',
        badge: 'Bus Topology',
        syntax: '<code>bus BusName; dev1, dev2, dev3 on BusName;</code>',
        tip: 'Nodes tap directly into a common shared communication backbone.',
        actions: [
            {
                label: '+ Shared Bus',
                tooltip: 'Declare a shared hardware communication bus',
                snippet: 'bus SystemBus;\nCPU, GPU, MemoryController, StorageAdapter on SystemBus;\n'
            }
        ]
    },
    network_bus: {
        alias: 'grid'
    }
};

function insertSnippet(snippet) {
    const text = getGraphText();
    const updated = text.endsWith('\n') ? text + snippet : text + '\n' + snippet;
    setGraphText(updated);
    if (window.editor) {
        window.editor.navigateFileEnd();
        window.editor.focus();
    }
    parseAndRegenerate();
}

export function updateContextHelperBar(visualizer) {
    const bar = document.getElementById('context-helper-bar');
    if (!bar) return;

    let target = visualizer || 'ast_record';
    let data = CONTEXT_HELP_DATA[target];
    if (data && data.alias) {
        data = CONTEXT_HELP_DATA[data.alias];
    }
    if (!data) {
        data = {
            title: target,
            badge: 'Graph',
            syntax: '<code>a &gt; b</code> standard directed connection',
            tip: 'Use arrows to connect nodes and semicolons to separate statements.',
            actions: [
                {
                    label: '+ Connected Pair',
                    tooltip: 'Insert basic directed connection',
                    snippet: 'nodeA > nodeB;\n'
                }
            ]
        };
    }

    let actionsHtml = '';
    (data.actions || []).forEach((act, idx) => {
        actionsHtml += `<button type="button" class="context-helper-pill" data-idx="${idx}" tooltip="${act.tooltip || act.label}">${act.label}</button>`;
    });

    bar.innerHTML = `
        <div class="context-helper-left">
            <span class="context-helper-badge">${data.badge}</span>
            <span class="context-helper-syntax">${data.syntax}</span>
        </div>
        <div class="context-helper-actions">
            ${actionsHtml}
        </div>
    `;

    // Bind action pill clicks
    const btns = bar.querySelectorAll('.context-helper-pill');
    btns.forEach(btn => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const act = data.actions[idx];
        if (act) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                insertSnippet(act.snippet);
            });
        }
    });
}

export function initContextHelper() {
    const vizSelect = document.getElementById('diagrammer-visualizer');
    const current = vizSelect ? vizSelect.value : 'ast_record';
    updateContextHelperBar(current);
}
