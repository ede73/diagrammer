import { GraphEdge } from '../../model/graphedge.js';
import { GraphObject } from '../../model/graphobject.js';
import { diagrammer_parser } from '../../build/diagrammer_parser.js';
import { GraphCanvas, generators } from '../../model/graphcanvas.js';

describe('Parser/grammar rule tests', () => {
    var errors;
    /** @type {GraphCanvas} */
    var graphcanvas;

    beforeAll(async () => {
        // Copied over to sharedstate
        generators.set('abba', (gv) => {
            graphcanvas = gv;
        });
        diagrammer_parser.yy.result = function (result) {
            throw new Error("Setup failure");
        }
        diagrammer_parser.yy.USE_GENERATOR = 'abba';
        diagrammer_parser.yy.parseError = function (str, hash) {
            console.log("Parsing error found:");
            console.log(str);
            console.log(hash);
            errors = 1
            throw new Error(str);
        };
    });

    it(`colorOrVariable`, async () => {
        const y = diagrammer_parser.parse('$(variable:value) $(toinen:kolmas)');
        /** @type Map<string, string> */
        const variables = new Map(Object.entries(Array(graphcanvas.yy.VARIABLES)[0]));
        expect(variables.has('variable')).toBeTruthy();
        expect(variables.has('toinen')).toBeTruthy();
        expect(variables.get('variable')).toMatch('value');
        expect(variables.get('toinen')).toMatch('kolmas');
    });
});
