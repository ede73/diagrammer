import { adaptColorForDark } from '../../web/perceptualTheme.js';

describe('Automatic Perceptual Dark Mode Color Adaptation', () => {
    test('adapts pure black foreground text/stroke to high contrast', () => {
        const adapted = adaptColorForDark('#000000', true);
        expect(adapted).toBe('#e6edf3');
    });

    test('lifts dark blue foreground (#0000ff) to bright readable blue', () => {
        const adapted = adaptColorForDark('#0000ff', true);
        expect(adapted.toLowerCase()).not.toBe('#0000ff');
        expect(adapted).toBe('#6868f3');
    });

    test('lifts dark seagreen (#2e8b57) to clear bright green', () => {
        const adapted = adaptColorForDark('#2e8b57', true);
        expect(adapted).toBe('#97dcb6');
    });

    test('lifts dark violet (#9400d3) to legible lilac', () => {
        const adapted = adaptColorForDark('#9400d3', true);
        expect(adapted).toBe('#cb6df3');
    });

    test('softens pure harsh red (#ff0000) into non-vibrating coral red', () => {
        const adapted = adaptColorForDark('#ff0000', true);
        expect(adapted).toBe('#f36868');
    });

    test('adapts pure black fill to dark card container', () => {
        const adapted = adaptColorForDark('#000000', false);
        expect(adapted).toBe('#161b22');
    });

    test('adapts white fill to dark slate fill', () => {
        const adapted = adaptColorForDark('#ffffff', false);
        expect(adapted).toBe('#1e293b');
    });

    test('preserves transparent/none/invalid colors as-is', () => {
        expect(adaptColorForDark('none', true)).toBe('none');
        expect(adaptColorForDark('transparent', false)).toBe('transparent');
        expect(adaptColorForDark('', true)).toBe('');
    });
});
