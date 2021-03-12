
###
Construct a new node

@param name Name of the node
@param [shape] Optional shape for the node, if not give, will default to what ever default is being used at the moment
@constructor
###
Node = (name, shape) ->
  @name = name
  @shape = shape
  @image = `undefined`
  @style = `undefined`
  @setShape = (value) ->
    return this  if value is `undefined`
    value = value.toLowerCase()  if value
    setAttr this, "shape", value

  
  #noinspection JSUnusedGlobalSymbols
  @getShape = ->
    getAttr this, "shape"

  
  # temporary for RHS list array!!
  @setLinkLabel = (value) ->
    setAttr this, "linklabel", value

  @getLinkLabel = ->
    getAttr this, "linklabel"

  @setStyle = (value) ->
    return this  if value is `undefined`
    value = value.toLowerCase()  if value
    setAttr this, "style", value

  
  #noinspection JSUnusedGlobalSymbols
  @getStyle = ->
    getAttr this, "style"

  @setImage = (value) ->
    return this  if value is `undefined`
    setAttr this, "image", value

  
  #noinspection JSUnusedGlobalSymbols
  @getImage = ->
    getAttr this, "image"

  @toString = ->
    "Node(" + @getName() + getAttrFmt(this, "color", ",color={0}") + getAttrFmt(this, "label", ",label={0}") + ")"
Node:: = new GraphObject()
Node::constructor = Node
