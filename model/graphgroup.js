// @ts-check
import { GraphObject } from '../model/graphobject.js';
import { GraphVertex } from '../model/graphvertex.js';
import { setAttr, getAttribute, debug } from '../model/support.js';
import { GraphContainer } from '../model/graphcontainer.js';
import { GraphConnectable } from './graphconnectable.js';

/**
 * Represents a container
 */
export class GraphGroup extends GraphContainer {
    /** @param {string} name */
    constructor(name) {
        super(name);

        /** @type {number} */
        this.exitvertex = undefined;

        /**
         * Only defined in case of start conditional (if clause)
         * Most usually GraphVertex
         * Set directly in diagrammer.grammar
         * @type {GraphConnectable}
         */

        this.entryedge = undefined;

        /**
         * Only defined in case of end conditional (else clause)
         * TODO: Inconsistent: not a GraphConnectable
         * 
         * Set to yy.collectNextVertex
         * @type {GraphConnectable}
         */
        this.exitedge = undefined;
    }

    /**
     * Set default vertexcolor, groupcolor, edgecolor Always ask from the
     * currentContainer first
     * @param {string} key
     * @param {any} value
     */
    setDefault(key, value) {
        if (this.ALLOWED_DEFAULTS.indexOf(key.toLowerCase()) == -1) {
            throw new Error(`Trying to set unknown default ${key}`);
        }
        // @ts-ignore
        return setAttr(this, key, value);
    }

    /**
     * @param {string} key
     */
    getDefault(key) {
        debug(`group:Get group ${key}`);
        return getAttribute(this, key);
    }

    toString() {
        return `group:Group(${this.name})`;
    }
};
