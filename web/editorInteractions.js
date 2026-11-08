import { getSavedGraphs } from './localStorage.js';
import { parse } from './parserInteractions.js';
import { getInputElement, getSelectElement, getSelectedVisualizer, updateRuntimeBadge } from './uiComponentAccess.js';
import { makeHTTPGet } from './ajax.js';
import { clearBeautified, visualize } from './visualize.js';
const acemode = 1;
function getAceEditor() {
    const editor = ace.edit('diagrammer-code');
    return editor;
}
export function getGraphText() {
    if (acemode) {
        return getAceEditor().getSession().getValue();
    }
    else {
        return getInputElement('diagrammer-code').value;
    }
}
export function setGraphText(data) {
    if (acemode) {
        const editor = getAceEditor();
        editor.selectAll();
        editor.insert(data);
    }
    else {
        getInputElement('diagrammer-code').value = data;
    }
}
function prependLine(data) {
    if (acemode) {
        const editor = getAceEditor();
        const cursor = editor.getCursorPosition();
        editor.navigateFileStart();
        editor.insert(data);
        editor.getSession().getSelection().getSelectionLead().setPosition(cursor.column, cursor.row - data.split('\n').length + 1);
    }
    else {
        const comp = getInputElement('diagrammer-code');
        comp.value = data + comp.value;
    }
}
function appendLine(data) {
    if (acemode) {
        const editor = getAceEditor();
        editor.navigateLineEnd();
        const cursor = editor.getCursorPosition();
        if (cursor.column > 1) {
            editor.insert('\n');
        }
        editor.insert(data.trim());
    }
    else {
        const comp = getInputElement('diagrammer-code');
        comp.value = comp.value + data;
    }
}
export function addLine(i) {
    if (typeof i === 'string') {
        appendLine(i + '\n');
    }
    else {
        switch (i) {
            case 1:
                appendLine('node#ff0000;Label here\n');
                break;
            case 2:
                appendLine('group color #7722ee\ngroup NAME;Label the group\n//Nodes\n  group InnerGroup#00ff00;Inner group\n  xy\n  group end\ngroup end\n');
                break;
            case 3:
                appendLine('x#ff0000>#00ff00y#0000ff\n');
                break;
            case 4:
                appendLine('a/barcode.png,b/basestation.png,c/battery.png>d/camera.png,e/cpu.png,f/documents.png\n' + 'a1/harddisk.png,b1/keyboard.png,c1/laptop.png>d1/laser.png,e1/monitor.png,f1/mouse.png\n' + 'a2/phone.png,b2/printer.png,c2/ram.png>d2/satellite.png,e2/scanner.png,f2/sim.png\n' + 'u/usbmemory.png>w/wifi.png\n' + 'a1/actor1.png>a2/actor2.png>a3/actor3.png');
                break;
            case 5:
                prependLine('start NODENAME\n');
                break;
            case 6:
                appendLine('//shapes: default, invis, record, dots, actor, cloud\n' + '//beginpoint,endpoint,condition,database,terminator,input,loopin,loopout\n' + '//square,ellipse,diamond,minidiamond,note,mail\n' + 'shape box\n');
                break;
            case 7:
                prependLine('equal node1,node2\n');
                break;
            case 8:
                prependLine('$(color1:#12ede0)\nclr$(color1)\nclr2$(color1)\n');
                break;
            case 9:
                appendLine('if something would happend then\n' + '  a1>b1\n' + 'elseif something probably would not happen then\n' + ' a2>b2\n' + 'elseif or if i see a flying bird then\n' + ' a3>b3\n' + 'else\n' + '  a4>b4\n' + 'endif\n');
                break;
        }
    }
    parseAndRegenerate();
    return false;
}
export function generatorChanged() {
    updateRuntimeBadge();
    parseAndRegenerate();
}
function parseAndRegenerate(preferScriptSpecifiedVisualizer = false) {
    const code = getGraphText() + '\n';
    parse(code, (finalVisualizer) => {
        console.debug(`  parseAndRegenerate() - visualize using final visualizer ${finalVisualizer}`);
        visualize(finalVisualizer);
    }, (_error, _ex) => {
        clearBeautified();
        console.warn(`  parseAndRegenerate() - Parsing failed :( ${_error}`);
    }, preferScriptSpecifiedVisualizer);
}
export function savedChanged() {
    const e = getSelectElement('diagrammer-saved');
    const doc = e.options[e.selectedIndex].value;
    const filename = getInputElement('diagrammer-filename');
    const data = getSavedGraphs();
    if (data[doc]) {
        setGraphText(data[doc]);
        filename.value = doc;
        console.debug('savedChanged..parse');
        parseAndRegenerate();
    }
}
export function exampleChanged() {
    const e = getSelectElement('diagrammer-example');
    const doc = e.options[e.selectedIndex].value;
    console.debug(`exampleChanged(${doc})`);
    makeHTTPGet(`tests/${doc}`, (msg) => {
        setGraphText(String(msg));
        parseAndRegenerate(true);
    }, (stateCode, statusText, responseText) => {
        alert(`Failed fetching example tests/${doc} ${statusText} ${responseText}`);
    });
}
function hookupToListenToManualCodeChanges(parseChangesAfterMillis) {
    let parsingTimerID;
    getInputElement('diagrammer-code').onkeyup = function () {
        if (parsingTimerID) {
            clearTimeout(parsingTimerID);
            parsingTimerID = undefined;
        }
        parsingTimerID = setTimeout(() => {
            parseAndRegenerate();
        }, parseChangesAfterMillis);
    };
}
function hookupToListenToManualGeneratorChanges(visualizeChangesAfterMillis) {
    let visualizationTimerID;
    getInputElement('diagrammer-result').onkeyup = function () {
        if (!visualizationTimerID) {
            clearTimeout(visualizationTimerID);
            visualizationTimerID = undefined;
        }
        visualizationTimerID = setTimeout(() => {
            visualize(getSelectedVisualizer());
        }, visualizeChangesAfterMillis);
    };
}
try {
    hookupToListenToManualCodeChanges(500);
    hookupToListenToManualGeneratorChanges(500);
}
catch (ex) { }
if (acemode && typeof (ace) !== 'undefined') {
    const editor = getAceEditor();
    if (typeof editor !== 'undefined') {
        editor.getSession().on('change', function () {
        });
    }
}
