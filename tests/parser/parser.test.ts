// @ts-check

import { diagrammerParser } from '../../build/diagrammer_parser.js'
import { getParserYY } from '../../build/types/diagrammer_parser_types'
import { generators, GraphCanvas } from '../../model/graphcanvas.js'
import { GraphContainer } from '../../model/graphcontainer.js'
import { GraphGroup } from '../../model/graphgroup.js'
import { GraphInner } from '../../model/graphinner.js'
import { GraphVertex } from '../../model/graphvertex.js'
import { GraphConditional } from '../../model/graphconditional.js'
import { GraphEdgeDirectionType, GraphEdgeLineType } from '../../model/graphedge.js'
import { describe, expect, it } from '@jest/globals'

// curried, canvas passed on call site
const canvasHas = (prop: string, value: any) => {
  // Moved away from setting 'defaults' directly as dynamic properties of canvas, they're now in 'defaults' type
  return (canvas: GraphCanvas) => {
    // just to allow dumping helper debug (see TODO at Run all tests..will go away)
    try {
      // Actual canvas properties! vs
      if (prop in canvas.defaults) {
        const value2 = canvas.defaults[prop as keyof GraphCanvas['defaults']]
        expect(value2).toStrictEqual(value)
      } else if (prop in GraphCanvas) {
        const value1 = canvas[prop as keyof GraphCanvas]
        expect(value1).toStrictEqual(value)
      }
    } catch (ex) {
      console.warn(canvas)
    }
    if (prop in canvas.defaults) {
      const value2 = canvas.defaults[prop as keyof GraphCanvas['defaults']]
      expect(value2).toStrictEqual(value)
    } else if (prop in GraphCanvas) {
      const value1 = canvas[prop as keyof GraphCanvas]
      expect(value1).toStrictEqual(value)
    }
  }
}

// curried, canvas passed on call site
const canvasContainsAutoProps = (match: string[]) => {
  return (canvas: GraphCanvas) => {
    const res: string[] = []
    const collectIfDefined = (a: string[], prop: string | undefined) => { if (prop) a.push(prop) }

    function containerName(container: GraphContainer) {
      if (container instanceof GraphCanvas) {
        return ''
      }
      if (container instanceof GraphGroup) {
        return `:${container.getName() ?? ''}`
      }
      if (container instanceof GraphInner) {
        return `:${container.getName() ?? ''}`
      }
      throw new Error('Unexpected container')
    }
    let container: GraphContainer = canvas
    canvas.getObjects().forEach(function c(connectable) {
      if (connectable instanceof GraphContainer) {
        container = connectable
        const containerProps: string[] = []
        collectIfDefined(containerProps, containerName(container))
        // todo defaults...
        collectIfDefined(containerProps, container.getLabel())
        collectIfDefined(containerProps, container.getColor())
        collectIfDefined(containerProps, container.getTextColor())
        res.push(containerProps.join(','))
        connectable.getObjects().forEach(o => { c(o) })
        container = connectable
      } else {
        const vertexProps: string[] = []
        if (connectable instanceof GraphVertex) {
          collectIfDefined(vertexProps, containerName(container))
        }
        collectIfDefined(vertexProps, connectable.getName())
        if (connectable instanceof GraphVertex) {
          collectIfDefined(vertexProps, connectable.getStyle())
        }
        collectIfDefined(vertexProps, connectable.getLabel())
        collectIfDefined(vertexProps, connectable.getColor())
        collectIfDefined(vertexProps, connectable.getTextColor())
        collectIfDefined(vertexProps, connectable.getUrl())
        if (connectable instanceof GraphVertex) { collectIfDefined(vertexProps, connectable.getImage()) }
        // also iterate INTO containers
        res.push(vertexProps.join(','))
      }
    }, false) // TODO: also innards

    canvas.getEdges().forEach(edge => {
      const edgeProps: string[] = []
      collectIfDefined(edgeProps, edge.left.getName())
      collectIfDefined(edgeProps, edge.lcompass)
      collectIfDefined(edgeProps, edge.edgeType)
      collectIfDefined(edgeProps, edge.right.getName())
      collectIfDefined(edgeProps, edge.rcompass)
      collectIfDefined(edgeProps, edge.color)
      collectIfDefined(edgeProps, edge.color) // always empty
      collectIfDefined(edgeProps, edge.textcolor)
      collectIfDefined(edgeProps, edge.label)
      collectIfDefined(edgeProps, edge.parent?.getName() ? edge.parent.getName() : '') // what to do with unnamed containers?
      res.push(edgeProps.join(','))
    })
    try {
      expect(res).toStrictEqual(match)
    } catch (ex) {
      // console.warn(canvas, res)
      console.warn(`[ "${res.join('","')}" ]`)
    }
    expect(res).toStrictEqual(match)
  }
}

