import { generators } from '../model/graphcanvas.js';
import { output, getAttributeAndFormat } from '../model/support.js';
import { traverseVertices, traverseEdges } from '../model/model.js';
import { GraphGroup } from '../model/graphgroup.js';

const BlockDiagShapeMap = {
    default: "box",
    invis: "invis",
    record: "box",
    doublecircle: "endpoint",
    box: "box",
    rect: "box",
    rectangle: "box",
    square: "square",
    roundedbox: "roundedbox",
    dots: "dots",
    circle: "circle",
    ellipse: "ellipse",
    diamond: "diamond",
    minidiamond: "minidiamond",
    minisquare: "minidiamond",
    note: "note",
    mail: "mail",
    cloud: "cloud",
    actor: "actor",
    beginpoint: "flowchart.beginpoint",
    endpoint: "flowchart.endpoint",
    condition: "flowchart.condition",
    database: "flowchart.database",
    terminator: "flowchart.terminator",
    input: "flowchart.input",
    loopin: "flowchart.loopin",
    loop: "flowchart.loop",
    loopstart: "flowchart.loopin",
    loopout: "flowchart.loopout",
    loopend: "flowchart.loopout",
};

/**
 * http://blockdiag.com/en/blockdiag/
 * To test: node js/diagrammer.js tests/test_inputs/state2.txt blockdiag |blockdiag3 -Tpng -o a.png - && open a.png
 * @param {GraphCanvas} graphcanvas
 */
export function blockdiag(graphcanvas) {
    output(graphcanvas, "blockdiag {", true);
    output(graphcanvas, "default_fontsize = 14");
    if (graphcanvas.getDirection() === "portrait") {
        output(graphcanvas, "orientation=portrait");
    } else {
        // DEFAULT
        output(graphcanvas, "orientation=landscape");
    }

    var lastNode = graphcanvas.getStart();

    /**
     * @param {(GraphVertex|GraphGroup)} obj
     */
    const parseObjects = /** @type {function(GraphConnectable)}*/obj => {
        output(true);
        if (obj instanceof GraphGroup) {
            output(graphcanvas, ` group "${obj.getLabel()}"{`, true);
            output(graphcanvas, getAttributeAndFormat(obj, 'color', '   color="{0}"'));
            output(graphcanvas, getAttributeAndFormat(obj, 'label', '   label="{0}"'));
            if (lastNode && lastNode.trim() != "") {
                lastNode = `[${lastNode.trim().substring(1)}]`;
            }
            traverseVertices(obj, obj => {
                if (obj.shape && !BlockDiagShapeMap[obj.shape]) {
                    throw new Error("Missing shape mapping");
                }
                const mappedShape = BlockDiagShapeMap[obj.shape] ? BlockDiagShapeMap[obj.shape] : BlockDiagShapeMap['default'];
                let tmp = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                    ',shape={0}'.format(mappedShape) +
                    getAttributeAndFormat(obj, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = `[${tmp.trim().substring(1)}]`;
                output(graphcanvas, `${obj.getName()}${tmp};`);
            });
            output(false);
            output(graphcanvas, "}");
        } else {
            // dotted,dashed,solid
            // NOT invis,bold,rounded,diagonals
            // ICON does not work, using background
            let style = getAttributeAndFormat(obj, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            if (obj.shape && !BlockDiagShapeMap[obj.shape]) {
                throw new Error("Missing shape mapping");
            }
            const mappedShape = BlockDiagShapeMap[obj.shape] ? BlockDiagShapeMap[obj.shape] : BlockDiagShapeMap['default'];

            let colorIconShapeLabel = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                getAttributeAndFormat(obj, 'image', ',background="icons{0}"') +
                style +
                ',shape="{0}"'.format(mappedShape) +
                getAttributeAndFormat(obj, 'label', ',label="{0}"');
            if (colorIconShapeLabel.trim() != "")
                colorIconShapeLabel = `[${colorIconShapeLabel.trim().substring(1)}]`;
            output(graphcanvas, `${obj.getName()}${colorIconShapeLabel};`);
        }
        output(false);
    };

    traverseVertices(graphcanvas, parseObjects);

    traverseEdges(graphcanvas, edge => {
        let t = "";
        if (edge.isDotted()) {
            t += ',style="dotted" ';
        } else if (edge.isDashed()) {
            t += ',style="dashed" ';
        }
        const labelAndItsColor = getAttributeAndFormat(edge, 'label', ',label = "{0}"' +
            "" /*getAttributeAndFormat(edge, ['color', 'textcolor'], 'textcolor="{0}"')*/);
        const color = getAttributeAndFormat(edge, 'color', ',color="{0}"');
        t += labelAndItsColor + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = `[${t}]`;
        output(graphcanvas, `  ${edge.left.getName()} -> ${edge.right.getName()}${t};`);
    });
    output(graphcanvas, "}");
}
generators.set('blockdiag', blockdiag);