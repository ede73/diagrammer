// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { traverseVertices, traverseEdges } from '../model/model.js';
import { GraphGroup } from '../model/graphgroup.js';
import { debug, output } from '../model/support.js';

/**

	  // setup a few example class vertices and relationships
	  const nodedata = [
		{
		  key: 1,
		  name: "BankAccount",
		  properties: [
			{ name: "owner", type: "String", visibility: "public" },
			{ name: "balance", type: "Currency", visibility: "public", default: "0" }
		  ],
		  methods: [
			{ name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
			{ name: "withdraw", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" }
		  ]
		},

	  const linkdata = [
		{ from: 12, to: 11, relationship: "generalization" },
		{ from: 13, to: 11, relationship: "generalization" },
		{ from: 14, to: 13, relationship: "aggregation" }
	  ];


	  node js/diagrammer.js verbose uml.test umlclass

	  Couple problems:
	  - If groups (classes) have same named methods/members it'll clash with
	  diagrammer ideal, node names ones is create, 2nd time met -> referred
	  Also reserved words cannot be used
		- mitigation: trailing or leading underscores can be used to mangle names, both filtered out from output
@param {GraphCanvas} graphcanvas
*/
export function umlclass(graphcanvas) {
	const groups = [];
	const edges = [];

	const nameAndLabel = ln => {
		// name;name():?? -> name():??
		// name;:?? -> name():??
		const label = (!ln.label) ? "" : ln.label;
		if (label.startsWith(ln.name)) {
			return label;
		}
		return ln.name + "" + label;
	}

	const mangleName = name => {
		return name.replace(/_+$/, "").replace(/^_+/, "");
	}

	const getProperties = vertices => {
		// instead of array of names...{name:???,type=???,visibility=???,default=??}
		// Example:
		// NAME;LABEL
		// name;[+-#][name:]String[=defaultValue]
		return [...vertices].filter(node => !nameAndLabel(node).includes(")")).map(p => {
			const ret = {
			};
			// By default, name=name
			ret['name'] = mangleName(p.name);

			// If there's a label attached, parse that
			if (p.label) {
				const regex = /^([+#-]|)([^:]+:|)([^=]+)(=.+|)/;
				const all = p.label.match(regex);
				switch (all[1]) {
					case "+":
						ret['visibility'] = 'public';
						break;
					case "-":
						ret['visibility'] = 'private';
						break;
					case "#":
						ret['visibility'] = 'protected';
						break;
				}
				if (all[2]) {
					ret['name'] = all[2]; // specific label name, NO MANGLING
				}
				if (all[3]) {
					ret['type'] = all[3];
				}
				if (all[4]) {
					ret['default'] = all[4];
				}
				return ret;
			}
		});
	};

	const getMethods = vertices => {
		// instead of array of names...{name:???,parameters:[{name:???,type:???}],visiblity:???}
		//+public,-private,#protected
		// Example:
		// name;label
		// where name and/or label includes "("
		// name()
		// name;[+-#][name(...):]RETURNTYPE
		return [...vertices].filter(node => nameAndLabel(node).includes("(")).map(m => {
			const ret = {
			};
			ret['name'] = mangleName(m.name);
			if (m.label) {
				const regex = /^([+#-]|)([^)]+\)|)(.+)/;
				const all = m.label.match(regex);
				switch (all[1]) {
					case "+":
						ret['visibility'] = 'public';
						break;
					case "-":
						ret['visibility'] = 'private';
						break;
					case "#":
						ret['visibility'] = 'protected';
						break;
				}
				if (all[2]) {
					if (all[2].startsWith("(")) {
						ret['name'] = mangleName(m.name) + "==" + all[2];
					} else {
						// TODO: separate name and parameters..
						ret['name'] = mangleName(all[2]);
					}
				}
				// TODO:
				// ret["parameters"] = [{name:???,type:???}];
				// if (all[3]) {
				// 	ret['type'] = all[3];
				// }
				// if (all[4]) {
				// 	ret['default'] = all[4];
				// }
				return ret;
			}
		});
	};

	let id = 1;
	const groupNameIdMap = new Map();
	traverseVertices(graphcanvas, o => {
		if (o instanceof GraphGroup) {
			const key = id++;
			groupNameIdMap.set(o.name, key);
			groups.push({
				key: key,
				name: nameAndLabel(o),
				properties: getProperties(o.OBJECTS),
				methods: getMethods(o.OBJECTS)
			});
		}
	});
	debug(groupNameIdMap);

	traverseEdges(graphcanvas, l => {
		let relationship = 'generalization';
		if (l.edgeType != '>') {
			relationship = 'aggregation';
		}
		edges.push({
			from: groupNameIdMap.get(l.left.name),
			to: groupNameIdMap.get(l.right.name),
			relationship: relationship
		});
	});
	output(graphcanvas, JSON.stringify([groups, edges]));
}
generators.set("umlclass", umlclass);
