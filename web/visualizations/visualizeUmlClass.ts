// @ts-check
import go from 'gojs'
import { removeOldVisualizations } from '../d3support.js'
import { visualizations } from '../globals.js'
import { RelationshipTypeT, UMLClassDocumentT, MethodDeclarationT, PropertyDeclarationT, RelationshipT, ParameterTypeT } from '../../generators/umlclass.js'

visualizations.set('umlclass', visualizeUmlClass)

// use ../manual_test_diagrams/uml.d
export function visualizeUmlClass(generatorResult: string) {
  const printSize = 900
  const jsonData = JSON.parse(generatorResult) as UMLClassDocumentT
  const $ = go.GraphObject.make

  // don't need to save
  removeOldVisualizations('UMLCLASS')

  const myDiagram =
    $(go.Diagram, 'UMLCLASS',
      {
        'undoManager.isEnabled': true,
        layout: $(go.TreeLayout,
          { // this only lays out in trees nodes connected by "generalization" links
            angle: 90,
            path: go.TreeLayout.PathSource, // links go from child to parent
            setsPortSpot: false, // keep Spot.AllSides for link connection spot
            setsChildPortSpot: false, // keep Spot.AllSides
            // nodes not connected by "generalization" links are laid out horizontally
            arrangement: go.TreeLayout.ArrangementHorizontal,
            nodeSpacing: 100, layerSpacing: 100
          })
      })

  // show visibility or access as a single character at the beginning of each property or method
  function classVisibilityToHumanReadable(v: string): string {
    switch (v) {
      case 'public': return '+'
      case 'private': return '-'
      case 'protected': return '#'
      case 'package': return '~'
      default: return v
    }
  }

  // the item template for properties
  const propertyTemplate =
    // sourceprop = PropertyDeclarationT
    $(go.Panel, 'Horizontal',
      // property visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding('text', 'visibility', classVisibilityToHumanReadable)),
      // property name, underlined if scope=="class" to indicate static property
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding('text', 'name').makeTwoWay(),
        new go.Binding('isUnderline', 'scope', (isClassLevel: string) => { return isClassLevel[0] === 'c' })),
      // property type, if known
      $(go.TextBlock, '',
        new go.Binding('text', 'type', (hasType: string) => { return (hasType ? ': ' : '') })),
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding('text', 'type').makeTwoWay()),
      // property default value, if any
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding('text', 'default', (hasDefault: string) => { return hasDefault ? ' = ' + hasDefault : '' }))
    )

  // the item template for methods
  const methodTemplate =
    // sourceprop = MethodDeclarationT
    $(go.Panel, 'Horizontal',
      // method visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding('text', 'visibility', classVisibilityToHumanReadable)),
      // method name, underlined if scope=="class" to indicate static method
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding('text', 'name').makeTwoWay(),
        new go.Binding('isUnderline', 'scope', (isClassLevel: string) => { return isClassLevel[0] === 'c' })),
      // method parameters
      $(go.TextBlock, '',
        // this does not permit adding/editing/removing of parameters via inplace edits
        new go.Binding('text', 'parameters', (parameters: ParameterTypeT[]) => {
          let s = '('
          for (let i = 0; i < parameters.length; i++) {
            const param = parameters[i]
            if (i > 0) s += ', '
            s += `${param.name}: ${param.type}`
          }
          return s + ')'
        })),
      // method return type, if any
      $(go.TextBlock, '',
        new go.Binding('text', 'type', function (hasType: string) { return (hasType ? ': ' : '') })),
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding('text', 'type').makeTwoWay())
    )

  const background = 'lightblue'
  myDiagram.nodeTemplate =
    $(go.Node, 'Auto',
      {
        locationSpot: go.Spot.Center,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides,
        //linkSpacing: 33,
      },
      $(go.Shape, { fill: background }),

      // header ---
      $(go.Panel, 'Table',
        { defaultRowSeparatorStroke: 'black' },
        $(go.TextBlock,
          {
            row: 0,
            columnSpan: 2,
            margin: 3,
            alignment: go.Spot.Center,
            font: 'bold 12pt sans-serif',
            isMultiline: false,
            editable: false
          },
          new go.Binding('text', 'name').makeTwoWay()),

        // properties ----
        $(go.TextBlock, 'Properties',
          { row: 1, font: 'italic 10pt sans-serif' },
          new go.Binding('visible', 'visible', (v: boolean) => { return !v }).ofObject('PROPERTIES')),
        $(go.Panel, 'Vertical', { name: 'PROPERTIES' },
          new go.Binding('itemArray', 'properties'),
          {
            row: 1,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background: background,
            itemTemplate: propertyTemplate
          }
        ),
        $('PanelExpanderButton', 'PROPERTIES',
          { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding('visible', 'properties', (arr: any[]) => { return arr.length > 0 })),

        // methods -----
        $(go.TextBlock, 'Methods',
          { row: 2, font: 'italic 10pt sans-serif' },
          new go.Binding('visible', 'visible', (v: boolean) => { return !v }).ofObject('METHODS')),
        $(go.Panel, 'Vertical', { name: 'METHODS' },
          new go.Binding('itemArray', 'methods'),
          {
            row: 2,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background: background,
            itemTemplate: methodTemplate
          }
        ),
        $('PanelExpanderButton', 'METHODS',
          { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
          new go.Binding('visible', 'methods', (arr: any[]) => { return arr.length > 0 }))
      )
    )

  function shouldLayoutVertically(r: RelationshipTypeT) {
    return true
    return ['generalization', 'composition'].includes(r)
  }

  function tailRelationShipToFillColor(r: RelationshipTypeT) {
    switch (r) {
      case 'aggregation': return 'transparent' // "open"
      case 'composition': return 'black' // "filled"
      default: return ''
    }
  }
  // alas not strongly typed, but return value passed to:
  // https://gojs.net/latest/api/symbols/Shape.html#fromArrow
  function tailArrow(r: RelationshipTypeT) {
    switch (r) {
      case 'aggregation': return 'StretchedDiamond' // diamond, not filled
      case 'composition': return 'StretchedDiamond' // diamond, not filled
      default: return ''
    }
  }

  function getRelationshipStroke(r: RelationshipTypeT) {
    switch (r) {
      case 'dependency': return [4, 4]
      case 'realization': return [4, 4]
      default: return [0, 0]
    }
  }

  function headRelationShipToFillColor(r: RelationshipTypeT) {
    switch (r) {
      case 'composition': return 'black' // "filled"
      default: return 'transparent' // "open"
    }
  }

  // alas not strongly typed, but return value passed to:
  // https://gojs.net/latest/api/symbols/Shape.html#toArrow
  function headArrow(r: RelationshipTypeT) {
    // OMG! UML is supposed to be standard, and there's massive massive deviation of association types
    // in, practise..no standard :)
    switch (r) {
      case 'association': return ''     // open arrow, cont'd line OK .
      case 'dependency': return 'Boomerang'      // open arrow, DASHED line ->

      case 'generalization': return 'Triangle'      // (inheritance) Triangle(TODO:not filled), cont'd line >
      case 'realization': return 'Triangle'         // Triangle(TODO: not filled), DASHED line ->

      case 'composition': return 'Boomerang' // diamond (filled), cont'd line OK >>
      case 'aggregation': return 'Boomerang' // diamond (TODO:not filled) cont'd line >>
      default: return ''
    }
  }

  // new go.Binding("strokeDashArray", "dash")
  myDiagram.linkTemplate =
    $(go.Link,
      { routing: go.Link.Orthogonal },
      new go.Binding('isLayoutPositioned', 'relationship', shouldLayoutVertically),
      $(go.Shape, new go.Binding("strokeDashArray", "relationship", getRelationshipStroke)),

      $(go.Shape, { scale: 2 },
        new go.Binding('fill', 'relationship', tailRelationShipToFillColor),
        new go.Binding('fromArrow', 'relationship', tailArrow)),

      $(go.Shape, { scale: 2 },
        new go.Binding('fill', 'relationship', headRelationShipToFillColor),
        new go.Binding('toArrow', 'relationship', headArrow)),

      $(go.TextBlock, {
        textAlign: 'center',
        font: 'italic 14px sans-serif',
        stroke: '#606060',
        isMultiline: true,
      },
        new go.Binding('text', 'label', (label: string) =>
          // there's no replaceAll here
          label ? label.split('\\n').join("\n") : ''),
      ), $(go.TextBlock, {
        textAlign: 'center',
        font: 'bold 14px sans-serif',
        stroke: '#1967B3',
        segmentIndex: 0,
        segmentOffset: new go.Point(NaN, NaN),
        segmentOrientation: go.Link.OrientPlus90
      },
        new go.Binding('text', 'tailLabel', (tailLabel: string) => tailLabel ? tailLabel : ''),
      ),
      $(go.TextBlock, {
        textAlign: 'center',
        font: 'bold 14px sans-serif',
        stroke: '#1967B3',
        segmentIndex: -1,
        segmentOffset: new go.Point(NaN, NaN),
        segmentOrientation: go.Link.OrientPlus90
      },
        new go.Binding('text', 'headLabel', (headLabel: string) => headLabel ? headLabel : ''))
    )

  // setup a few example class nodes and relationships
  const nodedata = jsonData[0]
  const linkdata = jsonData[1]
  console.log(linkdata)
  myDiagram.model = $(go.GraphLinksModel,
    {
      copiesArrays: true,
      copiesArrayObjects: true,
      nodeDataArray: nodedata,
      linkDataArray: linkdata
    })

  const x = 0
  const y = 0
  const u = new go.Size(printSize, printSize)
  const svg = myDiagram.makeSvg({ position: new go.Point(x, y) })
  removeOldVisualizations().appendChild(svg)
}
