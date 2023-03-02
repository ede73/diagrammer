// @ts-check

import { visualizations } from '../globals.js'

visualizations.set('mscgen', visualizeMscGen)

export function visualizeMscGen(generatorResult: string) {
    const anchor: string = 'diagrammer-graph'
    // xu,mscgenny,json
    // lazy, basic, classic, fountainpen, cygne, pegasse, grayscaled, inverted, noentityboxes
    const config = {
        elementId: anchor, input: 'mscgen', additionalTemplate: 'fountainpen', mirrorEntitiesOnBottom: true,
        styleAdditions: '.mscgenjsdiagrammer-graph .bglayer { fill: rgb(29 26 26 / 0%);|'
    }

    /*
    mscgenjsdiagrammer-graph .bglayer {
    fill: rgb(29 26 26 / 0%);
}
    .mscgenjsdiagrammer-graph .bglayer {
    fill: #9e2a2a;
    stroke: white;
    stroke-width: 0;
}

svg.mscgenjsdiagrammer-graph.font-size:24px didnt work

    */
    //inputType: "msgenny",
    function handleRenderMscResult(pError: any, pSuccess: any) {
        if (Boolean(pError)) {
            console.error(pError);
            return;
        } else if (Boolean(pSuccess)) {
            console.log("Visualized");
            return;
            // the svg is in the pSuccess argument
        }
        console.log("Should not happen...");
    }

    // @ts-ignore
    mscgenjs.renderMsc(generatorResult, config, handleRenderMscResult);
}
