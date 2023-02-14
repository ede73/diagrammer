import { getHTMLElement } from "./uiComponentAccess.js";

export function make_svg(width, height) {
    if (!width) {
        width = 300;
    }
    if (!height) {
        height = 300;
    }
    d3.select("#the_SVG_ID").remove();
    return d3.select("#graphVisualizationHere").append("svg")
        .attr('id', 'the_SVG_ID')
        .attr("width", width)
        .attr("height", height)
        .append("g");

}

// TODO: Discrepancy between d3.js and GoJS, former results in #graphVisualizationHere/(div#default_,svg) latter #graphVisualizerionHere/div#default_/svg
export function removeOldVisualizations(idName) {
    const element = getHTMLElement("graphVisualizationHere");
    removeAllChildNodes(element);
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", idName ? idName : "default_");
    element.appendChild(newDiv);
    return newDiv;
}


export function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
