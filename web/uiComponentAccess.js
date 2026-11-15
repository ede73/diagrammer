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
export function populateVisualizerDropdown(family) {
    const vizSelect = document.getElementById('diagrammer-visualizer');
    if (!vizSelect) return;
    vizSelect.innerHTML = '';
    const matching = visualizations.filter(p => p.family === family);
    matching.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.visualizerLabel || p.menuName;
        vizSelect.appendChild(opt);
    });
}
export function setVisualizer(visualizer) {
    if (!visualizer) return;
    let target = visualizer;
    if (target === 'nwdiag') {
        target = 'network_bus';
    }
    let viz = visualizations.find(p => p.name === target);
    if (!viz && (target === 'network_bus' || target === 'grid')) {
        viz = visualizations.find(p => p.name === 'network_bus' || p.name === 'grid');
        if (viz) target = viz.name;
    }

    const select = document.querySelector('#diagrammer-generator');
    if (select) {
        select.value = target;
    }

    if (viz) {
        const groupSelect = document.getElementById('diagrammer-generator-group');
        if (groupSelect && groupSelect.value !== viz.family) {
            groupSelect.value = viz.family;
            populateVisualizerDropdown(viz.family);
        }
        const vizSelect = document.getElementById('diagrammer-visualizer');
        if (vizSelect) {
            vizSelect.value = target;
        }
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

export function isLockHintsEnabled() {
    try {
        return localStorage.getItem('diagrammer_lock_hints') === 'true';
    } catch (_) {
        return false;
    }
}

export function setLockHintsEnabled(enabled) {
    try {
        localStorage.setItem('diagrammer_lock_hints', enabled ? 'true' : 'false');
    } catch (_) {}
    updateLockHintsButton();
}

export function toggleLockHints() {
    setLockHintsEnabled(!isLockHintsEnabled());
}

export function updateLockHintsButton() {
    const btn = document.getElementById('diagrammer-lock-hints');
    if (!btn) return;
    const locked = isLockHintsEnabled();
    const icon = document.getElementById('diagrammer-lock-hints-icon');
    const text = document.getElementById('diagrammer-lock-hints-text');
    if (locked) {
        btn.classList.add('locked');
        btn.title = "Visualizer is LOCKED. In-diagram 'visualizer' and 'generator' hints are ignored when loading diagrams. Click to follow hints.";
        if (icon) icon.textContent = '🔒';
        if (text) text.textContent = 'Hints Ignored';
    } else {
        btn.classList.remove('locked');
        btn.title = "Following in-diagram hints. Loading a diagram will switch to its declared visualizer. Click to lock visualizer.";
        if (icon) icon.textContent = '🔓';
        if (text) text.textContent = 'Follow Hints';
    }
}

export function initWorkspaceSplitter() {
    const splitter = document.getElementById('workspace-splitter');
    const container = document.querySelector('.workspace-main');
    const editorPane = document.querySelector('.editor-pane');
    if (!splitter || !container || !editorPane) return;

    try {
        const savedWidth = localStorage.getItem('diagrammer_editor_width');
        if (savedWidth) {
            editorPane.style.flex = `0 0 ${savedWidth}`;
        }
    } catch (_) {}

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    splitter.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = editorPane.getBoundingClientRect().width;
        splitter.classList.add('active');
        container.classList.add('is-resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const containerWidth = container.getBoundingClientRect().width;
        const newWidth = Math.max(180, Math.min(containerWidth - 180, startWidth + dx));
        const pct = (newWidth / containerWidth) * 100;
        editorPane.style.flex = `0 0 ${pct}%`;
        try {
            localStorage.setItem('diagrammer_editor_width', `${pct}%`);
        } catch (_) {}
        if (window.ace) {
            try { ace.edit('diagrammer-code').resize(); } catch (_) {}
            try { ace.edit('diagrammer-theme-code').resize(); } catch (_) {}
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            splitter.classList.remove('active');
            container.classList.remove('is-resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            if (window.ace) {
                try { ace.edit('diagrammer-code').resize(); } catch (_) {}
            }
        }
    });

    splitter.addEventListener('dblclick', () => {
        editorPane.style.flex = '0 0 50%';
        try { localStorage.removeItem('diagrammer_editor_width'); } catch (_) {}
        if (window.ace) {
            try { ace.edit('diagrammer-code').resize(); } catch (_) {}
        }
    });
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkspaceSplitter);
    } else {
        initWorkspaceSplitter();
    }
}
