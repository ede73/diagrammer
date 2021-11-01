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


	  node parse.js verbose uml.test umlclass

*/

function generateUmlClass(yy) {
	//console.log(yy)
	const groups = [];
	const links = [];
	const root = getGraphRoot(yy);

	String.prototype.endsWith = function (suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
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
		return [...nodes].filter(node => !nameAndLabel(node).endsWith(")")).map(p => {
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
		return [...nodes].filter(node => nameAndLabel(node).endsWith(")")).map(m => { return { name: nameAndLabel(m), type: "string", visibility: "public" } });
	};
	var id = 1;
	const groupNameIdMap = new Map();
	traverseObjects(root, o => {
		if (o instanceof Group) {
			const key = id++;
			groupNameIdMap.set(o.name, id);
			groups.push({
				key: key,
				name: nameAndLabel(o),
				properties: getProperties(o.OBJECTS),
				methods: getMethods(o.OBJECTS)
			});
		}
	});

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
