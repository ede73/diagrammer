#http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
#node parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
#available shapes
#box,square,roundedbox,dots
#circle,ellipse,diamond,minidiamond
#note,mail,cloud,actor
#flowchart.beginpoint,flowchart.endpoint
#flowchart.condition,flowchart.database,flowchart.terminator,flowchart.input
#flowchart.loopin,flowchart.loopout
blockdiag = (yy) ->
  yy.result "blockdiag{\n default_fontsize = 14"
  r = getGraphRoot(yy)
  if r.getDirection() is "portrait"
    yy.result "  orientation=portrait"
  else
    
    # DEFAULT
    yy.result "  orientation=landscape"
  s = r.getStart()
  for i of r.OBJECTS
    o = r.OBJECTS[i]
    if o instanceof Group
      yy.result "  group \"" + o.getLabel() + "\"{"
      yy.result getAttrFmt(o, "color", "   color=\"{0}\"")
      yy.result getAttrFmt(o, "label", "   label=\"{0}\"")
      s = "[" + s.trim().substring(1) + "]"  if s isnt `undefined` and s.trim() isnt ""
      for j of o.OBJECTS
        z = o.OBJECTS[j]
        s = getAttrFmt(z, "color", ",color=\"{0}\"") + getShape(shapes.blockdiag, z.shape, ",shape={0}") + getAttrFmt(z, "label", ",label=\"{0}\"")
        s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
        yy.result "    " + z.getName() + s + ";"
      yy.result "  }"
    else
      
      # dotted,dashed,solid
      # NOT invis,bold,rounded,diagonals
      # ICON does not work, using background
      style = getAttrFmt(o, "style", ",style=\"{0}\"")
      style = ""  if style isnt "" and not style.match(/(dotted|dashed|solid)/)?
      s = getAttrFmt(o, "color", ",color=\"{0}\"") + getAttrFmt(o, "image", ",background=\"icons{0}\"") + style + getShape(shapes.blockdiag, o.shape, ",shape=\"{0}\"") + getAttrFmt(o, "label", ",label=\"{0}\"")
      s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
      yy.result "  " + o.getName() + s + ";"
  for i of yy.LINKS
    l = yy.LINKS[i]
    t = ""
    if l.linkType.indexOf(".") isnt -1
      t += ",style=\"dotted\" "
    else t += ",style=\"dashed\" "  if l.linkType.indexOf("-") isnt -1
    lbl = getAttrFmt(l, "label", ",label = \"{0}\"" + getAttrFmt(l, ["color", "textcolor"], "textcolor=\"{0}\""))
    color = getAttrFmt(l, "color", ",color=\"{0}\"")
    t += lbl + color
    t = t.trim()
    t = t.substring(1).trim()  if t.substring(0, 1) is ","
    t = "[" + t + "]"  unless t is ""
    yy.result "  " + l.left.getName() + " -> " + l.right.getName() + t + ";"
  yy.result "}"
