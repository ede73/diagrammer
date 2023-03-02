// @ts-check

export function getSavedGraph() {
  let data = {}
  if (!localStorage.getItem('graphs')) {
    localStorage.setItem('graphs', JSON.stringify(data))
    return data
  }
  const graph = localStorage.getItem('graphs')
  // console.log("Have graph"+graph);
  // eslint-disable-next-line no-eval
  data = eval('(' + graph + ')')
  return data
}

export function getSavedFilesAsOptionList() {
  let t = ''
  for (const k in getSavedGraph()) {
    console.log(`Stored file:${k}`)
    t += '<option value="' + k + '">' + k + '</option>'
  }
  return t
}

export function saveCurrentGraph(filename: string, diagrammerCode: string) {
  const data = getSavedGraph()
  data[filename] = diagrammerCode
  const jd = JSON.stringify(data)
  localStorage.setItem('graphs', jd)
  // clipboardData.setData("text",jd);
}

export function loadGraph(filename: string) {
  const data = getSavedGraph()
  if (data[filename]) {
    return data[filename]
  }
}