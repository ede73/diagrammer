
# called line by line...
openImage = (imageUrl) ->
  window.open imageUrl + "?x=" + new Date().getTime()
getSavedGraph = ->
  data = {}
  unless localStorage.getItem("graphs")
    localStorage.setItem "graphs", JSON.stringify(data)
    return data
  graph = localStorage.getItem("graphs")
  
  # console.log("Have graph"+graph);
  data = eval_("(" + graph + ")")
  data
getSavedFiles = ->
  t = ""
  for k of getSavedGraph()
    console.log "Stored file:" + k
    t += "<option value=\"" + k + "\">" + k + "</option>"
  e = document.getElementById("saved")
  e.innerHTML = t
save = ->
  filename = document.getElementById("filename").value
  editable = getText()
  data = getSavedGraph()
  data[filename] = editable
  jd = JSON.stringify(data)
  localStorage.setItem "graphs", jd

# clipboardData.setData("text",jd);
load = ->
  filename = document.getElementById("filename").value
  data = getSavedGraph()
  setText data[filename]  if data[filename]
exportGraphs = ->
  $.ajax
    type: "POST"
    async: true
    cache: false
    url: "web/saveExport.php"
    data: JSON.stringify(getSavedGraph())
    contentType: "application/json; charset=utf-8"
    
    # dataType: "json",
    success: (msg) ->
      alert "Exported"

    error: (err) ->
      alert "ERROR: " + JSON.stringify(err)
      if err.status is 200
        ParseResult err
      else
        alert "Error:" + err.responseText + "  Status: " + err.status

importGraphs = ->
  $.ajax
    type: "GET"
    async: true
    cache: false
    
    # url: "web/localstorage.json",
    url: "web/loadExport.php"
    contentType: "application/json; charset=utf-8"
    dataType: "json"
    success: (msg) ->
      
      # alert(JSON.stringify(msg));
      localStorage.setItem "graphs", JSON.stringify(msg)

    error: (err) ->
      alert "ERROR: " + JSON.stringify(err)
      if err.status is 200
        ParseResult err
      else
        alert "Error:" + err.responseText + "  Status: " + err.status

visualize = (visualizer) ->
  statelang = document.getElementById("result").value
  visualizer = getVisualizer()  unless visualizer
  visualizeUrl = "web/visualize.php?visualizer=" + visualizer
  $.ajax
    type: "POST"
    async: true
    cache: false
    url: visualizeUrl
    data: statelang
    
    # data: {body:statelang},
    # contentType: "application/json; charset=utf-8",
    # dataType: "json",
    success: (msg) ->
      
      # UseReturnedData(msg.d);
      # alert(msg);
      document.getElementById("image").setAttribute "src", msg
      reloadImg "image"

    error: (err) ->
      alert "ERROR: " + JSON.stringify(err)
      if err.status is 200
        ParseResult err
      else
        alert "Error:" + err.responseText + "  Status: " + err.status

  if visualizer is "dot"
    try
      document.getElementById("svg").innerHTML = Viz(statelang, "svg")
    catch err
      console.log err
  
  # try{
  # var canviz = new Canviz('graph_container');
  # canviz.load("http://192.168.11.215/~ede/state/post.txt");
  # }catch(err){
  # console.log(err);
  # }
  else
    document.getElementById("svg").innerHTML = "only for dotty"
console.log "Reset generator and visualizer"
VERBOSE = false
parser.yy.parseError = (str, hash) ->
  pe = "Parsing error:\n" + str + "\n" + hash
  console.log "pe"
  document.getElementById("error").innerText = pe
  cancelVTimer()
  throw new Error(str)

parser.yy.result = (line) ->
  if parsingStarted
    console.log "Parsing results coming in for " + parser.yy.OUTPUT + " / " + parser.yy.VISUALIZER
    parsingStarted = false
    result.value = ""
  result.value = result.value + line + "\n"

parser.trace = (x) ->
  console.log "TRACE:" + x
