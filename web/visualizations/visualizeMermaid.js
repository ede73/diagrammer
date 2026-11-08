import { getHTMLElement } from '../uiComponentAccess.js';
import { removeAllChildNodes } from '../d3support.js';

let mermaidInitialized = false;

async function ensureMermaid() {
    if (typeof window.mermaid === 'undefined') {
        const module = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
        window.mermaid = module.default;
    }
    if (!mermaidInitialized && window.mermaid) {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        window.mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'default',
            securityLevel: 'loose'
        });
        mermaidInitialized = true;
    }
    return window.mermaid;
}

export async function visualizeMermaid(code) {
    const vizContainer = getHTMLElement('diagrammer-graph');
    if (!vizContainer) return;
    removeAllChildNodes(vizContainer);

    try {
        const mermaid = await ensureMermaid();
        const id = 'mermaid-svg-' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaid.render(id, code);
        vizContainer.innerHTML = svg;
    } catch (err) {
        console.error('Failed to render Mermaid diagram in browser:', err);
        vizContainer.innerHTML = `<pre style="color: #ef4444; padding: 1rem; font-family: monospace;">${err.message || err}</pre>`;
    }
}
