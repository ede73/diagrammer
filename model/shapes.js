//@ts-check
/**
 * Return a targetshape (like actdiga style shapes) matching 'diagrammer' shape representation 
 * @param {string[]} shapes like shapes.blockdiag
 * @param {(string|number)} shapeKey like doublecircle (or index)
 * @param {string} fmt Format string like ',shape={0}'
 * @returns {string}
 */
function getShape(shapes, shapeKey, fmt) {
    if (!shapeKey || shapeKey == 0) return "";
    // @ts-ignore
    shapeKey = shapeKey.toLowerCase();
    if (shapeKey in shapes) {
        // @ts-ignore
        return ' ' + fmt.format(shapes[shapeKey]) + ' ';
    } else {
        // @ts-ignore
        return ' ' + fmt.format(shapes['default']) + ' ';
    }
}

const shapes = {
    blockdiag: {
        default: "box",
        invis: "invis",
        /* TODO? */
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
        loop: "flowchart.loopin",
        loopstart: "flowchart.loopin",
        loopout: "flowchart.loopout",
        loopend: "flowchart.loopout"
    },
    actdiag: {
        default: "box",
        invis: "invis",
        /* TODO? */
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
        loop: "flowchart.loopin",
        loopstart: "flowchart.loopin",
        loopout: "flowchart.loopout",
        loopend: "flowchart.loopout"
    },
    digraph: {
        default: "box",
        invis: "invis",
        record: "record",
        doublecircle: "doublecircle",
        box: "box",
        rect: "box",
        rectangle: "box",
        square: "square",
        roundedbox: "box",
        dots: "point",
        circle: "circle",
        ellipse: "ellipse",
        diamond: "diamond",
        minidiamond: "Mdiamond",
        minisquare: "Msquare",
        note: "note",
        mail: "tab",
        cloud: "tripleoctagon",
        actor: "cds",
        beginpoint: "circle",
        endpoint: "doublecircle",
        condition: "Mdiamond",
        database: "Mcircle",
        terminator: "ellipse",
        input: "parallelogram",
        loopin: "house",
        loop: "house",
        loopstart: "house",
        loopout: "invhouse",
        loopend: "invhouse"
    }
};
