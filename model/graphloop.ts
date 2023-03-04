// @ts-check

import { GraphCanvas } from './graphcanvas.js'
import { GraphContainer } from './graphcontainer.js'
import { GraphGroup } from './graphgroup.js'
import { _getGroupOrMakeNew } from './model.js'

export class GraphLoop extends GraphGroup {
    private canvas: GraphCanvas

    constructor(canvas: GraphCanvas, type: string, label: string, parent: GraphContainer) {
        // for IF, current container is correct, for any other part (right now), current contantainer
        // is obviously this GraphConditional (ie. previous statement), so we will use the parent
        // IN THE FUTURE, TODO: Make GraphConditional a NEW parent group for the WHOLE conditional section
        // is GraphConditional(If,elseif..else..endif)
        super(String(canvas.GROUPIDS++), parent);
        this.canvas = this.getCanvas();

        (parent as GraphContainer).addObject(this);
        this.setLabel(label.trim().replace(/(^(end[ ]*while|until)\s)/g, '').trim())
        // TODO: right now, digraph generator assumes conditional means if/else.. neeed revamping
        //this.conditional = type

        this.canvas._enterContainer(this)

    }
};
