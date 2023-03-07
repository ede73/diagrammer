// @ts-check

export function getSavedGraphs(): Record<string, string> {
  if (!localStorage.getItem('graphs')) {
    const data = {}
    localStorage.setItem('graphs', JSON.stringify(data))
    return data
  }
  const graph = localStorage.getItem('graphs')
  return eval(`(${graph})`)
}

export function getSavedFilesAsOptionList() {
  let t = ''
  for (const k in getSavedGraphs()) {
    t += '<option value="' + k + '">' + k + '</option>'
  }
  return t
}

export function saveCurrentGraph(filename: string, diagrammerCode: string) {
  const data = getSavedGraphs()
  data[filename] = diagrammerCode
  const jd = JSON.stringify(data)
  localStorage.setItem('graphs', jd)
}

export function loadGraph(filename: string) {
  const data = getSavedGraphs()
  if (data[filename]) {
    return data[filename]
  }
}