// curried, canvas passed on call site
const dumpCanvas = () => {
  return (canvas: GraphCanvas) => {
    console.warn(canvas)
    expect(false).toBeTruthy()
  }
}
// TODO: Add "strong" consice typing, instead of list of strings, make them: G("group stuff here"), N("NODE stff here"), E("EDGE stff here")
// Collection of comprehensive but as simple as possible grammar tests (in increasing complexity)
const grammarTests = [
  { g: 'vertical', f: [canvasHas('direction', 'portrait')] },
  { g: 'landscape', f: [canvasHas('direction', 'landscape')] },
  { g: 'start a', f: [canvasHas('start', 'a')] },
  { g: 'shape cloud', f: [canvasHas('shape', 'cloud')] },
  { g: 'equal a,b,c', f: [canvasContainsAutoProps(['a', 'b', 'c'])] },
  { g: 'edge color #0000ff', f: [canvasHas('edgecolor', '#0000ff')] },
  { g: 'group color #0000ff', f: [canvasHas('groupcolor', '#0000ff')] },
  { g: 'vertex color #0000ff', f: [canvasHas('vertexcolor', '#0000ff')] },
  { g: 'vertex text color #0000ff', f: [canvasHas('vertextextcolor', '#0000ff')] },
  { g: 'edge text color #0000ff', f: [canvasHas('edgetextcolor', '#0000ff')] },
  { g: '$(c:#badede)', f: [canvasHas('VARIABLES', { c: '#badede' })] },
  {
    g: '$(c:#badede)\nedge color $(c)',
    f: [
      canvasHas('VARIABLES', { c: '#badede' }),
      canvasHas('edgecolor', '#badede')]
  },
  { g: 'node', f: [canvasContainsAutoProps(['node'])] },
  {
    g: 'a/wifi.png>#ff0000b',
    f: [canvasContainsAutoProps(['a,/wifi.png', 'b', 'a,>,b,#ff0000,#ff0000'])]
  },
  // No good test for this other than passing parsing
  // { g: '// a line comment' },
  // No good test for this other than passing parsing
  // {
  //   g: `/* a multi
  // line
  // comment*/`
  // },
  { g: 'node#000ede', f: [canvasContainsAutoProps(['node,#000ede'])] },
  { g: 'f-#00fffff', f: [canvasContainsAutoProps(['f', 'f,-,f,#00ffff,#00ffff'])] },
  { g: 'node;and its label', f: [canvasContainsAutoProps(['node,and its label'])] },
  { g: 'node>(a,b,c)', f: [canvasContainsAutoProps(['node', ':1', ':1,a', ':1,b', ':1,c', 'node,>,a,1', 'node,>,b,1', 'node,>,c,1'])] },
  { g: 'node>(a b c)', f: [canvasContainsAutoProps(['node', ':1', ':1,a', ':1,b', ':1,c', 'node,>,a,1', 'node,>,b,1', 'node,>,c,1'])] },
  { g: 'node>(a>b>c)', f: [canvasContainsAutoProps(['node', ':1', ':1,a', ':1,b', ':1,c', 'node,>,a,1', 'a,>,b,1', 'b,>,c,1'])] },
  { g: 'node>(a>(b c)>d)', f: [canvasContainsAutoProps(['node', ':1', ':1,a', ':2', ':2,b', ':2,c', ':2,d', 'node,>,a,1', 'a,>,b,2', 'a,>,c,2', '2,>,d,1'])] }, // should be :1,d
  { g: '(a,b,c)>node', f: [canvasContainsAutoProps([':1', ':1,a', ':1,b', ':1,c', ':1,node', '1,>,node'])] }, // wrong!
  { g: '(a b c)>node', f: [canvasContainsAutoProps([':1', ':1,a', ':1,b', ':1,c', ':1,node', '1,>,node'])] }, // wrong!
  { g: '(a>b>c)>node', f: [canvasContainsAutoProps([':1', ':1,a', ':1,b', ':1,c', ':1,node', 'a,>,b,1', 'b,>,c,1', '1,>,node'])] },
  {
    g: '(a>(b c)>d)>node',
    f: [canvasContainsAutoProps([':1', ':1,a', ':2', ':2,b', ':2,c', ':2,d', ':1,node', 'a,>,b,2', 'a,>,c,2', '2,>,d,1', '1,>,node'])]
  },
  { g: 'dotted a;dotted', f: [canvasContainsAutoProps(['a,dotted,dotted'])] },
  { g: 'dashed b;dashed', f: [canvasContainsAutoProps(['b,dashed,dashed'])] },
  { g: 'solid c;solid', f: [canvasContainsAutoProps(['c,solid,solid'])] },
  { g: 'bold d;bold', f: [canvasContainsAutoProps(['d,bold,bold'])] },
  { g: 'rounded e;rounded', f: [canvasContainsAutoProps(['e,rounded,rounded'])] },
  { g: 'diagonals f;diagonals', f: [canvasContainsAutoProps(['f,diagonals,diagonals'])] },
  { g: 'invis g;invis', f: [canvasContainsAutoProps(['g,invis,invis'])] },
  { g: 'm1>"m1 to \'m2\'"m2,"m1 to m3"m3', f: [canvasContainsAutoProps(['m1', 'm2', 'm3', "m1,>,m2,m1 to 'm2'", 'm1,>,m3,m1 to m3'])] },
  { g: 'node>linkedtoanothernode', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,>,linkedtoanothernode'])] },
  { g: 'dashed rect a #ff0000 ;dashed red rectangle', f: [canvasContainsAutoProps(['a,dashed,dashed red rectangle,#ff0000'])] },
  { g: 'node>linkedtoanothernode;AndEdgeLabel', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,>,linkedtoanothernode,AndEdgeLabel'])] },
  { g: 'node>"AndEdgeLabel"linkedtoanothernode', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,>,linkedtoanothernode,AndEdgeLabel'])] },
  { g: 'node:n>linkedtoanothernode', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,:n,>,linkedtoanothernode'])] },
  { g: 'node:se>linkedtoanothernode:ne', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,:se,>,linkedtoanothernode,:ne'])] },
  { g: 'node>linked,to,multiple,nodes', f: [canvasContainsAutoProps(['node', 'linked', 'to', 'multiple', 'nodes', 'node,>,linked', 'node,>,to', 'node,>,multiple', 'node,>,nodes'])] },
  { g: 'many,nodes,linked,to,a>node', f: [canvasContainsAutoProps(['many', 'nodes', 'linked', 'to', 'a', 'node', 'many,>,node', 'nodes,>,node', 'linked,>,node', 'to,>,node', 'a,>,node'])] },
  { g: 'node>linked:n,to:e,multiple:s,nodes:e', f: [canvasContainsAutoProps(['node', 'linked', 'to', 'multiple', 'nodes', 'node,>,linked,:n', 'node,>,to,:e', 'node,>,multiple,:s', 'node,>,nodes,:e'])] },
  { g: 'node>linkedtoanothernode:w', f: [canvasContainsAutoProps(['node', 'linkedtoanothernode', 'node,>,linkedtoanothernode,:w'])] },
  {
    g: `{;UnNamedGroupAndItsMandatoryLabel
  }`,
    f: [canvasContainsAutoProps([':1,UnNamedGroupAndItsMandatoryLabel'])]
  },
  {
    g: `{NamedGroup;AndItsMandatoryLabel
  }`,
    f: [canvasContainsAutoProps([':NamedGroup,AndItsMandatoryLabel'])]
  },
  {
    g: `{NamedGroupWithColor#ff00ff;AndItsMandatoryLabel
  }`,
    f: [canvasContainsAutoProps([':NamedGroupWithColor,AndItsMandatoryLabel,#ff00ff'])]
  },
  { g: 'visualizer ast_record', f: [canvasHas('visualizer', 'ast_record')] },
  { g: 'generator ast', f: [canvasHas('generator', 'abba')] }, // TODO: hmm..think we need to pass request to use grammar defined generators
  {
    g: `cloud inet-router {
      router web01 web02
  }`,
    f: [canvasContainsAutoProps(['inet', 'router', ':1', ':1,web01', ':1,web02', 'inet,-,router'])]
  },
  {
    g: `cloud router;label
  {;grp
      router;different label
      web01 web02
  }`,
    f: [canvasContainsAutoProps(['router,label', ':1,grp', ':1,web01', ':1,web02'])]
  },
  {
    g: 'User>"DoWork"(A>"createRequesr"B>"DoWork"C>"WorkDone"B>"RequestCreated"A)>"Done"User',
    f: [canvasContainsAutoProps(['User', ':1', ':1,A', ':1,B', ':1,C', 'User,>,A,DoWork,1', 'A,>,B,createRequesr,1', 'B,>,C,DoWork,1', 'C,>,B,WorkDone,1', 'B,>,A,RequestCreated,1', '1,>,User,Done'])]
  }
]

describe('Parser/grammar rule tests', () => {
  // linter failure, it's used in beforeAll error handler
  // definitely used, see below
  let graphcanvas: GraphCanvas

  beforeAll(async () => {
    // Copied over to sharedstate
    generators.set('abba', (gv: GraphCanvas) => {
      graphcanvas = gv
    })
    getParserYY().result = function (result: string) {
      throw new Error('Setup failure')
    }
    getParserYY().USE_GENERATOR = 'abba'
    getParserYY().parseError = function (str: string, hash: string) {
      console.warn('Parsing error found:')
      console.warn(str)
      console.warn(hash)
      throw new Error(str)
    }
  })

  /**
   *
   * @param {string} code
   */
  function parseCode(code: string) {
    getParserYY().GRAPHCANVAS = new GraphCanvas()
    try {
      // @ts-expect-error diagrammerParser type missing, but parse() exists, else this would never work
      diagrammerParser.parse(code)
    } catch (ex) {
      console.warn('=====failed parsing======')
      console.warn(code)
      throw ex
    }
  }

  function makeRandomRGB() {
    const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
    const rgb = randomBetween(0, 16777215)
    return '#' + ('000000' + rgb.toString(16)).substr(-6)
  }

  // describe.each(contentarray)("xxx")
  // TODO: there was a generator pattern for JESTs, so could 'feed' tests in here...
  grammarTests.forEach((t) => {
    it(`Grammar test ${t.g}`, async () => {
      const c = new GraphCanvas()
      getParserYY().GRAPHCANVAS = c
      // @ts-expect-error diagrammer parser type missing, but parse() exists, else this would never work
      diagrammerParser.parse(`${t.g}\n`)
      if (t.f) {
        // dump the code (will be part of description, see TODO above)
        // console.warn(t.g)
        Object.entries(t.f).forEach((i) => {
          const [, assertion] = i
          assertion(c)
        })
      } else {
        // used while building...
        dumpCanvas()(c)
        throw new Error('Missing assertions')
      }
    })
  })

  it('graphContent/VARIABLE/state 16', async () => {
    parseCode('$(variable:value) $(toinen:kolmas)')
    const variables = new Map<string, string>(Object.entries(Array(graphcanvas.VARIABLES)[0]))
    expect(variables.has('variable')).toBeTruthy()
    expect(variables.has('toinen')).toBeTruthy()
    expect(variables.get('variable')).toMatch('value')
    expect(variables.get('toinen')).toMatch('kolmas')
  })

  it('graphContent/SHAPE/state 17', async () => {
    parseCode('shape ellipse')
    expect(graphcanvas.getCurrentShape()).toMatch('ellipse')
  })

  it('graphContent/EQUAL/state 18', async () => {
    parseCode('equal a,b\n')
    const equals = graphcanvas.getEqual()
    expect(equals[0].getName()).toMatch('a')
    expect(equals[1].getName()).toMatch('b')
  })

  it('graphContent/LANDSCAPE/state 20', async () => {
    parseCode('landscape\n')
    expect(graphcanvas.getDirection()).toMatch('landscape')
  })

  // Can't test since we've FORCED a generator..
  // it(`graphContent/generator/state 21`, async () => {
  //     parseCode("generator xx\n");
  //     expect(graphcanvas.getGenerator()).toMatch('xx');
  // });

  it('graphContent/visualizer/state 22', async () => {
    parseCode('visualizer xx\n')
    expect(graphcanvas.getVisualizer()).toMatch('xx')
  })

  it('graphContent/PORTRAIT/state 23', async () => {
    parseCode('portrait\n')
    expect(graphcanvas.getDirection()).toMatch('portrait')
  })

  it('graphContent/COMMENT/state 24', async () => {
    // no point
  })

  it('graphContent/VERTEX_COLOR/state 25', async () => {
    const color = makeRandomRGB()
    parseCode(`vertex color ${color}`)
    expect(graphcanvas.getDefault('vertexcolor')).toMatch(color)
  })

  it('graphContent/VERTEXTEXT_COLOR/state 26', async () => {
    const color = makeRandomRGB()
    parseCode(`vertex text color ${color}`)
    expect(graphcanvas.getDefault('vertextextcolor')).toMatch(color)
  })

  it('graphContent/EDGE_COLOR/state 27', async () => {
    const color = makeRandomRGB()
    parseCode(`edge color ${color}`)
    expect(graphcanvas.getDefault('edgecolor')).toMatch(color)
  })

  it('graphContent/EDGETEXT_COLOR/state 28', async () => {
    const color = makeRandomRGB()
    parseCode(`edge text color ${color}`)
    expect(graphcanvas.getDefault('edgetextcolor')).toMatch(color)
  })

  it('graphContent/GROUP_COLOR/state 29', async () => {
    const color = makeRandomRGB()
    parseCode(`group color ${color}`)
    expect(graphcanvas.getDefault('groupcolor')).toMatch(color)
  })

  it('graphContent/[ IF/state 30 ELSEIF/state 31 ELSE/state 32 ENDIF/state 33]', async () => {
    parseCode(`
entry;is required with conditional
if a then
elseif b then
else c then
endif
exit;exit node is also required
        `)
    // console.warn(graphcanvas)
    expect(graphcanvas.getObjects().length).toBe(5)
    expect(graphcanvas._ROOTVERTICES.length).toBe(2)
    // in this case only all the objects and root vertices do match
    // expect(graphcanvas.getObjects()).toMatchObject(graphcanvas._ROOTVERTICES)

    const conditionalGroups = new Set(['1', '2', '3'])
    const verticeNames = new Set(['entry', 'exit'])

    graphcanvas.getObjects().forEach(obj => {
      const objectName: string = obj.getName()
      if (obj instanceof GraphConditional) {
        // TODO: grammar is buggy, there should be single vertex in, or none for no-vertices conditional
        // how ever 'then'/'else' is intepretex as one
        // expect(obj._getObjects().length).toBe(1);
        conditionalGroups.delete(objectName)
        switch (objectName) {
          case '1':
            expect(obj.getLabel()).toBe('a')
            expect(obj.exitvertex).toBe(1)
            expect(obj.conditional).toBe('if')
            expect(obj._conditionalEntryEdge?.getName()).toBe('entry')
            break
          case '2':
            expect(obj.getLabel()).toBe('b')
            expect(obj.exitvertex).toBe(2)
            expect(obj.conditional).toBe('elseif')
            break
          case '3':
            expect(obj.getLabel()).toBe('endif')
            expect(obj.exitvertex).toBe(3)
            expect(obj.conditional).toBe('endif')
            expect(obj._conditionalExitEdge?.getName()).toBe('exit')
            break
        }
      } else if (obj instanceof GraphVertex) {
        verticeNames.delete(objectName)
        switch (objectName) {
          case 'entry':
            expect(obj.getLabel()).toBe('is required with conditional')
            expect(obj._noedges).toBeTruthy()
            break
          case '2':
            expect(obj.getLabel()).toBe('exit node is also required')
            expect(obj._noedges).toBeTruthy()
            break
        }
      } else {
        // we only expect Groups/Vertices
        expect(false).toBeTruthy()
      }
    })
    expect(conditionalGroups.size).toBe(0)
    expect(verticeNames.size).toBe(0)
  })

  it('graphContent/GROUP/state 34', async () => {
    const color = makeRandomRGB()
    parseCode(`group name ${color};label\ngroup end\n`)
    const connectable = graphcanvas.getFirstObject()
    expect(connectable).toBeInstanceOf(GraphGroup)
    const group = connectable as GraphGroup
    expect(graphcanvas.getObjects().length).toBe(1)
    expect(group.getName()).toBe('name')
    expect(group.getColor()).toBe(color)
    expect(group.isEmpty()).toBeTruthy()
  })

  it('graphContent/GROUP(brief)/state 34', async () => {
    const color = makeRandomRGB()
    parseCode(`{name${color};label\n}\n`)
    const connectable = graphcanvas.getFirstObject()
    expect(connectable).toBeInstanceOf(GraphGroup)
    const group = connectable as GraphGroup
    expect(graphcanvas.getObjects().length).toBe(1)
    expect(group.getName()).toBe('name')
    expect(group.getColor()).toBe(color)
    expect(group.isEmpty()).toBeTruthy()
  })

  it('graphContent/START/state 35', async () => {
    // this is just a reference to a vertex, not a vertex(probably should be though :) )
    parseCode('start a\n')
    expect(graphcanvas.getStart()).toBe('a')
  })

  it('graphContent/readEvents/state 36', async () => {
    const color = makeRandomRGB()
    // should have vertices a,q,w,e latter 3 have label label
    // root vertices a
    // 3 edges, between a (at NW corner) q,w,e to (at SE corner) edge text is edgelabel
    // readEvents COMPASS? EVENT COMPASS? colorOrVariable? INLINE_STRING? vertexGroupListOrAttrs LABEL? -> getEdge(yy,$EVENT,$readEvents,$vertexGroupListOrAttrs,$6,$8?$8.substring(1):$8,$5,$2,$4).right
    parseCode(`a:nw ->:se ${color} "edgelabel" q,w,e;label\n`)
    expect(graphcanvas.getObjects().length).toBe(4)
    expect(graphcanvas._ROOTVERTICES.length).toBe(1)
    expect(graphcanvas.getEdges().length).toBe(3)

    // verify all objects accounted for
    const vertices = new Set(['a', 'q', 'w', 'e'])
    graphcanvas.getObjects().forEach(vertex => {
      vertices.delete(vertex.getName())
    })
    expect(vertices.size).toBe(0)

    expect(graphcanvas.lastSeenVertex?.getName()).toBe('e')

    const edges = new Set(['q', 'w', 'e'])
    graphcanvas.getEdges().forEach((edge, idx) => {
      expect(edge.getColor()).toBe(color)
      expect(edge.getName()).toBe('')
      expect(edge.lcompass).toBe(':nw')
      expect(edge.rcompass).toBe(':se')
      expect(edge.direction()).toBe(GraphEdgeDirectionType.RIGHT)
      expect(edge.lineType() === GraphEdgeLineType.DASHED).toBeTruthy()
      expect(edge.left.getName()).toBe('a')

      edges.delete(edge.right.getName())
    })
    expect(edges.size).toBe(0)
  })

  // TODO: fix this
  it.skip('Root vertices test', async () => {
    parseCode(`
            a b c
            q>a w>b e>c
            w>a
            e>b
            w>c
            q>c
            q>b
            e>a
            q>w
            q>e
        `)

    // all vertices gradually interconnected, hence this graph has only one ROOT node q
    // q has subs w,e which have c,a,b
    // model how ever misproduces the situations and incorrectly has q,w AND e in the ROOTVERTICES list
    expect(graphcanvas._ROOTVERTICES.length).toBe(1)
    expect(graphcanvas._ROOTVERTICES[0].getName()).toBe('q')
  })
})
