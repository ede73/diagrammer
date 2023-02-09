# With THESE changes in place
reset;node js/diagrammer.js verbose tests/test_inputs/state_group.txt ast
# actually parses

ie. js and model need to be made modules (ES)

cat js/package.json
{
  "type":"module",
  "dependencies":[
    "fs",
    "path"
  ]
}

model/package.json
{
  "type":"module"
}

js/diagrammer.js as
+// CommonJS crap
+// const fs = require('fs');
+// const path = require('path');
+
+// ES
+import * as fs from 'fs';
+import * as path from 'path';
+import * as lexer from '../build/diagrammer_lexer.js';
+import {diagrammer_parser} from '../build/diagrammer_parser.js';
...
-    diagrammer_parser.parser.yy.parseError = function (str, hash) {
+    diagrammer_parser.yy.parseError = function (str, hash) {^M

Add imports to all models AND export them
+import {GraphObject} from '../model/graphobject.js';
+import {GraphEdge} from '../model/graphedge.js';
+import {setAttr, getAttribute, debug} from '../model/support.js';

-class GraphEdge extends GraphObject {
+export class GraphEdge extends GraphObject {

Build system requirs changes also, ie. build/diagrammer.parser should look like:
import {GraphObject} from '../model/graphobject.js';
import {GraphVertex} from '../model/graphvertex.js';
import {GraphGroup} from '../model/graphgroup.js';
import {GraphCanvas} from '../model/graphcanvas.js';
import {GraphEdge} from '../model/graphedge.js';
import * as model from '../model/model.js';

var generators;
var visualizations;
var collectNextVertex;

