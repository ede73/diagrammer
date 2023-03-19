// @ts-check

export async function visualizeMscGen(generatorResult: string) {
  const anchor: string = 'diagrammer-graph'
  // xu,mscgenny,json
  // lazy, basic, classic, fountainpen, cygne, pegasse, grayscaled, inverted, noentityboxes
  const config = {
    elementId: anchor,
    input: 'mscgen',
    additionalTemplate: 'fountainpen',
    mirrorEntitiesOnBottom: true,
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
  // inputType: "msgenny",
  function handleRenderMscResult(pError: any, pSuccess: any) {
    if (pError) {
      console.error(pError)
      return
    } else if (pSuccess) {
      return
      // the svg is in the pSuccess argument
    }
    console.error('Should not happen...')
  }

  // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
  mscgenjs.renderMsc(generatorResult, config, handleRenderMscResult)
}
