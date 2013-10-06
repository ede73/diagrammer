debug = (msg) ->
  console.log msg  if VERBOSE is true
setAttr = (cl, attr, value) ->
  cl[attr] = value
  cl

#
# * return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
# * or undefined
# 
getAttr = (cl, attr) ->
  return `undefined`  if cl[attr] is `undefined` or cl[attr] is 0
  cl[attr]
getAttrFmt = (cl, attr, fmt, resultarray) ->
  if attr instanceof Array
    for i of attr
      
      # debug("Get FMT attr "+attr[i]+" from "+cl);
      r = getAttrFmt(cl, attr[i], fmt, resultarray)
      if r isnt ""
        debug "Return " + r
        return r
    return ""
  return ""  if cl[attr] is `undefined` or cl[attr] is 0
  r = fmt.format(cl[attr])
  resultarray.push r  if resultarray
  " " + r + " "
String::format = ->
  formatted = this
  for arg of arguments_
    formatted = formatted.replace("{" + arg + "}", arguments_[arg])
  formatted
