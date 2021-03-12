
###
Create a new graph root
@constructor
###
GraphRoot = ->
  @OBJECTS = []
  @setGenerator = (value) ->
    value = value.toLowerCase()  if value
    setAttr this, "generator", value

  @getGenerator = ->
    getAttr this, "generator"

  @setVisualizer = (value) ->
    value = value.toLowerCase()  if value
    setAttr this, "visualizer", value

  @getVisualizer = ->
    getAttr this, "visualizer"

  @setCurrentShape = (value) ->
    value = value.toLowerCase()  if value
    setAttr this, "shape", value

  @getCurrentShape = ->
    getAttr this, "shape"

  @setDirection = (value) ->
    setAttr this, "direction", value

  @getDirection = ->
    getAttr this, "direction"

  @setStart = (value) ->
    setAttr this, "start", value

  @getStart = ->
    getAttr this, "start"

  
  # Save EQUAL node ranking
  @setEqual = (value) ->
    setAttr this, "equal", value

  @getEqual = ->
    getAttr this, "equal"

  
  ###
  Set default nodecolor, groupcolor, linkcolor Always ask from the
  currentContainer first
  ###
  @setDefault = (key, value) ->
    debug "Set ROOT " + key + " to " + value
    setAttr this, key, value

  @getDefault = (key) ->
    
    # debug("Get ROOT "+key);
    getAttr this, key

  @toString = ->
    "GraphRoot"
GraphRoot:: = new GraphObject()
GraphRoot::constructor = GraphRoot
