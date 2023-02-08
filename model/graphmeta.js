//@ts-check
class GraphMeta {
    /**
     * Which generator to use. Generator converts diagrammer to language understood by visualizer
     * @type {string}
     */
    USE_GENERATOR=undefined;

    /**
     * Which visualizer to use. Generator (like digraph)
     * can be visualized by circo, twopi, dot etc.
     *  @type {string}
     */
    USE_VISUALIZER=undefined;

    /**
     * Rendering direction hint
     * 
     * @type {string}
     */
    direction=undefined;

    /**
     * Marks start vertex for the graph
     *  @type {string}
     */
    start=undefined;

    GRAPHROOT=new GraphRoot();

    /**
     * @type {Edge[]}
     */
    EDGES=[];

    /**
     * @type {function(string,string):void}
     */
    parseError = undefined;

    /**
     * Output the generated result
     * @type {function(string):void}
     */
    result = undefined;

    /**
     * ===index.js===
     * parser.yy.parseError=function() (!)
     * parser.yy.result=function() (!)
     * 
     * ===index2.js===
     * parser.yy.USE_GENERATOR = generator (!)
     * parser.yy.USE_VISUALIZER = visualizer (!)
     * 
     * ===model.js===
     *  at getGraphRoot() 'singleton'
     * 
     * yy.result = function()
     * yy.CURRENTCONTAINER = [];
     * yy.EDGES = []; (!)
     * yy.CONTAINER_EXIT = 1;
     * yy.GRAPHROOT = new GraphRoot(); (!)
     *
     * at _getVariables()
     * yy.VARIABLES = {};
     * 
     * yy.GROUPIDS
     * yy.collectNextVertex
     * yy.lastSeen
     * 
     * ===parse.js===
     * yy.OUTPUT
     * parser.parser.trace
     * parser.parser.debug
     * parser.parser.yy.result
     */
    constructor(yy) {
        // TODO: DEPRECTAE
        this.yy = yy;
    }
};
