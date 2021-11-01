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

	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
	const labelOrName = ln => {
		return (ln.label == undefined) ? ln.name : ln.label;
	}

	const getProperties = nodes => {
		return [...nodes].filter(node => !labelOrName(node).endsWith(")"));
	};
	const getMethods = nodes => {
		return [...nodes].filter(node => labelOrName(node).endsWith(")"));
	};
	var id = 1;
	const groupNameIdMap = new Map();
	traverseObjects(root, o => {
		if (o instanceof Group) {
			const key = id++;
			groupNameIdMap.set(o.name, id);
			groups.push({
				key: key,
				name: labelOrName(o),
				properties: getProperties(o.OBJECTS),
				methods: getMethods(o.OBJECTS)
			});
		}
	});

	traverseLinks(yy, l => {
		relationship = 'aggregation';
		links.push({
			from: groupNameIdMap.get(l.left.name),
			to:  groupNameIdMap.get(l.right.name),
			relationship: relationship
		});
	});
	output(yy, JSON.stringify([groups, links]));
}
