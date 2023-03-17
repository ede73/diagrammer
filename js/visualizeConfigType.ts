import { type ConfigType } from './configsupport.js'

export interface VisualizeConfigType extends ConfigType {
  visualizer: string
  code: string
  visualizedGraph: string
  format: string
  webPort: number
  tests: boolean
  // used when miniserver is calling (it wants the binary image and has no usable stream)
  returnImage: boolean
  // only use if returnImage=true, returns the image here
  outputImage?: string
}
