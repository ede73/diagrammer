/*

	  // setup a few example class nodes and relationships
	  var nodedata = [
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

	  var linkdata = [
		{ from: 12, to: 11, relationship: "generalization" },
		{ from: 13, to: 11, relationship: "generalization" },
		{ from: 14, to: 13, relationship: "aggregation" }
	  ];


	  node js/parse.js verbose uml.test umlclass

*/

function generateUmlClass(yy) {
	//console.log(yy)
	const groups = [];
	const links = [];
	const root = getGraphRoot(yy);

	const nameAndLabel = ln => {
		// name;name():?? -> name():??
		// name;:?? -> name():??
		const label = (ln.label == undefined) ? "" : ln.label;
		if (label.startsWith(ln.name)) {
			return label;
		}
		return ln.name + "" + label;
	}

	const getProperties = nodes => {
		// instead of array of names...{name:???,type=???,visibility=???,default=??}
		// name;[+-#][name:]String[=xx]
		return [...nodes].filter(node => !nameAndLabel(node).includes(")")).map(p => {
			var ret = {
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
	const getMethods = nodes => {
		// instead of array of names...{name:???,parameters:[{name:???,type:???}],visiblity:???}
		//+public,-private,#protected
		return [...nodes].filter(node => nameAndLabel(node).includes("(")).map(m => {
			var ret = {
			};
			console.log(m.label);
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
					if (all[2].startsWith("(")){
						ret['name'] = m.name+all[2];
					}else{
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
	var id = 1;
	const groupNameIdMap = new Map();
	traverseObjects(root, o => {
		if (o instanceof Group) {
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
	console.log(groupNameIdMap);

	traverseLinks(yy, l => {
		relationship = 'generalization';
		if (l.linkType != '>') {
			relationship = 'aggregation';
		}
		links.push({
			from: groupNameIdMap.get(l.left.name),
			to: groupNameIdMap.get(l.right.name),
			relationship: relationship
		});
	});
	output(yy, JSON.stringify([groups, links]));
}
