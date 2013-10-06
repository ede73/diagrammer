#afterbody

#Set to 0 to fall back to textarea(enable textarea in index.html)

#get all
getText = ->
  if acemode
    editor.getSession().getValue()
  else
    document.getElementById("editable").value

#replace all
setText = (data) ->
  if acemode
    editor.destroy()
    editor.insert data
  else
    document.getElementById("editable").value = data

#Add text to top of document
#try to maintain cursor position(TODO:fucked up)
addTop = (data) ->
  if acemode
    
    #using ace
    cursor = editor.getCursorPosition()
    editor.navigateFileStart()
    editor.insert data
    
    #should roughly
    editor.getSession().getSelection().selectionLead.setPosition cursor.column, cursor.row - data.split("\n").length + 1
  else
    comp = document.getElementById("editable")
    
    #using textarea
    comp.value = data + comp.value

#add text to current cursor position(on a new line how ever)
appendLine = (comp, data) ->
  if acemode
    
    #using ace insert text into wherever the cursor is pointing.
    editor.navigateLineEnd()
    
    #TODO: If this is empty line, no need for linefeed
    cursor = editor.getCursorPosition()
    editor.insert "\n"  if cursor.column > 1
    editor.insert data.trim()
  else
    
    #using textarea
    comp.value = comp.value + data
addLine = (i) ->
  if typeof i is "string"
    appendLine i + "\n"
  else
    switch i
      when 1
        appendLine "node#ff0000;Label here\n"
      when 2
        appendLine "group color #7722ee\ngroup NAME;Label the group\n//Nodes\n  group InnerGroup#00ff00;Inner group\n  xy\n  group end\ngroup end\n"
      when 3
        appendLine "x#ff0000>#00ff00y#0000ff\n"
      when 4
        appendLine "a/barcode.png,b/basestation.png,c/battery.png>d/camera.png,e/cpu.png,f/documents.png\n" + "a1/harddisk.png,b1/keyboard.png,c1/laptop.png>d1/laser.png,e1/monitor.png,f1/mouse.png\n" + "a2/phone.png,b2/printer.png,c2/ram.png>d2/satellite.png,e2/scanner.png,f2/sim.png\n" + "u/usbmemory.png>w/wifi.png\n" + "a1/actor1.png>a2/actor2.png>a3/actor3.png"
      when 5
        addTop "start NODENAME\n"
      when 6
        appendLine "//shapes: default, invis, record, dots, actor, cloud\n" + "//beginpoint,endpoint,condition,database,terminator,input,loopin,loopout\n" + "//square,ellipse,diamond,minidiamond,note,mail\n" + "shape box\n"
      when 7
        addTop "equal node1,node2\n"
      when 8
        addTop "$(color1:#12ede0)\nclr$(color1)\nclr2$(color1)\n"
      when 9
        appendLine "if something would happend then\n" + "  a1>b1\n" + "elseif something probably would not happen then\n" + " a2>b2\n" + "elseif or if i see a flying bird then\n" + " a3>b3\n" + "else\n" + "  a4>b4\n" + "endif\n"
  console.log "getSavedFilesChanged..parse"
  parse getText() + "\n", getGenerator()
  false
openPicWindow = ->
  win = window.open("web/result.png", "extpic")
reloadImg = (id) ->
  obj = document.getElementById(id)
  src = obj.src
  pos = src.indexOf("?")
  src = src.substr(0, pos)  if pos >= 0
  date = new Date()
  obj.src = src + "?v=" + date.getTime()
  win.location.reload()  if win
  false

# Get currently selected generator
getGenerator = ->
  e = document.getElementById("generator")
  gen = e.options[e.selectedIndex].value
  return gen.split(":")[0]  if gen.indexOf(":") > -1
  gen
getVisualizer = ->
  e = document.getElementById("generator")
  gen = e.options[e.selectedIndex].value
  if gen.indexOf(":") > -1
    console.log "Return visualizer " + gen.split(":")[1]
    return gen.split(":")[1]
  console.log "Return visualizer " + gen
  gen
cancelVTimer = ->
  window.clearTimeout vtimer  if vtimer

#
#function highlight(tc) {
#    var s = document.getElementById("editable");
#    s.innerHTML = tc.replace("->", "->>").replace(".>", ".>>").replace("<-",
#        "<<-").replace("<.", "<<.").replace("<", "<<").replace(">", ">>")
#        .replace("->>", '<text id="event">-&gt;</text>').replace(".>>",
#        '<text id="event">.&gt;</text>').replace("<<-",
#        '<text id="event">&lt;-</text>').replace("<<.",
#        '<text id="event">&lt;.</text>').replace(">>",
#        '<text id="event">&gt;</text>').replace("<<",
#        '<text id="event">&lt;</text>');
#}
#
parse = (generator, visualizer) ->
  data = getText() + "\n"
  console.log "parse " + generator + "," + visualizer
  document.getElementById("error").innerText = ""
  parsingStarted = true
  delete (parser.yy.GRAPHROOT)

  delete (parser.yy.LINKS)

  delete (parser.yy.OBJECTS)

  parser.yy.OUTPUT = generator
  parser.yy.VISUALIZER = visualizer
  console.log "Parse, set generator to " + parser.yy.OUTPUT + " visualizer to " + parser.yy.VISUALIZER
  parser.parse data
  
  #
  #     * var tc=textArea.textContent; parser.parse(tc+"\n"); highlight(tc);
  #     
  cancelVTimer()
  vtimer = window.setTimeout(->
    vtimer = null
    console.log "Visualize now using " + parser.yy.VISUALIZER
    visualize parser.yy.VISUALIZER
  , vdelay)
generatorChanged = ->
  console.log "generatorChanged..parse"
  parse getGenerator(), getVisualizer()
savedChanged = ->
  
  # read the example...place to textArea(overwrite)
  e = document.getElementById("saved")
  doc = e.options[e.selectedIndex].value
  filename = document.getElementById("filename")
  data = getSavedGraph()
  if data[doc]
    setText data[doc]
    filename.value = doc
    console.log "savedChanged..parse"
    parse()
exampleChanged = ->
  
  # read the example...place to textArea(overwrite)
  e = document.getElementById("example")
  doc = e.options[e.selectedIndex].value
  $.ajax(
    url: "tests/" + doc
    cache: false
  ).done (data) ->
    setText data
    console.log "exampleChanged..parse"
    parse()

textAreaOnChange = (callback, delay) ->
  timer = null
  document.getElementById("editable").onkeyup = -> # onchange does not work on
    # chrome/mac(elsewhere?)
    window.clearTimeout timer  if timer
    timer = window.setTimeout(->
      timer = null
      callback getGenerator(), getVisualizer()
    , delay)

  obj = null
visualizeOnChange = (callback, delay) ->
  timer = null
  tt = document.getElementById("result")
  tt.onkeyup = -> # onchange does not work on
    # chrome/mac(elsewhere?)
    window.clearTimeout timer  if timer
    timer = window.setTimeout(->
      timer = null
      callback tt, getGenerator(), getVisualizer()
    , delay)

  obj = null
getSavedFiles()
result = document.getElementById("result")
vtimer = null
vdelay = 1000
acemode = 1
win = undefined
textAreaOnChange parse, 150
visualizeOnChange visualize, 250
if acemode
  timer2 = null
  editor.getSession().on "change", ->
    
    # chrome/mac(elsewhere?)
    window.clearTimeout timer2  if timer2
    timer = window.setTimeout(->
      timer2 = null
      parse getGenerator(), getVisualizer()
    , delay)

