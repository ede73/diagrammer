// @ts-check
import { getSavedGraph } from './localStorage.js'
import { parse, visualize } from './parserInteractions.js'
import { getGenerator, getInputElement, getSelectElement, getVisualizer } from './uiComponentAccess.js'
import { makeHTTPGet } from './ajax.js'
// import { Editor } from '../ace/src-noconflict/ace.js';

// Set to 0 to fall back to textarea(enable textarea in index.html)
const acemode = 1

function getAceEditor () {
  // TODO: fix type acq..
  /** type {Editor} */
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const editor = ace.edit('diagrammer-code')
  return editor
}

// get all
export function getGraphText () {
  if (acemode) {
    return getAceEditor().getSession().getValue()
  } else {
    return getInputElement('diagrammer-code').value
  }
}

// replace all
export function setGraphText (data) {
  if (acemode) {
    const editor = getAceEditor()
    // EDE:editor.destroy does not work reliably
    // editor.destroy();
    editor.selectAll()
    editor.insert(data)
  } else {
    getInputElement('diagrammer-code').value = data
  }
}

/**
 * Add text to top of document
 * try to maintain cursor position(TODO:fucked up)
 *
 * @param {string} data
 */
function prependLine (data) {
  if (acemode) {
    /** type {Editor} */
    const editor = getAceEditor()
    // using ace
    const cursor = editor.getCursorPosition()
    editor.navigateFileStart()
    editor.insert(data)
    // should roughly
    editor.getSession().getSelection().selectionLead.setPosition(cursor.column, cursor.row - data.split('\n').length + 1)
  } else {
    // using textarea
    const comp = getInputElement('diagrammer-code')
    comp.value = data + comp.value
  }
}

/**
 * add text to current cursor position(on a new line how ever)
 *
 * @param {string} data
 */
function appendLine (data) {
  if (acemode) {
    /** type {Editor} */
    const editor = getAceEditor()

    // using ace insert text into wherever the cursor is pointing.
    editor.navigateLineEnd()
    // TODO: If this is empty line, no need for linefeed
    const cursor = editor.getCursorPosition()
    if (cursor.column > 1) { editor.insert('\n') }
    editor.insert(data.trim())
  } else {
    // using textarea
    const comp = getInputElement('diagrammer-code')
    comp.value = comp.value + data
  }
}

/**
 *
 * @param {(string|number)} i
 * @returns
 */
export function addLine (i) {
  if (typeof i === 'string') {
    appendLine(i + '\n')
  } else {
    switch (i) {
      case 1:
        appendLine('node#ff0000;Label here\n')
        break
      case 2:
        appendLine('group color #7722ee\ngroup NAME;Label the group\n//Nodes\n  group InnerGroup#00ff00;Inner group\n  xy\n  group end\ngroup end\n')
        break
      case 3:
        appendLine('x#ff0000>#00ff00y#0000ff\n')
        break
      case 4:
        appendLine('a/barcode.png,b/basestation.png,c/battery.png>d/camera.png,e/cpu.png,f/documents.png\n' + 'a1/harddisk.png,b1/keyboard.png,c1/laptop.png>d1/laser.png,e1/monitor.png,f1/mouse.png\n' + 'a2/phone.png,b2/printer.png,c2/ram.png>d2/satellite.png,e2/scanner.png,f2/sim.png\n' + 'u/usbmemory.png>w/wifi.png\n' + 'a1/actor1.png>a2/actor2.png>a3/actor3.png')
        break
      case 5:
        prependLine('start NODENAME\n')
        break
      case 6:
        appendLine('//shapes: default, invis, record, dots, actor, cloud\n' + '//beginpoint,endpoint,condition,database,terminator,input,loopin,loopout\n' + '//square,ellipse,diamond,minidiamond,note,mail\n' + 'shape box\n')
        break
      case 7:
        prependLine('equal node1,node2\n')
        break
      case 8:
        prependLine('$(color1:#12ede0)\nclr$(color1)\nclr2$(color1)\n')
        break
      case 9:
        appendLine('if something would happend then\n' + '  a1>b1\n' + 'elseif something probably would not happen then\n' + ' a2>b2\n' + 'elseif or if i see a flying bird then\n' + ' a3>b3\n' + 'else\n' + '  a4>b4\n' + 'endif\n')
        break
    }
  }
  console.log('getSavedFilesChanged..parse')
  parseAndRegenerate()
  return false
}

