// @ts-check
import { getSavedGraph } from './localStorage.js'
import { makeHTTPGet, makeHTTPPost } from './ajax.js'
import { setError } from './uiComponentAccess.js'

export function exportGraphs () {
  makeHTTPPost('web/saveExport.php',
    JSON.stringify(getSavedGraph),
    (msg) => {
      alert('Exported')
    },
    (statusCode, statusText, responseText) => {
      const error = `Failed exporting, error:${responseText} Status: ${statusText}`
      setError(error)
      alert(error)
    })
}

export function importGraphs () {
  // eslint-disable-next-line no-undef
  makeHTTPGet('web/loadExport.php',
    (msg) => {
      localStorage.setItem('graphs', JSON.stringify(msg))
      alert('Imported, reload the page!')
    },
    (statusCode, statusText, responseText) => {
      const error = `Error:${responseText}  Status: ${statusText}`
      setError(error)
      alert(error)
    }, 'application/json; charset=utf-8', 'json')
}
