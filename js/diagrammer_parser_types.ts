import { diagrammerParser } from '../diagrammer_parser.js'
import { type GraphCanvas } from '../../model/graphcanvas.js'

// This 'type export' file will be placed in build/types directory along with module package.json
// And make will tsc this
export interface DiagrammerParserYY {
  GRAPHCANVAS: GraphCanvas
  PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER: boolean
  USE_GENERATOR: string
  USE_VISUALIZATOR: string
  parseError: (str: string, hash: string) => void
  parsedGeneratorAndVisualizer: (generator: string, visualizer: string, preferParsed: boolean) => void
  result: (codeLine: string) => void
  trace: (msg: string) => void
}

export function getParserYY(): DiagrammerParserYY {
  return diagrammerParser.yy as DiagrammerParserYY
}
