#!/bin/sh
set -e

# Generate modern vector SVG node types
mkdir -p web/types
cat << 'EOF' > /tmp/gen_types.sh
#!/bin/sh
TYPES_DIR="web/types"

render_shape() {
    NAME="$1"
    SHAPE_ATTRS="$2"
    LABEL="$3"
    cat << DOT | dot -Tsvg -o "${TYPES_DIR}/x${NAME}.svg"
digraph {
    bgcolor="transparent";
    pad="0.05";
    node [
        ${SHAPE_ATTRS},
        fillcolor="#1e293b",
        color="#38bdf8",
        penwidth=1.5,
        fontname="Helvetica",
        fontsize=11,
        fontcolor="#f8fafc",
        width=1.1,
        height=0.38,
        fixedsize=true
    ];
    "${NAME}" [label="${LABEL}"];
}
DOT
}

render_shape "actor" 'shape="cds", style="filled"' "actor"
render_shape "beginpoint" 'shape="box", style="filled,rounded"' "beginpoint"
render_shape "circle" 'shape="circle", style="filled"' "circle"
render_shape "cloud" 'shape="tripleoctagon", style="filled"' "cloud"
render_shape "condition" 'shape="diamond", style="filled"' "condition"
render_shape "database" 'shape="cylinder", style="filled"' "database"
render_shape "default" 'shape="box", style="filled"' "default"
render_shape "diamond" 'shape="diamond", style="filled"' "diamond"
render_shape "display" 'shape="egg", style="filled", orientation=90' "display"
render_shape "document" 'shape="note", style="filled"' "document"
render_shape "dots" 'shape="ellipse", style="dotted,filled"' "dots"
render_shape "doublecircle" 'shape="doublecircle", style="filled"' "doublecircle"
render_shape "ellipse" 'shape="ellipse", style="filled"' "ellipse"
render_shape "endpoint" 'shape="box", style="filled,rounded"' "endpoint"
render_shape "folder" 'shape="folder", style="filled"' "folder"
render_shape "input" 'shape="parallelogram", style="filled"' "input"
render_shape "left" 'shape="house", orientation=90, style="filled"' "left"
render_shape "loop" 'shape="invtrapezium", style="filled"' "loop"
render_shape "loopin" 'shape="house", style="filled"' "loopin"
render_shape "loopout" 'shape="invhouse", style="filled"' "loopout"
render_shape "mail" 'shape="folder", style="filled"' "mail"
render_shape "note" 'shape="note", style="filled"' "note"
render_shape "preparation" 'shape="polygon", sides=6, style="filled"' "preparation"
render_shape "record" 'shape="record", style="filled"' "record"
render_shape "rect" 'shape="box", style="filled"' "rect"
render_shape "right" 'shape="house", orientation=-90, style="filled"' "right"
render_shape "roundedbox" 'shape="box", style="filled,rounded"' "roundedbox"
render_shape "square" 'shape="square", style="filled"' "square"
render_shape "subroutine" 'shape="rect", peripheries=2, style="filled"' "subroutine"

EOF
sh /tmp/gen_types.sh

# Generate modern horizontal vector SVG arrows
mkdir -p web/arrows
cat << 'EOF' > /tmp/gen_arrows.sh
#!/bin/sh
ARROWS_DIR="web/arrows"

render_arrow() {
    FILE="$1"
    EDGE_STMT="$2"
    cat << DOT | dot -Tsvg -o "${ARROWS_DIR}/${FILE}.svg"
digraph {
    bgcolor="transparent";
    rankdir=LR;
    pad="0.05";
    edge [color="#38bdf8", penwidth=1.5, arrowsize=0.7];
    node [
        shape="circle",
        style="filled",
        fillcolor="#1e293b",
        color="#38bdf8",
        penwidth=1.2,
        fontcolor="#f8fafc",
        fontname="Helvetica",
        fontsize=9,
        width=0.28,
        height=0.28,
        fixedsize=true
    ];
    ${EDGE_STMT};
}
DOT
}

render_arrow "a1" 'a1 -> b1'
render_arrow "a2" 'a2 -> b2 [style="dashed"]'
render_arrow "a3" 'a3 -> b3 [style="dotted"]'
render_arrow "a4" 'a4 -> b4 [dir="both"]'
render_arrow "a5" 'a5 -> b5 [dir="both", style="dashed"]'
render_arrow "a6" 'a6 -> b6 [dir="both", style="dotted"]'
render_arrow "a7" 'a7 -> b7 [dir="none", style="dashed"]'
render_arrow "a8" 'a8 -> b8 [dir="none", style="dotted"]'
render_arrow "b9" 'b9 -> a9 [arrowhead="tee"]'
render_arrow "a10" 'a10 -> b10 [arrowhead="tee"]'
render_arrow "a11" 'a11 -> b11 [arrowhead="diamond"]'
render_arrow "a12" 'a12 -> b12 [arrowhead="tee", style="dashed"]'
render_arrow "a13" 'a13 -> b13 [arrowhead="diamond", arrowtail="diamond", dir="both"]'
render_arrow "a14" 'a14 -> b14 [arrowhead="tee", arrowtail="tee", dir="both"]'

EOF
sh /tmp/gen_arrows.sh

echo "Modern SVG assets generated successfully."
