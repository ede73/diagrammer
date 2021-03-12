#noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
###
Called from grammar to inject a new (COLOR) variable
Only colors supported currently, though there's really no limitation

If this is assignment, rewrite the variable, else assign new
Always return the current value

@param yy Lexer yy
@param variable ${XXX:yyy} assignment or ${XXX} query
###
processVariable = (yy, variable) ->
  
  # ASSIGN VARIABLE
  # $(NAME:CONTENT...)
  # or
  # refer variable
  # $(NAME)
  vari = variable.slice(2, -1)
  if vari.indexOf(":") isnt -1
    
    # Assignment
    tmp = vari.split(":")
    debug "GOT assignment " + tmp[0] + "=" + tmp[1]
    getVariables(yy)[tmp[0]] = tmp[1]
    tmp[1]
  else
    
    # referral
    throw new Error("Variable " + vari + " not defined")  unless getVariables(yy)[vari]
    getVariables(yy)[vari]

###
Return all the variables from the collection (hard coded to yy)
###
getVariables = (yy) ->
  yy.VARIABLES = {}  unless yy.VARIABLES
  yy.VARIABLES

###
Get current singleton graphroot or create  new one
###
getGraphRoot = (yy) ->
  
  # debug(" getGraphRoot "+yy);
  unless yy.GRAPHROOT
    debug " no graphroot,init - in getGraphRoot"
    if yy.result is `undefined`
      yy.result = (str) ->
        console.log str
    debug "  ...Initialize emptyroot " + yy
    yy.CURRENTCONTAINER = []
    yy.LINKS = []
    yy.CONTAINER_EXIT = 1
    yy.GRAPHROOT = new GraphRoot()
    
    # yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
    enterContainer yy, yy.GRAPHROOT
  yy.GRAPHROOT

###
Return current container. If none specified, it is GRAPHROOT

Current container can be (in therory):
array -> link list
group -> well, a group
node ->
link ->

Direct accessor, though graphroot governs!
TODO: DUAL DECLARATION - this function never used
###

#function getCurrentContainer_ERROR(yy) {
#    var x = getGraphRoot(yy).getCurrentContainer();
#    if (x == undefined) debug(" ERROR: Container undefined");
#    if (x.OBJECTS == undefined) {
#        if (x instanceof Array) debug(" Container is Array");
#        if (x instanceof Group) debug(" Container is Group");
#        if (x instanceof Node) debug(" Container is Node");
#        if (x instanceof Link) debug(" Container is Link");
#        debug(" ERROR: Containers " + typeof(x) + "object store undefined");
#    }
#    return x;
#}

