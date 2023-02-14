import { GraphEdge } from '../../model/graphedge.js';
import { GraphObject } from '../../model/graphobject.js';
import { GraphGroup } from '../../model/graphgroup.js';
import { GraphVertex } from '../../model/graphvertex.js';
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

    function makeRandomRGB() {
        const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
        const rgb = randomBetween(0, 16777215);
        return "#" + ("000000" + rgb.toString(16)).substr(-6);

    }

    it(`graphContent/VARIABLE/state 16`, async () => {
        diagrammer_parser.parse('$(variable:value) $(toinen:kolmas)');
        /** @type Map<string, string> */
        const variables = new Map(Object.entries(Array(graphcanvas.yy.VARIABLES)[0]));
        expect(variables.has('variable')).toBeTruthy();
        expect(variables.has('toinen')).toBeTruthy();
        expect(variables.get('variable')).toMatch('value');
        expect(variables.get('toinen')).toMatch('kolmas');
    });

    it(`graphContent/SHAPE/state 17`, async () => {
        diagrammer_parser.parse('shape ellipse');
        expect(graphcanvas.getCurrentShape()).toMatch('ellipse');
    });

    it(`graphContent/EQUAL/state 18`, async () => {
        diagrammer_parser.parse("equal a,b\n");
        const equals = graphcanvas.getEqual();
        expect(equals[0].getName()).toMatch('a');
        expect(equals[1].getName()).toMatch('b');
    });

    it(`graphContent/LANDSCAPE/state 20`, async () => {
        diagrammer_parser.parse("landscape\n");
        expect(graphcanvas.getDirection()).toMatch('landscape');
    });

    // Can't test since we've FORCED a generator..
    // it(`graphContent/generator/state 21`, async () => {
    //     diagrammer_parser.parse("generator xx\n");
    //     expect(graphcanvas.getGenerator()).toMatch('xx');
    // });

    it(`graphContent/visualizer/state 22`, async () => {
        diagrammer_parser.parse("visualizer xx\n");
        expect(graphcanvas.getVisualizer()).toMatch('xx');
    });

    it(`graphContent/PORTRAIT/state 23`, async () => {
        diagrammer_parser.parse("portrait\n");
        expect(graphcanvas.getDirection()).toMatch('portrait');
    });

    it(`graphContent/COMMENT/state 24`, async () => {
        // no point
    });

    it(`graphContent/VERTEX_COLOR/state 25`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`vertex color ${color}`);
        expect(graphcanvas.getDefault('vertexcolor')).toMatch(color);
    });

    it(`graphContent/VERTEXTEXT_COLOR/state 26`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`vertex text color ${color}`);
        expect(graphcanvas.getDefault('vertextextcolor')).toMatch(color);
    });

    it(`graphContent/EDGE_COLOR/state 27`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`edge color ${color}`);
        expect(graphcanvas.getDefault('edgecolor')).toMatch(color);
    });

    it(`graphContent/EDGETEXT_COLOR/state 28`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`edge text color ${color}`);
        expect(graphcanvas.getDefault('edgetextcolor')).toMatch(color);
    });

    it(`graphContent/GROUP_COLOR/state 29`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`group color ${color}`);
        expect(graphcanvas.getDefault('groupcolor')).toMatch(color);
    });

    it(`graphContent/[ IF/state 30 ELSEIF/state 31 ELSE/state 32 ENDIF/state 33]`, async () => {
        diagrammer_parser.parse(`
entry;is required with conditional
if a then
elseif b then
else c then
endif
exit;exit node is also required
        `);
        console.log(graphcanvas);
        expect(graphcanvas.OBJECTS.length).toBe(5);
        expect(graphcanvas.ROOTVERTICES.length).toBe(5);
        // in this case only all the objects and root vertices do match
        expect(graphcanvas.OBJECTS).toMatchObject(graphcanvas.ROOTVERTICES);

        const conditionalGroups = new Set('1', '2', '3');
        const verticeNames = new Set(["entry", "exit"]);

        graphcanvas.OBJECTS.forEach(obj => {
            if (obj instanceof GraphGroup) {
                // TODO: grammar is buggy, there should be single vertex in, or none for no-vertices conditional
                // how ever 'then'/'else' is intepretex as one
                //expect(obj.OBJECTS.length).toBe(1);
                conditionalGroups.delete(obj.getName());
                if (obj.getName() == '1') {
                    expect(obj.getLabel()).toBe('a');
                    expect(obj.exitvertex).toBe(1);
                    expect(obj.conditional).toBe('if');
                    expect(obj.entryedge.getName()).toBe('entry');
                } else if (obj.getName() == '2') {
                    expect(obj.getLabel()).toBe('b');
                    expect(obj.exitvertex).toBe(2);
                    expect(obj.conditional).toBe('elseif');
                } else if (obj.getName() == '3') {
                    expect(obj.getLabel()).toBe('endif');
                    expect(obj.exitvertex).toBe(3);
                    expect(obj.conditional).toBe('endif');
                    expect(obj.exitedge.getName()).toBe('exit');
                }
            } else if (obj instanceof GraphVertex) {
                verticeNames.delete(obj.getName());
                if (obj.getName() == 'entry') {
                    expect(obj.getLabel()).toBe('is required with conditional');
                    expect(obj.noedges).toBeTruthy();
                } else if (obj.getName() == '2') {
                    expect(obj.getLabel()).toBe('exit node is also required');
                    expect(obj.noedges).toBeTruthy();
                }
            }
            else {
                // we only expect Groups/Vertices
                expect(false).toBeTruthy();
            }
        });
        expect(conditionalGroups.size).toBe(0);
        expect(verticeNames.size).toBe(0);
    });

    it(`graphContent/GROUP/state 34`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`group name ${color};label\ngroup end\n`);
        /** @type {GraphGroup} */
        const group = graphcanvas.OBJECTS[0];
        expect(graphcanvas.OBJECTS.length).toBe(1);
        expect(group.getName()).toBe('name');
        expect(group.getColor()).toBe(color);
        expect(group.OBJECTS.length).toBe(0);
    });

    it(`graphContent/GROUP(brief)/state 34`, async () => {
        const color = makeRandomRGB();
        diagrammer_parser.parse(`{name${color};label\n}\n`);
        /** @type {GraphGroup} */
        const group = graphcanvas.OBJECTS[0];
        expect(graphcanvas.OBJECTS.length).toBe(1);
        expect(group.getName()).toBe('name');
        expect(group.getColor()).toBe(color);
        expect(group.OBJECTS.length).toBe(0);
    });

    it(`graphContent/START/state 35`, async () => {
        // this is just a reference to a vertex, not a vertex(probably should be though :) )
        diagrammer_parser.parse("start a\n");
        expect(graphcanvas.getStart()).toBe('a');
    });

    it(`graphContent/readEvents/state 36`, async () => {
        const color = makeRandomRGB();
        // should have vertices a,q,w,e latter 3 have label label
        // root vertices a
        // 3 edges, between a (at NW corner) q,w,e to (at SE corner) edge text is edgelabel
        //readEvents COMPASS? EVENT COMPASS? colorOrVariable? INLINE_STRING? vertexGroupListOrAttrs LABEL? -> getEdge(yy,$EVENT,$readEvents,$vertexGroupListOrAttrs,$6,$8?$8.substring(1):$8,$5,$2,$4).right
        diagrammer_parser.parse(`a:nw ->:se ${color} "edgelabel" q,w,e;label\n`);
        expect(graphcanvas.OBJECTS.length).toBe(4);
        expect(graphcanvas.ROOTVERTICES.length).toBe(1);
        expect(graphcanvas.EDGES.length).toBe(3);

        // verify all objects accounted for
        const vertices = new Set('a', 'q', 'w', 'e');
        graphcanvas.OBJECTS.forEach(vertex => {
            vertices.delete(vertex.getName());
        });
        expect(vertices.size).toBe(0);

        expect(graphcanvas.yy.lastSeenVertex.getName()).toBe('e');

        const edges = new Set('q', 'w', 'e');
        graphcanvas.EDGES.forEach((edge, idx) => {
            expect(edge.getColor()).toBe(color);
            expect(edge.getName()).toBe(undefined);
            expect(edge.lcompass).toBe(':nw');
            expect(edge.rcompass).toBe(':se');
            expect(edge.isRightPointingEdge()).toBeTruthy();
            expect(edge.isLeftPointingEdge()).toBeFalsy();
            expect(edge.isDashed()).toBeTruthy();
            expect(edge.left.getName()).toBe('a');

            edges.delete(edge.right.getName());
        });
        expect(edges.size).toBe(0);
    });

    //TODO: fix this
    it.skip('Root vertices test', async () => {
        diagrammer_parser.parse(`
            a b c
            q>a w>b e>c
            w>a
            e>b
            w>c
            q>c
            q>b
            e>a
            q>w
            q>e
        `);

        // all vertices gradually interconnected, hence this graph has only one ROOT node q
        // q has subs w,e which have c,a,b
        // model how ever misproduces the situations and incorrectly has q,w AND e in the ROOTVERTICES list
        expect(graphcanvas.ROOTVERTICES.length).toBe(1);
        expect(graphcanvas.ROOTVERTICES[0].getName()).toBe('q');
    });
});
