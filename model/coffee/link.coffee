
###
Create a new link between objects (nodes,groups,lists)

@param linkType Type of the link(grammar!)
@param l Left hand side of the link
@param r Right hand side of the link
@constructor
###
Link = (linkType, l, r) ->
  @linkType = linkType.trim()
  @left = l
  @right = r
  @toString = ->
    "Link(" + @linkType + "== L" + @left.toString() + ", R" + @right.toString() + ",label=" + @getLabel() + ")"
Link:: = new GraphObject()
Link::constructor = Link