###
function setCurrentContainer(yy,ctr){ if (!(ctr instanceof Group || ctr
instanceof GraphRoot)){ throw new Error("Trying to set container other than
Group/GraphRoot:"+typeof(ctr)); } debug(" setCurrentContainer "+yy); return
getGraphRoot(yy).setCurrentContainer(ctr); }
###

# LHS=Node(z1)
###
Create an array, push LHS,RHS nodes there and return the array as long as
processing the list nodes added to array..

@param yy Lexer yy
@param LHS left hand side of the list
@param RHS right hand side of the list
@param rhsLinkLabel optional RHS label
###
getList = (yy, LHS, RHS, rhsLinkLabel) ->
  if LHS instanceof Node
    debug " getList(" + LHS + "," + RHS + ")"
    x = []
    x.push LHS
    x.push getNode(yy, RHS).setLinkLabel(rhsLinkLabel)
    return x
  debug " getList([" + LHS + "]," + RHS
  
  # LHS not a node..
  LHS.push getNode(yy, RHS).setLinkLabel(rhsLinkLabel)
  LHS

###
See readNodeOrGroup in grammar

Return matching Node,Array,Group

If no match, create a new node

STYLE will always be updated on last occurance (ie. dashed a1
dotted a1>b1 - only for nodes!

node a1 will be dotted instead of being dashed

@param yy Lexer yy
@param name Reference, Node/Array/Group
@param [style] OPTIONAL if style given, update (only if name refers to node)
###
getNode = (yy, name, style) ->
  cc = (yy, name, style) ->
    if name instanceof Node
      name.setStyle style  if style
      return name
    return name  if name instanceof Array
    search = s = (container, name) ->
      return container  if container.getName() is name
      for i of container.OBJECTS
        continue  unless container.OBJECTS.hasOwnProperty(i)
        o = container.OBJECTS[i]
        if o instanceof Node and o.getName() is name
          o.setStyle style  if style
          return o
        if o instanceof Group
          found = s(o, name)
          return found  unless found is `undefined`
      `undefined`
    search getGraphRoot(yy), name
    return search  if search isnt `undefined`
    debug " Create new node"
    n = new Node(name, getGraphRoot(yy).getCurrentShape())
    n.setStyle style  if style
    getDefaultAttribute yy, "nodecolor", (color) ->
      n.setColor color

    getDefaultAttribute yy, "nodetextcolor", (color) ->
      n.setTextColor color

    pushObject yy, n
  node = cc(yy, name, style)
  debug " getNode gotNode " + node
  yy.lastSeenNode = node
  if yy.collectNextNode
    debug "Collect next node"
    setAttr yy.collectNextNode, "exitlink", name
    yy.collectNextNode = `undefined`
  node

###
Get default attribute nodecolor,linkcolor,groupcolor and bubble upwards if
otherwise 'unobtainable'

@param yy lexer
@param attrname Name of the default attribute. If not found, returns undefined
@param [x] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
###
getDefaultAttribute = (yy, attrname, x) ->
  
  # no need for the value, but runs init if missing
  getGraphRoot yy
  
  # debug("getDefaultAttribute "+attrname);
  a = undefined
  for i of yy.CURRENTCONTAINER
    continue  unless yy.CURRENTCONTAINER.hasOwnProperty(i)
    ctr = yy.CURRENTCONTAINER[i]
    a = ctr.getDefault(attrname)
    
    # debug(" traverse getDefaultAttribute "+attrname+" from "+ctr+" as
    # "+a);
    if a isnt `undefined`
      
      # debug("getDefaultAttribute "+attrname+" from "+ctr+"=("+a+")");
      x a  if x isnt `undefined`
      return a
  a = getGraphRoot(yy).getDefault(attrname)
  if a isnt `undefined`
    debug "getDefaultAttribute got from graphroot"
    x a  if x isnt `undefined`
    return a
  
  # debug("getDefaultAttribute FAILED");
  `undefined`

###
TODO: DUAL DECLARATION

Get current container
@para, yy Lexer
###
getCurrentContainer = (yy) ->
  
  # no need for value, but runs init if missing
  getGraphRoot yy
  yy.CURRENTCONTAINER[yy.CURRENTCONTAINER.length - 1]

###
Enter into a new container, set it as current container
@param yy lexer
@param container Set this container as current container
###
enterContainer = (yy, container) ->
  yy.CURRENTCONTAINER.push container
  
  # yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
  container

#noinspection JSUnusedGlobalSymbols
###
Exit the current container
Return the previous one
Previous one also set as current container
@param yy lexer
###
exitContainer = (yy) ->
  throw new Error("INTERNAL ERROR:Trying to exist ROOT container")  if yy.CURRENTCONTAINER.length <= 1
  setAttr yy.CURRENTCONTAINER.pop(), "exitnode", yy.CONTAINER_EXIT++

#noinspection JSUnusedGlobalSymbols
###
Create a NEW GROUP if one (ref) does not exist yet getGroup(yy) => create a
new anonymous group getGroup(yy,GroupRef) => create a new group if GroupRef
is not a Group or return GroupRef if it is...1
@param yy lexer
@param ref Type of reference, if group, return it
@return ref if ref instance of group, else the newly created group
###
getGroup = (yy, ref) ->
  return ref  if ref instanceof Group
  debug " getGroup() NEW GROUP:" + yy + "/" + ref
  yy.GROUPIDS = 1  if yy.GROUPIDS is `undefined`
  newGroup = new Group(yy.GROUPIDS++)
  debug " push group " + newGroup + " to " + yy
  pushObject yy, newGroup
  getDefaultAttribute yy, "groupcolor", (color) ->
    newGroup.setColor color

  newGroup

# Get a link such that l links to r, return the added LINK or LINKS

#noinspection JSUnusedGlobalSymbols
###
linkType >,<,.>,<.,->,<-,<> l = left side, Node(xxx) or Group(yyy), or
Array(smthg) r = right side, Node(xxx) or Group(yyy), or Array(smthg) label =
if defined, LABEL for the link color = if defined, COLOR for the link
@param yy lexer
@param linkType Type of the link(grammar)
@param l Left hand side (must be Array,Node,Group)
@param r Right hand side (must be Array,Node,Group)
@param [label] Optional label for the link
@param [color] Optional color for the link
@param [lcompass] Left hand side compass value
@param [rcompass] Reft hand side compass value
###
getLink = (yy, linkType, l, r, label, color, lcompass, rcompass) ->
  lastLink = undefined
  i = undefined
  if l instanceof Array
    debug " getLink called with LHS array"
    i = 0
    while i < l.length
      debug " Get link " + l[i]
      lastLink = getLink(yy, linkType, l[i], r, label, color, lcompass, rcompass)
      i++
    return lastLink
  if r instanceof Array
    debug " getLink called with RHS array"
    i = 0
    while i < r.length
      debug " Get link " + r[i]
      lastLink = getLink(yy, linkType, l, r[i], label, color, lcompass, rcompass)
      i++
    return lastLink
  throw new Error("LHS not a Node nor a Group(" + l + ")")  if (l not instanceof Node) and (l not instanceof Group)
  throw new Error("RHS not a Node nor a Group(" + r + ")")  if (r not instanceof Node) and (r not instanceof Group)
  lnk = new Link(linkType, l, r)
  if lcompass
    setAttr lnk, "lcompass", lcompass
  else setAttr lnk, "lcompass", getAttr(l, "compass")  if getAttr(l, "compass")
  if rcompass
    setAttr lnk, "rcompass", rcompass
  else setAttr lnk, "rcompass", getAttr(r, "compass")  if getAttr(r, "compass")
  getDefaultAttribute yy, "linkcolor", (color) ->
    lnk.setColor color

  getDefaultAttribute yy, "linktextcolor", (color) ->
    lnk.setTextColor color

  lnk.setLabel label  unless label is `undefined`
  lnk.setLabel r.getLinkLabel()  if r instanceof Node and r.getLinkLabel() isnt `undefined`
  lnk.setColor color  unless color is `undefined`
  addLink yy, lnk

###
Add link to the list of links, return the LINK
@param yy lexer
@param l Link (Array or Link)
###
addLink = (yy, l) ->
  if l instanceof Array
    debug " PUSH LINK ARRAY:" + l
  else
    debug " PUSH LINK:" + l
    setAttr l, "container", getCurrentContainer(yy)
  yy.LINKS.push l
  l

###
Push given object into a current container
###
pushObject = (yy, o) ->
  debug "  pushObject " + o + "to " + getCurrentContainer(yy)
  getCurrentContainer(yy).OBJECTS.push o
  o

#noinspection JSUnusedGlobalSymbols
###
test if container has the object
###
containsObject = (container, o) ->
  for i of container.OBJECTS
    continue  unless container.OBJECTS.hasOwnProperty(i)
    c = container.OBJECTS[i]
    return true  if c is o
    return true  if containsObject(c, o)  if c instanceof Group
  false
