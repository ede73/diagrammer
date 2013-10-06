{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 239,
  "children": [],
  "varDecls": [],
  "labels": {
    "table": {},
    "size": 0
  },
  "functions": [],
  "nonfunctions": [],
  "transformed": true
}
{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 239,
  "children": [],
  "varDecls": [],
  "labels": {
    "table": {},
    "size": 0
  },
  "functions": [],
  "nonfunctions": [],
  "transformed": true
}
{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 247,
  "children": [],
  "varDecls": [],
  "labels": {
    "table": {},
    "size": 0
  },
  "functions": [],
  "nonfunctions": [],
  "transformed": true
}
{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 247,
  "children": [],
  "varDecls": [],
  "labels": {
    "table": {},
    "size": 0
  },
  "functions": [],
  "nonfunctions": [],
  "transformed": true
}
digraph = (yy) ->
  
  # TODO: See splines control
  # http://www.graphviz.org/doc/info/attrs.html#d:splines
  # TODO: Start note fdp/neato
  # http://www.graphviz.org/doc/info/attrs.html#d:start
  indent = (msg) ->
    return ""  if msg.trim() is ""
    prefix = ""
    i = 0

    while i < depth
      prefix += "  "
      i++
    prefix + msg
  
  # if (getAttr(o,'free')===true){
  # nattrs.push("constraint=false");
  # }
  
  # invis node is not singularity!, circle with minimal
  # width/height IS!
  
  #yy.result(indent("edge[weight=1]"))
  #yy.result(indent("ranksep=0.75"))
  #yy.result(indent("nodesep=0.75"))
  
  # This may FORWARD DECLARE a node...which creates problems with coloring
  
  # {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
  # [shape=plaintext,
  # label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
  
  # This may FORWARD DECLARE a node...which creates problems with coloring
  
  # A group...non empty...parse inside
  getFirstLink = (grp) ->
    
    # yy.result("FIRST NODE"+JSON.stringify(grp));
    for i of yy.LINKS
      l = yy.LINKS[i]
      for j of grp.OBJECTS
        n = grp.OBJECTS[j]
        
        # yy.result("ReturnF "+n);
        return n  if n is l.left
    `undefined`
  getLastLink = (grp) ->
    nod = `undefined`
    
    # yy.result("LAST NODE"+JSON.stringify(grp));
    for i of yy.LINKS
      l = yy.LINKS[i]
      for j of grp.OBJECTS
        n = grp.OBJECTS[j]
        nod = n  if n is l.left
        nod = n  if n is l.right
    
    # yy.result("ReturnL "+nod);
    nod
  depth = 0
  processANode = (o) ->
    nattrs = []
    styles = []
    getAttrFmt o, "color", "fillcolor=\"{0}\"", nattrs
    getAttrFmt o, "color", "filled", styles
    getAttrFmt o, "style", "{0}", styles
    url = getAttr(o, "url")
    nattrs.push "URL=\"" + url.trim() + "\""  if url
    if styles.length > 0
      if styles.join("").indexOf("singularity") isnt -1
        nattrs.push "shape=\"circle\""
        nattrs.push "label=\"\""
        nattrs.push "width=0.01"
        nattrs.push "weight=0.01"
      else
        nattrs.push "style=\"" + styles.join(",") + "\""
    getAttrFmt o, "image", "image=\"icons{0}\"", nattrs
    getAttrFmt o, "textcolor", "fontcolor=\"{0}\"", nattrs
    r = getShape(shapes.digraph, o.shape, "shape=\"{0}\"")
    nattrs.push r  if r
    getAttrFmt o, "label", "label=\"{0}\"", nattrs
    t = ""
    t = "[" + nattrs.join(",") + "]"  if nattrs.length > 0
    yy.result indent(o.getName() + t + ";")

  r = getGraphRoot(yy)
  yy.result "/* render:" + r.getVisualizer() + "*/"  if r.getVisualizer()
  yy.result "digraph {"
  depth++
  yy.result indent("compound=true;")
  if r.getDirection() is "portrait"
    yy.result indent("rankdir=LR;")
  else
    yy.result indent("rankdir=TD;")
  s = r.getStart()
  if s isnt `undefined` and s isnt ""
    fwd = getNode(yy, s)
    processANode fwd
    yy.result indent("//startnode setup\n  {rank = same;null} {rank = same; " + s + "}\n  null [shape=plaintext, label=\"\"];\n  " + s + "[shape=doublecircle];\n  null->" + s + ";\n")
  if r.getEqual() isnt `undefined` and r.getEqual().length > 0
    yy.result indent("{rank=same;")
    x = 0

    while x < r.getEqual().length
      yy.result indent(r.getEqual()[x].getName() + ";")
      x++
    yy.result "}"
  fixgroup = (c) ->
    for i of c.OBJECTS
      o = c.OBJECTS[i]
      if o instanceof Group
        if o.OBJECTS.length is 0
          o.OBJECTS.push new Node("invis_" + o.getName()).setStyle("invis")
        else
          fixgroup o
  (r.OBJECTS)
  lastexit = `undefined`
  lastendif = `undefined`
  traverseObjects = traverseObjects = (r) ->
    for i of r.OBJECTS
      o = r.OBJECTS[i]
      if o instanceof Group
        cond = getAttr(o, "conditional")
        
        #	if (cond=="endif")continue;
        # Group name,OBJECTS,get/setEqual,toString
        processAGroup = (o) ->
          debug JSON.stringify(o)
          yy.result indent("subgraph cluster_" + o.getName() + " {")
          depth++
          yy.result indent(getAttrFmt(o, "label", "   label=\"{0}\";"))  if o.getLabel()
          if o.getColor() isnt `undefined`
            yy.result indent("style=filled;")
            yy.result indent(getAttrFmt(o, "color", "   color=\"{0}\";\n"))
          depth++
          traverseObjects o
          depth--
          depth--
          yy.result indent("}//end of " + o.getName() + " " + cond)
          if cond
            yy.result indent("//COND " + o.getName() + " " + cond)
            if cond is "endif"
              
              #never reached
              exitlink = getAttr(o, "exitlink")
              if exitlink
                yy.result indent(lastexit + "->" + exitlink + "[color=red];")
                yy.result indent(lastendif + "->" + exitlink + ";")
            else
              sn = "entry" + getAttr(o, "exitnode")
              unless lastendif
                lastendif = "endif" + getAttr(o, "exitnode")
                yy.result indent(lastendif + "[shape=circle,label=\"\",width=0.01,height=0.01];")
              
              #TODO:else does not need diamond
              yy.result indent(sn + "[shape=diamond,fixedsize=true,width=1,height=1,label=\"" + o.getLabel() + "\"];")
              
              #entrylink!
              yy.result indent(getAttr(o, "entrylink").getName() + "->" + sn + ";")  if cond is "if"
              
              # FIRST node of group and LAST node in group..
              fn = getFirstLink(o)
              ln = getLastLink(o)
              
              # decision node
              en = "exit" + getAttr(o, "exitnode")
              if lastexit
                yy.result indent(lastexit + "->" + sn + "[label=\"NO\",color=red];")
                lastexit = `undefined`
              
              # YES LINK to first node of the group
              yy.result indent(sn + "->" + fn.getName() + "[label=\"YES\",color=green,lhead=cluster_" + o.getName() + "];")
              yy.result indent(ln.getName() + "->" + lastendif + "[label=\"\"];")
              lastexit = sn
        (o)
      else if o instanceof Node
        processANode o
      else
        throw new Error("Not a node nor a group, NOT SUPPORTED")
  (r)
  yy.result "//links start"
  for i of yy.LINKS
    l = yy.LINKS[i]
    attrs = []
    label = getAttr(l, "label")
    if label
      if label.indexOf("::") isnt -1
        label = label.split("::")
        attrs.push "label=\"" + label[0].trim() + "\""
        attrs.push "xlabel=\"" + label[1].trim() + "\""
      else
        attrs.push "label=\"" + label.trim() + "\""
    url = getAttr(l, "url")
    attrs.push "URL=\"" + url.trim() + "\""  if url
    getAttrFmt l, "color", "color=\"{0}\"", attrs
    getAttrFmt l, ["textcolor", "color"], "fontcolor=\"{0}\"", attrs
    lt = undefined
    lr = l.right
    ll = l.left
    
    # yy.result(indent("//"+lr));
    if lr instanceof Group
      
      # just pick ONE Node from group and use lhead
      # TODO: Assuming it is Node (if Recursive groups implemented, it
      # could be smthg else)
      attrs.push " lhead=cluster_" + lr.getName()
      lr = lr.OBJECTS[0]
      lr is `undefined`
    
    # TODO:Bad thing, EMPTY group..add one invisible node there...
    # But should add already at TOP
    if ll instanceof Group
      attrs.push " ltail=cluster_" + ll.getName()
      ll = ll.OBJECTS[0]
      ll is `undefined`
    
    # Same as above
    
    # TODO:Assuming producing DIGRAPH
    # For GRAPH all edges are type --
    # but we could SET arrow type if we'd like
    if l.linkType.indexOf(".") isnt -1
      attrs.push "style=\"dotted\""
    else attrs.push "style=\"dashed\""  if l.linkType.indexOf("-") isnt -1
    
    # TODO: Somehow denote better this "quite does not reach"
    # even though such an edge type MAKES NO SENSE in a graph
    attrs.push "arrowhead=\"tee\""  if l.linkType.indexOf("/") isnt -1
    if l.linkType.indexOf("<") isnt -1 and l.linkType.indexOf(">") isnt -1
      lt = "->"
      attrs.push "dir=both"
    else if l.linkType.indexOf("<") isnt -1
      tmp = ll
      ll = lr
      lr = tmp
      lt = "->"
    else if l.linkType.indexOf(">") isnt -1
      lt = "->"
    else
      
      # is dotted or dashed no direction
      lt = "->"
      attrs.push "dir=none"
    t = ""
    t = "[" + attrs.join(",") + "]"  if attrs.length > 0
    yy.result indent(ll.getName() + getAttrFmt(l, "lcompass", "{0}").trim() + lt + lr.getName() + getAttrFmt(l, "rcompass", "{0}").trim() + t + ";")
  yy.result "}"
