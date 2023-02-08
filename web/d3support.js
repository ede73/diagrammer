function make_svg(width, height) {
    d3.select("#the_SVG_ID").remove();
    return d3.select("#D3JSIMAGES").append("svg")
        .attr('id', 'the_SVG_ID')
        .attr("width", width)
        .attr("height", height)
        .append("g");
        
}
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
