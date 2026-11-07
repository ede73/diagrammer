// @ts-check
import { getError, getInputElement, getSelectedVisualizer, setError, setVisualizer } from './uiComponentAccess.js'
import { makeHTTPPost } from './ajax.js'

let wasmModule: any = null
let wasmInitPromise: Promise<any> | null = null

async function loadWasm() {
  if (wasmModule) return wasmModule
  if (!wasmInitPromise) {
    wasmInitPromise = (async () => {
      try {
        const mod = await import('../build/wasm/diagrammer_core.js')
        await mod.default('../build/wasm/diagrammer_core_bg.wasm')
        wasmModule = mod
        console.debug('Diagrammer Rust WebAssembly core successfully initialized in browser!')
        return wasmModule
      } catch (e) {
        console.warn('WASM module failed to initialize, falling back to server endpoint:', e)
        return null
      }
    })()
  }
  return wasmInitPromise
}

// Preload WASM immediately in browser environment
if (typeof window !== 'undefined') {
  loadWasm().catch(() => {})
}

/**
 * Check if the diagrammer script explicitly specifies a visualizer / generator directive
 */
function extractScriptVisualizer(diagrammerCode: string): string | null {
  const match = diagrammerCode.match(/(?:^|\n)\s*(?:generator|visualizer)\s+([A-Za-z0-9_]+)/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * @param diagrammerCode Diagrammer graph to parse using
 * @param successCallback Passing final generator, visualizer
 * @param failureCallback passing error as string, exception as Exception
 * @param preferScriptSpecifiedVisualizer prefer generator from script if present
 */
export function parse(
  diagrammerCode: string,
  successCallback: (visualizer: string) => void,
  failureCallback: (error: string, exception: DOMException) => void,
  preferScriptSpecifiedVisualizer = false
) {
  if (preferScriptSpecifiedVisualizer) {
    const scriptVisualizer = extractScriptVisualizer(diagrammerCode)
    if (scriptVisualizer) {
      setVisualizer(scriptVisualizer)
      console.debug(`  .. changed visualizer to script visualizer: ${scriptVisualizer}`)
    }
  }

  const visualizer = getSelectedVisualizer()
  console.debug(`parse(${visualizer} ${preferScriptSpecifiedVisualizer ? 'preferScriptSpecifiedVisualizer' : ''})`)
  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }

  // Fast synchronous path when WASM module is already loaded
  if (wasmModule) {
    try {
      const result = wasmModule.wasm_parse_and_generate(diagrammerCode, visualizer)
      const resultElem = getInputElement('diagrammer-result')
      if (resultElem) {
        resultElem.value = result
      }
      setError('')
      try {
        successCallback(getSelectedVisualizer())
      } catch (ex: any) {
        setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`)
      }
      return
    } catch (err: any) {
      const errStr = String(err)
      setError(errStr)
      failureCallback(errStr, new DOMException(errStr))
      throw err
    }
  }

  // Asynchronous fallback if WASM is still initializing
  loadWasm().then((wasm) => {
    if (wasm) {
      try {
        const result = wasm.wasm_parse_and_generate(diagrammerCode, visualizer)
        const resultElem = getInputElement('diagrammer-result')
        if (resultElem) {
          resultElem.value = result
        }
        setError('')
        try {
          successCallback(getSelectedVisualizer())
        } catch (ex: any) {
          setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`)
        }
        return
      } catch (err: any) {
        const errStr = String(err)
        setError(errStr)
        failureCallback(errStr, new DOMException(errStr))
        return
      }
    }

    // Server fallback if WASM unavailable
    makeHTTPPost(
      `/parse?visualizer=${encodeURIComponent(visualizer)}`,
      diagrammerCode,
      (result) => {
        const resultElem = getInputElement('diagrammer-result')
        if (resultElem) {
          resultElem.value = result
        }
        setError('')
        try {
          successCallback(getSelectedVisualizer())
        } catch (ex: any) {
          setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`)
        }
      },
      (status, statusText, responseText) => {
        const err = `Rust engine error (${status}): ${responseText || statusText}`
        setError(err)
        failureCallback(err, new DOMException(err))
      }
    )
  })
}
