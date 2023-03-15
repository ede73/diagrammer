// @ts-check
// from grammar/diagrammer.lex

// for run time testing
export const ShapeKeys = [
  'actor',
  'beginpoint',
  'circle',
  'cloud',
  'condition',
  'database',
  'default',
  'diamond',
  'dots',
  'doublecircle',
  'ellipse',
  'endpoint',
  'folder',
  'input',
  'left',
  'loop',
  'loopin',
  'loopout',
  'mail',
  'document',
  'display',
  'note',
  'preparation',
  'record',
  'rect',
  'right',
  'roundedbox',
  'square',
  'subroutine'
]

export type Shapes = Record<typeof ShapeKeys[number], string>
