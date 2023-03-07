// @ts-check
import { getSavedGraphs } from './localStorage.js'
import { parse } from './parserInteractions.js'
import { getInputElement, getSelectElement, getVisualizer } from './uiComponentAccess.js'
import { makeHTTPGet } from './ajax.js'
import { clearBeautified, visualize } from './visualize.js'
// import 'ace' works for VScode (after setting deps), but it errors in webbrowser
// and it will make jest tests fail. It fails accessing global[ns] where ns=ace in ace script (running jest) , globals is undefined, Window is undefiner
// You can define those in Jest config (globals), but still it fails..
// Some for of init/race condition. All because diagrammer-support required editorInteractions to import access functions :)
// import 'ace'
// but this setup now seems to with with JSDoc type hint also, so I'll take that!
// import { Editor } from '../ace/src-noconflict/ace.js';

// Set to 0 to fall back to textarea(enable textarea in index.html)
const acemode: number = 1

function getAceEditor() {
  // TODO: fix type acq..
  /** type {AceAjax.Editor} */
  // @ts-expect-error ignore missing ace (it ain't missing, loaded in index.jtml)
  const editor = ace.edit('diagrammer-code')
  return editor
}

// get all
export function getGraphText() {
  if (acemode) {
    return getAceEditor().getSession().getValue() as string
  } else {
    return getInputElement('diagrammer-code').value
  }
}

// replace all
export function setGraphText(data: string) {
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
 * try to maintain cursor position
 */
function prependLine(data: string) {
  if (acemode) {
    /** type {Editor} */
    const editor = getAceEditor()
    // using ace
    const cursor = editor.getCursorPosition()
    editor.navigateFileStart()
    editor.insert(data)
    // should roughly
    editor.getSession().getSelection().getSelectionLead().setPosition(cursor.column, cursor.row - data.split('\n').length + 1)
  } else {
    // using textarea
    const comp = getInputElement('diagrammer-code')
    comp.value = data + comp.value
  }
}

/**
 * add text to current cursor position(on a new line how ever)
 */
function appendLine(data: string) {
  if (acemode) {
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

export function addLine(i: (string | number)) {
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
  parseAndRegenerate()
  return false
}

export function generatorChanged() {
  parseAndRegenerate()
}

function parseAndRegenerate(preferScriptSpecifiedGeneratorAndVisualizer = false) {
  const code = getGraphText() + '\n'
  parse(code, (finalGenerator, finalVisualizer) => {
    console.warn(`  parseAndRegenerate() - visualize using final visualizer ${finalVisualizer}`)
    visualize(finalVisualizer)
  }, (_error, _ex) => {
    clearBeautified()
    console.warn('  parseAndRegenerate() - Parsing failed :(')
  }, preferScriptSpecifiedGeneratorAndVisualizer)
}

export function savedChanged() {
  // read the example...place to textArea(overwrite)
  const e = getSelectElement('diagrammer-saved')
  const doc = e.options[e.selectedIndex].value
  const filename = getInputElement('diagrammer-filename')
  const data = getSavedGraphs()
  if (data[doc]) {
    setGraphText(data[doc])
    filename.value = doc
    console.warn('savedChanged..parse')
    parseAndRegenerate()
  }
}

export function exampleChanged() {
  // read the example...place to textArea(overwrite)
  const e = getSelectElement('diagrammer-example')
  const doc = e.options[e.selectedIndex].value
  console.warn(`exampleChanged(${doc})`)
  makeHTTPGet(`tests/${doc}`,
    (msg) => {
      setGraphText(String(msg))
      parseAndRegenerate(true)
    },
    (stateCode, statusText, responseText) => {
      alert(`Failed fetching example tests/${doc} ${statusText} ${responseText}`)
    }).catch(err => { console.error(`HTTP error ${String(err)}`) })
}

/**
 * Hookup code editor, so that on every key(de)press a parsing starts after configurable delay UNLESS another keypress arrives.
 * Hence while typing, we don't constanly parse, but on a minute pause, we do and user get's feedback (ok/error)
 */
function hookupToListenToManualCodeChanges(parseChangesAfterMillis: number) {
  let parsingTimerID: number | undefined
  getInputElement('diagrammer-code').onkeyup = function () { // onchange does not work on
    if (parsingTimerID) {
      clearTimeout(parsingTimerID)
      parsingTimerID = undefined
    }
    // Typescript thinks we're calling node.js setTimeout returning NodeJs.Timeout.
    // This is a web page, we're calling Javascript setTimeout that returns a number!
    parsingTimerID = (setTimeout(() => {
      parseAndRegenerate()
    }, parseChangesAfterMillis) as any) as number
  }
}

/**
 * As above, but for parsed/generated text box. Usually parasing also visualizes, but
 * while developing, it's nice to be able to quickly edit the generated code as well in
 * order to debug/experiment with actual visualizations!
 */
function hookupToListenToManualGeneratorChanges(visualizeChangesAfterMillis: number) {
  let visualizationTimerID: number | undefined
  getInputElement('diagrammer-result').onkeyup = function () { // onchange does not work on
    if (!visualizationTimerID) {
      clearTimeout(visualizationTimerID)
      visualizationTimerID = undefined
    }
    // same as above, js setTimeout, not NodeJs
    visualizationTimerID = (setTimeout(() => {
      visualize(getVisualizer())
    }, visualizeChangesAfterMillis) as any) as number
  }
}

// skip over so jest can load us
try {
  hookupToListenToManualCodeChanges(500)
  hookupToListenToManualGeneratorChanges(500)
} catch (ex) { }

// @ts-expect-error ignore missing ace (it ain't missing, loaded in index.jtml)
if (acemode && typeof (ace) !== 'undefined') {
  // some init race condition, editor null on page load
  const editor = getAceEditor()
  if (typeof editor !== 'undefined') {
    editor.getSession().on('change', function () {
      // chrome/mac(elsewhere?)
      // Looks like code/result hooks above are enough
    })
  }
}
