// @ts-check
import { makeHTTPGet, makeHTTPPost } from './ajax.js'
import { getInputElement, setError } from './uiComponentAccess.js'
import { getSavedGraphs, getSavedFilesAsOptionList } from './localStorage.js'

export function exportGraphs() {
  makeHTTPPost('/saveExport',
    JSON.stringify(getSavedGraphs()),
    (msg) => {
      alert('Exported')
    },
    (statusCode, statusText, responseText) => {
      const error = `Failed exporting, error:(${responseText}) Status:(${statusText})`
      setError(error)
      alert(error)
    })
}

export function importGraphs() {
  // eslint-disable-next-line no-undef
  makeHTTPGet('/loadExport',
    (importedGraphs: Record<string, string>) => {
      let overwritten = false
      const merge = (mergeFrom: Record<string, string>, mergeInto: Record<string, string>) => {
        for (const attr in mergeFrom) {
          if (attr in mergeInto) {
            if (mergeInto[attr] !== mergeFrom[attr]) {
              console.error(`Local "save" ${attr} overwritten by imported graph, if error, do not export`)
              overwritten = true
            }
          }
          mergeInto[attr] = mergeFrom[attr]
        }
        return mergeInto
      }
      const savedGraphs = getSavedGraphs()
      const merged = merge(importedGraphs, savedGraphs)
      localStorage.setItem('graphs', JSON.stringify(merged))

      const e = getInputElement('diagrammer-saved')
      e.innerHTML = getSavedFilesAsOptionList()
      if (overwritten) {
        alert('Imported, reload the page! Some local saves overwritten by imports!')
      }
    },
    (statusCode, statusText, responseText) => {
      const error = `Error:${responseText}  Status: ${statusText}`
      setError(error)
      alert(error)
    }, 'application/json; charset=utf-8', 'json')
}
