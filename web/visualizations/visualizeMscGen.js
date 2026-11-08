export async function visualizeMscGen(generatorResult) {
    const anchor = 'diagrammer-graph';
    const config = {
        elementId: anchor,
        input: 'mscgen',
        additionalTemplate: 'fountainpen',
        mirrorEntitiesOnBottom: true,
        styleAdditions: '.mscgenjsdiagrammer-graph .bglayer { fill: rgb(29 26 26 / 0%);|'
    };
    function handleRenderMscResult(pError, pSuccess) {
        if (pError) {
            console.error(pError);
            return;
        }
        else if (pSuccess) {
            return;
        }
        console.error('Should not happen...');
    }
    mscgenjs.renderMsc(generatorResult, config, handleRenderMscResult);
}
