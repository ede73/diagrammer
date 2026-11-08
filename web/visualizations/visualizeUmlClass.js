import go from 'gojs';
import { removeOldVisualizations } from '../d3support.js';
export async function visualizeUmlClass(generatorResult) {
    const printSize = 900;
    const jsonData = JSON.parse(generatorResult);
    const $ = go.GraphObject.make;
    removeOldVisualizations('UMLCLASS');
    const myDiagram = $(go.Diagram, 'UMLCLASS', {
        'undoManager.isEnabled': true,
        layout: $(go.TreeLayout, {
            angle: 90,
            path: go.TreeLayout.PathSource,
            setsPortSpot: false,
            setsChildPortSpot: false,
            arrangement: go.TreeLayout.ArrangementHorizontal,
            nodeSpacing: 100,
            layerSpacing: 100
        })
    });
    function classVisibilityToHumanReadable(v) {
        switch (v) {
            case 'public': return '+';
            case 'private': return '-';
            case 'protected': return '#';
            case 'package': return '~';
            default: return v;
        }
    }
    const methodAndPropertyFont = 'italic 10pt sans-serif';
    const propertyTemplate = $(go.Panel, 'Horizontal', $(go.TextBlock, { isMultiline: false, editable: false, width: 12 }, new go.Binding('text', 'visibility', classVisibilityToHumanReadable)), $(go.TextBlock, { isMultiline: false, editable: false, font: methodAndPropertyFont.replace('italic', 'bold') }, new go.Binding('text', 'name'), new go.Binding('isUnderline', 'scope', (isClassLevel) => { return isClassLevel[0] === 'c'; })), $(go.TextBlock, '', new go.Binding('text', 'type', (hasType) => { return (hasType ? ': ' : ''); })), $(go.TextBlock, { row: 1, font: methodAndPropertyFont, stroke: '#0f5584' }, new go.Binding('text', 'type')), $(go.TextBlock, { isMultiline: false, editable: false }, new go.Binding('text', 'default', (hasDefault) => { return hasDefault ? ' = ' + hasDefault : ''; })));
    const methodTemplate = $(go.Panel, 'Horizontal', $(go.TextBlock, { isMultiline: false, editable: false, width: 12 }, new go.Binding('text', 'visibility', classVisibilityToHumanReadable)), $(go.TextBlock, { isMultiline: false, editable: false, font: methodAndPropertyFont.replace('italic', 'bold') }, new go.Binding('text', 'name').makeTwoWay(), new go.Binding('isUnderline', 'scope', (isClassLevel) => { return isClassLevel[0] === 'c'; })), $(go.TextBlock, { row: 1, font: methodAndPropertyFont, stroke: '#847323' }, new go.Binding('text', 'parameters', (parameters) => {
        var _a;
        let s = '(';
        for (let i = 0; i < parameters.length; i++) {
            const param = parameters[i];
            if (i > 0)
                s += ', ';
            s += `${param.name}${param.type ? ': ' : ''}${(_a = param.type) !== null && _a !== void 0 ? _a : ''}`;
        }
        return s + ')';
    })), $(go.TextBlock, { row: 1, font: methodAndPropertyFont, stroke: '#0f5584' }, new go.Binding('text', 'type', function (hasType) { return (hasType ? ': ' : ''); })), $(go.TextBlock, { isMultiline: false, editable: false, row: 1, font: methodAndPropertyFont, stroke: '#0f5584' }, new go.Binding('text', 'type')));
    const background = 'lightblue';
    const headerFont = 'bold 12pt sans-serif';
    myDiagram.nodeTemplate =
        $(go.Node, 'Auto', {
            locationSpot: go.Spot.Center,
            fromSpot: go.Spot.AllSides,
            toSpot: go.Spot.AllSides
        }, $(go.Shape, { fill: background }), $(go.Panel, 'Table', { defaultRowSeparatorStroke: 'black' }, $(go.TextBlock, {
            row: 0,
            columnSpan: 2,
            margin: 3,
            alignment: go.Spot.Center,
            font: headerFont,
            isMultiline: false,
            editable: false
        }, new go.Binding('text', 'name').makeTwoWay()), $(go.TextBlock, 'Properties', { row: 1, font: methodAndPropertyFont }, new go.Binding('visible', 'visible', (v) => { return !v; }).ofObject('PROPERTIES')), $(go.Panel, 'Vertical', { name: 'PROPERTIES' }, new go.Binding('itemArray', 'properties'), {
            row: 1,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background,
            itemTemplate: propertyTemplate
        }), $('PanelExpanderButton', 'PROPERTIES', { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false }, new go.Binding('visible', 'properties', (arr) => { return arr.length > 0; })), $(go.TextBlock, 'Methods', { row: 2, font: methodAndPropertyFont }, new go.Binding('visible', 'visible', (v) => { return !v; }).ofObject('METHODS')), $(go.Panel, 'Vertical', { name: 'METHODS' }, new go.Binding('itemArray', 'methods'), {
            row: 2,
            margin: 3,
            stretch: go.GraphObject.Fill,
            defaultAlignment: go.Spot.Left,
            background,
            itemTemplate: methodTemplate
        }), $('PanelExpanderButton', 'METHODS', { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false }, new go.Binding('visible', 'methods', (arr) => { return arr.length > 0; }))));
    function shouldLayoutVertically(r) {
        return true;
    }
    function tailRelationShipToFillColor(r) {
        switch (r) {
            case 'aggregation': return 'transparent';
            case 'composition': return 'black';
            default: return '';
        }
    }
    function tailArrow(r) {
        switch (r) {
            case 'aggregation': return 'StretchedDiamond';
            case 'composition': return 'StretchedDiamond';
            default: return '';
        }
    }
    function getRelationshipStroke(r) {
        switch (r) {
            case 'dependency': return [4, 4];
            case 'realization': return [4, 4];
            default: return [0, 0];
        }
    }
    function headRelationShipToFillColor(r) {
        switch (r) {
            case 'composition': return 'black';
            default: return 'transparent';
        }
    }
    function headArrow(r) {
        switch (r) {
            case 'association': return '';
            case 'dependency': return 'Boomerang';
            case 'generalization': return 'Triangle';
            case 'realization': return 'Triangle';
            case 'composition': return 'Boomerang';
            case 'aggregation': return 'Boomerang';
            default: return '';
        }
    }
    const headTailEdgeLabelFont = 'bold 14px sans-serif';
    const edgeLabelFont = 'italic 14px sans-serif';
    myDiagram.linkTemplate =
        $(go.Link, { routing: go.Link.Orthogonal }, new go.Binding('isLayoutPositioned', 'relationship', shouldLayoutVertically), $(go.Shape, new go.Binding('strokeDashArray', 'relationship', getRelationshipStroke)), $(go.Shape, { scale: 2 }, new go.Binding('fill', 'relationship', tailRelationShipToFillColor), new go.Binding('fromArrow', 'relationship', tailArrow)), $(go.Shape, { scale: 2 }, new go.Binding('fill', 'relationship', headRelationShipToFillColor), new go.Binding('toArrow', 'relationship', headArrow)), $(go.TextBlock, {
            textAlign: 'center',
            font: edgeLabelFont,
            stroke: '#606060',
            isMultiline: true
        }, new go.Binding('text', 'label', (label) => label ? label.split('\\n').join('\n') : '')), $(go.TextBlock, {
            textAlign: 'center',
            font: headTailEdgeLabelFont,
            stroke: '#1967B3',
            segmentIndex: 0,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientPlus90
        }, new go.Binding('text', 'tailLabel', (tailLabel) => tailLabel || '')), $(go.TextBlock, {
            textAlign: 'center',
            font: headTailEdgeLabelFont,
            stroke: '#1967B3',
            segmentIndex: -1,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientPlus90
        }, new go.Binding('text', 'headLabel', (headLabel) => headLabel || '')));
    const nodedata = jsonData[0];
    const linkdata = jsonData[1];
    myDiagram.model = $(go.GraphLinksModel, {
        copiesArrays: true,
        copiesArrayObjects: true,
        nodeDataArray: nodedata,
        linkDataArray: linkdata
    });
    const x = 0;
    const y = 0;
    const u = new go.Size(printSize, printSize);
    const svg = myDiagram.makeSvg({ position: new go.Point(x, y), size: u });
    removeOldVisualizations().appendChild(svg);
}
