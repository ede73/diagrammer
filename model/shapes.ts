// @ts-check
// from grammar/diagrammer.lex

// for run time testing
export const ShapeKeys = [
  'actor',
  'condition',
  'doublecircle',
  'loopend',
  'loopout',
  'record',
  'beginpoint',
  'box',
  'circle',
  'cloud',
  'database',
  'default',
  'diamond',
  'dots',
  'ellipse',
  'endpoint',
  'input',
  'loop',
  'loopin',
  'loopstart',
  'mail',
  'minidiamond',
  'minisquare',
  'note',
  'rect',
  'rectangle',
  'roundedbox',
  'square',
  'terminator']

export type Shapes = Record<typeof ShapeKeys[number], string>
