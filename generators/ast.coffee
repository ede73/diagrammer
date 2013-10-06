ast = (yy) ->
  indent = (msg) ->
    return ""  if msg.trim() is ""
    prefix = ""
    i = 0

    while i < depth
      prefix += "    "
      i++
    prefix + msg
  depth = 0
  processANode = (o) ->

  yy.result indent("{result:")
  depth++
  r = getGraphRoot(yy)
  yy.result indent(JSON.stringify(visualizer: r.getVisualizer()))  if r.getVisualizer()
  yy.result indent(JSON.stringify(direction: r.getDirection()))  if r.getDirection()
  yy.result indent(JSON.stringify(start: r.getStart()))  if r.getStart()
  yy.result indent(JSON.stringify(equal: r.getEqual()))  if r.getEqual()
  traverseObjects = traverseObjects = (r) ->
    for i of r.OBJECTS
      o = r.OBJECTS[i]
      if o instanceof Group
        processAGroup = (o) ->
          n = JSON.parse(JSON.stringify(o))
          n.OBJECTS = `undefined`
          yy.result indent(JSON.stringify(group: n))
          depth++
          traverseObjects o
          depth--
        (o)
      else if o instanceof Node
        yy.result indent(JSON.stringify(node: o))
      else
        throw new Error("Not a node nor a group, NOT SUPPORTED")
  (r)
  for i of yy.LINKS
    l = yy.LINKS[i]
    n = JSON.parse(JSON.stringify(l))
    n.container.OBJECTS = `undefined`
    n.container.label = `undefined`
    n.container.conditional = `undefined`
    yy.result indent(JSON.stringify(n))
  --depth
  yy.result indent("}")
