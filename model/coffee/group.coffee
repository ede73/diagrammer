
###
Create a new container group
@param name Name of the container
@constructor
###
Group = (name) ->
  @name = name
  @OBJECTS = []
  
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
    debug "Set group " + key + " to " + value
    setAttr this, key, value

  @getDefault = (key) ->
    debug "Get group " + key
    getAttr this, key

  @toString = ->
    "Group(" + @name + ")"
Group:: = new GraphObject()
Group::constructor = Group
