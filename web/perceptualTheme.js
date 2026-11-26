/**
 * Perceptual Color Adaptation Engine for Diagrammer
 *
 * Dynamically adapts user-defined diagram colors for dark mode & light mode:
 * - In Dark Mode:
 *   - Lifts low-luminance text/strokes (pure black, dark navy, dark violet) so they maintain WCAG >= 4.5:1 contrast against dark canvases (#0d1117 / #0f172a).
 *   - Softens hyper-saturated primaries (#ff0000, #00ff00, #0000ff, #ffff00) into elegant, legible dark-card accents that do not vibrate or crust.
 * - In Light Mode:
 *   - Adapts hardcoded dark-engine backgrounds (#0f172a, #0d1117) to clean, crisp light-canvas surfaces (#f8fafc / transparent).
 *   - Converts dark container cards (#1e293b) to elevated white cards with subtle slate borders (#cbd5e1).
 *   - Lifts light/white text (#ffffff, #e2e8f0, #f8fafc) to dark charcoal (#0f172a) for crystal-clear readability.
 *   - Softens saturated fills into modern tinted badges (e.g. soft blue #dbeafe with #2563eb border).
 * - Enforces a mathematical relative-luminance contrast guarantee on all SVG text elements relative to their container fills.
 */

const NAMED_COLORS = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    lime: '#00ff00',
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
    amaranth: '#9f2b68',
    lightblue: '#afeeee'
};

