{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 41,
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
  "lineno": 41,
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
mscgen = (yy) ->
  yy.result "msc {"
  r = getGraphRoot(yy)
  comma = false
  
  # print out all node declarations FIRST (if any)
  for i of r.OBJECTS
    o = r.OBJECTS[i]
    if o instanceof Group
      yy.result " /*" + o.getName() + getAttrFmt(o, "label", " {0}*/")
      for j of o.OBJECTS
        z = o.OBJECTS[j]
        s = getAttrFmt(z, "color", ",color=\"{0}\"") + getAttrFmt(z, "style", ",style={0}") + getAttrFmt(z, "label", ",label=\"{0}\"")
        s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
        yy.result ((if comma then "," else "")) + "    " + z.getName() + s
        comma = true
    else if o instanceof Node
      s = getAttrFmt(o, "color", ",textbgcolor=\"{0}\"") + getAttrFmt(o, "style", ",style={0}") + getAttrFmt(o, "label", ",label=\"{0}\"")
      s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
      yy.result ((if comma then "," else "")) + "  " + o.getName() + s
      comma = true
  yy.result ";"
  id = 1
  for i of yy.LINKS
    l = yy.LINKS[i]
    lt = undefined
    lr = l.right
    ll = l.left
    if lr instanceof Group
      
      # just pick ONE Node from group and use lhead
      # TODO: Assuming it is Node (if Recursive groups implemented, it
      # could be smthg else)
      t += " lhead=cluster_" + lr.getName()
      lr = lr.OBJECTS[0]
      lr is `undefined`
    
    # TODO:Bad thing, EMPTY group..add one invisible node there...
    # But should add already at TOP
    
    # TODO:Assuming producing DIGRAPH
    # For GRAPH all edges are type --
    # but we could SET arrow type if we'd like
    rightName = lr.getName()
    dot = false
    dash = false
    broken = false
    if l.linkType.indexOf(".") isnt -1
      dot = true
    else if l.linkType.indexOf("-") isnt -1
      dash = true
    else broken = true  if l.linkType.indexOf("/") isnt -1
    swap = false
    attrs = []
    label = getAttr(l, "label")
    color = getAttr(l, "color")
    url = getAttr(l, "url")
    note = ""
    attrs.push "URL=\"" + url + "\""  if url
    attrs.push "linecolor=\"" + color + "\""  if color
    if label
      if label.indexOf("::") isnt -1
        label = label.split("::")
        note = label[1].trim()
        attrs.push "label=\"" + label[0].trim() + "\""
      else
        attrs.push "label=\"" + label.trim() + "\""
    attrs.push "id=\"" + id++ + "\""
    if l.linkType.indexOf("<") isnt -1 and l.linkType.indexOf(">") isnt -1
      
      # Broadcast type (<>)
      # hmh..since seqdiag uses a<>a as broadcast and
      # a<>b as autoreturn, could we do as well?
      if ll is lr
        lt = "->"
        rightName = "*"
      else
        lt = "<=>"
        swap = true
    else if l.linkType.indexOf("<") isnt -1
      tmp = ll
      ll = lr
      lr = tmp
      if dot
        lt = ">>"
      else if dash
        lt = "->"
      else if broken
        lt = "-x"
      else
        lt = "=>"
      rightName = lr.getName()
    else if l.linkType.indexOf(">") isnt -1
      if dot
        lt = ">>"
      else if dash
        lt = "->"
      else if broken
        lt = "-x"
      else
        lt = "=>"
    else if dot
      
      # dotted
      attrs.push "textcolor=\"" + color + "\""  if color
      yy.result "...[" + attrs.join(",") + "];"
      continue
    else if dash
      
      # dashed
      attrs.push "textcolor=\"" + color + "\""  if color
      yy.result "---[" + attrs.join(",") + "];"
      continue
    else
      yy.result "ERROR: SHOULD NOT HAPPEN"
    yy.result ll.getName() + lt + rightName + "[" + attrs.join(",") + "];"
    
    # yy.result(ll.getName() +' abox '
    # +lr.getName()+'[label="'+note+'"];');
    yy.result lr.getName() + " abox " + lr.getName() + "[label=\"" + note + "\"];"  unless note is ""
  
  # if (swap)
  # yy.result(lr.getName() + lt + ll.getName() + t + ";");
  yy.result "}"
