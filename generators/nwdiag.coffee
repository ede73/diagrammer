#node parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
nwdiag = (yy) ->
  yy.result "nwdiag{\n default_fontsize = 16\n"
  r = getGraphRoot(yy)
  s = r.getStart()
  for i of r.OBJECTS
    o = r.OBJECTS[i]
    if o instanceof Group
      
      # split the label to two, NAME and address
      yy.result "  network " + o.getName() + "{"
      yy.result "    address=\"" + o.getLabel() + "\""  unless o.getLabel() is ""
      for j of o.OBJECTS
        z = o.OBJECTS[j]
        s = getAttrFmt(z, "color", ",color=\"{0}\"") + getShape(shapes.actdiag, z.shape, ",shape=\"{0}\"") + getAttrFmt(z, "label", ",address=\"{0}\"")
        s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
        yy.result "    " + z.getName() + s + ";"
      
      # find if there are ANY links that have this GROUP as participant!
      for i of yy.LINKS
        l = yy.LINKS[i]
        s = getAttrFmt(l, "label", "[address=\"{0}\"]")
        yy.result "  " + l.right.getName() + s + ";"  if l.left is o
        yy.result "  " + l.left.getName() + s + ";"  if l.right is o
      yy.result "  }"
    else
      
      # ICON does not work, using background
      s = getAttrFmt(o, "color", ",color=\"{0}\"") + getAttrFmt(o, "image", ",background=\"icons{0}\"") + getShape(shapes.actdiag, o.shape, ",shape=\"{0}\"") + getAttrFmt(o, "label", ",label=\"{0}\"")
      s = "[" + s.trim().substring(1) + "]"  unless s.trim() is ""
      yy.result "    " + o.getName() + s + ";"
  for i of yy.LINKS
    l = yy.LINKS[i]
    continue  if l.left instanceof Group or l.right instanceof Group
    yy.result l.left.getName() + " -- " + l.right.getName() + ";"
  yy.result "}"
