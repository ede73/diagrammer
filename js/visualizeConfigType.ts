import { type ConfigType } from './configsupport.js'

export interface VisualizeConfigType extends ConfigType {
  visualizer: string
  code: string
  visualizedGraph: string
  web: boolean
  format: string
  webPort: number
  useWebVisualizer: boolean
  tests: boolean
  // used when miniserver is calling (it wants the binary image and has no usable stream)
  returnImage: boolean
  outputImage: string
}
