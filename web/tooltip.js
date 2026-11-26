/**
 * Global Tooltip Engine for Diagrammer Web UI
 * Renders floating, formatted, multicontext tooltips via fixed body overlay,
 * completely immune to container overflow clipping.
 */

let tooltipEl = null;

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatCodeHighlights(str) {
    return str.replace(/\(([^)]+)\)/g, '<code class="tt-code">($1)</code>');
}

function formatTooltipText(raw) {
    const text = raw.replace(/\\n/g, '\n');
    const lines = text.split('\n');
    if (lines.length === 1 && text.includes(':') && !text.includes('http')) {
        const colonIdx = text.indexOf(':');
        const title = text.substring(0, colonIdx).trim();
        const desc = text.substring(colonIdx + 1).trim();
        return `<div class="tt-title">${escapeHtml(title)}</div><div class="tt-line">${formatCodeHighlights(escapeHtml(desc))}</div>`;
    }

    let html = '';
    lines.forEach((line, idx) => {
        let l = line.trim();
        if (!l) return;
        l = escapeHtml(l);
        l = formatCodeHighlights(l);
        if (idx === 0) {
            html += `<div class="tt-title">${l}</div>`;
        } else if (l.startsWith('•') || l.startsWith('-')) {
            html += `<div class="tt-bullet">${l}</div>`;
        } else {
            html += `<div class="tt-line">${l}</div>`;
        }
    });
    return html;
}

export function showTooltip(el) {
    const raw = el.getAttribute('tooltip');
    if (!raw) return;
    if (!tooltipEl) {
        initGlobalTooltips();
    }
    if (!tooltipEl) return;

    tooltipEl.innerHTML = formatTooltipText(raw);
    tooltipEl.style.display = 'block';
    tooltipEl.style.opacity = '1';

    const rect = el.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();

    const inSidebar = el.closest('.sidebars-column');
    const inHtoolbar = el.closest('.htoolbar');

    let top = 0;
    let left = 0;

    if (inSidebar) {
        // Flyout to the right of the vertical sidebar button
        left = rect.right + 10;
        top = rect.top + (rect.height - ttRect.height) / 2;
    } else if (inHtoolbar) {
        // Flyout BELOW the horizontal toolbar button (never clip above)
        left = rect.left + (rect.width - ttRect.width) / 2;
        top = rect.bottom + 8;
    } else {
        // Default: above if space permits, otherwise below
        if (rect.top > ttRect.height + 12) {
            top = rect.top - ttRect.height - 8;
            left = rect.left + (rect.width - ttRect.width) / 2;
        } else {
            top = rect.bottom + 8;
            left = rect.left + (rect.width - ttRect.width) / 2;
        }
    }

    // Viewport bounds clamping
    left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - ttRect.height - 8));

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
}

export function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.style.opacity = '0';
    tooltipEl.style.display = 'none';
}

export function initGlobalTooltips() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('diagrammer-global-tooltip')) {
        tooltipEl = document.getElementById('diagrammer-global-tooltip');
        return;
    }

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'diagrammer-global-tooltip';
    tooltipEl.className = 'diagrammer-global-tooltip';
    document.body.appendChild(tooltipEl);

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[tooltip]');
        if (!target) return;
        showTooltip(target);
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[tooltip]');
        if (target) hideTooltip();
    });
}
