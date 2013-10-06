{
  "type": "block",
  "src": "{",
  "value": "{",
  "lineno": 116,
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
  "lineno": 116,
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
  "lineno": 126,
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
  "lineno": 126,
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
  "lineno": 133,
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
  "lineno": 146,
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
plantuml_sequence = (yy) ->
  indent = (msg) ->
    return ""  if msg.trim() is ""
    prefix = ""
    i = 0

    while i < depth
      prefix += "  "
      i++
    prefix + msg
  depth = 0
  processANode = (o) ->
    nattrs = []
    styles = []
    
    # getAttrFmt(o, 'color', 'fillcolor="{0}"',nattrs);
    # getAttrFmt(o,'color','filled',styles);
    getAttrFmt o, "style", "{0}", styles
    if styles.length > 0
      if styles.join("").indexOf("singularity") isnt -1
        
        # invis node is not singularity!, circle with minimal
        # width/height IS!
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
    t = ""
    t = "[" + nattrs.join(",") + "]"  if nattrs.length > 0
    yy.result indent("participant " + getAttrFmt(o, "label", "\"{0}\" as") + " " + o.getName() + t)

  r = getGraphRoot(yy)
  yy.result "/* render:" + r.getVisualizer() + "*/"  if r.getVisualizer()
  yy.result "@startuml"
  yy.result "autonumber"
  
  #
  #     * if (r.getDirection() === "portrait") { yy.result(indent("rankdir=LR;")); }
  #     * else { yy.result(indent("rankdir=TD;")); }
  #     
  
  # This may FORWARD DECLARE a node...which creates problems with coloring
  s = r.getStart()
  if s isnt `undefined` and s isnt ""
    fwd = getNode(yy, s)
    processANode fwd
  
  # {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
  # [shape=plaintext,
  # label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
  # yy.result(indent("//startnode setup\n {rank = same;null} {rank =
  # same; " + s + "}\n null [shape=plaintext, label=\"\"];\n " + s +
  # "[shape=doublecircle];\n null->" + s + ";\n"));
  
  # This may FORWARD DECLARE a node...which creates problems with coloring
  #
  #     * if (r.getEqual() != undefined && r.getEqual().length > 0) {
  #     * yy.result(indent("{rank=same;")); for (var x = 0; x <
  #     * r.getEqual().length; x++) { yy.result(indent(r.getEqual()[x].getName() +
  #     * ";")); } yy.result("}"); }
  #     
  
  #
  #     * var fixgroup = function(c) { for (var i in c.OBJECTS) { var o =
  #     * c.OBJECTS[i]; if (o instanceof Group) { if (o.OBJECTS.length == 0) {
  #     * o.OBJECTS.push(new Node("invis_" + o.getName()).setStyle("invis")); }
  #     * else { //A group...non empty...parse inside fixgroup(o); } } }
  #     * }(r.OBJECTS);
  #     
  
  # print only NON PRINTED container links. If first non printed link is NOT
  # for this continer, break out immediately
  # this is to emulate ORDERED nodes of plantuml
  # (node=edge,node,link.group...all in order for this fucker)
  printLinks = printLinks = (container) ->
    for i of yy.LINKS
      l = yy.LINKS[i]
      continue  if l.printed
      
      # if container given, print ONLY THOSE links that match this
      # container!
      break  if l.container isnt container
      l.printed = true
      attrs = []
      note = ""
      label = getAttr(l, "label")
      if label
        if label.indexOf("::") isnt -1
          label = label.split("::")
          note = label[1].trim()
      color = getAttrFmt(l, "color", "[{0}]").trim()
      
      # getAttrFmt(l, ['textcolor','color'] ,'fontcolor="{0}"',attrs);
      lt = undefined
      lr = l.right
      ll = l.left
      
      # yy.result(indent("//"+lr));
      if lr instanceof Group
        
        # just pick ONE Node from group and use lhead
        # TODO: Assuming it is Node (if Recursive groups implemented,
        # it could be smthg else)
        # attrs.push(" lhead=cluster_" + lr.getName());
        # TODO:
        lr = lr.OBJECTS[0]
        lr is `undefined`
      
      # TODO:Bad thing, EMPTY group..add one invisible node
      # there...
      # But should add already at TOP
      if ll instanceof Group
        
        # attrs.push(" ltail=cluster_" + ll.getName());
        # TODO:
        ll = ll.OBJECTS[0]
        ll is `undefined`
      
      # Same as above
      
      # TODO:Assuming producing DIGRAPH
      # For GRAPH all edges are type --
      # but we could SET arrow type if we'd like
      l.linkType.indexOf("/") isnt -1
      
      # TODO: Somehow denote better this "quite does not reach"
      # even though such an edge type MAKES NO SENSE in a graph
      # attrs.push('arrowhead="tee"');
      # TODO:
      dot = false
      dash = false
      broken = false
      if l.linkType.indexOf(".") isnt -1
        dot = true
      else if l.linkType.indexOf("-") isnt -1
        dash = true
      else l.linkType.indexOf("/") isnt -1
      
      # attrs.push("failed");
      # TODO:
      swap = false
      if l.linkType.indexOf("<") isnt -1 and l.linkType.indexOf(">") isnt -1
        lt = ((if dot then "-" else "")) + "-" + color + ">"
        swap = true
      else if l.linkType.indexOf("<") isnt -1
        tmp = ll
        ll = lr
        lr = tmp
        lt = ((if dot then "-" else "")) + "-" + color + ">"
      else if l.linkType.indexOf(">") isnt -1
        lt = ((if dot then "-" else "")) + "-" + color + ">"
      else if dot
        
        # dotted
        yy.result getAttrFmt(l, "label", "...{0}...")
        continue
      else if dash
        
        # dashed
        yy.result getAttrFmt(l, "label", "=={0}==")
        continue
      else
        
        # is dotted or dashed no direction
        lt = "-" + color + ">"
      
      # attrs.push("dir=none");
      t = ""
      
      # if (attrs.length>0)
      # t = "[" + attrs.join(",") + "]";
      if label
        label = ":" + label
      else
        label = ""
      yy.result indent(ll.getName() + lt + lr.getName() + t + label)
      yy.result indent(lr.getName() + lt + ll.getName() + t + label)  if swap
      unless note is ""
        yy.result indent("note over " + lr.getName())
        yy.result note.replace(/\\n/g, "\n")
        yy.result indent("end note")

  traverseObjects = traverseObjects = (r) ->
    
    # Dump this groups participants first...
    for i of r.OBJECTS
      o = r.OBJECTS[i]
      processANode o  if o instanceof Node
    printLinks r
    for i of r.OBJECTS
      o = r.OBJECTS[i]
      if o instanceof Group
        
        # TODO:
        # Group name,OBJECTS,get/setEqual,toString
        processAGroup = (o) ->
          debug JSON.stringify(o)
          cond = getAttr(o, "conditional")
          if cond
            if cond is "if"
              cond = "alt"
            else if cond is "elseif"
              cond = "else"
            else if cond is "else"
              cond = "else"
            else cond = "end"  if cond is "endif"
          else
            cond = "ref"
          yy.result indent(cond + " " + o.getLabel())
          if o.getColor() isnt `undefined`
            yy.result indent("style=filled;")
            yy.result indent(getAttrFmt(o, "color", "   color=\"{0}\";\n"))
          depth++
          traverseObjects o
          printLinks o
          depth--
        
        # yy.result(indent("}//end of " + o.getName()));
        (o)
      else throw new Error("Not a node nor a group, NOT SUPPORTED")  if not o instanceof Node
  (r)
  printLinks r
  yy.result "@enduml"
