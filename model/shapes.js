function getShape(shapes, o, fmt) {
    if (!o || o == 0) return "";
    o = o.toLowerCase();
    if (o in shapes)
        return ' ' + fmt.format(shapes[o]) + ' ';
    else
        return ' ' + fmt.format(shapes['default']) + ' ';
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
