{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 55,
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
  "lineno": 55,
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
seqdiag = (yy) ->
  yy.result "seqdiag {"
  yy.result "autonumber = True;"
  
  # quite fucked up life line activations and no control over..skip
  # it,shrimpy!
  yy.result " activation = none;"
  r = getGraphRoot(yy)
  
  # print out all node declarations FIRST (if any)
  for i of r.OBJECTS
    o = r.OBJECTS[i]
    if o instanceof Group
      yy.result " /*" + o.getName() + getAttrFmt(o, "label", " {0}*/")
      for j of o.OBJECTS
        z = o.OBJECTS[j]
        
        # no color support either..
        s = getAttrFmt(z, "style", ",style={0}") + getAttrFmt(z, "label", ",label=\"{0}\"")
        s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
        yy.result z.getName() + s + ";"
    else if o instanceof Node
      s = getAttrFmt(o, "style", ",style={0}") + getAttrFmt(o, "label", ",label=\"{0}\"") + getAttrFmt(o, "color", ",color=\"{0}\"")
      s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
      yy.result o.getName() + s + ";"
  for i of yy.LINKS
    l = yy.LINKS[i]
    attrs = []
    lt = undefined
    lr = l.right
    ll = l.left
    color = getAttr(l, "color")
    attrs.push "color=\"" + color + "\""  if color
    label = getAttr(l, "label")
    if label
      if label.indexOf("::") isnt -1
        label = label.split("::")
        attrs.push "note=\"" + label[1].trim() + "\""
        attrs.push "label=\"" + label[0].trim() + "\""
      else
        attrs.push "label=\"" + label.trim() + "\""
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
    else attrs.push "failed"  if l.linkType.indexOf("/") isnt -1
    if l.linkType.indexOf("<") isnt -1 and l.linkType.indexOf(">") isnt -1
      
      # Broadcast type (<>)
      # Alas not supported...
      # HMh..since one could use the === as broadcast
      # a<>b would be BETTER served as autoreturn edge
      # But I'd need to GUESS a new broadcast then..
      # hm.. solve a<>a is broadcast, where as
      # a<>b (any else than node itself) is autoreturn
      if lr is ll
        yy.result getAttrFmt(l, "label", "===BROADCAST:{0}===")
        continue
      lt = "=>"
    else if l.linkType.indexOf("<") isnt -1
      if dot
        lt = "<--"
      else if dash
        lt = "<<--"
      else
        lt = "<-"
      rightName = lr.getName()
    else if l.linkType.indexOf(">") isnt -1
      if dot
        lt = "-->"
      else if dash
        lt = "-->>"
      else
        lt = "->"
    else if dot
      
      # dotted
      yy.result getAttrFmt(l, "label", "...{0}...")
      continue
    else if dash
      
      # dashed
      yy.result getAttrFmt(l, "label", "==={0}===")
      continue
    else
      yy.result "ERROR: SHOULD NOT HAPPEN"
    
    # MUST HAVE whitespace at both sides of the "arrow"
    yy.result ll.getName() + " " + lt + " " + rightName + "[" + attrs.join(",") + "];"
  yy.result "}"
