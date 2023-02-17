// @ts-check

/**
 * Records all loaded Web Visualization callsigns(names) and functions
 *
 * @type {Map<string, function(string):void>}
 */
// has to be var, else future imported visualizations cannot add them selves here
// eslint-disable-next-line no-var
export var visualizations = new Map()
