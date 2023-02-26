// @ts-check

import { visualizations } from '../globals.js'

visualizations.set('mscgen', visualizeMscGen)

export function visualizeMscGen(generatorResult: string) {
    const anchor: string = 'diagrammer-graph'
    const config = { elementId: anchor }
    //inputType: "msgenny",
    function handleRenderMscResult(pError: any, pSuccess: any) {
        console.log(`mscresults ${pError} ${pSuccess}`);
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
    mscgenjs.renderMsc(code, config, handleRenderMscResult);
}