export function generatorChanged () {
  console.log('generatorChanged() - parseAndRegenerate')
  parseAndRegenerate()
}

function parseAndRegenerate (preferScriptSpecifiedGeneratorAndVisualizer = false) {
  console.log('parseAndRegenerate()')
  const code = getGraphText() + '\n'
  parse(code, (finalGenerator, finalVisualizer) => {
    console.log(`  parseAndRegenerate() - visualize using final visualizer ${finalVisualizer}`)
    visualize(finalVisualizer)
  // eslint-disable-next-line n/handle-callback-err
  }, (error, ex) => {
    console.log('  parseAndRegenerate() - Parsing failed :(')
  }, preferScriptSpecifiedGeneratorAndVisualizer)
}

export function savedChanged () {
  // read the example...place to textArea(overwrite)
  const e = getSelectElement('saved')
  const doc = e.options[e.selectedIndex].value
  const filename = getInputElement('filename')
  const data = getSavedGraph()
  if (data[doc]) {
    setGraphText(data[doc])
    filename.value = doc
    console.log('savedChanged..parse')
    parseAndRegenerate()
  }
}

export function exampleChanged () {
  // read the example...place to textArea(overwrite)
  const e = getSelectElement('example')
  const doc = e.options[e.selectedIndex].value
  console.log(`exampleChanged(${doc})`)
  makeHTTPGet(`tests/${doc}`,
    (msg) => {
      setGraphText(String(msg))
      console.log(`  exampleChanged(${doc}) - parse and regenerate, from UI ${getGenerator()} / ${getVisualizer()}`)
      parseAndRegenerate(true)
    },
    (stateCode, statusText, responseText) => {
      alert(`Failed fetching example tests/${doc} ${statusText} ${responseText}`)
    })
}

/**
 * Hookup code editor, so that on every key(de)press a parsing starts after configurable delay UNLESS another keypress arrives.
 * Hence while typing, we don't constanly parse, but on a minute pause, we do and user get's feedback (ok/error)
 */
function hookupToListenToManualCodeChanges (parseChangesAfterMillis) {
  let parsingTimerID
  getInputElement('diagrammer-code').onkeyup = function () { // onchange does not work on
    if (parsingTimerID) {
      clearTimeout(parsingTimerID)
      parsingTimerID = undefined
    }
    parsingTimerID = setTimeout(() => {
      parseAndRegenerate()
    }, parseChangesAfterMillis)
  }
}

/**
 * As above, but for parsed/generated text box. Usually parasing also visualizes, but
 * while developing, it's nice to be able to quickly edit the generated code as well in
 * order to debug/experiment with actual visualizations!
 */
function hookupToListenToManualGeneratorChanges (visualizeChangesAfterMillis) {
  let visualizationTimerID
  getInputElement('diagrammer-result').onkeyup = function () { // onchange does not work on
    if (!visualizationTimerID) {
      clearTimeout(visualizationTimerID)
      visualizationTimerID = undefined
    }
    visualizationTimerID = setTimeout(() => {
      visualizationTimerID = visualize(getVisualizer())
    }, visualizeChangesAfterMillis)
  }
}

// skip over so jest can load us
try {
  hookupToListenToManualCodeChanges(500)
  hookupToListenToManualGeneratorChanges(500)
} catch (ex) { }

// @ts-ignore
if (acemode && typeof ace !== 'undefined') {
  // some init race condition, editor null on page load
  /** type {Editor} */
  const editor = getAceEditor()
  if (typeof editor !== 'undefined') {
    editor.getSession().on('change', function () {
      // chrome/mac(elsewhere?)
      // Looks like code/result hooks above are enough
    })
  }
}
