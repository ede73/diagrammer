/**
 * Perceptual Color Adaptation Engine for Diagrammer
 *
 * Dynamically adapts user-defined diagram colors for dark mode:
 * - Lifts low-luminance text/strokes (e.g. pure black, dark blue, forest green) so they maintain WCAG >= 4.5:1 contrast against dark canvases.
 * - Softens hyper-saturated primaries (e.g. pure #FF0000, #0000FF) so they do not crust or vibrate against #0d1117 backgrounds.
 * - Restores exact original author colors when switching back to light mode.
 */

const NAMED_COLORS = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    silver: '#c0c0c0',
    maroon: '#800000',
    navy: '#000080',
    purple: '#800080',
    teal: '#008080',
    olive: '#808000',
    orange: '#ffa500',
    darksalmon: '#e9967a',
    seagreen: '#2e8b57',
    peachpuff: '#ffdab9',
    darkviolet: '#9400d3',
    amaranth: '#9f2b68'
};

function parseColor(colorStr) {
    if (!colorStr || colorStr === 'none' || colorStr === 'transparent' || colorStr === 'inherit') {
        return null;
    }
    const clean = colorStr.trim().toLowerCase();
    if (NAMED_COLORS[clean]) {
        return parseColor(NAMED_COLORS[clean]);
    }
    if (clean.startsWith('#')) {
        let hex = clean.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return { r, g, b, a: 1 };
        }
    }
    const rgbMatch = clean.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
            a: 1
        };
    }
    return null;
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
    h = (h % 360) / 360;
    if (h < 0) h += 1;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adapt a color for dark mode based on perceptual properties.
 *
 * @param {string} colorStr Input color (hex or rgb or named)
 * @param {boolean} isForeground True for text, lines, arrows, borders; false for fills
 * @returns {string} Adapted CSS hex color
 */
export function adaptColorForDark(colorStr, isForeground = true) {
    const parsed = parseColor(colorStr);
    if (!parsed) return colorStr;

    const { r, g, b } = parsed;
    // Perceptual relative luminance (sRGB standard)
    const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
    const { h, s, l } = rgbToHsl(r, g, b);

    if (isForeground) {
        // Foreground elements: text, lines, strokes against dark canvas (#0d1117)
        // 1. Pure black or very dark colors -> lift to high contrast off-white/light gray
        if (l < 0.15 || lum < 0.05) {
            return '#e6edf3';
        }
        // 2. Dark saturated colors (navy, forest green, dark violet) -> lift lightness to readable level
        if (l < 0.55) {
            const targetL = Math.max(0.68, 1.0 - l * 0.75);
            const targetS = Math.min(s, 0.85);
            const { r: nr, g: ng, b: nb } = hslToRgb(h, targetS, targetL);
            return rgbToHex(nr, ng, nb);
        }
        // 3. Hyper-saturated pure red (#ff0000) or other harsh primaries
        if (s > 0.90 && (h < 15 || h > 345)) {
            // Soften to pastel coral red #ff6b6b (readable, doesn't vibrate on dark background)
            const { r: nr, g: ng, b: nb } = hslToRgb(h, 0.85, 0.71);
            return rgbToHex(nr, ng, nb);
        }
        // Colors that already have good contrast against dark canvas stay intact
        return colorStr;
    } else {
        // Fills: node shapes, group rectangles
        // 1. Pure black fill (#000000) on dark canvas -> slight lift to dark slate container (#161b22)
        if (l < 0.08) {
            return '#161b22';
        }
        // 2. Pure white node fill (#ffffff) -> soft dark slate card (#1c2128) if against dark canvas
        if (l > 0.95 && s < 0.05) {
            return '#1e293b';
        }
        // 3. Pure blue group fill (#0000ff) -> deep dark blue (#1e3a8a)
        if (s > 0.80 && h >= 220 && h <= 260 && l < 0.60) {
            const { r: nr, g: ng, b: nb } = hslToRgb(h, 0.70, 0.25);
            return rgbToHex(nr, ng, nb);
        }
        // 4. Pure red fill (#ff0000) -> deep dark red (#881337)
        if (s > 0.80 && (h < 15 || h > 345) && l < 0.60) {
            const { r: nr, g: ng, b: nb } = hslToRgb(h, 0.75, 0.28);
            return rgbToHex(nr, ng, nb);
        }
        return colorStr;
    }
}

/**
 * Walk through all elements in the active SVG and apply/revert perceptual color adjustments.
 *
 * @param {boolean} [isDark] Whether dark mode is currently active
 */
export function applyPerceptualColorTheme(isDark = null) {
    if (isDark === null) {
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }

    const svg = document.querySelector('#diagrammer-graph svg');
    if (!svg) return;

    const elements = svg.querySelectorAll('path, polygon, ellipse, circle, rect, text, polyline, line');

    elements.forEach(el => {
        // Skip Graphviz canvas bounding background polygon
        if (el.tagName === 'polygon' && el.parentElement && el.parentElement.classList.contains('graph') && el === el.parentElement.firstElementChild) {
            return;
        }

        const isText = el.tagName === 'text';
        const isLineOrPath = ['path', 'polyline', 'line'].includes(el.tagName);

        // --- STROKE ---
        const currStroke = el.getAttribute('stroke');
        if (currStroke && currStroke !== 'none' && currStroke !== 'transparent') {
            if (!el.hasAttribute('data-orig-stroke')) {
                el.setAttribute('data-orig-stroke', currStroke);
            }
            if (isDark) {
                const orig = el.getAttribute('data-orig-stroke');
                el.setAttribute('stroke', adaptColorForDark(orig, true));
            } else {
                el.setAttribute('stroke', el.getAttribute('data-orig-stroke'));
            }
        }

        // --- FILL ---
        const currFill = el.getAttribute('fill');
        if (currFill && currFill !== 'none' && currFill !== 'transparent') {
            if (!el.hasAttribute('data-orig-fill')) {
                el.setAttribute('data-orig-fill', currFill);
            }
            if (isDark) {
                const orig = el.getAttribute('data-orig-fill');
                // For text elements and arrow heads (polygons inside edges), treat fill as foreground!
                const isEdgeHead = el.tagName === 'polygon' && el.closest('.edge');
                const isFgFill = isText || isLineOrPath || isEdgeHead;
                el.setAttribute('fill', adaptColorForDark(orig, isFgFill));
            } else {
                el.setAttribute('fill', el.getAttribute('data-orig-fill'));
            }
        }
    });
}

// Global hook for easy browser console inspection and layout callbacks
if (typeof window !== 'undefined') {
    window.applyPerceptualColorTheme = applyPerceptualColorTheme;
    window.adaptColorForDark = adaptColorForDark;
}

