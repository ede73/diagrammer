###
Simple debugger, uses console.log
###
debug = (msg) ->
  console.log msg  if VERBOSE is true

###
Set attribute of an object

@param cl Object
@param attr Attribute name
@param value Value
@returns Object itself(cl)
###
setAttr = (cl, attr, value) ->
  cl[attr] = value
  cl

###
Create string formatter. Format string according to format rules with positional arguments like xxx={0} yyy={1}
@returns {String}
###

###
Return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
or undefined
@param cl Object to scan
@param attr Name of the attribute index to return
###
getAttr = (cl, attr) ->
  return `undefined`  if cl[attr] is `undefined` or cl[attr] is 0
  cl[attr]

###
Return formatted attribute value

@param cl Object to scan thru
@param attr Name of the attribute to return
@param fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
@param [resultarray] If given, in addition for returning, will PUSH the result to this array
@returns (possibly formatted) value of the attribute or "" if attribute not found
###
getAttrFmt = (cl, attr, fmt, resultarray) ->
  tmp = undefined
  if attr instanceof Array
    for i of attr
      continue  unless attr.hasOwnProperty(i)
      
      # debug("Get FMT attr "+attr[i]+" from "+cl);
      tmp = getAttrFmt(cl, attr[i], fmt, resultarray)
      if tmp isnt ""
        debug "Return " + tmp
        return tmp
    return ""
  return ""  if cl[attr] is `undefined` or cl[attr] is 0
  tmp = fmt.format(cl[attr])
  resultarray.push tmp  if resultarray
  " " + tmp + " "
String::format = ->
  formatted = this
  for arg of arguments_
    formatted = formatted.replace("{" + arg + "}", arguments_[arg])
  formatted
