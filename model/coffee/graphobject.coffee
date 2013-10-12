###
Create a new generic graph object
@param [label] Optional label
@constructor
###
GraphObject = (label) ->
  @setName = (value) ->
    return this  if value is `undefined`
    setAttr this, "name", value

  @getName = ->
    getAttr this, "name"

  @setColor = (value) ->
    return this  if value is `undefined`
    setAttr this, "color", value

  @getColor = ->
    getAttr this, "color"

  @setTextColor = (value) ->
    return this  if value is `undefined`
    setAttr this, "textcolor", value

  
  #noinspection JSUnusedGlobalSymbols
  @getTextColor = ->
    getAttr this, "textcolor"

  @setUrl = (value) ->
    return this  if value is `undefined`
    setAttr this, "url", value

  
  #noinspection JSUnusedGlobalSymbols
  @getUrl = ->
    getAttr this, "url"

  @label = label
  @setLabel = (value) ->
    return this  unless value
    value = value.trim().replace(/"/g, "")
    debug "  TEST value(" + value + ") for color"
    
    #Take out COLOR if preset
    m = value.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/)
    
    # debug(m);
    if m isnt null and m.length is 3
      @setTextColor m[1]
      value = m[2].trim()
    m = value.match(/\[([^\]]+)\](.*)$/)
    if m isnt null and m.length >= 3
      @setUrl m[1]
      value = m[2].trim()
    setAttr this, "label", value

  @getLabel = ->
    getAttr this, "label"

  @toString = ->
    "GraphObject"
