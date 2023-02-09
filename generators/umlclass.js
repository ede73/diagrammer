// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
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
@param {GraphCanvas} graphcanvas
*/
function generateUmlClass(graphcanvas) {
	//debug(graphcanvas)
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

	const getProperties = vertices => {
		// instead of array of names...{name:???,type=???,visibility=???,default=??}
		// name;[+-#][name:]String[=xx]
		return [...vertices].filter(node => !nameAndLabel(node).includes(")")).map(p => {
			const ret = {
			};
			ret['name'] = p.name;
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
					ret['name'] = all[2];
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
		return [...vertices].filter(node => nameAndLabel(node).includes("(")).map(m => {
			const ret = {
			};
			debug(m.label);
			ret['name'] = m.name;
			if (m.label) {
				const regex = /^([+#-]|)([^:]+:|)([^=]+)(=.+|)/;
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
						ret['name'] = m.name + all[2];
					} else {
						// TODO: separate name and parameters..
						ret['name'] = all[2];
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
generators.set("umlclass", generateUmlClass);