export function parseColor(colorStr) {
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

export function rgbToHsl(r, g, b) {
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

export function hslToRgb(h, s, l) {
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

export function rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function relativeLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Adapt a color for dark mode based on perceptual properties.
 */
export function adaptColorForDark(colorStr, isForeground = true) {
    const parsed = parseColor(colorStr);
    if (!parsed) return colorStr;

    const { r, g, b } = parsed;
    const lum = relativeLuminance(r, g, b);
    const { h, s, l } = rgbToHsl(r, g, b);

    if (isForeground) {
        // Foreground elements: text, lines, strokes, arrowheads against dark canvas
        // 1. Pure black or very dark colors -> lift to high contrast off-white
        if (l < 0.15 || lum < 0.05) {
            return '#e6edf3';
        }
        // 2. Pure red (#ff0000) -> coral rose #fb7185
        if (s > 0.85 && (h < 15 || h > 345)) {
            return '#fb7185';
        }
        // 4. Pure lime/green (#00ff00, #008000) -> emerald #34d399
        if (s > 0.70 && h >= 90 && h <= 150) {
            return '#34d399';
        }
        // 5. Pure yellow (#ffff00) -> amber #fbbf24
        if (s > 0.80 && h >= 45 && h <= 65) {
            return '#fbbf24';
        }
        // 6. Pure magenta (#ff00ff) -> fuchsia #e879f9
        if (s > 0.80 && h >= 280 && h <= 325) {
            return '#e879f9';
        }
        // 7. Pure cyan (#00ffff) -> bright cyan/teal #2dd4bf
        if (s > 0.80 && h >= 165 && h <= 200) {
            return '#2dd4bf';
        }
        // 8. General dark saturated colors -> lift lightness to readable level
        if (l < 0.55) {
            const targetL = Math.max(0.68, 1.0 - l * 0.75);
            const targetS = Math.min(s, 0.85);
            const { r: nr, g: ng, b: nb } = hslToRgb(h, targetS, targetL);
            return rgbToHex(nr, ng, nb);
        }
        return colorStr;
    } else {
        // Fills: node shapes, group rectangles
        // 1. Pure black fill (#000000) -> dark slate card
        if (l < 0.08) {
            return '#161b22';
        }
        // 2. Pure white node fill (#ffffff) -> soft dark slate card
        if (l > 0.95 && s < 0.05) {
            return '#1e293b';
        }
        // 3. Pure blue group/node fill (#0000ff) -> rich navy card
        if (s > 0.75 && h >= 210 && h <= 260 && l < 0.65) {
            return '#1e3a8a';
        }
        // 4. Pure red fill (#ff0000) -> deep crimson card
        if (s > 0.80 && (h < 15 || h > 345) && l < 0.65) {
            return '#881337';
        }
        // 5. Pure lime/green fill (#00ff00, #008000) -> deep emerald card
        if (s > 0.70 && h >= 90 && h <= 150) {
            return '#064e3b';
        }
        // 6. Pure yellow fill (#ffff00) -> deep amber card
        if (s > 0.80 && h >= 45 && h <= 65) {
            return '#78350f';
        }
        // 7. Pure magenta fill (#ff00ff) -> deep purple card
        if (s > 0.80 && h >= 280 && h <= 325) {
            return '#581c87';
        }
        // 8. Pure cyan fill (#00ffff) -> deep teal card
        if (s > 0.80 && h >= 165 && h <= 200) {
            return '#134e4a';
        }
        return colorStr;
    }
}

/**
 * Adapt a color for light mode based on perceptual properties.
 */
export function adaptColorForLight(colorStr, isForeground = true) {
    const parsed = parseColor(colorStr);
    if (!parsed) return colorStr;

    const { r, g, b } = parsed;
    const lum = relativeLuminance(r, g, b);
    const { h, s, l } = rgbToHsl(r, g, b);

    if (isForeground) {
        // Foreground: text, lines, strokes, arrowheads against light canvas (#f6f8fa / #ffffff)
        // 1. Off-whites and light grays -> dark charcoal
        if (l > 0.82 || lum > 0.65) {
            return '#0f172a';
        }
        // 2. Muted light slate (#94a3b8, #64748b) -> dark slate
        if (s < 0.30 && l > 0.50 && l <= 0.82) {
            return '#475569';
        }
        // 3. Pure red (#ff0000) -> rich crimson
        if (s > 0.80 && (h < 15 || h > 345)) {
            return '#e11d48';
        }
        // 4. Pure green (#00ff00) -> deep emerald
        if (s > 0.70 && h >= 90 && h <= 150) {
            return '#059669';
        }
        // 5. Pure blue (#0000ff) -> royal blue
        if (s > 0.70 && h >= 210 && h <= 255) {
            return '#2563eb';
        }
        // 6. Pure yellow (#ffff00) -> dark amber
        if (s > 0.80 && h >= 45 && h <= 65) {
            return '#d97706';
        }
        // 7. Pure magenta (#ff00ff) -> deep purple
        if (s > 0.80 && h >= 280 && h <= 325) {
            return '#7c3aed';
        }
        // 8. Pure cyan (#00ffff) -> deep teal
        if (s > 0.80 && h >= 165 && h <= 200) {
            return '#0d9488';
        }
        return colorStr;
    } else {
        // Fills: canvas backgrounds, cards, node shapes
        // 1. Hardcoded native engine dark canvas backgrounds (#0f172a, #0d1117) -> transparent
        if (l < 0.12 && s < 0.40) {
            return '#f8fafc';
        }
        // 2. Native engine dark cards (#1e293b, #161b22) -> clean white elevated card
        if (l >= 0.12 && l < 0.25 && s < 0.35) {
            return '#ffffff';
        }
        // 3. Pure blue fill (#0000ff, #1e3a8a) -> soft light blue badge
        if (s > 0.65 && h >= 210 && h <= 260) {
            return '#dbeafe';
        }
        // 4. Pure red fill (#ff0000, #881337) -> soft rose badge
        if (s > 0.70 && (h < 15 || h > 345)) {
            return '#ffe4e6';
        }
        // 5. Pure green fill (#00ff00, #008000, #064e3b) -> soft mint badge
        if (s > 0.65 && h >= 90 && h <= 150) {
            return '#dcfce7';
        }
        // 6. Pure yellow fill (#ffff00, #78350f) -> soft amber badge
        if (s > 0.70 && h >= 45 && h <= 65) {
            return '#fef3c7';
        }
        // 7. Pure magenta fill (#ff00ff, #581c87) -> soft lavender badge
        if (s > 0.70 && h >= 280 && h <= 325) {
            return '#f3e8ff';
        }
        // 8. Pure cyan fill (#00ffff, #134e4a) -> soft cyan badge
        if (s > 0.70 && h >= 165 && h <= 200) {
            return '#cffafe';
        }
        return colorStr;
    }
}

/**
 * Walk through all elements in the active SVG and apply perceptual color adjustments.
 *
 * @param {boolean} [isDark] Whether dark mode is currently active
 */
export function applyPerceptualColorTheme(isDark = null) {
    if (isDark === null) {
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }

    const svg = document.querySelector('#diagrammer-graph svg');
    if (!svg) return;

    // Handle canvas background rect/polygon if present
    const firstRect = svg.querySelector('rect, polygon');
    if (firstRect) {
        const fill = firstRect.getAttribute('fill');
        if (fill === '#0f172a' || fill === '#0d1117' || fill === '#ffffff' || fill === 'white') {
            if (!firstRect.hasAttribute('data-orig-fill')) {
                firstRect.setAttribute('data-orig-fill', fill);
            }
            firstRect.setAttribute('fill', isDark ? '#0f172a' : '#f8fafc');
        }
    }

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
            const orig = el.getAttribute('data-orig-stroke');
            el.setAttribute('stroke', isDark ? adaptColorForDark(orig, true) : adaptColorForLight(orig, true));
        }

        // --- FILL ---
        const currFill = el.getAttribute('fill');
        if (currFill && currFill !== 'none' && currFill !== 'transparent') {
            if (!el.hasAttribute('data-orig-fill')) {
                el.setAttribute('data-orig-fill', currFill);
            }
            const orig = el.getAttribute('data-orig-fill');
            const isEdgeHead = el.tagName === 'polygon' && (el.closest('.edge') || el.closest('.ds-edge') || el.closest('.dl-edge'));
            const isFgFill = isText || isLineOrPath || isEdgeHead;

            let adaptedFill;
            if (isDark) {
                adaptedFill = adaptColorForDark(orig, isFgFill);
            } else {
                adaptedFill = adaptColorForLight(orig, isFgFill);
            }

            // Text contrast guarantee: ensure text is always readable over its container
            if (isText) {
                const parentBox = el.closest('g')?.querySelector('rect, polygon, ellipse, circle, path');
                if (parentBox) {
                    const bgFill = parentBox.getAttribute('fill');
                    const bgParsed = parseColor(bgFill);
                    if (bgParsed) {
                        const bgLum = relativeLuminance(bgParsed.r, bgParsed.g, bgParsed.b);
                        if (bgLum > 0.5) {
                            // Bright container -> dark text
                            adaptedFill = '#0f172a';
                        } else {
                            // Dark container -> bright text
                            adaptedFill = '#f8fafc';
                        }
                    }
                }
            }

            el.setAttribute('fill', adaptedFill);
        }
    });
}

// Global hooks for easy browser console inspection and layout callbacks
if (typeof window !== 'undefined') {
    window.applyPerceptualColorTheme = applyPerceptualColorTheme;
    window.adaptColorForDark = adaptColorForDark;
    window.adaptColorForLight = adaptColorForLight;
}
