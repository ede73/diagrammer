// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      assert(sig.length == 1);
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2);assert((STACKTOP|0) < (STACK_MAX|0)); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 28580;
assert(STATICTOP < TOTAL_MEMORY);
var _stdout;
var _stdin;
var _stderr;
var _stdout = _stdout=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,0,48,97,80,0,40,97,80,0,16,97,80,0,60,80,80,0,228,79,80,0,248,90,80,0,232,89,80,0,68,89,80,0,244,64,80,0,188,90,80,0,236,80,80,0,120,72,80,0,4,89,80,0,164,88,80,0,20,88,80,0,224,82,80,0,116,83,80,0,36,82,80,0,156,81,80,0,152,72,80,0,244,96,80,0,216,96,80,0,88,72,80,0,4,71,80,0,208,70,80,0,172,96,80,0,232,66,80,0,232,65,80,0,152,96,80,0,96,64,80,0,200,61,80,0,124,96,80,0,176,98,80,0,196,96,80,0,40,96,80,0,172,69,80,0,16,68,80,0,12,96,80,0,56,95,80,0,60,94,80,0,204,95,80,0,188,95,80,0,168,95,80,0,56,70,80,0,20,81,80,0,124,79,80,0,244,73,80,0,168,70,80,0,80,70,80,0,152,78,80,0,204,80,80,0,132,93,80,0,108,93,80,0,236,92,80,0,92,92,80,0,112,70,80,0,96,95,80,0,92,95,80,0,40,95,80,0,36,95,80,0,236,94,80,0,180,94,80,0,164,94,80,0,136,94,80,0,132,94,80,0,116,94,80,0,100,94,80,0,84,94,80,0,40,94,80,0,28,94,80,0,8,94,80,0,208,93,80,0,200,93,80,0,164,93,80,0,156,93,80,0,0,0,0,0,0,0,0,0,16,5,6,5,6,82,1,88,19,101,83,5,6,5,6,16,25,16,5,6,87,89,17,18,33,34,35,36,37,38,39,40,41,42,82,7,8,9,10,100,20,21,27,3,27,5,6,28,4,28,22,86,27,20,47,55,56,28,84,94,7,8,9,10,89,57,43,55,99,23,26,85,24,81,91,92,93,95,96,90,0,98,58,48,59,60,49,61,62,50,63,64,51,65,66,52,67,68,53,69,70,71,72,97,0,0,0,0,0,0,73,74,75,76,48,0,0,49,0,0,50,0,0,51,0,0,52,0,0,53,0,0,0,12,57,8,0,3,4,45,46,47,48,58,59,60,61,62,74,6,7,5,6,7,10,59,61,74,62,44,49,63,64,65,74,13,14,15,16,17,18,19,20,21,22,55,71,72,73,7,24,27,30,33,36,39,70,6,7,10,23,25,26,28,29,31,32,34,35,37,38,40,41,42,43,51,52,53,54,66,67,68,69,70,6,11,5,63,74,64,9,64,71,74,74,74,49,74,74,72,74,7,11,9,0,0,0,2,9,7,1,3,3,1,1,1,1,1,3,1,4,1,3,3,4,1,1,3,3,3,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,56,57,57,58,58,59,60,60,60,60,61,61,62,62,63,63,63,64,64,65,65,65,65,65,65,65,65,66,66,66,66,67,67,67,67,68,68,68,68,68,69,69,69,69,69,69,70,70,70,70,70,70,71,71,72,73,73,73,73,73,73,73,73,73,73,73,74,74,0,0,0,220,220,220,52,220,54,50,24,221,220,220,220,220,220,41,22,21,220,253,0,250,35,48,15,220,220,220,220,220,220,220,16,220,3,34,40,220,246,42,42,42,8,11,220,47,220,40,220,90,49,220,55,59,220,220,220,220,220,220,220,220,220,220,220,255,220,53,8,220,220,220,220,220,220,42,8,254,11,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,42,42,42,10,42,11,220,42,61,220,220,220,220,28,220,220,220,220,220,220,220,220,0,220,220,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,69,80,0,196,69,80,0,192,69,80,0,168,69,80,0,152,69,80,0,144,69,80,0,120,69,80,0,36,69,80,0,184,68,80,0,176,68,80,0,60,68,80,0,52,68,80,0,44,68,80,0,36,68,80,0,0,68,80,0,248,67,80,0,228,67,80,0,136,67,80,0,76,67,80,0,72,67,80,0,16,67,80,0,8,67,80,0,0,67,80,0,248,66,80,0,220,66,80,0,212,66,80,0,184,66,80,0,148,66,80,0,96,66,80,0,84,66,80,0,72,66,80,0,12,66,80,0,0,66,80,0,252,65,80,0,216,65,80,0,208,65,80,0,192,65,80,0,168,65,80,0,4,65,80,0,224,64,80,0,216,64,80,0,144,64,80,0,128,64,80,0,116,64,80,0,72,64,80,0,64,64,80,0,244,64,80,0,188,90,80,0,236,80,80,0,120,72,80,0,172,69,80,0,16,68,80,0,232,66,80,0,232,65,80,0,96,64,80,0,200,61,80,0,176,98,80,0,196,96,80,0,56,95,80,0,60,94,80,0,132,93,80,0,108,93,80,0,236,92,80,0,92,92,80,0,248,90,80,0,232,89,80,0,68,89,80,0,4,89,80,0,164,88,80,0,20,88,80,0,116,83,80,0,224,82,80,0,36,82,80,0,156,81,80,0,20,81,80,0,204,80,80,0,60,80,80,0,228,79,80,0,124,79,80,0,152,78,80,0,244,73,80,0,216,73,80,0,128,73,80,0,200,72,80,0,152,72,80,0,88,72,80,0,4,71,80,0,208,70,80,0,168,70,80,0,112,70,80,0,80,70,80,0,56,70,80,0,255,2,11,12,13,14,15,29,30,31,77,78,79,80,54,44,45,46,32,0,0,0,0,0,1,68,67,7,8,9,10,0,4,0,0,11,13,0,0,0,0,0,0,5,0,6,12,20,0,0,15,19,0,56,57,58,59,60,61,62,63,64,65,66,0,53,0,0,52,47,48,49,51,50,0,0,0,0,46,36,41,37,42,38,43,40,45,39,44,28,29,30,31,32,33,34,35,0,0,0,0,0,0,14,0,0,27,17,3,16,0,21,24,22,26,23,25,54,55,0,18,2,0,0,3,3,4,3,4,6,12,9,5,9,11,3,4,3,4,18,19,20,3,4,55,56,6,7,13,14,15,16,17,18,19,20,21,22,6,45,46,47,48,11,6,7,44,8,44,3,4,49,0,49,10,54,44,6,7,6,7,49,5,49,45,46,47,48,99,10,55,6,7,17,20,47,18,32,77,78,79,80,81,57,255,84,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,82,255,255,255,255,255,255,51,52,53,54,24,255,255,27,255,255,30,255,255,33,255,255,36,255,255,39,0,0,0,0,0,0,0,0,0,0,0,0,59,1,59,1,9,0,10,0,9,0,10,0,13,0,14,0,13,0,14,0,15,0,66,0,15,0,72,0,80,0,64,0,83,0,85,0,81,0,92,0,84,0,86,0,97,0,87,0,88,0,89,0,90,0,72,0,103,0,98,0,59,1,93,0,104,0,165,0,64,0,132,0,133,0,166,0,198,0,199,0,106,0,111,0,167,0,168,0,82,0,178,0,73,0,118,0,112,0,179,0,208,0,209,0,119,0,107,0,56,1,180,0,181,0,245,0,246,0,56,1,73,0,253,0,254,0,48,1,11,0,55,1,11,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,28,0,29,0,30,0,31,0,32,0,33,0,34,0,27,0,27,0,27,0,27,0,35,0,36,0,27,0,37,0,38,0,27,0,27,0,39,0,27,0,40,0,41,0,42,0,43,0,44,0,16,0,45,0,46,0,47,0,27,0,27,0,27,0,27,0,48,0,49,0,27,0,50,0,51,0,52,0,27,0,27,0,53,0,27,0,54,0,55,0,56,0,43,0,57,0,58,0,59,0,16,0,16,0,16,0,76,0,125,0,72,0,7,1,10,1,45,1,8,1,11,1,77,0,7,1,10,1,37,1,17,1,19,1,38,1,37,1,45,1,48,1,43,1,46,1,49,1,45,1,48,1,56,1,51,1,53,1,57,1,78,0,56,1,48,1,54,1,58,1,45,1,50,1,73,0,73,0,37,1,52,1,50,1,37,1,47,1,44,1,42,1,41,1,40,1,33,1,39,1,36,1,35,1,34,1,78,0,8,0,8,0,8,0,8,0,12,0,12,0,12,0,12,0,60,0,33,1,60,0,60,0,63,0,32,1,10,1,63,0,64,0,31,1,64,0,64,0,65,0,65,0,65,0,65,0,69,0,7,1,69,0,69,0,71,0,71,0,71,0,71,0,74,0,74,0,74,0,74,0,121,0,30,1,121,0,121,0,123,0,29,1,123,0,123,0,124,0,28,1,124,0,124,0,128,0,128,0,128,0,128,0,27,1,26,1,10,1,25,1,7,1,24,1,23,1,22,1,21,1,20,1,18,1,16,1,15,1,14,1,13,1,12,1,9,1,6,1,5,1,4,1,3,1,2,1,1,1,0,1,255,0,252,0,251,0,250,0,249,0,248,0,247,0,244,0,243,0,242,0,241,0,240,0,239,0,238,0,230,0,237,0,236,0,235,0,234,0,233,0,232,0,231,0,230,0,229,0,228,0,227,0,226,0,225,0,224,0,215,0,223,0,222,0,221,0,220,0,219,0,218,0,217,0,216,0,215,0,214,0,213,0,212,0,211,0,210,0,200,0,207,0,196,0,195,0,206,0,205,0,204,0,203,0,202,0,201,0,200,0,197,0,196,0,195,0,194,0,193,0,192,0,191,0,190,0,189,0,188,0,187,0,186,0,174,0,173,0,185,0,184,0,183,0,182,0,164,0,177,0,176,0,175,0,174,0,173,0,172,0,171,0,170,0,169,0,164,0,163,0,162,0,129,0,161,0,160,0,159,0,146,0,158,0,157,0,156,0,155,0,154,0,153,0,152,0,151,0,138,0,150,0,149,0,148,0,147,0,146,0,145,0,144,0,143,0,142,0,141,0,140,0,139,0,138,0,137,0,136,0,135,0,134,0,131,0,130,0,129,0,127,0,126,0,75,0,68,0,122,0,120,0,117,0,116,0,115,0,114,0,113,0,110,0,109,0,108,0,105,0,102,0,101,0,100,0,99,0,96,0,95,0,94,0,91,0,79,0,75,0,70,0,68,0,67,0,62,0,61,0,59,1,7,0,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,5,0,0,0,6,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,7,0,0,0,1,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,1,0,0,0,1,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,12,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,12,0,0,0,26,0,0,0,27,0,0,0,12,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,12,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,12,0,0,0,35,0,0,0,36,0,0,0,12,0,0,0,12,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,1,0,0,0,12,0,0,0,1,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,12,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,12,0,0,0,48,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,12,0,0,0,54,0,0,0,55,0,0,0,56,0,0,0,57,0,0,0,12,0,0,0,58,0,0,0,59,0,0,0,12,0,0,0,12,0,0,0,60,0,0,0,61,0,0,0,62,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,63,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,64,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,65,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,60,1,60,1,61,1,61,1,59,1,5,0,59,1,59,1,62,1,62,1,59,1,63,1,64,1,65,1,59,1,59,1,59,1,66,1,66,1,67,1,68,1,59,1,59,1,59,1,59,1,59,1,69,1,59,1,59,1,59,1,59,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,59,1,59,1,62,1,70,1,59,1,63,1,64,1,65,1,71,1,59,1,59,1,66,1,72,1,67,1,59,1,67,1,68,1,59,1,59,1,59,1,59,1,59,1,59,1,73,1,69,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,70,1,59,1,71,1,72,1,67,1,59,1,59,1,73,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,59,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,59,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,69,1,0,0,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,0,0,0,0,0,0,1,0,1,0,2,0,2,0,3,0,3,0,4,0,4,0,3,0,14,0,4,0,20,0,26,0,14,0,28,0,30,0,26,0,33,0,28,0,30,0,37,0,30,0,30,0,31,0,31,0,71,0,42,0,37,0,65,0,33,0,42,0,137,0,65,0,87,0,87,0,137,0,175,0,175,0,46,0,50,0,137,0,137,0,69,1,150,0,20,0,56,0,50,0,150,0,186,0,186,0,56,0,46,0,58,1,150,0,150,0,231,0,231,0,57,1,71,0,238,0,238,0,53,1,1,0,52,1,2,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,5,0,24,0,73,0,125,0,247,0,249,0,51,1,247,0,249,0,24,0,255,0,1,1,25,1,255,0,1,1,25,1,31,1,34,1,36,1,31,1,34,1,36,1,40,1,42,1,54,1,40,1,42,1,54,1,24,0,55,1,49,1,47,1,55,1,46,1,44,1,73,0,125,0,43,1,41,1,39,1,38,1,35,1,32,1,30,1,29,1,28,1,27,1,26,1,24,1,23,1,22,1,24,0,60,1,60,1,60,1,60,1,61,1,61,1,61,1,61,1,62,1,21,1,62,1,62,1,63,1,20,1,19,1,63,1,64,1,18,1,64,1,64,1,65,1,65,1,65,1,65,1,66,1,17,1,66,1,66,1,67,1,67,1,67,1,67,1,68,1,68,1,68,1,68,1,70,1,16,1,70,1,70,1,71,1,15,1,71,1,71,1,72,1,14,1,72,1,72,1,73,1,73,1,73,1,73,1,13,1,12,1,11,1,9,1,8,1,6,1,5,1,4,1,3,1,2,1,0,1,254,0,253,0,252,0,251,0,250,0,248,0,246,0,245,0,244,0,243,0,242,0,241,0,240,0,239,0,237,0,236,0,235,0,234,0,233,0,232,0,229,0,228,0,227,0,226,0,225,0,224,0,223,0,222,0,221,0,220,0,219,0,218,0,217,0,216,0,214,0,213,0,212,0,211,0,210,0,209,0,208,0,207,0,206,0,205,0,204,0,203,0,202,0,201,0,199,0,198,0,197,0,194,0,193,0,192,0,191,0,190,0,188,0,187,0,185,0,184,0,183,0,182,0,181,0,180,0,179,0,178,0,177,0,176,0,172,0,171,0,170,0,169,0,168,0,167,0,166,0,165,0,162,0,160,0,159,0,158,0,157,0,156,0,154,0,153,0,152,0,151,0,149,0,148,0,147,0,145,0,144,0,143,0,142,0,141,0,140,0,139,0,136,0,133,0,132,0,128,0,120,0,119,0,118,0,117,0,116,0,115,0,114,0,113,0,112,0,111,0,110,0,109,0,108,0,107,0,106,0,104,0,103,0,102,0,101,0,100,0,99,0,98,0,97,0,96,0,95,0,94,0,93,0,92,0,90,0,88,0,86,0,85,0,81,0,79,0,76,0,74,0,68,0,62,0,58,0,55,0,54,0,53,0,52,0,51,0,49,0,48,0,47,0,43,0,41,0,40,0,39,0,38,0,36,0,35,0,34,0,32,0,25,0,21,0,19,0,17,0,15,0,11,0,10,0,7,0,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,4,0,6,0,67,0,0,0,154,1,155,1,0,0,150,1,89,1,0,0,0,0,9,0,140,1,155,1,148,1,0,0,146,1,9,0,145,1,155,1,155,1,124,0,137,1,8,0,0,0,4,0,155,1,9,0,10,0,129,1,1,0,116,1,112,1,122,1,5,0,113,1,122,1,118,1,108,1,4,0,129,1,155,1,155,1,0,0,85,1,81,1,92,1,2,0,79,1,81,1,91,1,87,1,76,1,1,0,155,1,68,1,155,1,0,0,0,0,64,1,0,0,0,0,28,0,0,0,155,1,125,1,0,0,0,0,23,0,155,1,129,0,123,1,155,1,116,1,155,1,155,1,114,1,155,1,120,1,0,0,155,1,155,1,105,1,104,1,20,0,103,1,155,1,102,1,155,1,89,1,97,1,80,1,95,1,80,1,94,1,84,1,78,1,81,1,73,1,81,1,86,1,75,1,155,1,53,1,62,1,44,1,60,1,44,1,59,1,48,1,56,1,41,1,44,1,36,1,45,1,50,1,38,1,30,1,0,0,155,1,0,0,0,0,130,0,155,1,155,1,87,1,155,1,155,1,155,1,72,1,71,1,155,1,155,1,51,1,11,0,0,0,68,1,54,1,62,1,61,1,60,1,45,1,47,1,0,0,46,1,57,1,18,1,1,0,36,1,21,1,30,1,29,1,0,0,28,1,12,1,14,1,13,1,25,1,155,1,50,1,155,1,0,0,35,1,40,1,38,1,41,1,35,1,34,1,33,1,39,1,0,0,0,0,20,0,34,1,22,1,2,1,8,1,6,1,9,1,3,1,2,1,1,1,7,1,10,0,2,1,245,0,155,1,28,1,17,1,19,1,7,1,20,1,0,0,0,0,12,1,17,1,10,1,0,0,7,1,253,0,241,0,244,0,231,0,245,0,236,0,242,0,234,0,231,0,7,1,5,1,252,0,248,0,0,0,253,0,3,1,251,0,3,1,233,0,231,0,221,0,217,0,223,0,229,0,221,0,229,0,243,0,247,0,0,0,39,0,237,0,236,0,235,0,233,0,215,0,219,0,21,0,208,0,207,0,206,0,204,0,234,0,226,0,231,0,224,0,105,0,225,0,106,0,233,0,206,0,197,0,203,0,195,0,88,0,197,0,89,0,205,0,216,0,216,0,222,0,214,0,0,0,209,0,210,0,0,0,207,0,206,0,185,0,180,0,183,0,172,0,155,0,149,0,144,0,143,0,160,0,153,0,152,0,151,0,113,0,159,0,122,0,125,0,124,0,123,0,94,0,132,0,0,0,118,0,146,0,119,0,0,0,141,0,139,0,100,0,121,0,101,0,115,0,111,0,0,0,134,0,134,0,0,0,131,0,0,0,84,0,14,0,10,0,125,0,107,0,0,0,29,0,1,0,155,1,183,0,187,0,191,0,195,0,199,0,203,0,207,0,211,0,215,0,41,0,219,0,223,0,227,0,231,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,0,4,0,3,0,3,0,4,0,6,0,9,0,6,0,7,0,70,0,69,0,12,0,12,0,70,0,70,0,68,0,62,0,70,0,70,0,70,0,59,0,70,0,63,0,70,0,61,0,70,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,66,0,67,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,64,0,70,0,65,0,3,0,2,0,0,0,6,0,9,0,6,0,8,0,5,0,69,0,12,0,11,0,0,0,60,0,0,0,0,0,13,0,37,0,35,0,38,0,47,0,10,0,0,0,59,0,51,0,49,0,36,0,50,0,46,0,42,0,43,0,41,0,45,0,59,0,59,0,59,0,59,0,23,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,39,0,59,0,59,0,59,0,59,0,23,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,0,0,2,0,1,0,8,0,11,0,60,0,32,0,31,0,0,0,14,0,34,0,48,0,54,0,0,0,40,0,53,0,59,0,59,0,55,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,20,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,15,0,59,0,59,0,59,0,59,0,59,0,33,0,0,0,44,0,56,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,58,0,57,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,52,0,59,0,59,0,59,0,59,0,59,0,22,0,21,0,59,0,59,0,59,0,17,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,16,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,30,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,24,0,59,0,59,0,25,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,18,0,59,0,59,0,59,0,26,0,59,0,59,0,59,0,59,0,59,0,59,0,59,0,27,0,59,0,59,0,28,0,59,0,19,0,59,0,59,0,59,0,59,0,59,0,29,0,59,0,59,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,1,0,0,47,116,109,112,47,109,115,99,103,101,110,88,88,88,88,88,88,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].concat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,2,0,0,80,0,0,0,20,0,0,0,6,0,0,0,0,0,0,0,8,0,0,0,4,0,0,0,6,0,0,0,12,0,0,0,6,0,0,0,0,0,0,0,10,0,0,0,6,0,0,0,12,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,88,80,0,24,45,80,0,176,72,80,0,28,45,80,0,116,72,80,0,196,28,80,0,176,72,80,0,200,28,80,0,20,71,80,0,200,44,80,0,228,70,80,0,204,44,80,0,188,70,80,0,28,61,80,0,0,0,0,0,0,0,0,0,136,70,80,0,188,27,80,0,0,0,0,0,0,0,0,0,104,70,80,0,192,27,80,0,72,70,80,0,196,27,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,79,75,95,82,69,76,95,77,69,84,72,79,68,95,70,82,79,77,0,10,78,111,116,101,58,32,84,104,105,115,32,105,110,112,117,116,32,108,105,110,101,32,99,111,110,116,97,105,110,115,32,39,120,45,39,32,119,104,105,99,104,32,104,97,115,32,115,112,101,99,105,97,108,32,109,101,97,110,105,110,103,32,97,115,32,97,32,10,32,32,32,32,32,32,39,108,111,115,116,32,109,101,115,115,97,103,101,39,32,97,114,99,44,32,98,117,116,32,109,97,121,32,110,111,116,32,104,97,118,101,32,98,101,101,110,32,114,101,99,111,103,110,105,115,101,100,32,97,115,32,115,117,99,104,32,105,102,32,105,116,10,32,32,32,32,32,32,105,115,32,112,114,101,99,101,100,101,100,32,98,121,32,111,116,104,101,114,32,108,101,116,116,101,114,115,32,111,114,32,110,117,109,98,101,114,115,46,32,32,80,108,101,97,115,101,32,117,115,101,32,100,111,117,98,108,101,45,113,117,111,116,101,100,10,32,32,32,32,32,32,115,116,114,105,110,103,115,32,102,111,114,32,116,111,107,101,110,115,32,98,101,102,111,114,101,32,39,120,45,39,44,32,111,114,32,105,110,115,101,114,116,32,97,32,112,114,101,99,101,100,105,110,103,32,119,104,105,116,101,115,112,97,99,101,32,105,102,10,32,32,32,32,32,32,116,104,105,115,32,105,115,32,119,104,97,116,32,121,111,117,32,105,110,116,101,110,100,46,10,0,0,0,0,120,45,0,0,62,32,37,115,10,0,0,0,60,112,97,116,104,32,100,61,34,77,32,37,117,32,37,117,32,65,37,117,44,37,117,32,48,32,48,44,49,32,37,117,44,37,117,34,32,115,116,114,111,107,101,61,34,37,115,34,32,102,105,108,108,61,34,110,111,110,101,34,32,115,116,114,111,107,101,45,100,97,115,104,97,114,114,97,121,61,34,50,44,50,34,47,62,0,0,0,37,115,46,10,0,0,0,0,37,115,0,0,37,99,0,0,112,110,103,0,102,97,116,97,108,32,101,114,114,111,114,32,45,32,115,99,97,110,110,101,114,32,105,110,112,117,116,32,98,117,102,102,101,114,32,111,118,101,114,102,108,111,119,0,84,79,75,95,0,0,0,0,41,32,100,117,112,32,115,116,114,105,110,103,119,105,100,116,104,32,112,111,112,32,110,101,103,32,48,32,114,109,111,118,101,116,111,32,115,104,111,119,10,0,0,0,69,114,114,111,114,32,100,101,116,101,99,116,101,100,32,97,116,32,108,105,110,101,32,37,108,117,58,32,0,0,0,0,115,114,99,69,110,116,105,116,121,32,61,61,32,78,85,76,76,32,38,38,32,100,115,116,69,110,116,105,116,121,32,61,61,32,78,85,76,76,0,0,39,110,111,116,101,39,0,0,39,119,111,114,100,119,114,97,112,97,114,99,115,39,0,0,89,69,76,76,79,87,0,0,84,79,75,95,82,69,76,95,77,69,84,72,79,68,95,84,79,0,0,0,39,97,114,99,115,107,105,112,39,0,0,0,39,97,114,99,103,114,97,100,105,101,110,116,39,0,0,0,39,120,45,39,0,0,0,0,60,112,97,116,104,32,100,61,34,77,32,37,117,32,37,117,32,65,37,117,44,37,117,32,48,32,48,44,49,32,37,117,44,37,117,34,32,115,116,114,111,107,101,61,34,37,115,34,32,102,105,108,108,61,34,110,111,110,101,34,47,62,0,0,39,45,120,39,0,0,0,0,39,97,114,99,116,101,120,116,98,103,99,111,108,111,114,39,0,0,0,0,84,79,75,95,79,67,66,82,65,67,75,69,84,0,0,0,39,116,101,120,116,98,103,99,111,108,111,117,114,39,0,0,78,111,116,101,58,32,45,70,32,111,112,116,105,111,110,32,115,112,101,99,105,102,105,101,100,32,98,117,116,32,105,103,110,111,114,101,100,32,115,105,110,99,101,32,109,115,99,103,101,110,32,119,97,115,32,110,111,116,32,98,117,105,108,116,10,32,32,32,32,32,32,119,105,116,104,32,85,83,69,95,70,82,69,69,84,89,80,69,46,10,0,0,102,97,116,97,108,32,102,108,101,120,32,115,99,97,110,110,101,114,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,45,45,101,110,100,32,111,102,32,98,117,102,102,101,114,32,109,105,115,115,101,100,0,39,114,98,111,120,39,0,0,37,100,32,37,100,32,109,111,118,101,116,111,32,40,0,0,39,97,98,111,120,39,0,0,37,112,58,32,37,115,10,0,39,98,111,120,39,0,0,0,39,119,105,100,116,104,39,0,79,82,65,78,71,69,0,0,84,79,75,95,82,69,76,95,83,73,71,95,70,82,79,77,0,0,0,0,39,42,39,0,39,104,115,99,97,108,101,39,0,0,0,0,39,113,117,111,116,101,100,32,115,116,114,105,110,103,39,0,60,99,105,114,99,108,101,32,102,105,108,108,61,34,37,115,34,32,99,120,61,34,37,117,34,32,99,121,61,34,37,117,34,32,114,61,34,37,117,34,47,62,10,0,39,115,116,114,105,110,103,39,0,0,0,0,99,104,97,114,97,99,116,101,114,115,0,0,39,46,46,46,39,44,32,39,45,45,45,39,0,0,0,0,46,0,0,0,102,108,101,120,32,115,99,97,110,110,101,114,32,112,117,115,104,45,98,97,99,107,32,111,118,101,114,102,108,111,119,0,39,116,101,120,116,99,111,108,111,117,114,39,0,0,0,0,37,100,32,37,100,32,109,111,118,101,116,111,32,115,104,111,119,10,0,0,39,108,105,110,101,99,111,108,111,117,114,39,0,0,0,0,37,112,58,32,37,115,61,37,115,10,0,0,39,105,100,39,0,0,0,0,39,105,100,117,114,108,39,0,82,69,68,0,84,79,75,95,82,69,76,95,83,73,71,95,84,79,0,0,39,117,114,108,39,0,0,0,39,108,97,98,101,108,39,0,39,109,115,99,39,0,0,0,39,59,39,0,60,112,111,108,121,103,111,110,32,102,105,108,108,61,34,37,115,34,32,112,111,105,110,116,115,61,34,37,117,44,37,117,32,37,117,44,37,117,32,37,117,44,37,117,34,47,62,10,0,0,0,0,39,44,39,0,39,61,39,0,37,115,0,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,101,110,115,117,114,101,95,98,117,102,102,101,114,95,115,116,97,99,107,40,41,0,0,0,0,39,58,58,39,0,0,0,0,112,111,112,32,100,117,112,32,110,101,119,112,97,116,104,32,37,100,32,37,100,32,109,111,118,101,116,111,32,48,32,114,108,105,110,101,116,111,32,48,32,37,100,32,114,108,105,110,101,116,111,32,110,101,103,32,48,32,114,108,105,110,101,116,111,32,99,108,111,115,101,112,97,116,104,32,102,105,108,108,10,0,0,0,39,46,46,39,0,0,0,0,60,117,110,107,110,111,119,110,62,0,0,0,39,61,61,39,0,0,0,0,39,45,45,39,0,0,0,0,66,76,65,67,75,0,0,0,84,79,75,95,82,69,76,95,68,79,85,66,76,69,95,70,82,79,77,0,39,60,60,61,39,0,0,0,39,61,62,62,39,0,0,0,39,60,60,39,0,0,0,0,39,62,62,39,0,0,0,0,60,116,101,120,116,32,120,61,34,37,117,34,32,121,61,34,37,117,34,32,116,101,120,116,76,101,110,103,116,104,61,34,37,117,34,32,102,111,110,116,45,102,97,109,105,108,121,61,34,72,101,108,118,101,116,105,99,97,34,32,102,111,110,116,45,115,105,122,101,61,34,37,117,34,32,102,105,108,108,61,34,37,115,34,32,116,101,120,116,45,97,110,99,104,111,114,61,34,109,105,100,100,108,101,34,62,0,0,39,60,61,39,0,0,0,0,39,61,62,39,0,0,0,0,45,111,32,60,102,105,108,101,110,97,109,101,62,32,109,117,115,116,32,98,101,32,115,112,101,99,105,102,105,101,100,32,111,110,32,116,104,101,32,99,111,109,109,97,110,100,32,108,105,110,101,32,105,102,32,45,105,32,105,115,32,110,111,116,32,117,115,101,100,32,111,114,32,105,110,112,117,116,32,105,115,32,102,114,111,109,32,115,116,100,105,110,10,0,0,0,37,115,10,0,39,60,45,39,0,0,0,0,60,108,105,110,101,32,120,49,61,34,37,117,34,32,121,49,61,34,37,117,34,32,120,50,61,34,37,117,34,32,121,50,61,34,37,117,34,32,115,116,114,111,107,101,61,34,37,115,34,47,62,10,0,0,0,0,41,32,100,117,112,32,115,116,114,105,110,103,119,105,100,116,104,10,0,0,39,45,62,39,0,0,0,0,119,111,114,100,119,114,97,112,97,114,99,115,0,0,0,0,39,60,58,39,0,0,0,0,39,58,62,39,0,0,0,0,87,72,73,84,69,0,0,0,39,93,39,0,84,79,75,95,82,69,76,95,68,79,85,66,76,69,95,84,79,0,0,0,39,91,39,0,39,125,39,0,39,123,39,0,42,0,0,0,60,116,101,120,116,32,120,61,34,37,117,34,32,121,61,34,37,117,34,32,116,101,120,116,76,101,110,103,116,104,61,34,37,117,34,32,102,111,110,116,45,102,97,109,105,108,121,61,34,72,101,108,118,101,116,105,99,97,34,32,102,111,110,116,45,115,105,122,101,61,34,37,117,34,32,102,105,108,108,61,34,37,115,34,32,116,101,120,116,45,97,110,99,104,111,114,61,34,101,110,100,34,62,0,84,79,75,95,82,69,76,95,78,79,84,69,0,0,0,0,37,50,53,54,115,0,0,0,84,79,75,95,79,80,84,95,87,79,82,68,87,82,65,80,65,82,67,83,0,0,0,0,45,70,0,0,92,37,111,0,84,79,75,95,65,84,84,82,95,65,82,67,95,83,75,73,80,0,0,0,45,0,0,0,45,112,0,0,70,97,116,97,108,32,101,114,114,111,114,58,32,37,115,10,0,0,0,0,40,0,0,0,92,41,0,0,84,79,75,95,79,80,84,95,65,82,67,71,82,65,68,73,69,78,84,0,45,108,0,0,97,114,99,103,114,97,100,105,101,110,116,0,92,40,0,0,84,79,75,95,82,69,76,95,76,79,83,83,95,70,82,79,77,0,0,0,37,49,48,115,0,0,0,0,37,102,32,37,102,32,37,102,32,115,101,116,114,103,98,99,111,108,111,114,10,0,0,0,84,79,75,95,82,69,76,95,76,79,83,83,95,84,79,0,45,84,0,0,37,120,0,0,47,109,116,114,120,32,109,97,116,114,105,120,32,100,101,102,10,47,101,108,108,105,112,115,101,10,32,32,123,32,47,101,110,100,97,110,103,108,101,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,115,116,97,114,116,97,110,103,108,101,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,121,100,105,97,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,120,100,105,97,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,121,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,120,32,101,120,99,104,32,100,101,102,10,32,32,32,32,47,115,97,118,101,109,97,116,114,105,120,32,109,116,114,120,32,99,117,114,114,101,110,116,109,97,116,114,105,120,32,100,101,102,10,32,32,32,32,120,32,121,32,116,114,97,110,115,108,97,116,101,10,32,32,32,32,120,100,105,97,32,50,32,100,105,118,32,121,100,105,97,32,50,32,100,105,118,32,115,99,97,108,101,10,32,32,32,32,49,32,45,49,32,115,99,97,108,101,10,32,32,32,32,48,32,48,32,49,32,115,116,97,114,116,97,110,103,108,101,32,101,110,100,97,110,103,108,101,32,97,114,99,10,32,32,32,32,115,97,118,101,109,97,116,114,105,120,32,115,101,116,109,97,116,114,105,120,10,125,32,100,101,102,10,0,0,0,84,79,75,95,65,84,84,82,95,65,82,67,95,84,69,88,84,95,66,71,67,79,76,79,85,82,0,0,45,111,0,0,84,79,75,95,67,83,66,82,65,67,75,69,84,0,0,0,48,32,37,100,32,116,114,97,110,115,108,97,116,101,10,0,84,79,75,95,65,84,84,82,95,84,69,88,84,95,66,71,67,79,76,79,85,82,0,0,37,52,48,57,54,115,0,0,49,48,32,115,99,97,108,101,102,111,110,116,10,0,0,0,84,79,75,95,65,82,67,95,82,66,79,88,0,0,0,0,114,111,119,32,60,32,114,111,119,67,111,117,110,116,0,0,37,37,80,97,103,101,58,32,49,32,49,10,0,0,0,0,87,97,114,110,105,110,103,58,32,85,110,114,101,99,111,103,110,105,115,101,100,32,98,111,111,108,101,97,110,32,111,112,116,105,111,110,32,118,97,108,117,101,32,39,37,115,39,46,32,32,86,97,108,105,100,32,118,97,108,117,101,115,32,97,114,101,32,39,116,114,117,101,39,44,10,32,32,32,32,32,32,32,32,32,39,102,97,108,115,101,39,44,32,39,121,101,115,39,44,32,39,110,111,39,44,32,39,111,110,39,44,32,39,111,102,102,39,44,32,39,49,39,32,97,110,100,32,39,48,39,46,10,0,0,0,0,84,79,75,95,65,82,67,95,65,66,79,88,0,0,0,0,87,97,114,110,105,110,103,58,32,78,111,110,45,105,110,116,101,103,101,114,32,97,114,99,115,107,105,112,32,118,97,108,117,101,58,32,37,115,10,0,60,47,116,101,120,116,62,10,0,0,0,0,37,37,80,97,103,101,84,114,97,105,108,101,114,10,0,0,48,0,0,0,84,79,75,95,65,82,67,95,66,79,88,0,37,117,0,0,99,108,105,112,10,0,0,0,111,102,102,0,84,79,75,95,79,80,84,95,87,73,68,84,72,0,0,0,92,110,0,0,85,115,97,103,101,58,32,109,115,99,103,101,110,32,45,84,32,60,116,121,112,101,62,32,91,45,111,32,60,102,105,108,101,62,93,32,91,45,105,93,32,60,105,110,102,105,108,101,62,10,32,32,32,32,32,32,32,109,115,99,103,101,110,32,45,108,10,10,87,104,101,114,101,58,10,32,45,84,32,60,116,121,112,101,62,32,32,32,83,112,101,99,105,102,105,101,115,32,116,104,101,32,111,117,116,112,117,116,32,102,105,108,101,32,116,121,112,101,44,32,119,104,105,99,104,32,109,97,121,98,101,32,111,110,101,32,111,102,32,39,112,110,103,39,44,32,39,101,112,115,39,44,10,32,32,32,32,32,32,32,32,32,32,32,32,32,39,115,118,103,39,32,111,114,32,39,105,115,109,97,112,39,10,32,45,105,32,60,105,110,102,105,108,101,62,32,84,104,101,32,102,105,108,101,32,102,114,111,109,32,119,104,105,99,104,32,116,111,32,114,101,97,100,32,105,110,112,117,116,46,32,32,73,102,32,111,109,105,116,116,101,100,32,111,114,32,115,112,101,99,105,102,105,101,100,32,97,115,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,39,45,39,44,32,105,110,112,117,116,32,119,105,108,108,32,98,101,32,114,101,97,100,32,102,114,111,109,32,115,116,100,105,110,46,32,32,84,104,101,32,39,45,105,39,32,102,108,97,103,32,109,97,121,98,101,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,111,109,105,116,116,101,100,32,105,102,32,60,105,110,102,105,108,101,62,32,105,115,32,115,112,101,99,105,102,105,101,100,32,97,115,32,116,104,101,32,108,97,115,116,32,111,112,116,105,111,110,32,111,110,32,116,104,101,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,99,111,109,109,97,110,100,32,108,105,110,101,46,10,32,45,111,32,60,102,105,108,101,62,32,32,32,87,114,105,116,101,32,111,117,116,112,117,116,32,116,111,32,116,104,101,32,110,97,109,101,100,32,102,105,108,101,46,32,32,84,104,105,115,32,111,112,116,105,111,110,32,109,117,115,116,32,98,101,32,115,112,101,99,105,102,105,101,100,32,105,102,32,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,105,110,112,117,116,32,105,115,32,116,97,107,101,110,32,102,114,111,109,32,115,116,100,105,110,44,32,111,116,104,101,114,119,105,115,101,32,116,104,101,32,111,117,116,112,117,116,32,102,105,108,101,110,97,109,101,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,100,101,102,97,117,108,116,115,32,116,111,32,60,105,110,102,105,108,101,62,46,60,116,121,112,101,62,46,32,32,84,104,105,115,32,109,97,121,32,97,108,115,111,32,98,101,32,115,112,101,99,105,102,105,101,100,32,97,115,32,39,45,39,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,116,111,32,119,114,105,116,101,32,111,117,116,112,117,116,32,100,105,114,101,99,116,108,121,32,116,111,32,115,116,100,111,117,116,46,10,32,45,112,32,32,32,32,32,32,32,32,32,32,80,114,105,110,116,32,112,97,114,115,101,100,32,109,115,99,32,111,117,116,112,117,116,32,40,102,111,114,32,112,97,114,115,101,114,32,100,101,98,117,103,41,46,10,32,45,108,32,32,32,32,32,32,32,32,32,32,68,105,115,112,108,97,121,32,112,114,111,103,114,97,109,32,108,105,99,101,110,99,101,32,97,110,100,32,101,120,105,116,46,10,10,77,115,99,103,101,110,32,118,101,114,115,105,111,110,32,37,115,44,32,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,48,32,77,105,99,104,97,101,108,32,67,32,77,99,84,101,114,110,97,110,44,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,77,105,99,104,97,101,108,46,77,99,84,101,114,110,97,110,46,50,48,48,49,64,99,115,46,98,114,105,115,46,97,99,46,117,107,10,77,115,99,103,101,110,32,99,111,109,101,115,32,119,105,116,104,32,65,66,83,79,76,85,84,69,76,89,32,78,79,32,87,65,82,82,65,78,84,89,46,32,32,84,104,105,115,32,105,115,32,102,114,101,101,32,115,111,102,116,119,97,114,101,44,32,97,110,100,32,121,111,117,32,97,114,101,10,119,101,108,99,111,109,101,32,116,111,32,114,101,100,105,115,116,114,105,98,117,116,101,32,105,116,32,117,110,100,101,114,32,99,101,114,116,97,105,110,32,99,111,110,100,105,116,105,111,110,115,59,32,116,121,112,101,32,96,109,115,99,103,101,110,32,45,108,39,32,102,111,114,10,100,101,116,97,105,108,115,46,10,10,80,78,71,32,114,101,110,100,101,114,105,110,103,32,98,121,32,108,105,98,103,100,44,32,119,119,119,46,108,105,98,103,100,46,111,114,103,10,10,0,0,99,108,111,115,101,112,97,116,104,10,0,0,110,111,0,0,84,79,75,95,65,83,84,69,82,73,83,75,0,0,0,0,45,84,32,60,116,121,112,101,62,32,109,117,115,116,32,98,101,32,115,112,101,99,105,102,105,101,100,32,111,110,32,116,104,101,32,99,111,109,109,97,110,100,32,108,105,110,101,10,0,0,0,0,115,116,97,114,116,67,111,108,32,62,61,32,45,49,32,38,38,32,115,116,97,114,116,67,111,108,32,60,32,40,115,105,103,110,101,100,41,77,115,99,71,101,116,78,117,109,69,110,116,105,116,105,101,115,40,109,41,0,0,0,110,101,119,112,97,116,104,32,37,100,32,37,100,32,109,111,118,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,99,108,111,115,101,112,97,116,104,32,102,105,108,108,10,0,37,117,32,48,32,108,105,110,101,116,111,10,0,0,0,0,102,97,108,115,101,0,0,0,84,79,75,95,79,80,84,95,72,83,67,65,76,69,0,0,115,116,97,114,116,67,111,108,32,62,61,32,48,32,38,38,32,115,116,97,114,116,67,111,108,32,60,32,40,115,105,103,110,101,100,41,77,115,99,71,101,116,78,117,109,69,110,116,105,116,105,101,115,40,109,41,0,0,0,0,119,105,100,116,104,0,0,0,37,117,32,37,117,32,108,105,110,101,116,111,10,0,0,0,49,0,0,0,84,79,75,95,81,83,84,82,73,78,71,0,48,0,0,0,102,97,116,97,108,32,102,108,101,120,32,115])
.concat([99,97,110,110,101,114,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,45,45,110,111,32,97,99,116,105,111,110,32,102,111,117,110,100,0,0,48,32,37,117,32,108,105,110,101,116,111,10,0,0,0,0,111,110,0,0,84,79,75,95,83,84,82,73,78,71,0,0,114,101,99,116,32,37,115,32,37,100,44,37,100,32,37,100,44,37,100,10,0,0,0,0,99,111,108,111,117,114,32,33,61,32,78,85,76,76,0,0,60,112,111,108,121,103,111,110,32,102,105,108,108,61,34,37,115,34,32,112,111,105,110,116,115,61,34,37,117,44,37,117,32,37,117,44,37,117,32,37,117,44,37,117,32,37,117,44,37,117,34,47,62,10,0,0,114,101,97,108,108,111,99,40,41,32,102,97,105,108,101,100,0,0,0,0,48,32,48,32,109,111,118,101,116,111,10,0,121,101,115,0,84,79,75,95,85,78,75,78,79,87,78,0,121,49,32,60,61,32,121,50,0,0,0,0,38,35,120,37,120,59,0,0,84,79,75,95,79,83,66,82,65,67,75,69,84,0,0,0,37,102,32,37,102,32,115,99,97,108,101,10,0,0,0,0,116,114,117,101,0,0,0,0,84,79,75,95,83,80,69,67,73,65,76,95,65,82,67,0,120,49,32,60,61,32,120,50,0,0,0,0,38,97,109,112,59,0,0,0,101,110,100,67,111,108,32,33,61,32,45,49,32,124,124,32,105,115,66,114,111,97,100,99,97,115,116,65,114,99,40,77,115,99,71,101,116,67,117,114,114,101,110,116,65,114,99,68,101,115,116,40,109,41,41,0,37,37,37,37,69,110,100,67,111,109,109,101,110,116,115,10,0,0,0,0,10,65,114,99,32,108,105,115,116,32,40,37,100,32,97,114,99,115,41,10,0,0,0,0,84,79,75,95,65,84,84,82,95,84,69,88,84,95,67,79,76,79,85,82,0,0,0,0,69,114,114,111,114,32,100,101,116,101,99,116,101,100,32,97,116,32,108,105,110,101,32,37,117,58,32,85,110,107,110,111,119,110,32,115,111,117,114,99,101,32,101,110,116,105,116,121,32,39,37,115,39,46,10,0,38,113,117,111,116,59,0,0,48,46,50,49,0,0,0,0,69,110,116,105,116,121,32,108,105,115,116,32,40,37,100,32,101,110,116,105,116,105,101,115,44,32,37,100,32,112,97,114,97,108,108,101,108,41,10,0,84,79,75,95,65,84,84,82,95,76,73,78,69,95,67,79,76,79,85,82,0,0,0,0,115,116,97,114,116,67,111,108,32,33,61,32,45,49,0,0,38,103,116,59,0,0,0,0,60,116,101,120,116,32,120,61,34,37,117,34,32,121,61,34,37,117,34,32,116,101,120,116,76,101,110,103,116,104,61,34,37,117,34,32,102,111,110,116,45,102,97,109,105,108,121,61,34,72,101,108,118,101,116,105,99,97,34,32,102,111,110,116,45,115,105,122,101,61,34,37,117,34,32,102,105,108,108,61,34,37,115,34,62,0,0,0,37,37,37,37,67,114,101,97,116,111,114,58,32,109,115,99,103,101,110,32,37,115,10,0,79,112,116,105,111,110,32,108,105,115,116,32,40,37,100,32,111,112,116,105,111,110,115,41,10,0,0,0,84,79,75,95,65,84,84,82,95,73,68,0,114,111,119,32,62,32,48,0,38,108,116,59,0,0,0,0,109,97,105,110,46,99,0,0,110,101,119,112,97,116,104,32,37,100,32,37,100,32,109,111,118,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,115,116,114,111,107,101,10,0,0,0,37,37,33,80,83,45,65,100,111,98,101,45,51,46,48,32,69,80,83,70,45,50,46,48,10,37,37,37,37,66,111,117,110,100,105,110,103,66,111,120,58,32,48,32,48,32,37,46,48,102,32,37,46,48,102,10,0,0,0,0,97,114,99,115,107,105,112,0,84,79,75,95,65,84,84,82,95,73,68,85,82,76,0,0,85,110,114,101,99,111,103,110,105,115,101,100,32,111,112,116,105,111,110,32,39,37,115,39,10,0,0,0,103,114,101,101,110,0,0,0,32,37,51,117,58,32,109,105,110,61,37,117,32,97,114,99,108,105,110,101,121,61,37,117,32,109,97,120,61,37,117,32,109,97,120,84,101,120,116,76,105,110,101,115,61,37,117,10,0,0,0,0,77,115,99,103,101,110,44,32,97,32,109,101,115,115,97,103,101,32,115,101,113,117,101,110,99,101,32,99,104,97,114,116,32,114,101,110,100,101,114,101,114,46,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,48,32,77,105,99,104,97,101,108,32,67,32,77,99,84,101,114,110,97,110,44,32,77,105,99,104,97,101,108,46,77,99,84,101,114,110,97,110,46,50,48,48,49,64,99,115,46,98,114,105,115,46,97,99,46,117,107,10,10,84,84,80,67,111,109,32,76,116,100,46,44,32,104,101,114,101,98,121,32,100,105,115,99,108,97,105,109,115,32,97,108,108,32,99,111,112,121,114,105,103,104,116,32,105,110,116,101,114,101,115,116,32,105,110,32,116,104,101,32,112,114,111,103,114,97,109,32,96,109,115,99,103,101,110,39,10,40,119,104,105,99,104,32,114,101,110,100,101,114,115,32,109,101,115,115,97,103,101,32,115,101,113,117,101,110,99,101,32,99,104,97,114,116,115,41,32,119,114,105,116,116,101,110,32,98,121,32,77,105,99,104,97,101,108,32,77,99,84,101,114,110,97,110,46,10,10,82,111,98,32,77,101,97,100,101,115,32,111,102,32,84,84,80,67,111,109,32,76,116,100,44,32,49,32,65,117,103,117,115,116,32,50,48,48,53,10,82,111,98,32,77,101,97,100,101,115,44,32,100,105,114,101,99,116,111,114,32,111,102,32,83,111,102,116,119,97,114,101,10,10,84,104,105,115,32,112,114,111,103,114,97,109,32,105,115,32,102,114,101,101,32,115,111,102,116,119,97,114,101,59,32,121,111,117,32,99,97,110,32,114,101,100,105,115,116,114,105,98,117,116,101,32,105,116,32,97,110,100,47,111,114,32,109,111,100,105,102,121,10,105,116,32,117,110,100,101,114,32,116,104,101,32,116,101,114,109,115,32,111,102,32,116,104,101,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,32,97,115,32,112,117,98,108,105,115,104,101,100,32,98,121,10,116,104,101,32,70,114,101,101,32,83,111,102,116,119,97,114,101,32,70,111,117,110,100,97,116,105,111,110,59,32,101,105,116,104,101,114,32,118,101,114,115,105,111,110,32,50,32,111,102,32,116,104,101,32,76,105,99,101,110,115,101,44,32,111,114,10,40,97,116,32,121,111,117,114,32,111,112,116,105,111,110,41,32,97,110,121,32,108,97,116,101,114,32,118,101,114,115,105,111,110,46,10,10,84,104,105,115,32,112,114,111,103,114,97,109,32,105,115,32,100,105,115,116,114,105,98,117,116,101,100,32,105,110,32,116,104,101,32,104,111,112,101,32,116,104,97,116,32,105,116,32,119,105,108,108,32,98,101,32,117,115,101,102,117,108,44,10,98,117,116,32,87,73,84,72,79,85,84,32,65,78,89,32,87,65,82,82,65,78,84,89,59,32,119,105,116,104,111,117,116,32,101,118,101,110,32,116,104,101,32,105,109,112,108,105,101,100,32,119,97,114,114,97,110,116,121,32,111,102,10,77,69,82,67,72,65,78,84,65,66,73,76,73,84,89,32,111,114,32,70,73,84,78,69,83,83,32,70,79,82,32,65,32,80,65,82,84,73,67,85,76,65,82,32,80,85,82,80,79,83,69,46,32,32,83,101,101,32,116,104,101,10,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,32,102,111,114,32,109,111,114,101,32,100,101,116,97,105,108,115,46,10,10,89,111,117,32,115,104,111,117,108,100,32,104,97,118,101,32,114,101,99,101,105,118,101,100,32,97,32,99,111,112,121,32,111,102,32,116,104,101,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,10,97,108,111,110,103,32,119,105,116,104,32,116,104,105,115,32,112,114,111,103,114,97,109,59,32,105,102,32,110,111,116,44,32,119,114,105,116,101,32,116,111,32,116,104,101,32,70,114,101,101,32,83,111,102,116,119,97,114,101,10,70,111,117,110,100,97,116,105,111,110,44,32,73,110,99,46,44,32,53,49,32,70,114,97,110,107,108,105,110,32,83,116,44,32,70,105,102,116,104,32,70,108,111,111,114,44,32,66,111,115,116,111,110,44,32,77,65,32,48,50,49,49,48,45,49,51,48,49,44,32,85,83,65,10,0,0,0,0,80,115,73,110,105,116,58,32,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,111,117,116,112,117,116,32,102,105,108,101,32,39,37,115,39,58,32,37,115,10,0,0,0,0,98,105,97,114,114,111,119,115,0,0,0,0,84,79,75,95,65,84,84,82,95,85,82,76,0,0,0,0,65,81,85,65,0,0,0,0,115,116,114,100,117,112,40,41,32,102,97,105,108,101,100,0,45,105,0,0,114,101,100,0,73,110,118,97,108,105,100,32,111,114,32,117,110,112,97,114,115,97,98,108,101,32,112,97,114,97,109,101,116,101,114,32,116,111,32,111,112,116,105,111,110,32,39,37,115,39,10,0,10,82,111,119,32,104,101,105,103,104,116,115,58,10,0,0,91,93,32,48,32,115,101,116,100,97,115,104,10,0,0,0,119,98,0,0,110,111,97,114,114,111,119,115,0,0,0,0,84,79,75,95,65,84,84,82,95,76,65,66,69,76,0,0,70,85,67,72,83,73,65,0,98,108,117,101,0,0,0,0,104,115,99,97,108,101,0,0,70,97,105,108,101,100,32,116,111,32,99,114,101,97,116,101,32,111,117,116,112,117,116,32,99,111,110,116,101,120,116,10,0,0,0,0,45,0,0,0,97,114,99,116,101,120,116,98,103,99,111,108,111,117,114,0,84,79,75,95,77,83,67,0,84,69,65,76,0,0,0,0,98,108,97,99,107,0,0,0,47,100,101,118,47,110,117,108,108,0,0,0,115,101,116,102,111,110,116,10,0,0,0,0,97,114,99,116,101,120,116,99,111,108,111,117,114,0,0,0,84,79,75,95,83,69,77,73,67,79,76,79,78,0,0,0,80,85,82,80,76,69,0,0,66,117,105,108,116,32,119,105,116,104,32,82,69,77,79,86,69,95,80,78,71,95,79,85,80,85,84,59,32,80,78,71,32,111,117,116,112,117,116,32,105,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,119,104,105,116,101,0,0,0,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,111,117,116,112,117,116,32,102,105,108,101,32,39,37,115,39,58,32,37,115,10,0,0,0,0,37,100,32,115,99,97,108,101,102,111,110,116,10,0,0,0,97,114,99,108,105,110,101,99,111,108,111,117,114,0,0,0,84,79,75,95,67,79,77,77,65,0,0,0,78,65,86,89,0,0,0,0,60,115,118,103,32,118,101,114,115,105,111,110,61,34,49,46,49,34,10,32,119,105,100,116,104,61,34,37,117,112,120,34,32,104,101,105,103,104,116,61,34,37,117,112,120,34,10,32,118,105,101,119,66,111,120,61,34,48,32,48,32,37,117,32,37,117,34,10,32,120,109,108,110,115,61,34,104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,50,48,48,48,47,115,118,103,34,32,115,104,97,112,101,45,114,101,110,100,101,114,105,110,103,61,34,99,114,105,115,112,69,100,103,101,115,34,10,32,115,116,114,111,107,101,45,119,105,100,116,104,61,34,49,34,32,116,101,120,116,45,114,101,110,100,101,114,105,110,103,61,34,103,101,111,109,101,116,114,105,99,80,114,101,99,105,115,105,111,110,34,62,10,0,0,0,0,84,79,75,95,67,67,66,82,65,67,75,69,84,0,0,0,119,0,0,0,47,72,101,108,118,101,116,105,99,97,32,102,105,110,100,102,111,110,116,10,0,0,0,0,116,101,120,116,98,103,99,111,108,111,117,114,0,0,0,0,84,79,75,95,69,81,85,65,76,0,0,0,77,65,82,79,79,78,0,0,60,33,68,79,67,84,89,80,69,32,115,118,103,32,80,85,66,76,73,67,32,34,45,47,47,87,51,67,47,47,68,84,68,32,83,86,71,32,49,46,49,47,47,69,78,34,10,32,34,104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,71,114,97,112,104,105,99,115,47,83,86,71,47,49,46,49,47,68,84,68,47,115,118,103,49,49,46,100,116,100,34,62,10,0,0,0,0,87,97,114,110,105,110,103,58,32,79,112,116,105,111,110,97,108,32,85,84,70,45,56,32,98,121,116,101,45,111,114,100,101,114,45,109,97,114,107,32,100,101,116,101,99,116,101,100,32,97,116,32,115,116,97,114,116,32,111,102,32,105,110,112,117,116,44,32,98,117,116,32,109,115,99,103,101,110,10,32,32,32,32,32,32,32,32,32,119,97,115,32,110,111,116,32,99,111,110,102,105,103,117,114,101,100,32,116,111,32,117,115,101,32,70,114,101,101,84,121,112,101,32,102,111,114,32,116,101,120,116,32,114,101,110,100,101,114,105,110,103,46,32,32,82,101,110,100,101,114,105,110,103,32,111,102,10,32,32,32,32,32,32,32,32,32,85,84,70,45,56,32,99,104,97,114,97,99,116,101,114,115,32,105,110,32,80,78,71,32,111,117,116,112,117,116,32,109,97,121,32,98,101,32,105,110,99,111,114,114,101,99,116,46,10,0,48,0,0,0,116,101,120,116,99,111,108,111,117,114,0,0,84,79,75,95,82,69,76,95,68,79,85,66,76,69,0,0,79,76,73,86,69,0,0,0,83,118,103,73,110,105,116,58,32,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,111,117,116,112,117,116,32,102,105,108,101,32,39,37,115,39,58,32,37,115,10,0,0,0,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,105,110,112,117,116,32,102,105,108,101,32,39,37,115,39,10,0,99,111,108,32,33,61,32,65,68,82,65,87,95,67,79,76,95,73,78,86,65,76,73,68,0,0,0,0,108,105,110,101,99,111,108,111,117,114,0,0,84,79,75,95,82,69,76,95,82,69,84,86,65,76,0,0,71,82,65,89,0,0,0,0,119,98,0,0,114,0,0,0,60,108,105,110,101,32,120,49,61,34,37,117,34,32,121,49,61,34,37,117,34,32,120,50,61,34,37,117,34,32,121,50,61,34,37,117,34,32,115,116,114,111,107,101,61,34,37,115,34,32,115,116,114,111,107,101,45,100,97,115,104,97,114,114,97,121,61,34,50,44,50,34,47,62,10,0,112,115,95,111,117,116,46,99,0,0,0,0,105,100,117,114,108,0,0,0,84,79,75,95,82,69,76,95,77,69,84,72,79,68,0,0,76,73,77,69,0,0,0,0,84,79,75,95,82,69,76,95,83,73,71,0,109,115,99,46,99,0,0,0,45,0,0,0,115,116,114,105,110,103,0,0,97,116,116,114,118,97,108,0,85,110,107,110,111,119,110,32,111,117,116,112,117,116,32,102,111,114,109,97,116,32,39,37,115,39,10,0,97,116,116,114,0,0,0,0,97,116,116,114,108,105,115,116,0,0,0,0,110,101,119,112,97,116,104,32,37,100,32,37,100,32,37,100,32,37,100,32,37,100,32,37,100,32,101,108,108,105,112,115,101,32,115,116,114,111,107,101,10,0,0,0,114,101,108,97,116,105,111,110,95,102,114,111,109,0,0,0,105,100,0,0,114,101,108,97,116,105,111,110,95,116,111,0,114,101,108,97,116,105,111,110,95,98,105,0,83,73,76,86,69,82,0,0,84,79,75,95,82,69,76,95,67,65,76,76,66,65,67,75,95,70,82,79,77,0,0,0,114,101,108,97,116,105,111,110,95,108,105,110,101,0,0,0,114,101,108,97,116,105,111,110,95,98,111,120,0,0,0,0,97,114,99,114,101,108,0,0,60,47,115,118,103,62,10,0,97,114,99,0,97,114,99,108,105,115,116,0,109,107,115,116,101,109,112,40,41,32,102,97,105,108,101,100,0,0,0,0,101,110,116,105,116,121,0,0,48,46,50,49,0,0,0,0,101,110,116,105,116,121,108,105,115,116,0,0,110,101,119,112,97,116,104,32,37,100,32,37,100,32,37,100,32,48,32,51,54,48,32,97,114,99,32,99,108,111,115,101,112,97,116,104,32,102,105,108,108,10,0,0,111,112,116,118,97,108,0,0,117,114,108,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,95,99,114,101,97,116,101,95,98,117,102,102,101,114,40,41,0,111,112,116,0,111,112,116,108,105,115,116,0,86,73,79,76,69,84,0,0,84,79,75,95,82,69,76,95,67,65,76,76,66,65,67,75,95,84,79,0,109,97,108,108,111,99,40,41,32,102,97,105,108,101,100,0,109,115,99,0,36,97,99,99,101,112,116,0,69,114,114,111,114,32,100,101,116,101,99,116,101,100,32,97,116,32,108,105,110,101,32,37,117,58,32,85,110,107,110,111,119,110,32,100,101,115,116,105,110,97,116,105,111,110,32,101,110,116,105,116,121,32,39,37,115,39,46,10,0,0,0,0,84,79,75,95,82,69,76,95,82,66,79,88,0,0,0,0,48,0,0,0,84,79,75,95,82,69,76,95,65,66,79,88,0,0,0,0,84,79,75,95,82,69,76,95,66,79,88,0,83,119,105,116,99,104,32,39,37,115,39,32,114,101,113,117,105,114,101,115,32,97,32,112,97,114,97,109,101,116,101,114,10,0,0,0,91,50,93,32,48,32,115,101,116,100,97,115,104,10,0,0,84,79,75,95,82,69,76,95,67,65,76,76,66,65,67,75,95,66,73,0,105,115,109,97,112,0,0,0,84,79,75,95,82,69,76,95,68,79,85,66,76,69,95,66,73,0,0,0,110,101,119,112,97,116,104,32,37,100,32,37,100,32,109,111,118,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,37,100,32,37,100,32,108,105,110,101,116,111,32,99,108,111,115,101,112,97,116,104,32,102,105,108,108,10,0,0,84,79,75,95,82,69,76,95,82,69,84,86,65,76,95,66,73,0,0,0,108,97,98,101,108,0,0,0,84,79,75,95,82,69,76,95,77,69,84,72,79,68,95,66,73,0,0,0,84,79,75,95,82,69,76,95,83,73,71,95,66,73,0,0,73,78,68,73,71,79,0,0,84,79,75,95,82,69,76,95,82,69,84,86,65,76,95,70,82,79,77,0,84,79,75,95,65,84,84,82,95,65,82,67,95,84,69,88,84,95,67,79,76,79,85,82,0,0,0,0,84,79,75,95,65,84,84,82,95,65,82,67,95,76,73,78,69,95,67,79,76,79,85,82,0,0,0,0,36,117,110,100,101,102,105,110,101,100,0,0,115,118,103,95,111,117,116,46,99,0,0,0,101,114,114,111,114,0,0,0,36,101,110,100,0,0,0,0,110,101,119,72,101,97,100,0,115,121,110,116,97,120,32,101,114,114,111,114,44,32,117,110,101,120,112,101,99,116,101,100,32,37,115,44,32,101,120,112,101,99,116,105,110,103,32,37,115,32,111,114,32,37,115,32,111,114,32,37,115,32,111,114,32,37,115,0,115,118,103,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,95,103,101,116,95,110,101,120,116,95,98,117,102,102,101,114,40,41,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,44,32,117,110,101,120,112,101,99,116,101,100,32,37,115,44,32,101,120,112,101,99,116,105,110,103,32,37,115,32,111,114,32,37,115,32,111,114,32,37,115,0,0,0,37,100,32,37,100,32,109,111,118,101,116,111,32,100,117,112,32,115,116,114,105,110,103,119,105,100,116,104,32,112,111,112,32,50,32,100,105,118,32,110,101,103,32,48,32,114,109,111,118,101,116,111,32,115,104,111,119,10,0,0,115,121,110,116,97,120,32,101,114,114,111,114,44,32,117,110,101,120,112,101,99,116,101,100,32,37,115,44,32,101,120,112,101,99,116,105,110,103,32,37,115,32,111,114,32,37,115,0,32,32,37,115,32,61,32,37,115,10,0,0,115,121,110,116,97,120,32,101,114,114,111,114,44,32,117,110,101,120,112,101,99,116,101,100,32,37,115,44,32,101,120,112,101,99,116,105,110,103,32,37,115,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,44,32,117,110,101,120,112,101,99,116,101,100,32,37,115,0,66,76,85,69,0,0,0,0,84,79,75,95,82,69,76,95,82,69,84,86,65,76,95,84,79,0,0,0,68,101,108,101,116,105,110,103,0,0,0,0,67,108,101,97,110,117,112,58,32,112,111,112,112,105,110,103,0,0,0,0,67,108,101,97,110,117,112,58,32,100,105,115,99,97,114,100,105,110,103,32,108,111,111,107,97,104,101,97,100,0,0,0,35,37,48,54,88,0,0,0,109,101,109,111,114,121,32,101,120,104,97,117,115,116,101,100,0,0,0,0,69,114,114,111,114,58,32,112,111,112,112,105,110,103,0,0,69,114,114,111,114,58,32,100,105,115,99,97,114,100,105,110,103,0,0,0,101,112,115,0,105,110,112,117,116,32,105,110,32,102,108,101,120,32,115,99,97,110,110,101,114,32,102,97,105,108,101,100,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,112,111,112,32,100,117,112,32,100,117,112,32,110,101,119,112,97,116,104,32,37,100,32,37,100,32,109,111,118,101,116,111,32,50,32,100,105,118,32,110,101,103,32,48,32,114,109,111,118,101,116,111,32,48,32,114,108,105,110,101,116,111,32,48,32,37,100,32,114,108,105,110,101,116,111,32,110,101,103,32,48,32,114,108,105,110,101,116,111,32,99,108,111,115,101,112,97,116,104,32,102,105,108,108,10,0,0,0,42,0,0,0,37,112,58,32,39,37,115,39,32,45,62,32,39,37,115,39,10,0,0,0,116,114,117,101,0,0,0,0,46,10,0,0,71,82,69,69,78,0,0,0,111,117,116,67,111,110,116,101,120,116,0,0,97,100,114,97,119,46,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,109,97,105,110,0,0,0,0,105,115,109,97,112,82,101,99,116,0,0,0,99,111,109,112,117,116,101,76,97,98,101,108,76,105,110,101,115,0,0,0,99,111,109,112,117,116,101,67,97,110,118,97,115,83,105,122,101,0,0,0,97,114,114,111,119,82,0,0,97,114,114,111,119,76,0,0,97,114,99,66,111,120,0,0,83,118,103,83,101,116,70,111,110,116,83,105,122,101,0,0,80,115,83,101,116,80,101,110,0,0,0,0,80,115,83,101,116,70,111,110,116,83,105,122,101,0,0,0,77,115,99,76,105,110,107,79,112,116,0,0,77,115,99,76,105,110,107,65,116,116,114,105,98,0,0,0,77,115,99,71,101,116,69,110,116,105,116,121,73,110,100,101,120,0,0,0,77,115,99,65,108,108,111,99,65,114,99,0,65,68,114,97,119,79,112,101,110,0,0,0,65,68,114,97,119,71,101,116,67,111,108,111,117,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,2,0,0,11,2,0,0,206,2,0,0,49,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,22,1,0,0,22,1,0,0,99,1,0,0,44,2,0,0,44,2,0,0,121,3,0,0,155,2,0,0,222,0,0,0,77,1,0,0,77,1,0,0,133,1,0,0,72,2,0,0,22,1,0,0,77,1,0,0,22,1,0,0,22,1,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,22,1,0,0,22,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,44,2,0,0,247,3,0,0,155,2,0,0,155,2,0,0,210,2,0,0,210,2,0,0,155,2,0,0,99,2,0,0,10,3,0,0,210,2,0,0,22,1,0,0,244,1,0,0,155,2,0,0,44,2,0,0,65,3,0,0,210,2,0,0,10,3,0,0,155,2,0,0,10,3,0,0,210,2,0,0,155,2,0,0,99,2,0,0,210,2,0,0,155,2,0,0,176,3,0,0,155,2,0,0,155,2,0,0,99,2,0,0,22,1,0,0,22,1,0,0,22,1,0,0,213,1,0,0,44,2,0,0,222,0,0,0,44,2,0,0,44,2,0,0,244,1,0,0,44,2,0,0,44,2,0,0,22,1,0,0,44,2,0,0,44,2,0,0,222,0,0,0,222,0,0,0,244,1,0,0,222,0,0,0,65,3,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,77,1,0,0,244,1,0,0,22,1,0,0,44,2,0,0,244,1,0,0,210,2,0,0,244,1,0,0,244,1,0,0,244,1,0,0,78,1,0,0,4,1,0,0,78,1,0,0,72,2,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,77,1,0,0,44,2,0,0,44,2,0,0,167,0,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,191,0,0,0,77,1,0,0,44,2,0,0,77,1,0,0,77,1,0,0,244,1,0,0,244,1,0,0,255,255,255,255,44,2,0,0,44,2,0,0,44,2,0,0,22,1,0,0,255,255,255,255,25,2,0,0,94,1,0,0,222,0,0,0,77,1,0,0,77,1,0,0,44,2,0,0,232,3,0,0,232,3,0,0,255,255,255,255,99,2,0,0,255,255,255,255,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,255,255,255,255,77,1,0,0,77,1,0,0,255,255,255,255,77,1,0,0,77,1,0,0,77,1,0,0,232,3,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,232,3,0,0,255,255,255,255,114,1,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,44,2,0,0,10,3,0,0,232,3,0,0,109,1,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,121,3,0,0,255,255,255,255,255,255,255,255,255,255,255,255,22,1,0,0,255,255,255,255,255,255,255,255,222,0,0,0,99,2,0,0,176,3,0,0,99,2,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,206,2,0,0,11,2,0,0,206,2,0,0,49,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,22,1,0,0,22,1,0,0,99,1,0,0,44,2,0,0,44,2,0,0,121,3,0,0,155,2,0,0,222,0,0,0,77,1,0,0,77,1,0,0,133,1,0,0,72,2,0,0,22,1,0,0,77,1,0,0,22,1,0,0,22,1,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,22,1,0,0,22,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,44,2,0,0,247,3,0,0,155,2,0,0,155,2,0,0,210,2,0,0,210,2,0,0,155,2,0,0,99,2,0,0,10,3,0,0,210,2,0,0,22,1,0,0,244,1,0,0,155,2,0,0,44,2,0,0,65,3,0,0,210,2,0,0,10,3,0,0,155,2,0,0,10,3,0,0,210,2,0,0,155,2,0,0,99,2,0,0,210,2,0,0,155,2,0,0,176,3,0,0,155,2,0,0,155,2,0,0,99,2,0,0,22,1,0,0,22,1,0,0,22,1,0,0,213,1,0,0,44,2,0,0,222,0,0,0,44,2,0,0,44,2,0,0,244,1,0,0,44,2,0,0,44,2,0,0,22,1,0,0,44,2,0,0,44,2,0,0,222,0,0,0,222,0,0,0,244,1,0,0,222,0,0,0,65,3,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,77,1,0,0,244,1,0,0,22,1,0,0,44,2,0,0,244,1,0,0,210,2,0,0,244,1,0,0,244,1,0,0,244,1,0,0,78,1,0,0,4,1,0,0,78,1,0,0,72,2,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,77,1,0,0,44,2,0,0,44,2,0,0,167,0,0,0,44,2,0,0,44,2,0,0,44,2,0,0,44,2,0,0,191,0,0,0,77,1,0,0,44,2,0,0,77,1,0,0,77,1,0,0,244,1,0,0,244,1,0,0,255,255,255,255,44,2,0,0,44,2,0,0,44,2,0,0,22,1,0,0,255,255,255,255,25,2,0,0,94,1,0,0,222,0,0,0,77,1,0,0,77,1,0,0,44,2,0,0,232,3,0,0,232,3,0,0,255,255,255,255,99,2,0,0,255,255,255,255,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,77,1,0,0,255,255,255,255,77,1,0,0,77,1,0,0,255,255,255,255,77,1,0,0,77,1,0,0,77,1,0,0,232,3,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,232,3,0,0,255,255,255,255,114,1,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,44,2,0,0,10,3,0,0,232,3,0,0,109,1,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,121,3,0,0,255,255,255,255,255,255,255,255,255,255,255,255,22,1,0,0,255,255,255,255,255,255,255,255,222,0,0,0,99,2,0,0,176,3,0,0,99,2,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,160,69,80,0,255,255,255,0,8,68,80,0,0,0,0,0,228,66,80,0,0,0,255,0,224,65,80,0,0,176,255,0,88,64,80,0,0,255,255,0,8,100,80,0,0,255,0,0,168,98,80,0,255,0,0,0,188,96,80,0,136,0,68,0,48,95,80,0,144,32,208,0,52,94,80,0,192,192,192,0,124,93,80,0,0,255,0,0,252,92,80,0,128,128,128,0,108,92,80,0,0,128,128,0,4,91,80,0,0,0,128,0,244,89,80,0,128,0,0,0,84,89,80,0,128,0,128,0,12,89,80,0,128,128,0,0,180,88,80,0,255,0,255,0,36,88,80,0,255,255,0,0])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],checkStreams:function () {
        for (var i in FS.streams) if (FS.streams.hasOwnProperty(i)) assert(i >= 0 && i < FS.streams.length); // no keys not in dense span
        for (var i = 0; i < FS.streams.length; i++) assert(typeof FS.streams[i] == 'object'); // no non-null holes in dense span
      },ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        FS.checkStreams();
        assert(FS.streams.length < 1024); // at this early stage, we should not have a large set of file descriptors - just a few
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function __isFloat(text) {
      return !!(/^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.exec(text));
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[' '] = 1;
        __scanString.whiteSpace['\t'] = 1;
        __scanString.whiteSpace['\n'] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        // TODO: Support strings like "%5c" etc.
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'c') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          fields++;
          next = get();
          HEAP8[(argPtr)]=next
          formatIndex += 2;
          continue;
        }
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if(format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' || type == 'E') {
            var last = 0;
            next = get();
            while (next > 0) {
              buffer.push(String.fromCharCode(next));
              if (__isFloat(buffer.join(''))) {
                last = buffer.length;
              }
              next = get();
            }
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   (type === 'x' && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if(longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,Math.min(Math.floor((parseInt(text, 10))/4294967296), 4294967295)>>>0],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'f':
            case 'e':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                (HEAPF64[(tempDoublePtr)>>3]=parseFloat(text),HEAP32[((argPtr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((argPtr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)])
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex] in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      var get = function() { return HEAP8[(((s)+(index++))|0)]; };
      var unget = function() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }function _strncasecmp(px, py, n) {
      px = px|0; py = py|0; n = n|0;
      var i = 0, x = 0, y = 0;
      while ((i>>>0) < (n>>>0)) {
        x = _tolower(HEAP8[(((px)+(i))|0)]);
        y = _tolower(HEAP8[(((py)+(i))|0)]);
        if (((x|0) == (y|0)) & ((x|0) == 0)) return 0;
        if ((x|0) == 0) return -1;
        if ((y|0) == 0) return 1;
        if ((x|0) == (y|0)) {
          i = (i + 1)|0;
          continue;
        } else {
          return ((x>>>0) > (y>>>0) ? 1 : -1)|0;
        }
      }
      return 0;
    }function _strcasecmp(px, py) {
      px = px|0; py = py|0;
      return _strncasecmp(px, py, -1)|0;
    }
  function _round(x) {
      return (x < 0) ? -Math.round(-x) : Math.round(x);
    }
  var _cos=Math.cos;
  var _sin=Math.sin;
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _strncat(pdest, psrc, num) {
      var len = _strlen(pdest);
      var i = 0;
      while(1) {
        HEAP8[((pdest+len+i)|0)]=HEAP8[((psrc+i)|0)];
        if (HEAP8[(((pdest)+(len+i))|0)] == 0) break;
        i ++;
        if (i == num) {
          HEAP8[(((pdest)+(len+i))|0)]=0
          break;
        }
      }
      return pdest;
    }
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      FS.checkStreams();
      return id;
    }function _creat(path, mode) {
      // int creat(const char *path, mode_t mode);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/creat.html
      return _open(path, 1 | 512 | 1024, allocate([mode, 0, 0, 0], 'i32', ALLOC_STACK));
    }function _mkstemp(template) {
      if (!_mkstemp.counter) _mkstemp.counter = 0;
      var c = (_mkstemp.counter++).toString();
      var rep = 'XXXXXX';
      while (c.length < rep.length) c = '0' + c;
      writeArrayToMemory(intArrayFromString(c), template + Pointer_stringify(template).indexOf(rep));
      return _creat(template, 0600);
    }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }function _perror(s) {
      // void perror(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/perror.html
      var stdout = HEAP32[((_stdout)>>2)];
      if (s) {
        _fputs(s, stdout);
        _fputc(58, stdout);
        _fputc(32, stdout);
      }
      var errnum = HEAP32[((___errno_location())>>2)];
      _puts(_strerror(errnum));
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }
  function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  var ___errno=___errno_location;
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    }
  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (!path.object.write) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        delete path.parentObject.contents[path.name];
        return 0;
      }
    }
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      _memcpy(newStr, ptr, len);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
  function _isatty(fildes) {
      // int isatty(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/isatty.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      if (FS.streams[fildes].isTerminal) return 1;
      ___setErrNo(ERRNO_CODES.ENOTTY);
      return 0;
    }
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      if (!FS.streams[stream]) return -1;
      var streamObj = FS.streams[stream];
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _read(stream, _fgetc.ret, 1);
      if (ret == 0) {
        streamObj.eof = true;
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      return Number(FS.streams[stream] && FS.streams[stream].error);
    }
  function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      if (FS.streams[stream]) FS.streams[stream].error = false;
    }
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_SvgFilledCircle,0,_NullTextWidth,0,_SvgArc,0,_SvgSetPen,0,_SvgTextHeight
,0,_SvgTextWidth,0,_NullLine,0,_NullFilledRectangle,0,_PsClose,0,_PsFilledTriangle
,0,_SvgTextL,0,_SvgSetBgPen,0,_SvgFilledRectangle,0,_SvgTextC,0,_PsTextWidth
,0,_SvgTextR,0,_SvgLine,0,_PsLine,0,_PsTextL,0,_PsTextR
,0,_SvgFilledTriangle,0,_deleteTmp,0,_NullFilledTriangle,0,_PsTextHeight,0,_NullTextC
,0,_PsTextC,0,_NullArc,0,_PsSetPen,0,_NullTextL,0,_PsDottedArc
,0,_NullTextR,0,_PsSetBgPen,0,_PsDottedLine,0,_PsSetFontSize,0,_SvgSetFontSize
,0,_NullTextHeight,0,_SvgDottedLine,0,_PsArc,0,_NullSetPen,0,_PsFilledCircle
,0,_PsFilledRectangle,0,_NullDottedArc,0,_NullDottedLine,0,_NullSetFontSize,0,_SvgDottedArc,0,_SvgClose,0,_NullClose,0];
// EMSCRIPTEN_START_FUNCS
function _ADrawComputeArcPoint($cx, $cy, $w, $h, $degrees, $x, $y) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  var $rad;
  $1=$cx;
  $2=$cy;
  $3=$w;
  $4=$h;
  $5=$degrees;
  $6=$x;
  $7=$y;
  var $8=$5;
  var $9=$8;
  var $10=($9)*(3.141592653589793);
  var $11=($10)/(180);
  var $12=$11;
  $rad=$12;
  var $13=$1;
  var $14=$13;
  var $15=$3;
  var $16=($15)/(2);
  var $17=$16;
  var $18=$rad;
  var $19=$18;
  var $20=Math.cos($19);
  var $21=($17)*($20);
  var $22=($14)+($21);
  var $23=_round($22);
  var $24=($23>=0 ? Math.floor($23) : Math.ceil($23));
  var $25=$6;
  HEAP32[(($25)>>2)]=$24;
  var $26=$2;
  var $27=$26;
  var $28=$4;
  var $29=($28)/(2);
  var $30=$29;
  var $31=$rad;
  var $32=$31;
  var $33=Math.sin($32);
  var $34=($30)*($33);
  var $35=($27)+($34);
  var $36=_round($35);
  var $37=($36>=0 ? Math.floor($36) : Math.ceil($36));
  var $38=$7;
  HEAP32[(($38)>>2)]=$37;
  return;
}
function _CmdParse($opts, $nOpts, $argc, $argv, $inputSwitch) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $lastOpt;
      var $t;
      var $swt;
      var $opt;
      $2=$opts;
      $3=$nOpts;
      $4=$argc;
      $5=$argv;
      $6=$inputSwitch;
      $lastOpt=0;
      $t=0;
      label = 2; break;
    case 2: 
      var $8=$t;
      var $9=$4;
      var $10=(($8)|(0)) < (($9)|(0));
      if ($10) { label = 3; break; } else { label = 26; break; }
    case 3: 
      var $12=$2;
      var $13=$3;
      var $14=$t;
      var $15=$5;
      var $16=(($15+($14<<2))|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=_findSwitch($12, $13, $17);
      $swt=$18;
      var $19=$swt;
      var $20=(($19)|(0))==0;
      if ($20) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $22=$t;
      var $23=$4;
      var $24=((($23)-(1))|0);
      var $25=(($22)|(0))==(($24)|(0));
      if ($25) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $27=$2;
      var $28=$3;
      var $29=$6;
      var $30=_findSwitch($27, $28, $29);
      $swt=$30;
      $lastOpt=1;
      label = 6; break;
    case 6: 
      var $32=$swt;
      var $33=(($32)|(0))==0;
      if ($33) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $35=HEAP32[((_stderr)>>2)];
      var $36=$t;
      var $37=$5;
      var $38=(($37+($36<<2))|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=_fprintf($35, ((5264260)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$39,tempInt));
      $1=0;
      label = 27; break;
    case 8: 
      var $42=$swt;
      var $43=(($42)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$t;
      var $46=$5;
      var $47=(($46+($45<<2))|0);
      var $48=HEAP32[(($47)>>2)];
      var $49=_strcmp($44, $48);
      var $50=(($49)|(0))==0;
      if ($50) { label = 9; break; } else { label = 16; break; }
    case 9: 
      var $52=$swt;
      var $53=(($52+4)|0);
      var $54=HEAP32[(($53)>>2)];
      HEAP32[(($54)>>2)]=1;
      var $55=$swt;
      var $56=(($55+8)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=(($57)|(0))!=0;
      if ($58) { label = 10; break; } else { label = 15; break; }
    case 10: 
      var $60=$t;
      var $61=((($60)+(1))|0);
      $t=$61;
      var $62=$t;
      var $63=$4;
      var $64=(($62)|(0)) >= (($63)|(0));
      if ($64) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $66=HEAP32[((_stderr)>>2)];
      var $67=$swt;
      var $68=(($67)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=_fprintf($66, ((5267416)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$69,tempInt));
      $1=0;
      label = 27; break;
    case 12: 
      var $72=$t;
      var $73=$5;
      var $74=(($73+($72<<2))|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=$swt;
      var $77=(($76+8)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=$swt;
      var $80=(($79+12)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=_sscanf($75, $78, (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$81,tempInt));
      var $83=(($82)|(0))!=1;
      if ($83) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $85=HEAP32[((_stderr)>>2)];
      var $86=$swt;
      var $87=(($86)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=_fprintf($85, ((5265476)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$88,tempInt));
      $1=0;
      label = 27; break;
    case 14: 
      label = 15; break;
    case 15: 
      label = 23; break;
    case 16: 
      var $93=$swt;
      var $94=(($93+4)|0);
      var $95=HEAP32[(($94)>>2)];
      HEAP32[(($95)>>2)]=1;
      var $96=$swt;
      var $97=(($96+8)|0);
      var $98=HEAP32[(($97)>>2)];
      var $99=(($98)|(0))!=0;
      if ($99) { label = 17; break; } else { label = 22; break; }
    case 17: 
      var $101=$t;
      var $102=$5;
      var $103=(($102+($101<<2))|0);
      var $104=HEAP32[(($103)>>2)];
      $opt=$104;
      var $105=$lastOpt;
      var $106=(($105)|(0))!=0;
      if ($106) { label = 19; break; } else { label = 18; break; }
    case 18: 
      var $108=$swt;
      var $109=(($108)|0);
      var $110=HEAP32[(($109)>>2)];
      var $111=_strlen($110);
      var $112=$opt;
      var $113=(($112+$111)|0);
      $opt=$113;
      label = 19; break;
    case 19: 
      var $115=$opt;
      var $116=$swt;
      var $117=(($116+8)|0);
      var $118=HEAP32[(($117)>>2)];
      var $119=$swt;
      var $120=(($119+12)|0);
      var $121=HEAP32[(($120)>>2)];
      var $122=_sscanf($115, $118, (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$121,tempInt));
      var $123=(($122)|(0))!=1;
      if ($123) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $125=HEAP32[((_stderr)>>2)];
      var $126=$t;
      var $127=$5;
      var $128=(($127+($126<<2))|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=_fprintf($125, ((5265476)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$129,tempInt));
      $1=0;
      label = 27; break;
    case 21: 
      label = 22; break;
    case 22: 
      label = 23; break;
    case 23: 
      label = 24; break;
    case 24: 
      label = 25; break;
    case 25: 
      var $136=$t;
      var $137=((($136)+(1))|0);
      $t=$137;
      label = 2; break;
    case 26: 
      $1=1;
      label = 27; break;
    case 27: 
      var $140=$1;
      STACKTOP = __stackBase__;
      return $140;
    default: assert(0, "bad label: " + label);
  }
}
function _findSwitch($opts, $nOpts, $swt) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $t;
      $2=$opts;
      $3=$nOpts;
      $4=$swt;
      $t=0;
      label = 2; break;
    case 2: 
      var $6=$t;
      var $7=$3;
      var $8=(($6)|(0)) < (($7)|(0));
      if ($8) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $10=$t;
      var $11=$2;
      var $12=(($11+($10<<4))|0);
      var $13=(($12)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$4;
      var $16=$t;
      var $17=$2;
      var $18=(($17+($16<<4))|0);
      var $19=(($18)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=_strlen($20);
      var $22=_strncmp($14, $15, $21);
      var $23=(($22)|(0))==0;
      if ($23) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $25=$t;
      var $26=$2;
      var $27=(($26+($25<<4))|0);
      $1=$27;
      label = 8; break;
    case 5: 
      label = 6; break;
    case 6: 
      var $30=$t;
      var $31=((($30)+(1))|0);
      $t=$31;
      label = 2; break;
    case 7: 
      $1=0;
      label = 8; break;
    case 8: 
      var $34=$1;
      return $34;
    default: assert(0, "bad label: " + label);
  }
}
function _checkMsc($m) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $arcType;
      var $src;
      var $dst;
      var $startCol;
      var $endCol;
      $2=$m;
      var $3=$2;
      _MscResetArcIterator($3);
      label = 2; break;
    case 2: 
      var $5=$2;
      var $6=_MscGetCurrentArcType($5);
      $arcType=$6;
      var $7=$arcType;
      var $8=(($7)|(0))!=8;
      if ($8) { label = 3; break; } else { label = 12; break; }
    case 3: 
      var $10=$arcType;
      var $11=(($10)|(0))!=5;
      if ($11) { label = 4; break; } else { label = 12; break; }
    case 4: 
      var $13=$arcType;
      var $14=(($13)|(0))!=6;
      if ($14) { label = 5; break; } else { label = 12; break; }
    case 5: 
      var $16=$arcType;
      var $17=(($16)|(0))!=7;
      if ($17) { label = 6; break; } else { label = 12; break; }
    case 6: 
      var $19=$2;
      var $20=_MscGetCurrentArcSource($19);
      $src=$20;
      var $21=$2;
      var $22=_MscGetCurrentArcDest($21);
      $dst=$22;
      var $23=$2;
      var $24=$src;
      var $25=_MscGetEntityIndex($23, $24);
      $startCol=$25;
      var $26=$2;
      var $27=$dst;
      var $28=_MscGetEntityIndex($26, $27);
      $endCol=$28;
      var $29=$startCol;
      var $30=(($29)|(0))==-1;
      if ($30) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $32=HEAP32[((_stderr)>>2)];
      var $33=$2;
      var $34=_MscGetCurrentArcInputLine($33);
      var $35=$src;
      var $36=_fprintf($32, ((5263796)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$34,HEAP32[(((tempInt)+(4))>>2)]=$35,tempInt));
      $1=0;
      label = 15; break;
    case 8: 
      var $38=$endCol;
      var $39=(($38)|(0))==-1;
      if ($39) { label = 9; break; } else { label = 11; break; }
    case 9: 
      var $41=$dst;
      var $42=_isBroadcastArc($41);
      var $43=(($42)|(0))!=0;
      if ($43) { label = 11; break; } else { label = 10; break; }
    case 10: 
      var $45=HEAP32[((_stderr)>>2)];
      var $46=$2;
      var $47=_MscGetCurrentArcInputLine($46);
      var $48=$dst;
      var $49=_fprintf($45, ((5267304)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$47,HEAP32[(((tempInt)+(4))>>2)]=$48,tempInt));
      $1=0;
      label = 15; break;
    case 11: 
      label = 12; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $53=$2;
      var $54=_MscNextArc($53);
      var $55=(($54)|(0))!=0;
      if ($55) { label = 2; break; } else { label = 14; break; }
    case 14: 
      $1=1;
      label = 15; break;
    case 15: 
      var $58=$1;
      STACKTOP = __stackBase__;
      return $58;
    default: assert(0, "bad label: " + label);
  }
}
function _isBroadcastArc($entity) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$entity;
      var $2=$1;
      var $3=(($2)|(0))!=0;
      if ($3) { label = 2; break; } else { var $9 = 0;label = 3; break; }
    case 2: 
      var $5=$1;
      var $6=_strcmp($5, ((5260748)|0));
      var $7=(($6)|(0))==0;
      var $9 = $7;label = 3; break;
    case 3: 
      var $9;
      var $10=(($9)&(1));
      return $10;
    default: assert(0, "bad label: " + label);
  }
}
function _ADrawOpen($w, $h, $file, $fontName, $type, $outContext) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      $2=$w;
      $3=$h;
      $4=$file;
      $5=$fontName;
      $6=$type;
      $7=$outContext;
      var $8=$7;
      var $9=(($8)|(0))!=0;
      if ($9) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5268508)|0), 47, ((5269176)|0), ((5268496)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      var $14=$6;
      if ((($14)|(0))==0) {
        label = 5; break;
      }
      else if ((($14)|(0))==1) {
        label = 6; break;
      }
      else if ((($14)|(0))==2) {
        label = 7; break;
      }
      else if ((($14)|(0))==3) {
        label = 8; break;
      }
      else {
      label = 9; break;
      }
    case 5: 
      var $16=$7;
      var $17=_NullInit($16);
      $1=$17;
      label = 10; break;
    case 6: 
      var $19=HEAP32[((_stderr)>>2)];
      var $20=_fprintf($19, ((5265756)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      $1=0;
      label = 10; break;
    case 7: 
      var $22=$2;
      var $23=$3;
      var $24=$4;
      var $25=$7;
      var $26=_PsInit($22, $23, $24, $25);
      $1=$26;
      label = 10; break;
    case 8: 
      var $28=$2;
      var $29=$3;
      var $30=$4;
      var $31=$7;
      var $32=_SvgInit($28, $29, $30, $31);
      $1=$32;
      label = 10; break;
    case 9: 
      $1=0;
      label = 10; break;
    case 10: 
      var $35=$1;
      STACKTOP = __stackBase__;
      return $35;
    default: assert(0, "bad label: " + label);
  }
}
function _ADrawGetColour($colour) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 4)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $c=__stackBase__;
      var $t;
      $2=$colour;
      var $3=$2;
      var $4=(($3)|(0))!=0;
      if ($4) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5268508)|0), 75, ((5269188)|0), ((5263456)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      var $9=$2;
      var $10=HEAP8[($9)];
      var $11=(($10 << 24) >> 24);
      var $12=(($11)|(0))==35;
      if ($12) { label = 5; break; } else { label = 8; break; }
    case 5: 
      HEAP32[(($c)>>2)]=0;
      var $14=$2;
      var $15=(($14+1)|0);
      var $16=_sscanf($15, ((5261080)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$c,tempInt));
      var $17=(($16)|(0))==1;
      if ($17) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $19=HEAP32[(($c)>>2)];
      $1=$19;
      label = 16; break;
    case 7: 
      label = 15; break;
    case 8: 
      $t=0;
      label = 9; break;
    case 9: 
      var $23=$t;
      var $24=(($23)>>>(0)) < 19;
      if ($24) { label = 10; break; } else { label = 14; break; }
    case 10: 
      var $26=$2;
      var $27=$t;
      var $28=((5271308+($27<<3))|0);
      var $29=(($28)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=_strcasecmp($26, $30);
      var $32=(($31)|(0))==0;
      if ($32) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $34=$t;
      var $35=((5271308+($34<<3))|0);
      var $36=(($35+4)|0);
      var $37=HEAP32[(($36)>>2)];
      $1=$37;
      label = 16; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $40=$t;
      var $41=((($40)+(1))|0);
      $t=$41;
      label = 9; break;
    case 14: 
      label = 15; break;
    case 15: 
      $1=0;
      label = 16; break;
    case 16: 
      var $45=$1;
      STACKTOP = __stackBase__;
      return $45;
    default: assert(0, "bad label: " + label);
  }
}
function _main($argc, $argv) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $ismap;
      var $outType;
      var $entColourRef;
      var $outImage;
      var $m;
      var $w=__stackBase__;
      var $h=(__stackBase__)+(4);
      var $row;
      var $col;
      var $rowInfo;
      var $addLines;
      var $f=(__stackBase__)+(8);
      var $h1;
      var $in;
      var $lines;
      var $gap;
      var $t;
      var $x;
      var $line;
      var $arcType;
      var $arcUrl;
      var $arcId;
      var $arcIdUrl;
      var $arcTextColour;
      var $arcTextBgColour;
      var $arcLineColour;
      var $arcGradient;
      var $arcHasArrows;
      var $arcHasBiArrows;
      var $arcLabelLines=(__stackBase__)+(12);
      var $arcLabelLineCount;
      var $startCol;
      var $endCol;
      var $ymin;
      var $ymid;
      var $ymax;
      var $t2;
      var $margin;
      $1=0;
      $2=$argc;
      $3=$argv;
      $ismap=0;
      var $4=$2;
      var $5=((($4)-(1))|0);
      var $6=$3;
      var $7=(($6+4)|0);
      var $8=_CmdParse(((5258528)|0), 6, $5, $7, ((5265468)|0));
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 2; break; }
    case 2: 
      _Usage();
      $1=1;
      label = 148; break;
    case 3: 
      var $12=HEAP32[((5258524)>>2)];
      var $13=(($12)|(0))!=0;
      if ($13) { label = 4; break; } else { label = 5; break; }
    case 4: 
      _Licence();
      $1=0;
      label = 148; break;
    case 5: 
      var $16=HEAP32[((5254344)>>2)];
      var $17=(($16)|(0))!=0;
      if ($17) { label = 7; break; } else { label = 6; break; }
    case 6: 
      var $19=HEAP32[((_stderr)>>2)];
      var $20=_fprintf($19, ((5263016)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      _Usage();
      $1=1;
      label = 148; break;
    case 7: 
      var $22=HEAP32[((5250244)>>2)];
      var $23=(($22)|(0))!=0;
      if ($23) { label = 12; break; } else { label = 8; break; }
    case 8: 
      var $25=HEAP32[((5254424)>>2)];
      var $26=(($25)|(0))!=0;
      if ($26) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $28=_strcmp(((5254428)|0), ((5260932)|0));
      var $29=(($28)|(0))==0;
      if ($29) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $31=HEAP32[((_stderr)>>2)];
      var $32=_fprintf($31, ((5260480)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      _Usage();
      $1=1;
      label = 148; break;
    case 11: 
      HEAP32[((5250244)>>2)]=1;
      var $34=_snprintf(((5250248)|0), 4096, ((5260112)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5254428)|0),tempInt));
      _trimExtension(((5250248)|0));
      var $35=_strlen(((5250248)|0));
      var $36=((($35)+(1))|0);
      var $37=(((4096)-($36))|0);
      var $38=_strncat(((5250248)|0), ((5259888)|0), $37);
      var $39=_strlen(((5250248)|0));
      var $40=((($39)+(1))|0);
      var $41=(((4096)-($40))|0);
      var $42=_strncat(((5250248)|0), ((5254348)|0), $41);
      label = 12; break;
    case 12: 
      var $44=HEAP32[((5249984)>>2)];
      var $45=(($44)|(0))!=0;
      if ($45) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $47=HEAP32[((_stderr)>>2)];
      var $48=_fprintf($47, ((5259540)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 14; break;
    case 14: 
      var $50=_strcmp(((5254348)|0), ((5259156)|0));
      var $51=(($50)|(0))==0;
      if ($51) { label = 15; break; } else { label = 16; break; }
    case 15: 
      $outType=1;
      $outImage=((5250248)|0);
      label = 28; break;
    case 16: 
      var $54=_strcmp(((5254348)|0), ((5268292)|0));
      var $55=(($54)|(0))==0;
      if ($55) { label = 17; break; } else { label = 18; break; }
    case 17: 
      $outType=2;
      $outImage=((5250248)|0);
      label = 27; break;
    case 18: 
      var $58=_strcmp(((5254348)|0), ((5267836)|0));
      var $59=(($58)|(0))==0;
      if ($59) { label = 19; break; } else { label = 20; break; }
    case 19: 
      $outType=3;
      $outImage=((5250248)|0);
      label = 26; break;
    case 20: 
      var $62=_strcmp(((5254348)|0), ((5267488)|0));
      var $63=(($62)|(0))==0;
      if ($63) { label = 21; break; } else { label = 24; break; }
    case 21: 
      $outType=1;
      $outImage=((5249948)|0);
      var $65=_mkstemp(((5249948)|0));
      $h1=$65;
      var $66=$h1;
      var $67=(($66)|(0))==-1;
      if ($67) { label = 22; break; } else { label = 23; break; }
    case 22: 
      _perror(((5267088)|0));
      $1=1;
      label = 148; break;
    case 23: 
      var $70=$h1;
      var $71=_close($70);
      var $72=$outImage;
      HEAP32[((5258692)>>2)]=$72;
      var $73=_atexit(44);
      label = 25; break;
    case 24: 
      var $75=HEAP32[((_stderr)>>2)];
      var $76=_fprintf($75, ((5266860)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5254348)|0),tempInt));
      _Usage();
      $1=1;
      label = 148; break;
    case 25: 
      label = 26; break;
    case 26: 
      label = 27; break;
    case 27: 
      label = 28; break;
    case 28: 
      var $81=HEAP32[((5254424)>>2)];
      var $82=(($81)|(0))!=0;
      if ($82) { label = 29; break; } else { label = 33; break; }
    case 29: 
      var $84=_strcmp(((5254428)|0), ((5260932)|0));
      var $85=(($84)|(0))!=0;
      var $86=$85 ^ 1;
      var $87=(($86)&(1));
      var $88=(($87)|(0))==0;
      if ($88) { label = 30; break; } else { label = 33; break; }
    case 30: 
      var $90=_fopen(((5254428)|0), ((5266696)|0));
      $in=$90;
      var $91=$in;
      var $92=(($91)|(0))!=0;
      if ($92) { label = 32; break; } else { label = 31; break; }
    case 31: 
      var $94=HEAP32[((_stderr)>>2)];
      var $95=_fprintf($94, ((5266596)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5254428)|0),tempInt));
      $1=1;
      label = 148; break;
    case 32: 
      var $97=$in;
      var $98=_MscParse($97);
      $m=$98;
      var $99=$in;
      var $100=_fclose($99);
      label = 34; break;
    case 33: 
      var $102=HEAP32[((_stdin)>>2)];
      var $103=_MscParse($102);
      $m=$103;
      label = 34; break;
    case 34: 
      var $105=$m;
      var $106=(($105)|(0))!=0;
      if ($106) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $108=$m;
      var $109=_checkMsc($108);
      var $110=(($109)|(0))!=0;
      if ($110) { label = 37; break; } else { label = 36; break; }
    case 36: 
      $1=1;
      label = 148; break;
    case 37: 
      var $113=HEAP32[((5249980)>>2)];
      var $114=(($113)|(0))!=0;
      if ($114) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $116=$m;
      _MscPrint($116);
      label = 39; break;
    case 39: 
      var $118=$outType;
      var $119=(($118)|(0))==1;
      if ($119) { label = 40; break; } else { label = 42; break; }
    case 40: 
      var $121=_lex_getutf8();
      var $122=(($121)|(0))!=0;
      if ($122) { label = 41; break; } else { label = 42; break; }
    case 41: 
      var $124=HEAP32[((_stderr)>>2)];
      var $125=_fprintf($124, ((5266292)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 42; break;
    case 42: 
      var $127=_strcmp(((5254348)|0), ((5267488)|0));
      var $128=(($127)|(0))==0;
      if ($128) { label = 43; break; } else { label = 46; break; }
    case 43: 
      var $130=_fopen(((5250248)|0), ((5266124)|0));
      $ismap=$130;
      var $131=$ismap;
      var $132=(($131)|(0))!=0;
      if ($132) { label = 45; break; } else { label = 44; break; }
    case 44: 
      var $134=HEAP32[((_stderr)>>2)];
      var $135=___errno_location();
      var $136=HEAP32[(($135)>>2)];
      var $137=_strerror($136);
      var $138=_fprintf($134, ((5265824)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5250248)|0),HEAP32[(((tempInt)+(4))>>2)]=$137,tempInt));
      $1=1;
      label = 148; break;
    case 45: 
      label = 46; break;
    case 46: 
      var $141=$outType;
      var $142=_ADrawOpen(10, 10, ((5265692)|0), ((5249988)|0), $141, 5258624);
      var $143=(($142)|(0))!=0;
      if ($143) { label = 48; break; } else { label = 47; break; }
    case 47: 
      var $145=HEAP32[((_stderr)>>2)];
      var $146=_fprintf($145, ((5265612)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      $1=1;
      label = 148; break;
    case 48: 
      var $148=$m;
      var $149=_MscGetOptAsFloat($148, 1, $f);
      var $150=(($149)|(0))!=0;
      if ($150) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $152=HEAPF32[(($f)>>2)];
      var $153=($152>=0 ? Math.floor($152) : Math.ceil($152));
      HEAP32[((((5254360)|0))>>2)]=$153;
      label = 53; break;
    case 50: 
      var $155=$m;
      var $156=_MscGetOptAsFloat($155, 0, $f);
      var $157=(($156)|(0))!=0;
      if ($157) { label = 51; break; } else { label = 52; break; }
    case 51: 
      var $159=HEAPF32[(($f)>>2)];
      var $160=HEAP32[((((5254360)|0))>>2)];
      var $161=(($160)>>>(0));
      var $162=($161)*($159);
      var $163=($162>=0 ? Math.floor($162) : Math.ceil($162));
      HEAP32[((((5254360)|0))>>2)]=$163;
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      var $166=$m;
      var $167=_MscGetOptAsFloat($166, 2, $f);
      var $168=(($167)|(0))!=0;
      if ($168) { label = 54; break; } else { label = 55; break; }
    case 54: 
      var $170=HEAPF32[(($f)>>2)];
      var $171=(($170)&-1);
      HEAP32[((((5254376)|0))>>2)]=$171;
      var $172=HEAP32[((((5254376)|0))>>2)];
      var $173=HEAP32[((((5254372)|0))>>2)];
      var $174=((($173)+($172))|0);
      HEAP32[((((5254372)|0))>>2)]=$174;
      label = 55; break;
    case 55: 
      var $176=$m;
      var $177=_MscGetOptAsBoolean($176, 3, ((5254400)|0));
      var $178=HEAP32[((((5254360)|0))>>2)];
      var $179=$m;
      var $180=_MscGetNumEntities($179);
      var $181=Math.floor(((($178)>>>(0)))/((($180)>>>(0))));
      var $182=HEAP32[((((5254364)|0))>>2)];
      var $183=(($181)>>>(0)) > (($182)>>>(0));
      if ($183) { label = 56; break; } else { label = 57; break; }
    case 56: 
      var $185=HEAP32[((((5254360)|0))>>2)];
      var $186=$m;
      var $187=_MscGetNumEntities($186);
      var $188=Math.floor(((($185)>>>(0)))/((($187)>>>(0))));
      HEAP32[((((5254364)|0))>>2)]=$188;
      label = 57; break;
    case 57: 
      var $190=$m;
      _MscResetEntityIterator($190);
      $col=0;
      label = 58; break;
    case 58: 
      var $192=$col;
      var $193=$m;
      var $194=_MscGetNumEntities($193);
      var $195=(($192)>>>(0)) < (($194)>>>(0));
      if ($195) { label = 59; break; } else { label = 63; break; }
    case 59: 
      var $197=$m;
      var $198=_MscGetCurrentEntAttrib($197, 0);
      var $199=_countLines($198);
      $lines=$199;
      var $200=$lines;
      var $201=HEAP32[((((5258648)|0))>>2)];
      var $202=FUNCTION_TABLE[$201](5258624);
      var $203=Math.imul($200,$202);
      $gap=$203;
      var $204=$gap;
      var $205=HEAP32[((((5254368)|0))>>2)];
      var $206=(($204)>>>(0)) > (($205)>>>(0));
      if ($206) { label = 60; break; } else { label = 61; break; }
    case 60: 
      var $208=$gap;
      HEAP32[((((5254368)|0))>>2)]=$208;
      label = 61; break;
    case 61: 
      var $210=$m;
      var $211=_MscNextEntity($210);
      label = 62; break;
    case 62: 
      var $213=$col;
      var $214=((($213)+(1))|0);
      $col=$214;
      label = 58; break;
    case 63: 
      var $216=$m;
      var $217=_computeCanvasSize($216, $w, $h);
      $rowInfo=$217;
      var $218=HEAP32[((5249980)>>2)];
      var $219=(($218)|(0))!=0;
      if ($219) { label = 64; break; } else { label = 69; break; }
    case 64: 
      var $221=_printf(((5265524)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      $t=0;
      label = 65; break;
    case 65: 
      var $223=$t;
      var $224=$m;
      var $225=_MscGetNumArcs($224);
      var $226=$m;
      var $227=_MscGetNumParallelArcs($226);
      var $228=((($225)-($227))|0);
      var $229=(($223)>>>(0)) < (($228)>>>(0));
      if ($229) { label = 66; break; } else { label = 68; break; }
    case 66: 
      var $231=$t;
      var $232=$t;
      var $233=$rowInfo;
      var $234=(($233+($232<<4))|0);
      var $235=(($234)|0);
      var $236=HEAP32[(($235)>>2)];
      var $237=$t;
      var $238=$rowInfo;
      var $239=(($238+($237<<4))|0);
      var $240=(($239+4)|0);
      var $241=HEAP32[(($240)>>2)];
      var $242=$t;
      var $243=$rowInfo;
      var $244=(($243+($242<<4))|0);
      var $245=(($244+8)|0);
      var $246=HEAP32[(($245)>>2)];
      var $247=$t;
      var $248=$rowInfo;
      var $249=(($248+($247<<4))|0);
      var $250=(($249+12)|0);
      var $251=HEAP32[(($250)>>2)];
      var $252=_printf(((5264296)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$231,HEAP32[(((tempInt)+(4))>>2)]=$236,HEAP32[(((tempInt)+(8))>>2)]=$241,HEAP32[(((tempInt)+(12))>>2)]=$246,HEAP32[(((tempInt)+(16))>>2)]=$251,tempInt));
      label = 67; break;
    case 67: 
      var $254=$t;
      var $255=((($254)+(1))|0);
      $t=$255;
      label = 65; break;
    case 68: 
      label = 69; break;
    case 69: 
      var $258=HEAP32[((((5258684)|0))>>2)];
      var $259=FUNCTION_TABLE[$258](5258624);
      var $260=HEAP32[(($w)>>2)];
      var $261=HEAP32[(($h)>>2)];
      var $262=$outImage;
      var $263=$outType;
      var $264=_ADrawOpen($260, $261, $262, ((5249988)|0), $263, 5258624);
      var $265=(($264)|(0))!=0;
      if ($265) { label = 71; break; } else { label = 70; break; }
    case 70: 
      var $267=HEAP32[((_stderr)>>2)];
      var $268=_fprintf($267, ((5265612)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      $1=1;
      label = 148; break;
    case 71: 
      var $270=$m;
      var $271=_MscGetNumEntities($270);
      var $272=($271<<2);
      var $273=_malloc_s($272);
      var $274=$273;
      $entColourRef=$274;
      var $275=$m;
      _MscResetEntityIterator($275);
      $col=0;
      label = 72; break;
    case 72: 
      var $277=$col;
      var $278=$m;
      var $279=_MscGetNumEntities($278);
      var $280=(($277)>>>(0)) < (($279)>>>(0));
      if ($280) { label = 73; break; } else { label = 78; break; }
    case 73: 
      var $282=HEAP32[((((5254364)|0))>>2)];
      var $283=Math.floor(((($282)>>>(0)))/(2));
      var $284=HEAP32[((((5254364)|0))>>2)];
      var $285=$col;
      var $286=Math.imul($284,$285);
      var $287=((($283)+($286))|0);
      $x=$287;
      var $288=$ismap;
      var $289=$x;
      var $290=HEAP32[((((5254368)|0))>>2)];
      var $291=HEAP32[((((5258648)|0))>>2)];
      var $292=FUNCTION_TABLE[$291](5258624);
      var $293=((((($292)|(0)))/(2))&-1);
      var $294=((($290)-($293))|0);
      var $295=$m;
      var $296=_MscGetCurrentEntAttrib($295, 0);
      var $297=$m;
      var $298=_MscGetCurrentEntAttrib($297, 2);
      var $299=$m;
      var $300=_MscGetCurrentEntAttrib($299, 1);
      var $301=$m;
      var $302=_MscGetCurrentEntAttrib($301, 3);
      var $303=$m;
      var $304=_MscGetCurrentEntAttrib($303, 5);
      var $305=$m;
      var $306=_MscGetCurrentEntAttrib($305, 6);
      _entityText($288, $289, $294, $296, $298, $300, $302, $304, $306);
      var $307=$m;
      var $308=_MscGetCurrentEntAttrib($307, 4);
      $line=$308;
      var $309=$line;
      var $310=(($309)|(0))!=0;
      if ($310) { label = 74; break; } else { label = 75; break; }
    case 74: 
      var $312=$line;
      var $313=_ADrawGetColour($312);
      var $314=$col;
      var $315=$entColourRef;
      var $316=(($315+($314<<2))|0);
      HEAP32[(($316)>>2)]=$313;
      label = 76; break;
    case 75: 
      var $318=$col;
      var $319=$entColourRef;
      var $320=(($319+($318<<2))|0);
      HEAP32[(($320)>>2)]=0;
      label = 76; break;
    case 76: 
      var $322=$m;
      var $323=_MscNextEntity($322);
      label = 77; break;
    case 77: 
      var $325=$col;
      var $326=((($325)+(1))|0);
      $col=$326;
      label = 72; break;
    case 78: 
      $addLines=1;
      $row=0;
      var $328=$m;
      _MscResetArcIterator($328);
      label = 79; break;
    case 79: 
      var $330=$m;
      var $331=_MscGetCurrentArcType($330);
      $arcType=$331;
      var $332=$m;
      var $333=_MscGetCurrentArcAttrib($332, 2);
      $arcUrl=$333;
      var $334=$m;
      var $335=_MscGetCurrentArcAttrib($334, 1);
      $arcId=$335;
      var $336=$m;
      var $337=_MscGetCurrentArcAttrib($336, 3);
      $arcIdUrl=$337;
      var $338=$m;
      var $339=_MscGetCurrentArcAttrib($338, 5);
      $arcTextColour=$339;
      var $340=$m;
      var $341=_MscGetCurrentArcAttrib($340, 6);
      $arcTextBgColour=$341;
      var $342=$m;
      var $343=_MscGetCurrentArcAttrib($342, 4);
      $arcLineColour=$343;
      var $344=$arcType;
      var $345=_isBoxArc($344);
      var $346=(($345)|(0))!=0;
      if ($346) { label = 80; break; } else { label = 81; break; }
    case 80: 
      var $354 = 0;label = 82; break;
    case 81: 
      var $349=$m;
      var $350=$rowInfo;
      var $351=$row;
      var $352=_getArcGradient($349, $350, $351);
      var $354 = $352;label = 82; break;
    case 82: 
      var $354;
      $arcGradient=$354;
      var $355=$m;
      var $356=_MscGetCurrentArcAttrib($355, 10);
      var $357=(($356)|(0))==0;
      var $358=(($357)&(1));
      $arcHasArrows=$358;
      var $359=$m;
      var $360=_MscGetCurrentArcAttrib($359, 11);
      var $361=(($360)|(0))!=0;
      var $362=(($361)&(1));
      $arcHasBiArrows=$362;
      HEAP32[(($arcLabelLines)>>2)]=0;
      $arcLabelLineCount=0;
      $startCol=-1;
      $endCol=-1;
      var $363=$arcType;
      var $364=(($363)|(0))==8;
      if ($364) { label = 83; break; } else { label = 87; break; }
    case 83: 
      $addLines=0;
      var $366=$row;
      var $367=(($366)>>>(0)) > 0;
      if ($367) { label = 84; break; } else { label = 85; break; }
    case 84: 
      label = 86; break;
    case 85: 
      ___assert_func(((5264124)|0), 1927, ((5268988)|0), ((5264108)|0));
      throw "Reached an unreachable!"
      label = 86; break;
    case 86: 
      var $372=$row;
      var $373=((($372)-(1))|0);
      $row=$373;
      label = 143; break;
    case 87: 
      var $375=$row;
      var $376=$rowInfo;
      var $377=(($376+($375<<4))|0);
      var $378=(($377)|0);
      var $379=HEAP32[(($378)>>2)];
      $ymin=$379;
      var $380=$row;
      var $381=$rowInfo;
      var $382=(($381+($380<<4))|0);
      var $383=(($382+4)|0);
      var $384=HEAP32[(($383)>>2)];
      $ymid=$384;
      var $385=$row;
      var $386=$rowInfo;
      var $387=(($386+($385<<4))|0);
      var $388=(($387+8)|0);
      var $389=HEAP32[(($388)>>2)];
      $ymax=$389;
      var $390=$arcType;
      var $391=(($390)|(0))!=5;
      if ($391) { label = 88; break; } else { label = 104; break; }
    case 88: 
      var $393=$arcType;
      var $394=(($393)|(0))!=6;
      if ($394) { label = 89; break; } else { label = 104; break; }
    case 89: 
      var $396=$arcType;
      var $397=(($396)|(0))!=7;
      if ($397) { label = 90; break; } else { label = 104; break; }
    case 90: 
      var $399=$m;
      var $400=$m;
      var $401=_MscGetCurrentArcSource($400);
      var $402=_MscGetEntityIndex($399, $401);
      $startCol=$402;
      var $403=$m;
      var $404=$m;
      var $405=_MscGetCurrentArcDest($404);
      var $406=_MscGetEntityIndex($403, $405);
      $endCol=$406;
      var $407=$startCol;
      var $408=(($407)|(0))!=-1;
      if ($408) { label = 91; break; } else { label = 92; break; }
    case 91: 
      label = 93; break;
    case 92: 
      ___assert_func(((5264124)|0), 1950, ((5268988)|0), ((5263932)|0));
      throw "Reached an unreachable!"
      label = 93; break;
    case 93: 
      var $413=$endCol;
      var $414=(($413)|(0))!=-1;
      if ($414) { label = 95; break; } else { label = 94; break; }
    case 94: 
      var $416=$m;
      var $417=_MscGetCurrentArcDest($416);
      var $418=_isBroadcastArc($417);
      var $419=(($418)|(0))!=0;
      if ($419) { label = 95; break; } else { label = 96; break; }
    case 95: 
      label = 97; break;
    case 96: 
      ___assert_func(((5264124)|0), 1951, ((5268988)|0), ((5263672)|0));
      throw "Reached an unreachable!"
      label = 97; break;
    case 97: 
      var $424=$arcTextColour;
      var $425=(($424)|(0))==0;
      if ($425) { label = 98; break; } else { label = 99; break; }
    case 98: 
      var $427=$m;
      var $428=$startCol;
      var $429=_MscGetEntAttrib($427, $428, 8);
      $arcTextColour=$429;
      label = 99; break;
    case 99: 
      var $431=$arcTextBgColour;
      var $432=(($431)|(0))==0;
      if ($432) { label = 100; break; } else { label = 101; break; }
    case 100: 
      var $434=$m;
      var $435=$startCol;
      var $436=_MscGetEntAttrib($434, $435, 9);
      $arcTextBgColour=$436;
      label = 101; break;
    case 101: 
      var $438=$arcLineColour;
      var $439=(($438)|(0))==0;
      if ($439) { label = 102; break; } else { label = 103; break; }
    case 102: 
      var $441=$m;
      var $442=$startCol;
      var $443=_MscGetEntAttrib($441, $442, 7);
      $arcLineColour=$443;
      label = 103; break;
    case 103: 
      label = 105; break;
    case 104: 
      $startCol=0;
      var $446=$m;
      var $447=_MscGetNumEntities($446);
      var $448=((($447)-(1))|0);
      $endCol=$448;
      label = 105; break;
    case 105: 
      var $450=$m;
      var $451=$arcType;
      var $452=$m;
      var $453=_MscGetCurrentArcAttrib($452, 0);
      var $454=$startCol;
      var $455=$endCol;
      var $456=_computeLabelLines($450, $451, $arcLabelLines, $453, $454, $455);
      $arcLabelLineCount=$456;
      var $457=$m;
      var $458=_MscGetCurrentArcDest($457);
      var $459=_isBroadcastArc($458);
      var $460=(($459)|(0))!=0;
      if ($460) { label = 106; break; } else { label = 115; break; }
    case 106: 
      var $462=$addLines;
      var $463=(($462)|(0))!=0;
      if ($463) { label = 107; break; } else { label = 108; break; }
    case 107: 
      var $465=$m;
      var $466=$ymin;
      var $467=$ymax;
      var $468=HEAP32[((((5254372)|0))>>2)];
      var $469=((($467)+($468))|0);
      var $470=$entColourRef;
      _entityLines($465, $466, $469, 0, $470);
      label = 108; break;
    case 108: 
      $t2=0;
      label = 109; break;
    case 109: 
      var $473=$t2;
      var $474=$m;
      var $475=_MscGetNumEntities($474);
      var $476=(($473)>>>(0)) < (($475)>>>(0));
      if ($476) { label = 110; break; } else { label = 114; break; }
    case 110: 
      var $478=$t2;
      var $479=$startCol;
      var $480=(($478)|(0))!=(($479)|(0));
      if ($480) { label = 111; break; } else { label = 112; break; }
    case 111: 
      var $482=$m;
      var $483=$ymid;
      var $484=$arcGradient;
      var $485=$startCol;
      var $486=$t2;
      var $487=$arcLineColour;
      var $488=$arcHasArrows;
      var $489=$arcHasBiArrows;
      var $490=$arcType;
      _arcLine($482, $483, $484, $485, $486, $487, $488, $489, $490);
      label = 112; break;
    case 112: 
      label = 113; break;
    case 113: 
      var $493=$t2;
      var $494=((($493)+(1))|0);
      $t2=$494;
      label = 109; break;
    case 114: 
      $startCol=0;
      var $496=$m;
      var $497=_MscGetNumEntities($496);
      var $498=((($497)-(1))|0);
      $endCol=$498;
      label = 140; break;
    case 115: 
      var $500=$arcType;
      var $501=_isBoxArc($500);
      var $502=(($501)|(0))!=0;
      if ($502) { label = 116; break; } else { label = 119; break; }
    case 116: 
      var $504=$addLines;
      var $505=(($504)|(0))!=0;
      if ($505) { label = 117; break; } else { label = 118; break; }
    case 117: 
      var $507=$m;
      var $508=$ymin;
      var $509=$ymax;
      var $510=HEAP32[((((5254372)|0))>>2)];
      var $511=((($509)+($510))|0);
      var $512=$entColourRef;
      _entityLines($507, $508, $511, 0, $512);
      label = 118; break;
    case 118: 
      var $514=$ymin;
      var $515=$ymax;
      var $516=$startCol;
      var $517=$endCol;
      var $518=$arcType;
      var $519=$arcLineColour;
      var $520=$arcTextBgColour;
      _arcBox($514, $515, $516, $517, $518, $519, $520);
      label = 139; break;
    case 119: 
      var $522=$arcType;
      var $523=(($522)|(0))==5;
      if ($523) { label = 120; break; } else { label = 123; break; }
    case 120: 
      var $525=$addLines;
      var $526=(($525)|(0))!=0;
      if ($526) { label = 121; break; } else { label = 122; break; }
    case 121: 
      var $528=$m;
      var $529=$ymin;
      var $530=$ymax;
      var $531=HEAP32[((((5254372)|0))>>2)];
      var $532=((($530)+($531))|0);
      var $533=$entColourRef;
      _entityLines($528, $529, $532, 1, $533);
      label = 122; break;
    case 122: 
      label = 138; break;
    case 123: 
      var $536=$arcType;
      var $537=(($536)|(0))==6;
      if ($537) { label = 125; break; } else { label = 124; break; }
    case 124: 
      var $539=$arcType;
      var $540=(($539)|(0))==7;
      if ($540) { label = 125; break; } else { label = 134; break; }
    case 125: 
      var $542=$addLines;
      var $543=(($542)|(0))!=0;
      if ($543) { label = 126; break; } else { label = 127; break; }
    case 126: 
      var $545=$m;
      var $546=$ymin;
      var $547=$ymax;
      var $548=HEAP32[((((5254372)|0))>>2)];
      var $549=((($547)+($548))|0);
      var $550=$entColourRef;
      _entityLines($545, $546, $549, 0, $550);
      label = 127; break;
    case 127: 
      var $552=$arcType;
      var $553=(($552)|(0))==6;
      if ($553) { label = 128; break; } else { label = 133; break; }
    case 128: 
      var $555=HEAP32[((((5254364)|0))>>2)];
      var $556=Math.floor(((($555)>>>(0)))/(4));
      $margin=$556;
      var $557=$arcLineColour;
      var $558=(($557)|(0))!=0;
      if ($558) { label = 129; break; } else { label = 130; break; }
    case 129: 
      var $560=HEAP32[((((5258672)|0))>>2)];
      var $561=$arcLineColour;
      var $562=_ADrawGetColour($561);
      FUNCTION_TABLE[$560](5258624, $562);
      label = 130; break;
    case 130: 
      var $564=HEAP32[((((5258628)|0))>>2)];
      var $565=$margin;
      var $566=$ymid;
      var $567=$m;
      var $568=_MscGetNumEntities($567);
      var $569=HEAP32[((((5254364)|0))>>2)];
      var $570=Math.imul($568,$569);
      var $571=$margin;
      var $572=((($570)-($571))|0);
      var $573=$ymid;
      FUNCTION_TABLE[$564](5258624, $565, $566, $572, $573);
      var $574=$arcLineColour;
      var $575=(($574)|(0))!=0;
      if ($575) { label = 131; break; } else { label = 132; break; }
    case 131: 
      var $577=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$577](5258624, 0);
      label = 132; break;
    case 132: 
      label = 133; break;
    case 133: 
      label = 137; break;
    case 134: 
      var $581=$addLines;
      var $582=(($581)|(0))!=0;
      if ($582) { label = 135; break; } else { label = 136; break; }
    case 135: 
      var $584=$m;
      var $585=$ymin;
      var $586=$ymax;
      var $587=HEAP32[((((5254372)|0))>>2)];
      var $588=((($586)+($587))|0);
      var $589=$entColourRef;
      _entityLines($584, $585, $588, 0, $589);
      label = 136; break;
    case 136: 
      var $591=$m;
      var $592=$ymid;
      var $593=$arcGradient;
      var $594=$startCol;
      var $595=$endCol;
      var $596=$arcLineColour;
      var $597=$arcHasArrows;
      var $598=$arcHasBiArrows;
      var $599=$arcType;
      _arcLine($591, $592, $593, $594, $595, $596, $597, $598, $599);
      label = 137; break;
    case 137: 
      label = 138; break;
    case 138: 
      label = 139; break;
    case 139: 
      label = 140; break;
    case 140: 
      var $604=$arcLabelLineCount;
      var $605=(($604)>>>(0)) > 0;
      if ($605) { label = 141; break; } else { label = 142; break; }
    case 141: 
      var $607=$m;
      var $608=$ismap;
      var $609=HEAP32[(($w)>>2)];
      var $610=$ymid;
      var $611=$arcGradient;
      var $612=$startCol;
      var $613=$endCol;
      var $614=$arcLabelLineCount;
      var $615=HEAP32[(($arcLabelLines)>>2)];
      var $616=$arcUrl;
      var $617=$arcId;
      var $618=$arcIdUrl;
      var $619=$arcTextColour;
      var $620=$arcTextBgColour;
      var $621=$arcType;
      _arcText($607, $608, $609, $610, $611, $612, $613, $614, $615, $616, $617, $618, $619, $620, $621);
      label = 142; break;
    case 142: 
      var $623=$arcLabelLineCount;
      var $624=HEAP32[(($arcLabelLines)>>2)];
      _freeLabelLines($623, $624);
      var $625=$row;
      var $626=((($625)+(1))|0);
      $row=$626;
      $addLines=1;
      label = 143; break;
    case 143: 
      label = 144; break;
    case 144: 
      var $629=$m;
      var $630=_MscNextArc($629);
      var $631=(($630)|(0))!=0;
      if ($631) { label = 79; break; } else { label = 145; break; }
    case 145: 
      var $633=$m;
      var $634=$m;
      var $635=_MscGetNumArcs($634);
      var $636=$m;
      var $637=_MscGetNumParallelArcs($636);
      var $638=((($635)-($637))|0);
      var $639=((($638)-(1))|0);
      var $640=$rowInfo;
      var $641=(($640+($639<<4))|0);
      var $642=(($641+8)|0);
      var $643=HEAP32[(($642)>>2)];
      var $644=HEAP32[(($h)>>2)];
      var $645=$entColourRef;
      _entityLines($633, $643, $644, 0, $645);
      var $646=$ismap;
      var $647=(($646)|(0))!=0;
      if ($647) { label = 146; break; } else { label = 147; break; }
    case 146: 
      var $649=$ismap;
      var $650=_fclose($649);
      label = 147; break;
    case 147: 
      var $652=$entColourRef;
      var $653=$652;
      _free($653);
      var $654=$rowInfo;
      var $655=$654;
      _free($655);
      var $656=$m;
      _MscFree($656);
      var $657=HEAP32[((((5258684)|0))>>2)];
      var $658=FUNCTION_TABLE[$657](5258624);
      $1=0;
      label = 148; break;
    case 148: 
      var $660=$1;
      STACKTOP = __stackBase__;
      return $660;
    default: assert(0, "bad label: " + label);
  }
}
Module["_main"] = _main;
function _isBoxArc($a) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$a;
      var $2=$1;
      var $3=(($2)|(0))==9;
      if ($3) { var $14 = 1;label = 5; break; } else { label = 2; break; }
    case 2: 
      var $5=$1;
      var $6=(($5)|(0))==11;
      if ($6) { var $14 = 1;label = 5; break; } else { label = 3; break; }
    case 3: 
      var $8=$1;
      var $9=(($8)|(0))==10;
      if ($9) { var $14 = 1;label = 5; break; } else { label = 4; break; }
    case 4: 
      var $11=$1;
      var $12=(($11)|(0))==12;
      var $14 = $12;label = 5; break;
    case 5: 
      var $14;
      var $15=(($14)&(1));
      return $15;
    default: assert(0, "bad label: " + label);
  }
}
function _trimExtension($s) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $l;
      $1=$s;
      var $2=$1;
      var $3=_strlen($2);
      $l=$3;
      label = 2; break;
    case 2: 
      var $5=$l;
      var $6=(($5)|(0)) > 0;
      if ($6) { label = 3; break; } else { label = 11; break; }
    case 3: 
      var $8=$l;
      var $9=((($8)-(1))|0);
      $l=$9;
      var $10=$l;
      var $11=$1;
      var $12=(($11+$10)|0);
      var $13=HEAP8[($12)];
      var $14=(($13 << 24) >> 24);
      if ((($14)|(0))==46) {
        label = 4; break;
      }
      else if ((($14)|(0))==47 | (($14)|(0))==92) {
        label = 9; break;
      }
      else {
      label = 10; break;
      }
    case 4: 
      var $16=$l;
      var $17=(($16)|(0)) > 0;
      if ($17) { label = 5; break; } else { label = 8; break; }
    case 5: 
      var $19=$l;
      var $20=((($19)-(1))|0);
      var $21=$1;
      var $22=(($21+$20)|0);
      var $23=HEAP8[($22)];
      var $24=(($23 << 24) >> 24);
      var $25=(($24)|(0))!=92;
      if ($25) { label = 6; break; } else { label = 8; break; }
    case 6: 
      var $27=$l;
      var $28=((($27)-(1))|0);
      var $29=$1;
      var $30=(($29+$28)|0);
      var $31=HEAP8[($30)];
      var $32=(($31 << 24) >> 24);
      var $33=(($32)|(0))!=47;
      if ($33) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $35=$l;
      var $36=$1;
      var $37=(($36+$35)|0);
      HEAP8[($37)]=0;
      label = 8; break;
    case 8: 
      label = 11; break;
    case 9: 
      label = 11; break;
    case 10: 
      label = 2; break;
    case 11: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _countLines($l) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $c;
      $1=$l;
      $c=1;
      label = 2; break;
    case 2: 
      var $3=$c;
      var $4=((($3)+(1))|0);
      $c=$4;
      var $5=$1;
      var $6=_strstr($5, ((5261828)|0));
      $1=$6;
      var $7=$1;
      var $8=(($7)|(0))!=0;
      if ($8) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $10=$1;
      var $11=(($10+2)|0);
      $1=$11;
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $14=$1;
      var $15=(($14)|(0))!=0;
      if ($15) { label = 2; break; } else { label = 6; break; }
    case 6: 
      var $17=$c;
      return $17;
    default: assert(0, "bad label: " + label);
  }
}
function _entityText($ismap, $x, $y, $entLabel, $entUrl, $entId, $entIdUrl, $entColour, $entBgColour) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 1024)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $9;
      var $lines;
      var $l;
      var $lineBuffer=__stackBase__;
      var $lineLabel;
      var $width;
      var $idwidth;
      var $idx;
      var $idy;
      $1=$ismap;
      $2=$x;
      $3=$y;
      $4=$entLabel;
      $5=$entUrl;
      $6=$entId;
      $7=$entIdUrl;
      $8=$entColour;
      $9=$entBgColour;
      var $10=$4;
      var $11=(($10)|(0))!=0;
      if ($11) { label = 2; break; } else { label = 19; break; }
    case 2: 
      var $13=$4;
      var $14=_countLines($13);
      $lines=$14;
      var $15=HEAP32[((((5258648)|0))>>2)];
      var $16=FUNCTION_TABLE[$15](5258624);
      var $17=$lines;
      var $18=((($17)-(1))|0);
      var $19=Math.imul($16,$18);
      var $20=$3;
      var $21=((($20)-($19))|0);
      $3=$21;
      $l=0;
      label = 3; break;
    case 3: 
      var $23=$l;
      var $24=$lines;
      var $25=((($24)-(1))|0);
      var $26=(($23)>>>(0)) < (($25)>>>(0));
      if ($26) { label = 4; break; } else { label = 18; break; }
    case 4: 
      var $28=$4;
      var $29=$l;
      var $30=(($lineBuffer)|0);
      var $31=_getLine($28, $29, $30, 1024);
      $lineLabel=$31;
      var $32=HEAP32[((((5258644)|0))>>2)];
      var $33=$lineLabel;
      var $34=FUNCTION_TABLE[$32](5258624, $33);
      $width=$34;
      var $35=HEAP32[((((5258648)|0))>>2)];
      var $36=FUNCTION_TABLE[$35](5258624);
      var $37=$3;
      var $38=((($37)+($36))|0);
      $3=$38;
      var $39=$5;
      var $40=(($39)|(0))!=0;
      if ($40) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $42=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$42](5258624, 255);
      var $43=$1;
      var $44=$5;
      var $45=$2;
      var $46=$width;
      var $47=Math.floor(((($46)>>>(0)))/(2));
      var $48=((($45)-($47))|0);
      var $49=$3;
      var $50=HEAP32[((((5258648)|0))>>2)];
      var $51=FUNCTION_TABLE[$50](5258624);
      var $52=((($49)-($51))|0);
      var $53=$2;
      var $54=$width;
      var $55=Math.floor(((($54)>>>(0)))/(2));
      var $56=((($53)+($55))|0);
      var $57=$3;
      _ismapRect($43, $44, $48, $52, $56, $57);
      label = 6; break;
    case 6: 
      var $59=$8;
      var $60=(($59)|(0))!=0;
      if ($60) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $62=HEAP32[((((5258672)|0))>>2)];
      var $63=$8;
      var $64=_ADrawGetColour($63);
      FUNCTION_TABLE[$62](5258624, $64);
      label = 8; break;
    case 8: 
      var $66=$9;
      var $67=(($66)|(0))!=0;
      if ($67) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $69=HEAP32[((((5258676)|0))>>2)];
      var $70=$9;
      var $71=_ADrawGetColour($70);
      FUNCTION_TABLE[$69](5258624, $71);
      label = 10; break;
    case 10: 
      var $73=HEAP32[((((5258636)|0))>>2)];
      var $74=$2;
      var $75=$3;
      var $76=$lineLabel;
      FUNCTION_TABLE[$73](5258624, $74, $75, $76);
      var $77=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$77](5258624, 0);
      var $78=HEAP32[((((5258676)|0))>>2)];
      FUNCTION_TABLE[$78](5258624, 16777215);
      var $79=$6;
      var $80=(($79)|(0))!=0;
      if ($80) { label = 11; break; } else { label = 16; break; }
    case 11: 
      var $82=$l;
      var $83=(($82)|(0))==0;
      if ($83) { label = 12; break; } else { label = 16; break; }
    case 12: 
      var $85=$3;
      var $86=HEAP32[((((5258648)|0))>>2)];
      var $87=FUNCTION_TABLE[$86](5258624);
      var $88=((($85)-($87))|0);
      $idy=$88;
      var $89=$2;
      var $90=$width;
      var $91=Math.floor(((($90)>>>(0)))/(2));
      var $92=((($89)+($91))|0);
      $idx=$92;
      var $93=HEAP32[((((5258680)|0))>>2)];
      FUNCTION_TABLE[$93](5258624, 0);
      var $94=HEAP32[((((5258644)|0))>>2)];
      var $95=$6;
      var $96=FUNCTION_TABLE[$94](5258624, $95);
      $idwidth=$96;
      var $97=HEAP32[((((5258648)|0))>>2)];
      var $98=FUNCTION_TABLE[$97](5258624);
      var $99=((($98)+(1))|0);
      var $100=((((($99)|(0)))/(2))&-1);
      var $101=$idy;
      var $102=((($101)+($100))|0);
      $idy=$102;
      var $103=$7;
      var $104=(($103)|(0))!=0;
      if ($104) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $106=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$106](5258624, 255);
      var $107=HEAP32[((((5258640)|0))>>2)];
      var $108=$idx;
      var $109=$idy;
      var $110=$6;
      FUNCTION_TABLE[$107](5258624, $108, $109, $110);
      var $111=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$111](5258624, 0);
      var $112=$1;
      var $113=$7;
      var $114=$idx;
      var $115=$idy;
      var $116=HEAP32[((((5258648)|0))>>2)];
      var $117=FUNCTION_TABLE[$116](5258624);
      var $118=((($115)-($117))|0);
      var $119=$idx;
      var $120=$idwidth;
      var $121=((($119)+($120))|0);
      var $122=$idy;
      _ismapRect($112, $113, $114, $118, $121, $122);
      label = 15; break;
    case 14: 
      var $124=HEAP32[((((5258640)|0))>>2)];
      var $125=$idx;
      var $126=$idy;
      var $127=$6;
      FUNCTION_TABLE[$124](5258624, $125, $126, $127);
      label = 15; break;
    case 15: 
      var $129=HEAP32[((((5258680)|0))>>2)];
      FUNCTION_TABLE[$129](5258624, 1);
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $132=$l;
      var $133=((($132)+(1))|0);
      $l=$133;
      label = 3; break;
    case 18: 
      label = 19; break;
    case 19: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _getArcGradient($m, $rowInfo, $row) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 4)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $s;
      var $v;
      var $rowCount;
      var $skip=__stackBase__;
      var $ystart;
      var $yend;
      $1=$m;
      $2=$rowInfo;
      $3=$row;
      var $4=$1;
      var $5=_MscGetCurrentArcAttrib($4, 12);
      $s=$5;
      var $6=HEAP32[((((5254376)|0))>>2)];
      $v=$6;
      var $7=$s;
      var $8=(($7)|(0))!=0;
      if ($8) { label = 2; break; } else { label = 10; break; }
    case 2: 
      var $10=$2;
      var $11=(($10)|(0))!=0;
      if ($11) { label = 3; break; } else { label = 10; break; }
    case 3: 
      var $13=$1;
      var $14=_MscGetNumArcs($13);
      var $15=$1;
      var $16=_MscGetNumParallelArcs($15);
      var $17=((($14)-($16))|0);
      $rowCount=$17;
      var $18=$s;
      var $19=_sscanf($18, ((5261796)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$skip,tempInt));
      var $20=(($19)|(0))==1;
      if ($20) { label = 4; break; } else { label = 8; break; }
    case 4: 
      var $22=$3;
      var $23=$2;
      var $24=(($23+($22<<4))|0);
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      $ystart=$26;
      var $27=$rowCount;
      var $28=((($27)-(1))|0);
      var $29=$3;
      var $30=HEAP32[(($skip)>>2)];
      var $31=((($29)+($30))|0);
      var $32=(($28)>>>(0)) < (($31)>>>(0));
      if ($32) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $34=$rowCount;
      var $35=((($34)-(1))|0);
      var $41 = $35;label = 7; break;
    case 6: 
      var $37=$3;
      var $38=HEAP32[(($skip)>>2)];
      var $39=((($37)+($38))|0);
      var $41 = $39;label = 7; break;
    case 7: 
      var $41;
      var $42=$2;
      var $43=(($42+($41<<4))|0);
      var $44=(($43+4)|0);
      var $45=HEAP32[(($44)>>2)];
      $yend=$45;
      var $46=$yend;
      var $47=$ystart;
      var $48=((($46)-($47))|0);
      var $49=$v;
      var $50=((($49)+($48))|0);
      $v=$50;
      label = 9; break;
    case 8: 
      var $52=HEAP32[((_stderr)>>2)];
      var $53=$s;
      var $54=_fprintf($52, ((5261712)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$53,tempInt));
      label = 9; break;
    case 9: 
      label = 10; break;
    case 10: 
      var $57=$v;
      STACKTOP = __stackBase__;
      return $57;
    default: assert(0, "bad label: " + label);
  }
}
function _computeCanvasSize($m, $w, $h) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 4)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $rowCount;
      var $textHeight;
      var $rowHeight;
      var $nextYmin;
      var $ymin;
      var $ymax;
      var $yskipmax;
      var $row;
      var $arcType;
      var $arcGradient;
      var $arcLabelLines=__stackBase__;
      var $arcLabelLineCount;
      var $startCol;
      var $endCol;
      $1=$m;
      $2=$w;
      $3=$h;
      var $4=$1;
      var $5=_MscGetNumArcs($4);
      var $6=$1;
      var $7=_MscGetNumParallelArcs($6);
      var $8=((($5)-($7))|0);
      $rowCount=$8;
      var $9=HEAP32[((((5258648)|0))>>2)];
      var $10=FUNCTION_TABLE[$9](5258624);
      $textHeight=$10;
      var $11=$rowCount;
      var $12=($11<<4);
      var $13=_zalloc_s($12);
      var $14=$13;
      $rowHeight=$14;
      $row=0;
      var $15=HEAP32[((((5254368)|0))>>2)];
      $ymin=$15;
      $nextYmin=$15;
      $yskipmax=0;
      $ymax=0;
      var $16=$1;
      _MscResetArcIterator($16);
      label = 2; break;
    case 2: 
      var $18=$1;
      var $19=_MscGetCurrentArcType($18);
      $arcType=$19;
      var $20=$arcType;
      var $21=_isBoxArc($20);
      var $22=(($21)|(0))!=0;
      if ($22) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $28 = 0;label = 5; break;
    case 4: 
      var $25=$1;
      var $26=_getArcGradient($25, 0, 0);
      var $28 = $26;label = 5; break;
    case 5: 
      var $28;
      $arcGradient=$28;
      HEAP32[(($arcLabelLines)>>2)]=0;
      $arcLabelLineCount=0;
      $startCol=-1;
      $endCol=-1;
      var $29=$arcType;
      var $30=(($29)|(0))==8;
      if ($30) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $32=$row;
      var $33=(($32)>>>(0)) > 0;
      if ($33) { label = 7; break; } else { label = 8; break; }
    case 7: 
      label = 9; break;
    case 8: 
      ___assert_func(((5264124)|0), 898, ((5269028)|0), ((5264108)|0));
      throw "Reached an unreachable!"
      label = 9; break;
    case 9: 
      var $38=$row;
      var $39=((($38)-(1))|0);
      $row=$39;
      var $40=$row;
      var $41=$rowHeight;
      var $42=(($41+($40<<4))|0);
      var $43=(($42)|0);
      var $44=HEAP32[(($43)>>2)];
      $ymin=$44;
      var $45=$row;
      var $46=$rowHeight;
      var $47=(($46+($45<<4))|0);
      var $48=(($47+8)|0);
      var $49=HEAP32[(($48)>>2)];
      $nextYmin=$49;
      label = 34; break;
    case 10: 
      var $51=$arcType;
      var $52=(($51)|(0))!=5;
      if ($52) { label = 11; break; } else { label = 14; break; }
    case 11: 
      var $54=$arcType;
      var $55=(($54)|(0))!=6;
      if ($55) { label = 12; break; } else { label = 14; break; }
    case 12: 
      var $57=$arcType;
      var $58=(($57)|(0))!=7;
      if ($58) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $60=$1;
      var $61=$1;
      var $62=_MscGetCurrentArcSource($61);
      var $63=_MscGetEntityIndex($60, $62);
      $startCol=$63;
      var $64=$1;
      var $65=$1;
      var $66=_MscGetCurrentArcDest($65);
      var $67=_MscGetEntityIndex($64, $66);
      $endCol=$67;
      label = 15; break;
    case 14: 
      $startCol=0;
      var $69=$1;
      var $70=_MscGetNumEntities($69);
      var $71=((($70)-(1))|0);
      $endCol=$71;
      label = 15; break;
    case 15: 
      var $73=$1;
      var $74=$arcType;
      var $75=$1;
      var $76=_MscGetCurrentArcAttrib($75, 0);
      var $77=$startCol;
      var $78=$endCol;
      var $79=_computeLabelLines($73, $74, $arcLabelLines, $76, $77, $78);
      $arcLabelLineCount=$79;
      var $80=$row;
      var $81=$rowCount;
      var $82=(($80)>>>(0)) < (($81)>>>(0));
      if ($82) { label = 16; break; } else { label = 17; break; }
    case 16: 
      label = 18; break;
    case 17: 
      ___assert_func(((5264124)|0), 925, ((5269028)|0), ((5261528)|0));
      throw "Reached an unreachable!"
      label = 18; break;
    case 18: 
      var $87=$arcLabelLineCount;
      var $88=$row;
      var $89=$rowHeight;
      var $90=(($89+($88<<4))|0);
      var $91=(($90+12)|0);
      var $92=HEAP32[(($91)>>2)];
      var $93=(($87)>>>(0)) > (($92)>>>(0));
      if ($93) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $95=$arcLabelLineCount;
      var $96=$row;
      var $97=$rowHeight;
      var $98=(($97+($96<<4))|0);
      var $99=(($98+12)|0);
      HEAP32[(($99)>>2)]=$95;
      label = 20; break;
    case 20: 
      var $101=$arcLabelLineCount;
      var $102=HEAP32[(($arcLabelLines)>>2)];
      _freeLabelLines($101, $102);
      var $103=$arcType;
      var $104=(($103)|(0))!=5;
      if ($104) { label = 21; break; } else { label = 27; break; }
    case 21: 
      var $106=$arcType;
      var $107=(($106)|(0))!=6;
      if ($107) { label = 22; break; } else { label = 27; break; }
    case 22: 
      var $109=$arcType;
      var $110=(($109)|(0))!=7;
      if ($110) { label = 23; break; } else { label = 27; break; }
    case 23: 
      var $112=$ymin;
      var $113=HEAP32[((((5254372)|0))>>2)];
      var $114=((($112)+($113))|0);
      $ymax=$114;
      var $115=$row;
      var $116=$rowHeight;
      var $117=(($116+($115<<4))|0);
      var $118=(($117+12)|0);
      var $119=HEAP32[(($118)>>2)];
      var $120=(($119)>>>(0)) > 2;
      if ($120) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $122=$row;
      var $123=$rowHeight;
      var $124=(($123+($122<<4))|0);
      var $125=(($124+12)|0);
      var $126=HEAP32[(($125)>>2)];
      var $129 = $126;label = 26; break;
    case 25: 
      var $129 = 2;label = 26; break;
    case 26: 
      var $129;
      var $130=$textHeight;
      var $131=Math.imul($129,$130);
      var $132=$ymax;
      var $133=((($132)+($131))|0);
      $ymax=$133;
      label = 31; break;
    case 27: 
      var $135=$ymin;
      var $136=HEAP32[((((5254372)|0))>>2)];
      var $137=((($135)+($136))|0);
      $ymax=$137;
      var $138=$row;
      var $139=$rowHeight;
      var $140=(($139+($138<<4))|0);
      var $141=(($140+12)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=(($142)>>>(0)) > 1;
      if ($143) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $145=$row;
      var $146=$rowHeight;
      var $147=(($146+($145<<4))|0);
      var $148=(($147+12)|0);
      var $149=HEAP32[(($148)>>2)];
      var $152 = $149;label = 30; break;
    case 29: 
      var $152 = 1;label = 30; break;
    case 30: 
      var $152;
      var $153=$textHeight;
      var $154=Math.imul($152,$153);
      var $155=$ymax;
      var $156=((($155)+($154))|0);
      $ymax=$156;
      label = 31; break;
    case 31: 
      var $158=$ymax;
      var $159=$nextYmin;
      var $160=(($158)>>>(0)) > (($159)>>>(0));
      if ($160) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $162=$ymax;
      $nextYmin=$162;
      label = 33; break;
    case 33: 
      var $164=$ymin;
      var $165=$row;
      var $166=$rowHeight;
      var $167=(($166+($165<<4))|0);
      var $168=(($167)|0);
      HEAP32[(($168)>>2)]=$164;
      var $169=$nextYmin;
      var $170=HEAP32[((((5254372)|0))>>2)];
      var $171=((($169)-($170))|0);
      var $172=$row;
      var $173=$rowHeight;
      var $174=(($173+($172<<4))|0);
      var $175=(($174+8)|0);
      HEAP32[(($175)>>2)]=$171;
      var $176=$row;
      var $177=$rowHeight;
      var $178=(($177+($176<<4))|0);
      var $179=(($178)|0);
      var $180=HEAP32[(($179)>>2)];
      var $181=$row;
      var $182=$rowHeight;
      var $183=(($182+($181<<4))|0);
      var $184=(($183+8)|0);
      var $185=HEAP32[(($184)>>2)];
      var $186=$row;
      var $187=$rowHeight;
      var $188=(($187+($186<<4))|0);
      var $189=(($188)|0);
      var $190=HEAP32[(($189)>>2)];
      var $191=((($185)-($190))|0);
      var $192=Math.floor(((($191)>>>(0)))/(2));
      var $193=((($180)+($192))|0);
      var $194=$row;
      var $195=$rowHeight;
      var $196=(($195+($194<<4))|0);
      var $197=(($196+4)|0);
      HEAP32[(($197)>>2)]=$193;
      var $198=$row;
      var $199=((($198)+(1))|0);
      $row=$199;
      var $200=$nextYmin;
      $ymin=$200;
      label = 34; break;
    case 34: 
      var $202=$ymax;
      var $203=$arcGradient;
      var $204=((($202)+($203))|0);
      var $205=$ymax;
      var $206=(($204)>>>(0)) > (($205)>>>(0));
      if ($206) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $208=$ymax;
      var $209=$arcGradient;
      var $210=((($208)+($209))|0);
      $yskipmax=$210;
      label = 36; break;
    case 36: 
      label = 37; break;
    case 37: 
      var $213=$1;
      var $214=_MscNextArc($213);
      var $215=(($214)|(0))!=0;
      if ($215) { label = 2; break; } else { label = 38; break; }
    case 38: 
      var $217=$ymax;
      var $218=$yskipmax;
      var $219=(($217)>>>(0)) < (($218)>>>(0));
      if ($219) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $221=$yskipmax;
      $ymax=$221;
      label = 40; break;
    case 40: 
      var $223=$1;
      var $224=_MscGetNumEntities($223);
      var $225=HEAP32[((((5254364)|0))>>2)];
      var $226=Math.imul($224,$225);
      var $227=$2;
      HEAP32[(($227)>>2)]=$226;
      var $228=$ymax;
      var $229=$3;
      HEAP32[(($229)>>2)]=$228;
      var $230=$rowHeight;
      STACKTOP = __stackBase__;
      return $230;
    default: assert(0, "bad label: " + label);
  }
}
function _entityLines($m, $ymin, $ymax, $dotted, $colourRefs) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $t;
      var $x;
      $1=$m;
      $2=$ymin;
      $3=$ymax;
      $4=$dotted;
      $5=$colourRefs;
      $t=0;
      label = 2; break;
    case 2: 
      var $7=$t;
      var $8=$1;
      var $9=_MscGetNumEntities($8);
      var $10=(($7)>>>(0)) < (($9)>>>(0));
      if ($10) { label = 3; break; } else { label = 8; break; }
    case 3: 
      var $12=HEAP32[((((5254364)|0))>>2)];
      var $13=Math.floor(((($12)>>>(0)))/(2));
      var $14=HEAP32[((((5254364)|0))>>2)];
      var $15=$t;
      var $16=Math.imul($14,$15);
      var $17=((($13)+($16))|0);
      $x=$17;
      var $18=HEAP32[((((5258672)|0))>>2)];
      var $19=$t;
      var $20=$5;
      var $21=(($20+($19<<2))|0);
      var $22=HEAP32[(($21)>>2)];
      FUNCTION_TABLE[$18](5258624, $22);
      var $23=$4;
      var $24=(($23)|(0))!=0;
      if ($24) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $26=HEAP32[((((5258628)|0))>>2)];
      var $27=$x;
      var $28=$2;
      var $29=$x;
      var $30=$3;
      FUNCTION_TABLE[$26](5258624, $27, $28, $29, $30);
      label = 6; break;
    case 5: 
      var $32=HEAP32[((((5258624)|0))>>2)];
      var $33=$x;
      var $34=$2;
      var $35=$x;
      var $36=$3;
      FUNCTION_TABLE[$32](5258624, $33, $34, $35, $36);
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $39=$t;
      var $40=((($39)+(1))|0);
      $t=$40;
      label = 2; break;
    case 8: 
      var $42=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$42](5258624, 0);
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _arcLine($m, $y, $ygradient, $startCol, $endCol, $arcLineCol, $hasArrows, $hasBiArrows, $arcType) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $9;
      var $sx;
      var $dx;
      var $span;
      var $mx;
      var $px=__stackBase__;
      var $py=(__stackBase__)+(4);
      var $px1=(__stackBase__)+(8);
      var $py2=(__stackBase__)+(12);
      $1=$m;
      $2=$y;
      $3=$ygradient;
      $4=$startCol;
      $5=$endCol;
      $6=$arcLineCol;
      $7=$hasArrows;
      $8=$hasBiArrows;
      $9=$arcType;
      var $10=$4;
      var $11=HEAP32[((((5254364)|0))>>2)];
      var $12=Math.imul($10,$11);
      var $13=HEAP32[((((5254364)|0))>>2)];
      var $14=Math.floor(((($13)>>>(0)))/(2));
      var $15=((($12)+($14))|0);
      $sx=$15;
      var $16=$5;
      var $17=HEAP32[((((5254364)|0))>>2)];
      var $18=Math.imul($16,$17);
      var $19=HEAP32[((((5254364)|0))>>2)];
      var $20=Math.floor(((($19)>>>(0)))/(2));
      var $21=((($18)+($20))|0);
      $dx=$21;
      var $22=$6;
      var $23=(($22)|(0))!=0;
      if ($23) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $25=HEAP32[((((5258672)|0))>>2)];
      var $26=$6;
      var $27=_ADrawGetColour($26);
      FUNCTION_TABLE[$25](5258624, $27);
      label = 3; break;
    case 3: 
      var $29=$4;
      var $30=$5;
      var $31=(($29)|(0))!=(($30)|(0));
      if ($31) { label = 4; break; } else { label = 24; break; }
    case 4: 
      var $33=$9;
      var $34=(($33)|(0))==1;
      if ($34) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $36=HEAP32[((((5258628)|0))>>2)];
      var $37=$sx;
      var $38=$2;
      var $39=$dx;
      var $40=$2;
      var $41=$3;
      var $42=((($40)+($41))|0);
      FUNCTION_TABLE[$36](5258624, $37, $38, $39, $42);
      label = 13; break;
    case 6: 
      var $44=$9;
      var $45=(($44)|(0))==4;
      if ($45) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $47=HEAP32[((((5258624)|0))>>2)];
      var $48=$sx;
      var $49=$2;
      var $50=((($49)-(1))|0);
      var $51=$dx;
      var $52=$2;
      var $53=((($52)-(1))|0);
      var $54=$3;
      var $55=((($53)+($54))|0);
      FUNCTION_TABLE[$47](5258624, $48, $50, $51, $55);
      var $56=HEAP32[((((5258624)|0))>>2)];
      var $57=$sx;
      var $58=$2;
      var $59=((($58)+(1))|0);
      var $60=$dx;
      var $61=$2;
      var $62=((($61)+(1))|0);
      var $63=$3;
      var $64=((($62)+($63))|0);
      FUNCTION_TABLE[$56](5258624, $57, $59, $60, $64);
      label = 12; break;
    case 8: 
      var $66=$9;
      var $67=(($66)|(0))==13;
      if ($67) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $69=$dx;
      var $70=$sx;
      var $71=((($69)-($70))|0);
      $span=$71;
      var $72=$sx;
      var $73=$span;
      var $74=((((($73)|(0)))/(4))&-1);
      var $75=((($74)*(3))&-1);
      var $76=((($72)+($75))|0);
      $mx=$76;
      var $77=HEAP32[((((5258624)|0))>>2)];
      var $78=$sx;
      var $79=$2;
      var $80=$mx;
      var $81=$2;
      var $82=$3;
      var $83=((($81)+($82))|0);
      FUNCTION_TABLE[$77](5258624, $78, $79, $80, $83);
      $7=0;
      var $84=HEAP32[((((5258624)|0))>>2)];
      var $85=$mx;
      var $86=((($85)-(4))|0);
      var $87=$2;
      var $88=$3;
      var $89=((($87)+($88))|0);
      var $90=((($89)-(4))|0);
      var $91=$mx;
      var $92=((($91)+(4))|0);
      var $93=$2;
      var $94=$3;
      var $95=((($93)+($94))|0);
      var $96=((($95)+(4))|0);
      FUNCTION_TABLE[$84](5258624, $86, $90, $92, $96);
      var $97=HEAP32[((((5258624)|0))>>2)];
      var $98=$mx;
      var $99=((($98)+(4))|0);
      var $100=$2;
      var $101=$3;
      var $102=((($100)+($101))|0);
      var $103=((($102)-(4))|0);
      var $104=$mx;
      var $105=((($104)-(4))|0);
      var $106=$2;
      var $107=$3;
      var $108=((($106)+($107))|0);
      var $109=((($108)+(4))|0);
      FUNCTION_TABLE[$97](5258624, $99, $103, $105, $109);
      label = 11; break;
    case 10: 
      var $111=HEAP32[((((5258624)|0))>>2)];
      var $112=$sx;
      var $113=$2;
      var $114=$dx;
      var $115=$2;
      var $116=$3;
      var $117=((($115)+($116))|0);
      FUNCTION_TABLE[$111](5258624, $112, $113, $114, $117);
      label = 11; break;
    case 11: 
      label = 12; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $121=$7;
      var $122=(($121)|(0))!=0;
      if ($122) { label = 14; break; } else { label = 23; break; }
    case 14: 
      var $124=$4;
      var $125=$5;
      var $126=(($124)>>>(0)) < (($125)>>>(0));
      if ($126) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $128=$dx;
      var $129=$2;
      var $130=$3;
      var $131=((($129)+($130))|0);
      var $132=$9;
      _arrowR($128, $131, $132);
      label = 17; break;
    case 16: 
      var $134=$dx;
      var $135=$2;
      var $136=$3;
      var $137=((($135)+($136))|0);
      var $138=$9;
      _arrowL($134, $137, $138);
      label = 17; break;
    case 17: 
      var $140=$8;
      var $141=(($140)|(0))!=0;
      if ($141) { label = 18; break; } else { label = 22; break; }
    case 18: 
      var $143=$4;
      var $144=$5;
      var $145=(($143)>>>(0)) < (($144)>>>(0));
      if ($145) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $147=$sx;
      var $148=$2;
      var $149=$3;
      var $150=((($148)+($149))|0);
      var $151=$9;
      _arrowL($147, $150, $151);
      label = 21; break;
    case 20: 
      var $153=$sx;
      var $154=$2;
      var $155=$3;
      var $156=((($154)+($155))|0);
      var $157=$9;
      _arrowR($153, $156, $157);
      label = 21; break;
    case 21: 
      label = 22; break;
    case 22: 
      label = 23; break;
    case 23: 
      label = 50; break;
    case 24: 
      var $162=$4;
      var $163=$1;
      var $164=_MscGetNumEntities($163);
      var $165=Math.floor(((($164)>>>(0)))/(2));
      var $166=(($162)>>>(0)) < (($165)>>>(0));
      if ($166) { label = 25; break; } else { label = 37; break; }
    case 25: 
      var $168=$9;
      var $169=(($168)|(0))==1;
      if ($169) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $171=HEAP32[((((5258668)|0))>>2)];
      var $172=$sx;
      var $173=$2;
      var $174=$3;
      var $175=Math.floor(((($174)>>>(0)))/(2));
      var $176=((($173)+($175))|0);
      var $177=HEAP32[((((5254364)|0))>>2)];
      var $178=HEAP32[((((5254412)|0))>>2)];
      var $179=$3;
      var $180=((($178)+($179))|0);
      FUNCTION_TABLE[$171](5258624, $172, $176, $177, $180, 90, 270);
      label = 34; break;
    case 27: 
      var $182=$9;
      var $183=(($182)|(0))==4;
      if ($183) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $185=HEAP32[((((5258664)|0))>>2)];
      var $186=$sx;
      var $187=$2;
      var $188=((($187)-(1))|0);
      var $189=$3;
      var $190=Math.floor(((($189)>>>(0)))/(2));
      var $191=((($188)+($190))|0);
      var $192=HEAP32[((((5254364)|0))>>2)];
      var $193=HEAP32[((((5254412)|0))>>2)];
      var $194=$3;
      var $195=((($193)+($194))|0);
      FUNCTION_TABLE[$185](5258624, $186, $191, $192, $195, 90, 270);
      var $196=HEAP32[((((5258664)|0))>>2)];
      var $197=$sx;
      var $198=$2;
      var $199=((($198)+(1))|0);
      var $200=$3;
      var $201=Math.floor(((($200)>>>(0)))/(2));
      var $202=((($199)+($201))|0);
      var $203=HEAP32[((((5254364)|0))>>2)];
      var $204=HEAP32[((((5254412)|0))>>2)];
      var $205=$3;
      var $206=((($204)+($205))|0);
      FUNCTION_TABLE[$196](5258624, $197, $202, $203, $206, 90, 270);
      label = 33; break;
    case 29: 
      var $208=$9;
      var $209=(($208)|(0))==13;
      if ($209) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $211=HEAP32[((((5258664)|0))>>2)];
      var $212=$sx;
      var $213=$2;
      var $214=((($213)-(1))|0);
      var $215=$3;
      var $216=Math.floor(((($215)>>>(0)))/(2));
      var $217=((($214)+($216))|0);
      var $218=HEAP32[((((5254364)|0))>>2)];
      var $219=((($218)-(8))|0);
      var $220=HEAP32[((((5254412)|0))>>2)];
      var $221=$3;
      var $222=((($220)+($221))|0);
      FUNCTION_TABLE[$211](5258624, $212, $217, $219, $222, 135, 270);
      $7=0;
      var $223=$sx;
      var $224=(($223)>>>(0));
      var $225=$2;
      var $226=((($225)-(1))|0);
      var $227=$3;
      var $228=Math.floor(((($227)>>>(0)))/(2));
      var $229=((($226)+($228))|0);
      var $230=(($229)>>>(0));
      var $231=HEAP32[((((5254364)|0))>>2)];
      var $232=((($231)-(8))|0);
      var $233=(($232)>>>(0));
      var $234=HEAP32[((((5254412)|0))>>2)];
      var $235=$3;
      var $236=((($234)+($235))|0);
      var $237=(($236)>>>(0));
      _ADrawComputeArcPoint($224, $230, $233, $237, 135, $px, $py);
      var $238=HEAP32[((((5258624)|0))>>2)];
      var $239=HEAP32[(($px)>>2)];
      var $240=((($239)-(4))|0);
      var $241=HEAP32[(($py)>>2)];
      var $242=((($241)-(4))|0);
      var $243=HEAP32[(($px)>>2)];
      var $244=((($243)+(4))|0);
      var $245=HEAP32[(($py)>>2)];
      var $246=((($245)+(4))|0);
      FUNCTION_TABLE[$238](5258624, $240, $242, $244, $246);
      var $247=HEAP32[((((5258624)|0))>>2)];
      var $248=HEAP32[(($px)>>2)];
      var $249=((($248)+(4))|0);
      var $250=HEAP32[(($py)>>2)];
      var $251=((($250)-(4))|0);
      var $252=HEAP32[(($px)>>2)];
      var $253=((($252)-(4))|0);
      var $254=HEAP32[(($py)>>2)];
      var $255=((($254)+(4))|0);
      FUNCTION_TABLE[$247](5258624, $249, $251, $253, $255);
      label = 32; break;
    case 31: 
      var $257=HEAP32[((((5258664)|0))>>2)];
      var $258=$sx;
      var $259=$2;
      var $260=$3;
      var $261=Math.floor(((($260)>>>(0)))/(2));
      var $262=((($259)+($261))|0);
      var $263=HEAP32[((((5254364)|0))>>2)];
      var $264=((($263)-(4))|0);
      var $265=HEAP32[((((5254412)|0))>>2)];
      var $266=$3;
      var $267=((($265)+($266))|0);
      FUNCTION_TABLE[$257](5258624, $258, $262, $264, $267, 90, 270);
      label = 32; break;
    case 32: 
      label = 33; break;
    case 33: 
      label = 34; break;
    case 34: 
      var $271=$7;
      var $272=(($271)|(0))!=0;
      if ($272) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $274=$dx;
      var $275=$2;
      var $276=$3;
      var $277=((($275)+($276))|0);
      var $278=HEAP32[((((5254412)|0))>>2)];
      var $279=Math.floor(((($278)>>>(0)))/(2));
      var $280=((($277)+($279))|0);
      var $281=$9;
      _arrowR($274, $280, $281);
      label = 36; break;
    case 36: 
      label = 49; break;
    case 37: 
      var $284=$9;
      var $285=(($284)|(0))==1;
      if ($285) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $287=HEAP32[((((5258668)|0))>>2)];
      var $288=$sx;
      var $289=$2;
      var $290=$3;
      var $291=Math.floor(((($290)>>>(0)))/(2));
      var $292=((($289)+($291))|0);
      var $293=HEAP32[((((5254364)|0))>>2)];
      var $294=HEAP32[((((5254412)|0))>>2)];
      var $295=$3;
      var $296=((($294)+($295))|0);
      FUNCTION_TABLE[$287](5258624, $288, $292, $293, $296, 270, 90);
      label = 46; break;
    case 39: 
      var $298=$9;
      var $299=(($298)|(0))==4;
      if ($299) { label = 40; break; } else { label = 41; break; }
    case 40: 
      var $301=HEAP32[((((5258664)|0))>>2)];
      var $302=$sx;
      var $303=$2;
      var $304=((($303)-(1))|0);
      var $305=$3;
      var $306=Math.floor(((($305)>>>(0)))/(2));
      var $307=((($304)+($306))|0);
      var $308=HEAP32[((((5254364)|0))>>2)];
      var $309=HEAP32[((((5254412)|0))>>2)];
      var $310=$3;
      var $311=((($309)+($310))|0);
      FUNCTION_TABLE[$301](5258624, $302, $307, $308, $311, 270, 90);
      var $312=HEAP32[((((5258664)|0))>>2)];
      var $313=$sx;
      var $314=$2;
      var $315=((($314)+(1))|0);
      var $316=$3;
      var $317=Math.floor(((($316)>>>(0)))/(2));
      var $318=((($315)+($317))|0);
      var $319=HEAP32[((((5254364)|0))>>2)];
      var $320=HEAP32[((((5254412)|0))>>2)];
      var $321=$3;
      var $322=((($320)+($321))|0);
      FUNCTION_TABLE[$312](5258624, $313, $318, $319, $322, 270, 90);
      label = 45; break;
    case 41: 
      var $324=$9;
      var $325=(($324)|(0))==13;
      if ($325) { label = 42; break; } else { label = 43; break; }
    case 42: 
      var $327=HEAP32[((((5258664)|0))>>2)];
      var $328=$sx;
      var $329=$2;
      var $330=((($329)-(1))|0);
      var $331=$3;
      var $332=Math.floor(((($331)>>>(0)))/(2));
      var $333=((($330)+($332))|0);
      var $334=HEAP32[((((5254364)|0))>>2)];
      var $335=((($334)-(8))|0);
      var $336=HEAP32[((((5254412)|0))>>2)];
      var $337=$3;
      var $338=((($336)+($337))|0);
      FUNCTION_TABLE[$327](5258624, $328, $333, $335, $338, 270, 45);
      $7=0;
      var $339=$sx;
      var $340=(($339)>>>(0));
      var $341=$2;
      var $342=((($341)-(1))|0);
      var $343=$3;
      var $344=Math.floor(((($343)>>>(0)))/(2));
      var $345=((($342)+($344))|0);
      var $346=(($345)>>>(0));
      var $347=HEAP32[((((5254364)|0))>>2)];
      var $348=((($347)-(8))|0);
      var $349=(($348)>>>(0));
      var $350=HEAP32[((((5254412)|0))>>2)];
      var $351=$3;
      var $352=((($350)+($351))|0);
      var $353=(($352)>>>(0));
      _ADrawComputeArcPoint($340, $346, $349, $353, 45, $px1, $py2);
      var $354=HEAP32[((((5258624)|0))>>2)];
      var $355=HEAP32[(($px1)>>2)];
      var $356=((($355)-(4))|0);
      var $357=HEAP32[(($py2)>>2)];
      var $358=((($357)-(4))|0);
      var $359=HEAP32[(($px1)>>2)];
      var $360=((($359)+(4))|0);
      var $361=HEAP32[(($py2)>>2)];
      var $362=((($361)+(4))|0);
      FUNCTION_TABLE[$354](5258624, $356, $358, $360, $362);
      var $363=HEAP32[((((5258624)|0))>>2)];
      var $364=HEAP32[(($px1)>>2)];
      var $365=((($364)+(4))|0);
      var $366=HEAP32[(($py2)>>2)];
      var $367=((($366)-(4))|0);
      var $368=HEAP32[(($px1)>>2)];
      var $369=((($368)-(4))|0);
      var $370=HEAP32[(($py2)>>2)];
      var $371=((($370)+(4))|0);
      FUNCTION_TABLE[$363](5258624, $365, $367, $369, $371);
      label = 44; break;
    case 43: 
      var $373=HEAP32[((((5258664)|0))>>2)];
      var $374=$sx;
      var $375=$2;
      var $376=$3;
      var $377=Math.floor(((($376)>>>(0)))/(2));
      var $378=((($375)+($377))|0);
      var $379=HEAP32[((((5254364)|0))>>2)];
      var $380=HEAP32[((((5254412)|0))>>2)];
      var $381=$3;
      var $382=((($380)+($381))|0);
      FUNCTION_TABLE[$373](5258624, $374, $378, $379, $382, 270, 90);
      label = 44; break;
    case 44: 
      label = 45; break;
    case 45: 
      label = 46; break;
    case 46: 
      var $386=$7;
      var $387=(($386)|(0))!=0;
      if ($387) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $389=$dx;
      var $390=$2;
      var $391=$3;
      var $392=((($390)+($391))|0);
      var $393=HEAP32[((((5254412)|0))>>2)];
      var $394=Math.floor(((($393)>>>(0)))/(2));
      var $395=((($392)+($394))|0);
      var $396=$9;
      _arrowL($389, $395, $396);
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      label = 50; break;
    case 50: 
      var $400=$6;
      var $401=(($400)|(0))!=0;
      if ($401) { label = 51; break; } else { label = 52; break; }
    case 51: 
      var $403=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$403](5258624, 0);
      label = 52; break;
    case 52: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _computeLabelLines($m, $arcType, $lines, $label, $startCol, $endCol) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $width;
      var $nAllocLines;
      var $retLines;
      var $c;
      var $nextLine;
      var $lineLen;
      $1=$m;
      $2=$arcType;
      $3=$lines;
      $4=$label;
      $5=$startCol;
      $6=$endCol;
      $nAllocLines=8;
      var $7=$nAllocLines;
      var $8=($7<<2);
      var $9=_malloc_s($8);
      var $10=$9;
      $retLines=$10;
      $c=0;
      var $11=$5;
      var $12=(($11)|(0)) >= 0;
      if ($12) { label = 2; break; } else { label = 4; break; }
    case 2: 
      var $14=$5;
      var $15=$1;
      var $16=_MscGetNumEntities($15);
      var $17=(($14)|(0)) < (($16)|(0));
      if ($17) { label = 3; break; } else { label = 4; break; }
    case 3: 
      label = 5; break;
    case 4: 
      ___assert_func(((5264124)|0), 428, ((5269008)|0), ((5263244)|0));
      throw "Reached an unreachable!"
      label = 5; break;
    case 5: 
      var $22=$5;
      var $23=(($22)|(0)) >= -1;
      if ($23) { label = 6; break; } else { label = 8; break; }
    case 6: 
      var $25=$5;
      var $26=$1;
      var $27=_MscGetNumEntities($26);
      var $28=(($25)|(0)) < (($27)|(0));
      if ($28) { label = 7; break; } else { label = 8; break; }
    case 7: 
      label = 9; break;
    case 8: 
      ___assert_func(((5264124)|0), 429, ((5269008)|0), ((5263068)|0));
      throw "Reached an unreachable!"
      label = 9; break;
    case 9: 
      var $33=$2;
      var $34=_isBoxArc($33);
      var $35=(($34)|(0))!=0;
      if ($35) { label = 11; break; } else { label = 10; break; }
    case 10: 
      var $37=HEAP32[((((5254400)|0))>>2)];
      var $38=(($37)|(0))!=0;
      if ($38) { label = 11; break; } else { label = 22; break; }
    case 11: 
      var $40=$6;
      var $41=(($40)|(0))==-1;
      if ($41) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $43=HEAP32[((((5254364)|0))>>2)];
      var $44=$1;
      var $45=_MscGetNumEntities($44);
      var $46=Math.imul($43,$45);
      $width=$46;
      label = 17; break;
    case 13: 
      var $48=$5;
      var $49=$6;
      var $50=(($48)|(0)) < (($49)|(0));
      if ($50) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $52=HEAP32[((((5254364)|0))>>2)];
      var $53=$6;
      var $54=$5;
      var $55=((($53)-($54))|0);
      var $56=((($55)+(1))|0);
      var $57=Math.imul($52,$56);
      $width=$57;
      label = 16; break;
    case 15: 
      var $59=HEAP32[((((5254364)|0))>>2)];
      var $60=$5;
      var $61=$6;
      var $62=((($60)-($61))|0);
      var $63=((($62)+(1))|0);
      var $64=Math.imul($59,$63);
      $width=$64;
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $67=$2;
      var $68=_isBoxArc($67);
      var $69=(($68)|(0))!=0;
      if ($69) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $71=HEAP32[((((5254380)|0))>>2)];
      var $72=HEAP32[((((5254384)|0))>>2)];
      var $73=((($71)+($72))|0);
      var $74=($73<<1);
      var $75=$width;
      var $76=((($75)-($74))|0);
      $width=$76;
      label = 19; break;
    case 19: 
      var $78=$2;
      var $79=(($78)|(0))==12;
      if ($79) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $81=HEAP32[((((5254392)|0))>>2)];
      var $82=$width;
      var $83=((($82)-($81))|0);
      $width=$83;
      label = 21; break;
    case 21: 
      label = 23; break;
    case 22: 
      $width=-1;
      label = 23; break;
    case 23: 
      label = 24; break;
    case 24: 
      var $88=$4;
      var $89=(($88)|(0))!=0;
      if ($89) { label = 25; break; } else { label = 34; break; }
    case 25: 
      var $91=$4;
      var $92=_strnl($91);
      $nextLine=$92;
      var $93=$nextLine;
      var $94=(($93)|(0))!=0;
      if ($94) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $96=$nextLine;
      var $97=$4;
      var $98=$96;
      var $99=$97;
      var $100=((($98)-($99))|0);
      $lineLen=$100;
      var $101=$lineLen;
      var $102=((($101)+(1))|0);
      var $103=_malloc_s($102);
      var $104=$c;
      var $105=$retLines;
      var $106=(($105+($104<<2))|0);
      HEAP32[(($106)>>2)]=$103;
      var $107=$c;
      var $108=$retLines;
      var $109=(($108+($107<<2))|0);
      var $110=HEAP32[(($109)>>2)];
      var $111=$4;
      var $112=$lineLen;
      assert($112 % 1 === 0);_memcpy($110, $111, $112);
      var $113=$lineLen;
      var $114=$c;
      var $115=$retLines;
      var $116=(($115+($114<<2))|0);
      var $117=HEAP32[(($116)>>2)];
      var $118=(($117+$113)|0);
      HEAP8[($118)]=0;
      var $119=$nextLine;
      var $120=(($119+2)|0);
      $4=$120;
      label = 28; break;
    case 27: 
      var $122=$4;
      var $123=_strdup_s($122);
      var $124=$c;
      var $125=$retLines;
      var $126=(($125+($124<<2))|0);
      HEAP32[(($126)>>2)]=$123;
      $4=0;
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      var $129=$c;
      var $130=((($129)+(2))|0);
      var $131=$nAllocLines;
      var $132=(($130)>>>(0)) >= (($131)>>>(0));
      if ($132) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $134=$nAllocLines;
      var $135=((($134)+(8))|0);
      $nAllocLines=$135;
      var $136=$retLines;
      var $137=$136;
      var $138=$nAllocLines;
      var $139=($138<<2);
      var $140=_realloc_s($137, $139);
      var $141=$140;
      $retLines=$141;
      label = 31; break;
    case 31: 
      var $143=$c;
      var $144=$retLines;
      var $145=(($144+($143<<2))|0);
      var $146=HEAP32[(($145)>>2)];
      var $147=$width;
      var $148=_splitStringToWidth($146, $147);
      var $149=$c;
      var $150=((($149)+(1))|0);
      var $151=$retLines;
      var $152=(($151+($150<<2))|0);
      HEAP32[(($152)>>2)]=$148;
      var $153=$c;
      var $154=((($153)+(1))|0);
      $c=$154;
      label = 32; break;
    case 32: 
      var $156=$c;
      var $157=$retLines;
      var $158=(($157+($156<<2))|0);
      var $159=HEAP32[(($158)>>2)];
      var $160=(($159)|(0))!=0;
      if ($160) { label = 29; break; } else { label = 33; break; }
    case 33: 
      label = 24; break;
    case 34: 
      var $163=$retLines;
      var $164=$3;
      HEAP32[(($164)>>2)]=$163;
      var $165=$c;
      return $165;
    default: assert(0, "bad label: " + label);
  }
}
function _arcText($m, $ismap, $outwidth, $ymid, $ygradient, $startCol, $endCol, $arcLabelLineCount, $arcLabelLines, $arcUrl, $arcId, $arcIdUrl, $arcTextColour, $arcTextBgColour, $arcType) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $9;
      var $10;
      var $11;
      var $12;
      var $13;
      var $14;
      var $15;
      var $l;
      var $y;
      var $yoff;
      var $lineLabel;
      var $width;
      var $x;
      var $idwidth;
      var $idx;
      var $idy;
      $1=$m;
      $2=$ismap;
      $3=$outwidth;
      $4=$ymid;
      $5=$ygradient;
      $6=$startCol;
      $7=$endCol;
      $8=$arcLabelLineCount;
      $9=$arcLabelLines;
      $10=$arcUrl;
      $11=$arcId;
      $12=$arcIdUrl;
      $13=$arcTextColour;
      $14=$arcTextBgColour;
      $15=$arcType;
      var $16=$8;
      var $17=(($16)|(0))==1;
      if ($17) { label = 2; break; } else { label = 7; break; }
    case 2: 
      var $19=$15;
      var $20=_isBoxArc($19);
      var $21=(($20)|(0))!=0;
      if ($21) { label = 7; break; } else { label = 3; break; }
    case 3: 
      var $23=$15;
      var $24=(($23)|(0))!=5;
      if ($24) { label = 4; break; } else { label = 7; break; }
    case 4: 
      var $26=$15;
      var $27=(($26)|(0))!=6;
      if ($27) { label = 5; break; } else { label = 7; break; }
    case 5: 
      var $29=$15;
      var $30=(($29)|(0))!=7;
      if ($30) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $32=$4;
      var $33=$5;
      var $34=((((($33)|(0)))/(2))&-1);
      var $35=((($32)+($34))|0);
      var $36=HEAP32[((((5258648)|0))>>2)];
      var $37=FUNCTION_TABLE[$36](5258624);
      var $38=((($35)-($37))|0);
      $y=$38;
      label = 8; break;
    case 7: 
      var $40=$5;
      var $41=HEAP32[((((5258648)|0))>>2)];
      var $42=FUNCTION_TABLE[$41](5258624);
      var $43=$8;
      var $44=Math.imul($42,$43);
      var $45=((($40)-($44))|0);
      $yoff=$45;
      var $46=$4;
      var $47=$yoff;
      var $48=((((($47)|(0)))/(2))&-1);
      var $49=((($46)+($48))|0);
      $y=$49;
      label = 8; break;
    case 8: 
      $l=0;
      label = 9; break;
    case 9: 
      var $52=$l;
      var $53=$8;
      var $54=(($52)>>>(0)) < (($53)>>>(0));
      if ($54) { label = 10; break; } else { label = 34; break; }
    case 10: 
      var $56=$l;
      var $57=$9;
      var $58=(($57+($56<<2))|0);
      var $59=HEAP32[(($58)>>2)];
      $lineLabel=$59;
      var $60=HEAP32[((((5258644)|0))>>2)];
      var $61=$lineLabel;
      var $62=FUNCTION_TABLE[$60](5258624, $61);
      $width=$62;
      var $63=$6;
      var $64=$7;
      var $65=((($63)+($64))|0);
      var $66=((($65)+(1))|0);
      var $67=HEAP32[((((5254364)|0))>>2)];
      var $68=Math.imul($66,$67);
      var $69=Math.floor(((($68)>>>(0)))/(2));
      $x=$69;
      var $70=HEAP32[((((5258648)|0))>>2)];
      var $71=FUNCTION_TABLE[$70](5258624);
      var $72=$y;
      var $73=((($72)+($71))|0);
      $y=$73;
      var $74=$6;
      var $75=$7;
      var $76=(($74)|(0))!=(($75)|(0));
      if ($76) { label = 12; break; } else { label = 11; break; }
    case 11: 
      var $78=$15;
      var $79=_isBoxArc($78);
      var $80=(($79)|(0))!=0;
      if ($80) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $82=$width;
      var $83=Math.floor(((($82)>>>(0)))/(2));
      var $84=$x;
      var $85=((($84)-($83))|0);
      $x=$85;
      label = 17; break;
    case 13: 
      var $87=$6;
      var $88=$1;
      var $89=_MscGetNumEntities($88);
      var $90=Math.floor(((($89)>>>(0)))/(2));
      var $91=(($87)>>>(0)) < (($90)>>>(0));
      if ($91) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $93=HEAP32[((((5254416)|0))>>2)];
      var $94=$x;
      var $95=((($94)+($93))|0);
      $x=$95;
      label = 16; break;
    case 15: 
      var $97=$width;
      var $98=HEAP32[((((5254420)|0))>>2)];
      var $99=((($97)+($98))|0);
      var $100=$x;
      var $101=((($100)-($99))|0);
      $x=$101;
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $104=$x;
      var $105=$width;
      var $106=((($104)+($105))|0);
      var $107=$3;
      var $108=(($106)>>>(0)) > (($107)>>>(0));
      if ($108) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $110=$3;
      var $111=$width;
      var $112=((($110)-($111))|0);
      $x=$112;
      label = 19; break;
    case 19: 
      var $114=$x;
      var $115=(($114)|(0)) < 0;
      if ($115) { label = 20; break; } else { label = 21; break; }
    case 20: 
      $x=0;
      label = 21; break;
    case 21: 
      var $118=$10;
      var $119=(($118)|(0))!=0;
      if ($119) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $121=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$121](5258624, 255);
      var $122=$2;
      var $123=$10;
      var $124=$x;
      var $125=$y;
      var $126=HEAP32[((((5258648)|0))>>2)];
      var $127=FUNCTION_TABLE[$126](5258624);
      var $128=((($125)-($127))|0);
      var $129=$x;
      var $130=$width;
      var $131=((($129)+($130))|0);
      var $132=$y;
      _ismapRect($122, $123, $124, $128, $131, $132);
      label = 23; break;
    case 23: 
      var $134=$13;
      var $135=(($134)|(0))!=0;
      if ($135) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $137=HEAP32[((((5258672)|0))>>2)];
      var $138=$13;
      var $139=_ADrawGetColour($138);
      FUNCTION_TABLE[$137](5258624, $139);
      label = 25; break;
    case 25: 
      var $141=$14;
      var $142=(($141)|(0))!=0;
      if ($142) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $144=HEAP32[((((5258676)|0))>>2)];
      var $145=$14;
      var $146=_ADrawGetColour($145);
      FUNCTION_TABLE[$144](5258624, $146);
      label = 27; break;
    case 27: 
      var $148=HEAP32[((((5258640)|0))>>2)];
      var $149=$x;
      var $150=$y;
      var $151=$lineLabel;
      FUNCTION_TABLE[$148](5258624, $149, $150, $151);
      var $152=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$152](5258624, 0);
      var $153=HEAP32[((((5258676)|0))>>2)];
      FUNCTION_TABLE[$153](5258624, 16777215);
      var $154=$11;
      var $155=(($154)|(0))!=0;
      if ($155) { label = 28; break; } else { label = 32; break; }
    case 28: 
      var $157=$l;
      var $158=(($157)|(0))==0;
      if ($158) { label = 29; break; } else { label = 32; break; }
    case 29: 
      var $160=$y;
      var $161=HEAP32[((((5258648)|0))>>2)];
      var $162=FUNCTION_TABLE[$161](5258624);
      var $163=((($160)-($162))|0);
      $idy=$163;
      var $164=$x;
      var $165=$width;
      var $166=((($164)+($165))|0);
      $idx=$166;
      var $167=HEAP32[((((5258680)|0))>>2)];
      FUNCTION_TABLE[$167](5258624, 0);
      var $168=HEAP32[((((5258644)|0))>>2)];
      var $169=$11;
      var $170=FUNCTION_TABLE[$168](5258624, $169);
      $idwidth=$170;
      var $171=HEAP32[((((5258648)|0))>>2)];
      var $172=FUNCTION_TABLE[$171](5258624);
      var $173=((($172)+(1))|0);
      var $174=((((($173)|(0)))/(2))&-1);
      var $175=$idy;
      var $176=((($175)+($174))|0);
      $idy=$176;
      var $177=$12;
      var $178=(($177)|(0))!=0;
      if ($178) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $180=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$180](5258624, 255);
      var $181=$2;
      var $182=$12;
      var $183=$idx;
      var $184=$idy;
      var $185=HEAP32[((((5258648)|0))>>2)];
      var $186=FUNCTION_TABLE[$185](5258624);
      var $187=((($184)-($186))|0);
      var $188=$idx;
      var $189=$idwidth;
      var $190=((($188)+($189))|0);
      var $191=$idy;
      _ismapRect($181, $182, $183, $187, $190, $191);
      label = 31; break;
    case 31: 
      var $193=HEAP32[((((5258640)|0))>>2)];
      var $194=$idx;
      var $195=$idy;
      var $196=$11;
      FUNCTION_TABLE[$193](5258624, $194, $195, $196);
      var $197=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$197](5258624, 0);
      var $198=HEAP32[((((5258680)|0))>>2)];
      FUNCTION_TABLE[$198](5258624, 1);
      label = 32; break;
    case 32: 
      label = 33; break;
    case 33: 
      var $201=$l;
      var $202=((($201)+(1))|0);
      $l=$202;
      label = 9; break;
    case 34: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _freeLabelLines($n, $lines) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$n;
      $2=$lines;
      label = 2; break;
    case 2: 
      var $4=$1;
      var $5=(($4)>>>(0)) > 0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $7=$1;
      var $8=((($7)-(1))|0);
      $1=$8;
      var $9=$1;
      var $10=$2;
      var $11=(($10+($9<<2))|0);
      var $12=HEAP32[(($11)>>2)];
      _free($12);
      label = 2; break;
    case 4: 
      var $14=$2;
      var $15=$14;
      _free($15);
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _arcBox($ymin, $ymax, $boxStart, $boxEnd, $boxType, $lineColour, $bgColour) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $t;
      var $x1;
      var $x2;
      var $ymid;
      $1=$ymin;
      $2=$ymax;
      $3=$boxStart;
      $4=$boxEnd;
      $5=$boxType;
      $6=$lineColour;
      $7=$bgColour;
      var $8=$3;
      var $9=$4;
      var $10=(($8)>>>(0)) > (($9)>>>(0));
      if ($10) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $12=$4;
      $t=$12;
      var $13=$3;
      $4=$13;
      var $14=$t;
      $3=$14;
      label = 3; break;
    case 3: 
      var $16=HEAP32[((((5254364)|0))>>2)];
      var $17=$3;
      var $18=Math.imul($16,$17);
      var $19=HEAP32[((((5254380)|0))>>2)];
      var $20=((($18)+($19))|0);
      $x1=$20;
      var $21=HEAP32[((((5254364)|0))>>2)];
      var $22=$4;
      var $23=((($22)+(1))|0);
      var $24=Math.imul($21,$23);
      var $25=HEAP32[((((5254380)|0))>>2)];
      var $26=((($24)-($25))|0);
      $x2=$26;
      var $27=$1;
      var $28=$2;
      var $29=((($27)+($28))|0);
      var $30=Math.floor(((($29)>>>(0)))/(2));
      $ymid=$30;
      var $31=$7;
      var $32=(($31)|(0))!=0;
      if ($32) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $34=HEAP32[((((5258672)|0))>>2)];
      var $35=$7;
      var $36=_ADrawGetColour($35);
      FUNCTION_TABLE[$34](5258624, $36);
      label = 6; break;
    case 5: 
      var $38=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$38](5258624, 16777215);
      label = 6; break;
    case 6: 
      var $40=$5;
      if ((($40)|(0))==9) {
        label = 7; break;
      }
      else if ((($40)|(0))==11) {
        label = 8; break;
      }
      else if ((($40)|(0))==12) {
        label = 9; break;
      }
      else if ((($40)|(0))==10) {
        label = 10; break;
      }
      else {
      label = 11; break;
      }
    case 7: 
      var $42=HEAP32[((((5258652)|0))>>2)];
      var $43=$x1;
      var $44=$1;
      var $45=$x2;
      var $46=$2;
      FUNCTION_TABLE[$42](5258624, $43, $44, $45, $46);
      label = 12; break;
    case 8: 
      var $48=HEAP32[((((5258652)|0))>>2)];
      var $49=$x1;
      var $50=HEAP32[((((5254388)|0))>>2)];
      var $51=((($49)+($50))|0);
      var $52=$1;
      var $53=$x2;
      var $54=HEAP32[((((5254388)|0))>>2)];
      var $55=((($53)-($54))|0);
      var $56=$2;
      FUNCTION_TABLE[$48](5258624, $51, $52, $55, $56);
      var $57=HEAP32[((((5258652)|0))>>2)];
      var $58=$x1;
      var $59=$1;
      var $60=HEAP32[((((5254388)|0))>>2)];
      var $61=((($59)+($60))|0);
      var $62=$x2;
      var $63=$2;
      var $64=HEAP32[((((5254388)|0))>>2)];
      var $65=((($63)-($64))|0);
      FUNCTION_TABLE[$57](5258624, $58, $61, $62, $65);
      var $66=HEAP32[((((5258660)|0))>>2)];
      var $67=$x1;
      var $68=HEAP32[((((5254388)|0))>>2)];
      var $69=((($67)+($68))|0);
      var $70=$1;
      var $71=HEAP32[((((5254388)|0))>>2)];
      var $72=((($70)+($71))|0);
      var $73=HEAP32[((((5254388)|0))>>2)];
      FUNCTION_TABLE[$66](5258624, $69, $72, $73);
      var $74=HEAP32[((((5258660)|0))>>2)];
      var $75=$x2;
      var $76=HEAP32[((((5254388)|0))>>2)];
      var $77=((($75)-($76))|0);
      var $78=$1;
      var $79=HEAP32[((((5254388)|0))>>2)];
      var $80=((($78)+($79))|0);
      var $81=HEAP32[((((5254388)|0))>>2)];
      FUNCTION_TABLE[$74](5258624, $77, $80, $81);
      var $82=HEAP32[((((5258660)|0))>>2)];
      var $83=$x1;
      var $84=HEAP32[((((5254388)|0))>>2)];
      var $85=((($83)+($84))|0);
      var $86=$2;
      var $87=HEAP32[((((5254388)|0))>>2)];
      var $88=((($86)-($87))|0);
      var $89=HEAP32[((((5254388)|0))>>2)];
      FUNCTION_TABLE[$82](5258624, $85, $88, $89);
      var $90=HEAP32[((((5258660)|0))>>2)];
      var $91=$x2;
      var $92=HEAP32[((((5254388)|0))>>2)];
      var $93=((($91)-($92))|0);
      var $94=$2;
      var $95=HEAP32[((((5254388)|0))>>2)];
      var $96=((($94)-($95))|0);
      var $97=HEAP32[((((5254388)|0))>>2)];
      FUNCTION_TABLE[$90](5258624, $93, $96, $97);
      label = 12; break;
    case 9: 
      var $99=HEAP32[((((5258652)|0))>>2)];
      var $100=$x1;
      var $101=$1;
      var $102=$x2;
      var $103=HEAP32[((((5254392)|0))>>2)];
      var $104=((($102)-($103))|0);
      var $105=$2;
      FUNCTION_TABLE[$99](5258624, $100, $101, $104, $105);
      var $106=HEAP32[((((5258652)|0))>>2)];
      var $107=$x1;
      var $108=$1;
      var $109=HEAP32[((((5254392)|0))>>2)];
      var $110=((($108)+($109))|0);
      var $111=$x2;
      var $112=$2;
      FUNCTION_TABLE[$106](5258624, $107, $110, $111, $112);
      var $113=HEAP32[((((5258656)|0))>>2)];
      var $114=$x2;
      var $115=HEAP32[((((5254392)|0))>>2)];
      var $116=((($114)-($115))|0);
      var $117=$1;
      var $118=$x2;
      var $119=$1;
      var $120=HEAP32[((((5254392)|0))>>2)];
      var $121=((($119)+($120))|0);
      var $122=$x2;
      var $123=HEAP32[((((5254392)|0))>>2)];
      var $124=((($122)-($123))|0);
      var $125=$1;
      var $126=HEAP32[((((5254392)|0))>>2)];
      var $127=((($125)+($126))|0);
      FUNCTION_TABLE[$113](5258624, $116, $117, $118, $121, $124, $127);
      label = 12; break;
    case 10: 
      var $129=HEAP32[((((5258652)|0))>>2)];
      var $130=$x1;
      var $131=HEAP32[((((5254396)|0))>>2)];
      var $132=((($130)+($131))|0);
      var $133=$1;
      var $134=$x2;
      var $135=HEAP32[((((5254396)|0))>>2)];
      var $136=((($134)-($135))|0);
      var $137=$2;
      FUNCTION_TABLE[$129](5258624, $132, $133, $136, $137);
      var $138=HEAP32[((((5258656)|0))>>2)];
      var $139=$x1;
      var $140=HEAP32[((((5254396)|0))>>2)];
      var $141=((($139)+($140))|0);
      var $142=$1;
      var $143=$x1;
      var $144=HEAP32[((((5254396)|0))>>2)];
      var $145=((($143)+($144))|0);
      var $146=$2;
      var $147=$x1;
      var $148=$ymid;
      FUNCTION_TABLE[$138](5258624, $141, $142, $145, $146, $147, $148);
      var $149=HEAP32[((((5258656)|0))>>2)];
      var $150=$x2;
      var $151=HEAP32[((((5254396)|0))>>2)];
      var $152=((($150)-($151))|0);
      var $153=$1;
      var $154=$x2;
      var $155=HEAP32[((((5254396)|0))>>2)];
      var $156=((($154)-($155))|0);
      var $157=$2;
      var $158=$x2;
      var $159=$ymid;
      FUNCTION_TABLE[$149](5258624, $152, $153, $156, $157, $158, $159);
      label = 12; break;
    case 11: 
      ___assert_func(((5264124)|0), 1100, ((5269064)|0), ((5263344)|0));
      throw "Reached an unreachable!"
    case 12: 
      var $162=$6;
      var $163=(($162)|(0))!=0;
      if ($163) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $165=HEAP32[((((5258672)|0))>>2)];
      var $166=$6;
      var $167=_ADrawGetColour($166);
      FUNCTION_TABLE[$165](5258624, $167);
      label = 15; break;
    case 14: 
      var $169=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$169](5258624, 0);
      label = 15; break;
    case 15: 
      var $171=$5;
      if ((($171)|(0))==9) {
        label = 16; break;
      }
      else if ((($171)|(0))==12) {
        label = 17; break;
      }
      else if ((($171)|(0))==11) {
        label = 18; break;
      }
      else if ((($171)|(0))==10) {
        label = 19; break;
      }
      else {
      label = 20; break;
      }
    case 16: 
      var $173=HEAP32[((((5258624)|0))>>2)];
      var $174=$x1;
      var $175=$1;
      var $176=$x2;
      var $177=$1;
      FUNCTION_TABLE[$173](5258624, $174, $175, $176, $177);
      var $178=HEAP32[((((5258624)|0))>>2)];
      var $179=$x1;
      var $180=$2;
      var $181=$x2;
      var $182=$2;
      FUNCTION_TABLE[$178](5258624, $179, $180, $181, $182);
      var $183=HEAP32[((((5258624)|0))>>2)];
      var $184=$x1;
      var $185=$1;
      var $186=$x1;
      var $187=$2;
      FUNCTION_TABLE[$183](5258624, $184, $185, $186, $187);
      var $188=HEAP32[((((5258624)|0))>>2)];
      var $189=$x2;
      var $190=$1;
      var $191=$x2;
      var $192=$2;
      FUNCTION_TABLE[$188](5258624, $189, $190, $191, $192);
      label = 21; break;
    case 17: 
      var $194=HEAP32[((((5258624)|0))>>2)];
      var $195=$x1;
      var $196=$1;
      var $197=$x2;
      var $198=HEAP32[((((5254392)|0))>>2)];
      var $199=((($197)-($198))|0);
      var $200=$1;
      FUNCTION_TABLE[$194](5258624, $195, $196, $199, $200);
      var $201=HEAP32[((((5258624)|0))>>2)];
      var $202=$x1;
      var $203=$2;
      var $204=$x2;
      var $205=$2;
      FUNCTION_TABLE[$201](5258624, $202, $203, $204, $205);
      var $206=HEAP32[((((5258624)|0))>>2)];
      var $207=$x1;
      var $208=$1;
      var $209=$x1;
      var $210=$2;
      FUNCTION_TABLE[$206](5258624, $207, $208, $209, $210);
      var $211=HEAP32[((((5258624)|0))>>2)];
      var $212=$x2;
      var $213=$1;
      var $214=HEAP32[((((5254392)|0))>>2)];
      var $215=((($213)+($214))|0);
      var $216=$x2;
      var $217=$2;
      FUNCTION_TABLE[$211](5258624, $212, $215, $216, $217);
      var $218=HEAP32[((((5258624)|0))>>2)];
      var $219=$x2;
      var $220=HEAP32[((((5254392)|0))>>2)];
      var $221=((($219)-($220))|0);
      var $222=$1;
      var $223=$x2;
      var $224=$1;
      var $225=HEAP32[((((5254392)|0))>>2)];
      var $226=((($224)+($225))|0);
      FUNCTION_TABLE[$218](5258624, $221, $222, $223, $226);
      var $227=HEAP32[((((5258624)|0))>>2)];
      var $228=$x2;
      var $229=HEAP32[((((5254392)|0))>>2)];
      var $230=((($228)-($229))|0);
      var $231=$1;
      var $232=$x2;
      var $233=HEAP32[((((5254392)|0))>>2)];
      var $234=((($232)-($233))|0);
      var $235=$1;
      var $236=HEAP32[((((5254392)|0))>>2)];
      var $237=((($235)+($236))|0);
      FUNCTION_TABLE[$227](5258624, $230, $231, $234, $237);
      var $238=HEAP32[((((5258624)|0))>>2)];
      var $239=$x2;
      var $240=$1;
      var $241=HEAP32[((((5254392)|0))>>2)];
      var $242=((($240)+($241))|0);
      var $243=$x2;
      var $244=HEAP32[((((5254392)|0))>>2)];
      var $245=((($243)-($244))|0);
      var $246=$1;
      var $247=HEAP32[((((5254392)|0))>>2)];
      var $248=((($246)+($247))|0);
      FUNCTION_TABLE[$238](5258624, $239, $242, $245, $248);
      label = 21; break;
    case 18: 
      var $250=HEAP32[((((5258624)|0))>>2)];
      var $251=$x1;
      var $252=HEAP32[((((5254388)|0))>>2)];
      var $253=((($251)+($252))|0);
      var $254=$1;
      var $255=$x2;
      var $256=HEAP32[((((5254388)|0))>>2)];
      var $257=((($255)-($256))|0);
      var $258=$1;
      FUNCTION_TABLE[$250](5258624, $253, $254, $257, $258);
      var $259=HEAP32[((((5258624)|0))>>2)];
      var $260=$x1;
      var $261=HEAP32[((((5254388)|0))>>2)];
      var $262=((($260)+($261))|0);
      var $263=$2;
      var $264=$x2;
      var $265=HEAP32[((((5254388)|0))>>2)];
      var $266=((($264)-($265))|0);
      var $267=$2;
      FUNCTION_TABLE[$259](5258624, $262, $263, $266, $267);
      var $268=HEAP32[((((5258624)|0))>>2)];
      var $269=$x1;
      var $270=$1;
      var $271=HEAP32[((((5254388)|0))>>2)];
      var $272=((($270)+($271))|0);
      var $273=$x1;
      var $274=$2;
      var $275=HEAP32[((((5254388)|0))>>2)];
      var $276=((($274)-($275))|0);
      FUNCTION_TABLE[$268](5258624, $269, $272, $273, $276);
      var $277=HEAP32[((((5258624)|0))>>2)];
      var $278=$x2;
      var $279=$1;
      var $280=HEAP32[((((5254388)|0))>>2)];
      var $281=((($279)+($280))|0);
      var $282=$x2;
      var $283=$2;
      var $284=HEAP32[((((5254388)|0))>>2)];
      var $285=((($283)-($284))|0);
      FUNCTION_TABLE[$277](5258624, $278, $281, $282, $285);
      var $286=HEAP32[((((5258664)|0))>>2)];
      var $287=$x1;
      var $288=HEAP32[((((5254388)|0))>>2)];
      var $289=((($287)+($288))|0);
      var $290=$1;
      var $291=HEAP32[((((5254388)|0))>>2)];
      var $292=((($290)+($291))|0);
      var $293=HEAP32[((((5254388)|0))>>2)];
      var $294=($293<<1);
      var $295=HEAP32[((((5254388)|0))>>2)];
      var $296=($295<<1);
      FUNCTION_TABLE[$286](5258624, $289, $292, $294, $296, 180, 270);
      var $297=HEAP32[((((5258664)|0))>>2)];
      var $298=$x2;
      var $299=HEAP32[((((5254388)|0))>>2)];
      var $300=((($298)-($299))|0);
      var $301=$1;
      var $302=HEAP32[((((5254388)|0))>>2)];
      var $303=((($301)+($302))|0);
      var $304=HEAP32[((((5254388)|0))>>2)];
      var $305=($304<<1);
      var $306=HEAP32[((((5254388)|0))>>2)];
      var $307=($306<<1);
      FUNCTION_TABLE[$297](5258624, $300, $303, $305, $307, 270, 0);
      var $308=HEAP32[((((5258664)|0))>>2)];
      var $309=$x2;
      var $310=HEAP32[((((5254388)|0))>>2)];
      var $311=((($309)-($310))|0);
      var $312=$2;
      var $313=HEAP32[((((5254388)|0))>>2)];
      var $314=((($312)-($313))|0);
      var $315=HEAP32[((((5254388)|0))>>2)];
      var $316=($315<<1);
      var $317=HEAP32[((((5254388)|0))>>2)];
      var $318=($317<<1);
      FUNCTION_TABLE[$308](5258624, $311, $314, $316, $318, 0, 90);
      var $319=HEAP32[((((5258664)|0))>>2)];
      var $320=$x1;
      var $321=HEAP32[((((5254388)|0))>>2)];
      var $322=((($320)+($321))|0);
      var $323=$2;
      var $324=HEAP32[((((5254388)|0))>>2)];
      var $325=((($323)-($324))|0);
      var $326=HEAP32[((((5254388)|0))>>2)];
      var $327=($326<<1);
      var $328=HEAP32[((((5254388)|0))>>2)];
      var $329=($328<<1);
      FUNCTION_TABLE[$319](5258624, $322, $325, $327, $329, 90, 180);
      label = 21; break;
    case 19: 
      var $331=HEAP32[((((5258624)|0))>>2)];
      var $332=$x1;
      var $333=HEAP32[((((5254396)|0))>>2)];
      var $334=((($332)+($333))|0);
      var $335=$1;
      var $336=$x2;
      var $337=HEAP32[((((5254396)|0))>>2)];
      var $338=((($336)-($337))|0);
      var $339=$1;
      FUNCTION_TABLE[$331](5258624, $334, $335, $338, $339);
      var $340=HEAP32[((((5258624)|0))>>2)];
      var $341=$x1;
      var $342=HEAP32[((((5254396)|0))>>2)];
      var $343=((($341)+($342))|0);
      var $344=$2;
      var $345=$x2;
      var $346=HEAP32[((((5254396)|0))>>2)];
      var $347=((($345)-($346))|0);
      var $348=$2;
      FUNCTION_TABLE[$340](5258624, $343, $344, $347, $348);
      var $349=HEAP32[((((5258624)|0))>>2)];
      var $350=$x1;
      var $351=HEAP32[((((5254396)|0))>>2)];
      var $352=((($350)+($351))|0);
      var $353=$1;
      var $354=$x1;
      var $355=$ymid;
      FUNCTION_TABLE[$349](5258624, $352, $353, $354, $355);
      var $356=HEAP32[((((5258624)|0))>>2)];
      var $357=$x1;
      var $358=$ymid;
      var $359=$x1;
      var $360=HEAP32[((((5254396)|0))>>2)];
      var $361=((($359)+($360))|0);
      var $362=$2;
      FUNCTION_TABLE[$356](5258624, $357, $358, $361, $362);
      var $363=HEAP32[((((5258624)|0))>>2)];
      var $364=$x2;
      var $365=HEAP32[((((5254396)|0))>>2)];
      var $366=((($364)-($365))|0);
      var $367=$1;
      var $368=$x2;
      var $369=$ymid;
      FUNCTION_TABLE[$363](5258624, $366, $367, $368, $369);
      var $370=HEAP32[((((5258624)|0))>>2)];
      var $371=$x2;
      var $372=$ymid;
      var $373=$x2;
      var $374=HEAP32[((((5254396)|0))>>2)];
      var $375=((($373)-($374))|0);
      var $376=$2;
      FUNCTION_TABLE[$370](5258624, $371, $372, $375, $376);
      label = 21; break;
    case 20: 
      ___assert_func(((5264124)|0), 1166, ((5269064)|0), ((5263344)|0));
      throw "Reached an unreachable!"
    case 21: 
      var $379=$6;
      var $380=(($379)|(0))!=0;
      if ($380) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $382=HEAP32[((((5258672)|0))>>2)];
      FUNCTION_TABLE[$382](5258624, 0);
      label = 23; break;
    case 23: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _ismapRect($ismap, $url, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      $1=$ismap;
      $2=$url;
      $3=$x1;
      $4=$y1;
      $5=$x2;
      $6=$y2;
      var $7=$1;
      var $8=(($7)|(0))!=0;
      if ($8) { label = 2; break; } else { label = 10; break; }
    case 2: 
      var $10=$2;
      var $11=(($10)|(0))!=0;
      if ($11) { label = 3; break; } else { label = 10; break; }
    case 3: 
      var $13=$3;
      var $14=$5;
      var $15=(($13)>>>(0)) <= (($14)>>>(0));
      if ($15) { label = 4; break; } else { label = 5; break; }
    case 4: 
      label = 6; break;
    case 5: 
      ___assert_func(((5264124)|0), 650, ((5268996)|0), ((5263652)|0));
      throw "Reached an unreachable!"
      label = 6; break;
    case 6: 
      var $20=$4;
      var $21=$6;
      var $22=(($20)>>>(0)) <= (($21)>>>(0));
      if ($22) { label = 7; break; } else { label = 8; break; }
    case 7: 
      label = 9; break;
    case 8: 
      ___assert_func(((5264124)|0), 650, ((5268996)|0), ((5263576)|0));
      throw "Reached an unreachable!"
      label = 9; break;
    case 9: 
      var $27=$1;
      var $28=$2;
      var $29=$3;
      var $30=$4;
      var $31=$5;
      var $32=$6;
      var $33=_fprintf($27, ((5263432)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$28,HEAP32[(((tempInt)+(4))>>2)]=$29,HEAP32[(((tempInt)+(8))>>2)]=$30,HEAP32[(((tempInt)+(12))>>2)]=$31,HEAP32[(((tempInt)+(16))>>2)]=$32,tempInt));
      label = 10; break;
    case 10: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _getSvgCtx($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=(($2+64)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=$4;
  return $5;
}
function _strnl($line) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $nl;
      $2=$line;
      var $3=$2;
      $nl=$3;
      label = 2; break;
    case 2: 
      var $5=$nl;
      var $6=_strstr($5, ((5261828)|0));
      $nl=$6;
      var $7=$nl;
      var $8=(($7)|(0))!=0;
      if ($8) { label = 3; break; } else { label = 8; break; }
    case 3: 
      var $10=$nl;
      var $11=$2;
      var $12=(($10)|(0))==(($11)|(0));
      if ($12) { label = 5; break; } else { label = 4; break; }
    case 4: 
      var $14=$nl;
      var $15=((($14)-(1))|0);
      var $16=HEAP8[($15)];
      var $17=(($16 << 24) >> 24);
      var $18=(($17)|(0))!=92;
      if ($18) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $20=$nl;
      $1=$20;
      label = 11; break;
    case 6: 
      var $22=$nl;
      var $23=(($22+2)|0);
      $nl=$23;
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $27=$nl;
      var $28=(($27)|(0))!=0;
      if ($28) { label = 2; break; } else { label = 10; break; }
    case 10: 
      $1=0;
      label = 11; break;
    case 11: 
      var $31=$1;
      return $31;
    default: assert(0, "bad label: " + label);
  }
}
function _splitStringToWidth($l, $width) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $p;
      var $orig;
      var $m;
      var $n;
      var $hyphenWidth;
      $1=$l;
      $2=$width;
      var $3=$1;
      var $4=$1;
      var $5=_strlen($4);
      var $6=(($3+$5)|0);
      $p=$6;
      $orig=0;
      var $7=HEAP32[((((5258644)|0))>>2)];
      var $8=$1;
      var $9=FUNCTION_TABLE[$7](5258624, $8);
      var $10=$2;
      var $11=(($9)>>>(0)) > (($10)>>>(0));
      if ($11) { label = 2; break; } else { label = 35; break; }
    case 2: 
      var $13=$1;
      var $14=_strdup_s($13);
      $orig=$14;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      var $17=$p;
      var $18=HEAP8[($17)];
      var $19=(($18 << 24) >> 24);
      var $20=_isspace($19);
      var $21=(($20)|(0))!=0;
      if ($21) { var $27 = 0;label = 6; break; } else { label = 5; break; }
    case 5: 
      var $23=$p;
      var $24=$1;
      var $25=(($23)>>>(0)) > (($24)>>>(0));
      var $27 = $25;label = 6; break;
    case 6: 
      var $27;
      if ($27) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $29=$p;
      var $30=((($29)-(1))|0);
      $p=$30;
      label = 4; break;
    case 8: 
      var $32=$p;
      var $33=$1;
      var $34=(($32)>>>(0)) > (($33)>>>(0));
      if ($34) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $36=$p;
      HEAP8[($36)]=0;
      label = 10; break;
    case 10: 
      label = 11; break;
    case 11: 
      var $39=HEAP32[((((5258644)|0))>>2)];
      var $40=$1;
      var $41=FUNCTION_TABLE[$39](5258624, $40);
      var $42=$2;
      var $43=(($41)>>>(0)) > (($42)>>>(0));
      if ($43) { label = 12; break; } else { var $49 = 0;label = 13; break; }
    case 12: 
      var $45=$p;
      var $46=$1;
      var $47=(($45)>>>(0)) > (($46)>>>(0));
      var $49 = $47;label = 13; break;
    case 13: 
      var $49;
      if ($49) { label = 3; break; } else { label = 14; break; }
    case 14: 
      var $51=$p;
      var $52=$1;
      var $53=(($51)|(0))==(($52)|(0));
      if ($53) { label = 15; break; } else { label = 26; break; }
    case 15: 
      var $55=HEAP32[((((5258644)|0))>>2)];
      var $56=FUNCTION_TABLE[$55](5258624, ((5260932)|0));
      $hyphenWidth=$56;
      label = 16; break;
    case 16: 
      var $58=$p;
      var $59=HEAP8[($58)];
      var $60=(($59 << 24) >> 24);
      var $61=_isspace($60);
      var $62=(($61)|(0))!=0;
      if ($62) { var $69 = 0;label = 18; break; } else { label = 17; break; }
    case 17: 
      var $64=$p;
      var $65=HEAP8[($64)];
      var $66=(($65 << 24) >> 24);
      var $67=(($66)|(0))!=0;
      var $69 = $67;label = 18; break;
    case 18: 
      var $69;
      if ($69) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $71=$p;
      var $72=(($71+1)|0);
      $p=$72;
      label = 16; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $75=$p;
      HEAP8[($75)]=0;
      var $76=$p;
      var $77=((($76)-(1))|0);
      $p=$77;
      label = 22; break;
    case 22: 
      var $79=HEAP32[((((5258644)|0))>>2)];
      var $80=$1;
      var $81=FUNCTION_TABLE[$79](5258624, $80);
      var $82=$hyphenWidth;
      var $83=((($81)+($82))|0);
      var $84=$2;
      var $85=(($83)>>>(0)) > (($84)>>>(0));
      if ($85) { label = 23; break; } else { var $91 = 0;label = 24; break; }
    case 23: 
      var $87=$p;
      var $88=$1;
      var $89=(($87)>>>(0)) > (($88)>>>(0));
      var $91 = $89;label = 24; break;
    case 24: 
      var $91;
      if ($91) { label = 21; break; } else { label = 25; break; }
    case 25: 
      var $93=$p;
      HEAP8[($93)]=45;
      label = 26; break;
    case 26: 
      $m=0;
      var $95=$p;
      var $96=$1;
      var $97=$95;
      var $98=$96;
      var $99=((($97)-($98))|0);
      $n=$99;
      label = 27; break;
    case 27: 
      var $101=$n;
      var $102=$orig;
      var $103=(($102+$101)|0);
      var $104=HEAP8[($103)];
      var $105=(($104 << 24) >> 24);
      var $106=_isspace($105);
      var $107=(($106)|(0))!=0;
      if ($107) { label = 28; break; } else { var $116 = 0;label = 29; break; }
    case 28: 
      var $109=$n;
      var $110=$orig;
      var $111=(($110+$109)|0);
      var $112=HEAP8[($111)];
      var $113=(($112 << 24) >> 24);
      var $114=(($113)|(0))!=0;
      var $116 = $114;label = 29; break;
    case 29: 
      var $116;
      if ($116) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $118=$n;
      var $119=((($118)+(1))|0);
      $n=$119;
      label = 27; break;
    case 31: 
      label = 32; break;
    case 32: 
      var $122=$n;
      var $123=((($122)+(1))|0);
      $n=$123;
      var $124=$orig;
      var $125=(($124+$122)|0);
      var $126=HEAP8[($125)];
      var $127=$m;
      var $128=((($127)+(1))|0);
      $m=$128;
      var $129=$orig;
      var $130=(($129+$127)|0);
      HEAP8[($130)]=$126;
      label = 33; break;
    case 33: 
      var $132=$m;
      var $133=((($132)-(1))|0);
      var $134=$orig;
      var $135=(($134+$133)|0);
      var $136=HEAP8[($135)];
      var $137=(($136 << 24) >> 24);
      var $138=(($137)|(0))!=0;
      if ($138) { label = 32; break; } else { label = 34; break; }
    case 34: 
      label = 35; break;
    case 35: 
      var $141=$orig;
      return $141;
    default: assert(0, "bad label: " + label);
  }
}
function _getLine($string, $line, $out, $outLen) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $lineStart;
      var $lineEnd;
      var $lineLen;
      $1=$string;
      $2=$line;
      $3=$out;
      $4=$outLen;
      $lineEnd=0;
      var $5=$2;
      var $6=((($5)+(1))|0);
      $2=$6;
      label = 2; break;
    case 2: 
      var $8=$lineEnd;
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $11=$lineEnd;
      var $12=(($11+2)|0);
      $lineStart=$12;
      label = 5; break;
    case 4: 
      var $14=$1;
      $lineStart=$14;
      label = 5; break;
    case 5: 
      var $16=$lineStart;
      var $17=_strnl($16);
      $lineEnd=$17;
      var $18=$2;
      var $19=((($18)-(1))|0);
      $2=$19;
      label = 6; break;
    case 6: 
      var $21=$2;
      var $22=(($21)>>>(0)) > 0;
      if ($22) { label = 7; break; } else { var $27 = 0;label = 8; break; }
    case 7: 
      var $24=$lineEnd;
      var $25=(($24)|(0))!=0;
      var $27 = $25;label = 8; break;
    case 8: 
      var $27;
      if ($27) { label = 2; break; } else { label = 9; break; }
    case 9: 
      var $29=$lineEnd;
      var $30=(($29)|(0))!=0;
      if ($30) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $32=$lineEnd;
      var $33=$lineStart;
      var $34=$32;
      var $35=$33;
      var $36=((($34)-($35))|0);
      $lineLen=$36;
      label = 12; break;
    case 11: 
      var $38=$1;
      var $39=_strlen($38);
      var $40=$lineStart;
      var $41=$1;
      var $42=$40;
      var $43=$41;
      var $44=((($42)-($43))|0);
      var $45=((($39)-($44))|0);
      $lineLen=$45;
      label = 12; break;
    case 12: 
      var $47=$lineLen;
      var $48=$4;
      var $49=((($48)-(1))|0);
      var $50=(($47)>>>(0)) > (($49)>>>(0));
      if ($50) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $52=$4;
      var $53=((($52)-(1))|0);
      $lineLen=$53;
      label = 14; break;
    case 14: 
      var $55=$3;
      var $56=$lineStart;
      var $57=$lineLen;
      assert($57 % 1 === 0);_memcpy($55, $56, $57);
      var $58=$lineLen;
      var $59=$3;
      var $60=(($59+$58)|0);
      HEAP8[($60)]=0;
      var $61=$3;
      return $61;
    default: assert(0, "bad label: " + label);
  }
}
function _deleteTmp() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1=HEAP32[((5258692)>>2)];
      var $2=(($1)|(0))!=0;
      if ($2) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $4=HEAP32[((5258692)>>2)];
      var $5=_unlink($4);
      label = 3; break;
    case 3: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgTextWidth($ctx, $string) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $width;
      var $i;
      var $w;
      $1=$ctx;
      $2=$string;
      $width=0;
      label = 2; break;
    case 2: 
      var $4=$2;
      var $5=HEAP8[($4)];
      var $6=(($5 << 24) >> 24);
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $9=$2;
      var $10=HEAP8[($9)];
      var $11=(($10 << 24) >> 24);
      var $12=$11 & 255;
      $i=$12;
      var $13=$i;
      var $14=((((5269244)|0)+($13<<2))|0);
      var $15=HEAP32[(($14)>>2)];
      $w=$15;
      var $16=$w;
      var $17=(($16)>>>(0)) > 0;
      if ($17) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $19=$w;
      var $22 = $19;label = 6; break;
    case 5: 
      var $22 = 0;label = 6; break;
    case 6: 
      var $22;
      var $23=$width;
      var $24=((($23)+($22))|0);
      $width=$24;
      var $25=$2;
      var $26=(($25+1)|0);
      $2=$26;
      label = 2; break;
    case 7: 
      var $28=$1;
      var $29=$width;
      var $30=_getSpace($28, $29);
      return $30;
    default: assert(0, "bad label: " + label);
  }
}
function _getSpace($ctx, $thousanths) {
  var label = 0;
  var $1;
  var $2;
  $1=$ctx;
  $2=$thousanths;
  var $3=$2;
  var $4=$1;
  var $5=_getSvgCtx($4);
  var $6=(($5+12)|0);
  var $7=HEAP32[(($6)>>2)];
  var $8=Math.imul($3,$7);
  var $9=((($8)+(500))|0);
  var $10=((((($9)|(0)))/(1000))&-1);
  return $10;
}
function _SvgTextHeight($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=HEAP32[((((5269236)|0))>>2)];
  var $4=HEAP32[((((5269240)|0))>>2)];
  var $5=((($3)-($4))|0);
  var $6=_getSpace($2, $5);
  return $6;
}
function _SvgLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=_getSvgFile($6);
  var $8=$2;
  var $9=$3;
  var $10=$4;
  var $11=$5;
  var $12=$1;
  var $13=_getSvgPen($12);
  var $14=_fprintf($7, ((5260588)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$8,HEAP32[(((tempInt)+(4))>>2)]=$9,HEAP32[(((tempInt)+(8))>>2)]=$10,HEAP32[(((tempInt)+(12))>>2)]=$11,HEAP32[(((tempInt)+(16))>>2)]=$13,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _getSvgFile($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=_getSvgCtx($2);
  var $4=(($3)|0);
  var $5=HEAP32[(($4)>>2)];
  return $5;
}
function _getSvgPen($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=_getSvgCtx($2);
  var $4=(($3+4)|0);
  var $5=HEAP32[(($4)>>2)];
  return $5;
}
function _SvgDottedLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=_getSvgFile($6);
  var $8=$2;
  var $9=$3;
  var $10=$4;
  var $11=$5;
  var $12=$1;
  var $13=_getSvgPen($12);
  var $14=_fprintf($7, ((5266700)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$8,HEAP32[(((tempInt)+(4))>>2)]=$9,HEAP32[(((tempInt)+(8))>>2)]=$10,HEAP32[(((tempInt)+(12))>>2)]=$11,HEAP32[(((tempInt)+(16))>>2)]=$13,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _SvgTextR($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getSvgCtx($5);
  $context=$6;
  var $7=$1;
  var $8=$1;
  var $9=_getSvgBgPen($8);
  var $10=$2;
  var $11=((($10)-(2))|0);
  var $12=$3;
  var $13=$1;
  var $14=_SvgTextHeight($13);
  var $15=((($12)-($14))|0);
  var $16=((($15)+(1))|0);
  var $17=$2;
  var $18=$1;
  var $19=$4;
  var $20=_SvgTextWidth($18, $19);
  var $21=((($17)+($20))|0);
  var $22=$3;
  var $23=((($22)-(1))|0);
  _svgRect($7, $9, $11, $16, $21, $23);
  var $24=$1;
  var $25=HEAP32[((((5269240)|0))>>2)];
  var $26=_getSpace($24, $25);
  var $27=$3;
  var $28=((($27)+($26))|0);
  $3=$28;
  var $29=$1;
  var $30=_getSvgFile($29);
  var $31=$2;
  var $32=((($31)-(1))|0);
  var $33=$3;
  var $34=$1;
  var $35=$4;
  var $36=_SvgTextWidth($34, $35);
  var $37=$context;
  var $38=(($37+12)|0);
  var $39=HEAP32[(($38)>>2)];
  var $40=$context;
  var $41=(($40+4)|0);
  var $42=HEAP32[(($41)>>2)];
  var $43=_fprintf($30, ((5263956)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$32,HEAP32[(((tempInt)+(4))>>2)]=$33,HEAP32[(((tempInt)+(8))>>2)]=$36,HEAP32[(((tempInt)+(12))>>2)]=$39,HEAP32[(((tempInt)+(16))>>2)]=$42,tempInt));
  var $44=$1;
  var $45=$4;
  _writeEscaped($44, $45);
  var $46=$1;
  var $47=_getSvgFile($46);
  var $48=_fprintf($47, ((5261752)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _svgRect($ctx, $colour, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  $1=$ctx;
  $2=$colour;
  $3=$x1;
  $4=$y1;
  $5=$x2;
  $6=$y2;
  var $7=$1;
  var $8=_getSvgFile($7);
  var $9=$2;
  var $10=$3;
  var $11=$4;
  var $12=$5;
  var $13=$4;
  var $14=$5;
  var $15=$6;
  var $16=$3;
  var $17=$6;
  var $18=_fprintf($8, ((5263472)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 36)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$9,HEAP32[(((tempInt)+(4))>>2)]=$10,HEAP32[(((tempInt)+(8))>>2)]=$11,HEAP32[(((tempInt)+(12))>>2)]=$12,HEAP32[(((tempInt)+(16))>>2)]=$13,HEAP32[(((tempInt)+(20))>>2)]=$14,HEAP32[(((tempInt)+(24))>>2)]=$15,HEAP32[(((tempInt)+(28))>>2)]=$16,HEAP32[(((tempInt)+(32))>>2)]=$17,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _getSvgBgPen($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=_getSvgCtx($2);
  var $4=(($3+8)|0);
  var $5=HEAP32[(($4)>>2)];
  return $5;
}
function _writeEscaped($ctx, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 8)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $f;
      var $code=__stackBase__;
      var $bytes=(__stackBase__)+(4);
      $1=$ctx;
      $2=$string;
      var $3=$1;
      var $4=_getSvgFile($3);
      $f=$4;
      label = 2; break;
    case 2: 
      var $6=$2;
      var $7=HEAP8[($6)];
      var $8=(($7 << 24) >> 24);
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 13; break; }
    case 3: 
      var $11=$2;
      var $12=HEAP8[($11)];
      var $13=(($12 << 24) >> 24);
      if ((($13)|(0))==60) {
        label = 4; break;
      }
      else if ((($13)|(0))==62) {
        label = 5; break;
      }
      else if ((($13)|(0))==34) {
        label = 6; break;
      }
      else if ((($13)|(0))==38) {
        label = 7; break;
      }
      else {
      label = 8; break;
      }
    case 4: 
      var $15=$f;
      var $16=_fprintf($15, ((5264116)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 12; break;
    case 5: 
      var $18=$f;
      var $19=_fprintf($18, ((5263948)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 12; break;
    case 6: 
      var $21=$f;
      var $22=_fprintf($21, ((5263852)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 12; break;
    case 7: 
      var $24=$f;
      var $25=_fprintf($24, ((5263664)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 12; break;
    case 8: 
      var $27=$2;
      var $28=_Utf8Decode($27, $code, $bytes);
      var $29=(($28)|(0))!=0;
      if ($29) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $31=$f;
      var $32=HEAP32[(($code)>>2)];
      var $33=_fprintf($31, ((5263588)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$32,tempInt));
      var $34=HEAP32[(($bytes)>>2)];
      var $35=((($34)-(1))|0);
      var $36=$2;
      var $37=(($36+$35)|0);
      $2=$37;
      label = 11; break;
    case 10: 
      var $39=$2;
      var $40=HEAP8[($39)];
      var $41=(($40 << 24) >> 24);
      var $42=$f;
      var $43=_fputc($41, $42);
      label = 11; break;
    case 11: 
      label = 12; break;
    case 12: 
      var $46=$2;
      var $47=(($46+1)|0);
      $2=$47;
      label = 2; break;
    case 13: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgTextL($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getSvgCtx($5);
  $context=$6;
  var $7=$1;
  var $8=$1;
  var $9=_getSvgBgPen($8);
  var $10=$2;
  var $11=$1;
  var $12=$4;
  var $13=_SvgTextWidth($11, $12);
  var $14=((($13)+(2))|0);
  var $15=((($10)-($14))|0);
  var $16=$3;
  var $17=$1;
  var $18=_SvgTextHeight($17);
  var $19=((($16)-($18))|0);
  var $20=((($19)+(1))|0);
  var $21=$2;
  var $22=$3;
  var $23=((($22)-(1))|0);
  _svgRect($7, $9, $15, $20, $21, $23);
  var $24=$1;
  var $25=HEAP32[((((5269240)|0))>>2)];
  var $26=_getSpace($24, $25);
  var $27=$3;
  var $28=((($27)+($26))|0);
  $3=$28;
  var $29=$1;
  var $30=_getSvgFile($29);
  var $31=$2;
  var $32=$3;
  var $33=$1;
  var $34=$4;
  var $35=_SvgTextWidth($33, $34);
  var $36=$context;
  var $37=(($36+12)|0);
  var $38=HEAP32[(($37)>>2)];
  var $39=$context;
  var $40=(($39+4)|0);
  var $41=HEAP32[(($40)>>2)];
  var $42=_fprintf($30, ((5260752)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$31,HEAP32[(((tempInt)+(4))>>2)]=$32,HEAP32[(((tempInt)+(8))>>2)]=$35,HEAP32[(((tempInt)+(12))>>2)]=$38,HEAP32[(((tempInt)+(16))>>2)]=$41,tempInt));
  var $43=$1;
  var $44=$4;
  _writeEscaped($43, $44);
  var $45=$1;
  var $46=_getSvgFile($45);
  var $47=_fprintf($46, ((5261752)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _arrowR($x, $y, $type) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $1=$x;
      $2=$y;
      $3=$type;
      var $4=$3;
      if ((($4)|(0))==2) {
        label = 2; break;
      }
      else if ((($4)|(0))==4 | (($4)|(0))==0 | (($4)|(0))==1) {
        label = 3; break;
      }
      else if ((($4)|(0))==3) {
        label = 4; break;
      }
      else {
      label = 5; break;
      }
    case 2: 
      var $6=HEAP32[((((5258624)|0))>>2)];
      var $7=$1;
      var $8=$2;
      var $9=$1;
      var $10=HEAP32[((((5254404)|0))>>2)];
      var $11=((($9)-($10))|0);
      var $12=$2;
      var $13=HEAP32[((((5254408)|0))>>2)];
      var $14=((($12)+($13))|0);
      FUNCTION_TABLE[$6](5258624, $7, $8, $11, $14);
      label = 6; break;
    case 3: 
      var $16=HEAP32[((((5258656)|0))>>2)];
      var $17=$1;
      var $18=$2;
      var $19=$1;
      var $20=HEAP32[((((5254404)|0))>>2)];
      var $21=((($19)-($20))|0);
      var $22=$2;
      var $23=HEAP32[((((5254408)|0))>>2)];
      var $24=((($22)+($23))|0);
      var $25=$1;
      var $26=HEAP32[((((5254404)|0))>>2)];
      var $27=((($25)-($26))|0);
      var $28=$2;
      var $29=HEAP32[((((5254408)|0))>>2)];
      var $30=((($28)-($29))|0);
      FUNCTION_TABLE[$16](5258624, $17, $18, $21, $24, $27, $30);
      label = 6; break;
    case 4: 
      var $32=HEAP32[((((5258624)|0))>>2)];
      var $33=$1;
      var $34=$2;
      var $35=$1;
      var $36=HEAP32[((((5254404)|0))>>2)];
      var $37=((($35)-($36))|0);
      var $38=$2;
      var $39=HEAP32[((((5254408)|0))>>2)];
      var $40=((($38)+($39))|0);
      FUNCTION_TABLE[$32](5258624, $33, $34, $37, $40);
      var $41=HEAP32[((((5258624)|0))>>2)];
      var $42=$1;
      var $43=HEAP32[((((5254404)|0))>>2)];
      var $44=((($42)-($43))|0);
      var $45=$2;
      var $46=HEAP32[((((5254408)|0))>>2)];
      var $47=((($45)-($46))|0);
      var $48=$1;
      var $49=$2;
      FUNCTION_TABLE[$41](5258624, $44, $47, $48, $49);
      label = 6; break;
    case 5: 
      ___assert_func(((5264124)|0), 702, ((5269048)|0), ((5263344)|0));
      throw "Reached an unreachable!"
    case 6: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _arrowL($x, $y, $type) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $1=$x;
      $2=$y;
      $3=$type;
      var $4=$3;
      if ((($4)|(0))==2) {
        label = 2; break;
      }
      else if ((($4)|(0))==4 | (($4)|(0))==0 | (($4)|(0))==1) {
        label = 3; break;
      }
      else if ((($4)|(0))==3) {
        label = 4; break;
      }
      else {
      label = 5; break;
      }
    case 2: 
      var $6=HEAP32[((((5258624)|0))>>2)];
      var $7=$1;
      var $8=$2;
      var $9=$1;
      var $10=HEAP32[((((5254404)|0))>>2)];
      var $11=((($9)+($10))|0);
      var $12=$2;
      var $13=HEAP32[((((5254408)|0))>>2)];
      var $14=((($12)+($13))|0);
      FUNCTION_TABLE[$6](5258624, $7, $8, $11, $14);
      label = 6; break;
    case 3: 
      var $16=HEAP32[((((5258656)|0))>>2)];
      var $17=$1;
      var $18=$2;
      var $19=$1;
      var $20=HEAP32[((((5254404)|0))>>2)];
      var $21=((($19)+($20))|0);
      var $22=$2;
      var $23=HEAP32[((((5254408)|0))>>2)];
      var $24=((($22)+($23))|0);
      var $25=$1;
      var $26=HEAP32[((((5254404)|0))>>2)];
      var $27=((($25)+($26))|0);
      var $28=$2;
      var $29=HEAP32[((((5254408)|0))>>2)];
      var $30=((($28)-($29))|0);
      FUNCTION_TABLE[$16](5258624, $17, $18, $21, $24, $27, $30);
      label = 6; break;
    case 4: 
      var $32=HEAP32[((((5258624)|0))>>2)];
      var $33=$1;
      var $34=$2;
      var $35=$1;
      var $36=HEAP32[((((5254404)|0))>>2)];
      var $37=((($35)+($36))|0);
      var $38=$2;
      var $39=HEAP32[((((5254408)|0))>>2)];
      var $40=((($38)+($39))|0);
      FUNCTION_TABLE[$32](5258624, $33, $34, $37, $40);
      var $41=HEAP32[((((5258624)|0))>>2)];
      var $42=$1;
      var $43=$2;
      var $44=$1;
      var $45=HEAP32[((((5254404)|0))>>2)];
      var $46=((($44)+($45))|0);
      var $47=$2;
      var $48=HEAP32[((((5254408)|0))>>2)];
      var $49=((($47)-($48))|0);
      FUNCTION_TABLE[$41](5258624, $42, $43, $46, $49);
      label = 6; break;
    case 5: 
      ___assert_func(((5264124)|0), 744, ((5269056)|0), ((5263344)|0));
      throw "Reached an unreachable!"
    case 6: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yywrap() {
  var label = 0;
  return 1;
}
function _svgColour($col) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$col;
      var $3=$2;
      if ((($3)|(0))==16777215) {
        label = 2; break;
      }
      else if ((($3)|(0))==0) {
        label = 3; break;
      }
      else if ((($3)|(0))==255) {
        label = 4; break;
      }
      else if ((($3)|(0))==16711680) {
        label = 5; break;
      }
      else if ((($3)|(0))==65280) {
        label = 6; break;
      }
      else {
      label = 7; break;
      }
    case 2: 
      $1=((5265816)|0);
      label = 8; break;
    case 3: 
      $1=((5265684)|0);
      label = 8; break;
    case 4: 
      $1=((5265596)|0);
      label = 8; break;
    case 5: 
      $1=((5265472)|0);
      label = 8; break;
    case 6: 
      $1=((5264288)|0);
      label = 8; break;
    case 7: 
      $1=0;
      label = 8; break;
    case 8: 
      var $11=$1;
      return $11;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgTextC($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  var $hw;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getSvgCtx($5);
  $context=$6;
  var $7=$1;
  var $8=$4;
  var $9=_SvgTextWidth($7, $8);
  var $10=Math.floor(((($9)>>>(0)))/(2));
  $hw=$10;
  var $11=$1;
  var $12=$1;
  var $13=_getSvgBgPen($12);
  var $14=$2;
  var $15=$hw;
  var $16=((($15)+(2))|0);
  var $17=((($14)-($16))|0);
  var $18=$3;
  var $19=$1;
  var $20=_SvgTextHeight($19);
  var $21=((($18)-($20))|0);
  var $22=((($21)+(1))|0);
  var $23=$2;
  var $24=$hw;
  var $25=((($23)+($24))|0);
  var $26=$3;
  var $27=((($26)-(1))|0);
  _svgRect($11, $13, $17, $22, $25, $27);
  var $28=$1;
  var $29=HEAP32[((((5269240)|0))>>2)];
  var $30=_getSpace($28, $29);
  var $31=$3;
  var $32=((($31)+($30))|0);
  $3=$32;
  var $33=$1;
  var $34=_getSvgFile($33);
  var $35=$2;
  var $36=$3;
  var $37=$1;
  var $38=$4;
  var $39=_SvgTextWidth($37, $38);
  var $40=$context;
  var $41=(($40+12)|0);
  var $42=HEAP32[(($41)>>2)];
  var $43=$context;
  var $44=(($43+4)|0);
  var $45=HEAP32[(($44)>>2)];
  var $46=_fprintf($34, ((5260356)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 20)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$35,HEAP32[(((tempInt)+(4))>>2)]=$36,HEAP32[(((tempInt)+(8))>>2)]=$39,HEAP32[(((tempInt)+(12))>>2)]=$42,HEAP32[(((tempInt)+(16))>>2)]=$45,tempInt));
  var $47=$1;
  var $48=$4;
  _writeEscaped($47, $48);
  var $49=$1;
  var $50=_getSvgFile($49);
  var $51=_fprintf($50, ((5261752)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _SvgFilledTriangle($ctx, $x1, $y1, $x2, $y2, $x3, $y3) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  $6=$x3;
  $7=$y3;
  var $8=$1;
  var $9=_getSvgFile($8);
  var $10=$1;
  var $11=_getSvgPen($10);
  var $12=$2;
  var $13=$3;
  var $14=$4;
  var $15=$5;
  var $16=$6;
  var $17=$7;
  var $18=_fprintf($9, ((5260052)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 28)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$11,HEAP32[(((tempInt)+(4))>>2)]=$12,HEAP32[(((tempInt)+(8))>>2)]=$13,HEAP32[(((tempInt)+(12))>>2)]=$14,HEAP32[(((tempInt)+(16))>>2)]=$15,HEAP32[(((tempInt)+(20))>>2)]=$16,HEAP32[(((tempInt)+(24))>>2)]=$17,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _SvgFilledCircle($ctx, $x, $y, $r) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$r;
  var $5=$1;
  var $6=_getSvgFile($5);
  var $7=$1;
  var $8=_getSvgPen($7);
  var $9=$2;
  var $10=$3;
  var $11=$4;
  var $12=_fprintf($6, ((5259804)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$8,HEAP32[(((tempInt)+(4))>>2)]=$9,HEAP32[(((tempInt)+(8))>>2)]=$10,HEAP32[(((tempInt)+(12))>>2)]=$11,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _SvgFilledRectangle($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=$1;
  var $8=_getSvgPen($7);
  var $9=$2;
  var $10=$3;
  var $11=$4;
  var $12=$5;
  _svgRect($6, $8, $9, $10, $11, $12);
  return;
}
function _SvgArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  var $sx=__stackBase__;
  var $sy=(__stackBase__)+(4);
  var $ex=(__stackBase__)+(8);
  var $ey=(__stackBase__)+(12);
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  var $8=$2;
  var $9=(($8)>>>(0));
  var $10=$3;
  var $11=(($10)>>>(0));
  var $12=$4;
  var $13=(($12)>>>(0));
  var $14=$5;
  var $15=(($14)>>>(0));
  var $16=$6;
  var $17=(($16)>>>(0));
  _arcPoint($9, $11, $13, $15, $17, $sx, $sy);
  var $18=$2;
  var $19=(($18)>>>(0));
  var $20=$3;
  var $21=(($20)>>>(0));
  var $22=$4;
  var $23=(($22)>>>(0));
  var $24=$5;
  var $25=(($24)>>>(0));
  var $26=$7;
  var $27=(($26)>>>(0));
  _arcPoint($19, $21, $23, $25, $27, $ex, $ey);
  var $28=$1;
  var $29=_getSvgFile($28);
  var $30=HEAP32[(($sx)>>2)];
  var $31=HEAP32[(($sy)>>2)];
  var $32=$4;
  var $33=Math.floor(((($32)>>>(0)))/(2));
  var $34=$5;
  var $35=Math.floor(((($34)>>>(0)))/(2));
  var $36=HEAP32[(($ex)>>2)];
  var $37=HEAP32[(($ey)>>2)];
  var $38=$1;
  var $39=_getSvgPen($38);
  var $40=_fprintf($29, ((5259416)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 28)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$30,HEAP32[(((tempInt)+(4))>>2)]=$31,HEAP32[(((tempInt)+(8))>>2)]=$33,HEAP32[(((tempInt)+(12))>>2)]=$35,HEAP32[(((tempInt)+(16))>>2)]=$36,HEAP32[(((tempInt)+(20))>>2)]=$37,HEAP32[(((tempInt)+(24))>>2)]=$39,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _arcPoint($cx, $cy, $w, $h, $a, $x, $y) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  var $rad;
  $1=$cx;
  $2=$cy;
  $3=$w;
  $4=$h;
  $5=$a;
  $6=$x;
  $7=$y;
  var $8=$5;
  var $9=$8;
  var $10=($9)*(3.141592653589793);
  var $11=($10)/(180);
  var $12=$11;
  $rad=$12;
  var $13=$1;
  var $14=$13;
  var $15=$3;
  var $16=($15)/(2);
  var $17=$16;
  var $18=$rad;
  var $19=$18;
  var $20=Math.cos($19);
  var $21=($17)*($20);
  var $22=($14)+($21);
  var $23=_round($22);
  var $24=($23>=0 ? Math.floor($23) : Math.ceil($23));
  var $25=$6;
  HEAP32[(($25)>>2)]=$24;
  var $26=$2;
  var $27=$26;
  var $28=$4;
  var $29=($28)/(2);
  var $30=$29;
  var $31=$rad;
  var $32=$31;
  var $33=Math.sin($32);
  var $34=($30)*($33);
  var $35=($27)+($34);
  var $36=_round($35);
  var $37=($36>=0 ? Math.floor($36) : Math.ceil($36));
  var $38=$7;
  HEAP32[(($38)>>2)]=$37;
  return;
}
function _SvgDottedArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  var $sx=__stackBase__;
  var $sy=(__stackBase__)+(4);
  var $ex=(__stackBase__)+(8);
  var $ey=(__stackBase__)+(12);
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  var $8=$2;
  var $9=(($8)>>>(0));
  var $10=$3;
  var $11=(($10)>>>(0));
  var $12=$4;
  var $13=(($12)>>>(0));
  var $14=$5;
  var $15=(($14)>>>(0));
  var $16=$6;
  var $17=(($16)>>>(0));
  _arcPoint($9, $11, $13, $15, $17, $sx, $sy);
  var $18=$2;
  var $19=(($18)>>>(0));
  var $20=$3;
  var $21=(($20)>>>(0));
  var $22=$4;
  var $23=(($22)>>>(0));
  var $24=$5;
  var $25=(($24)>>>(0));
  var $26=$7;
  var $27=(($26)>>>(0));
  _arcPoint($19, $21, $23, $25, $27, $ex, $ey);
  var $28=$1;
  var $29=_getSvgFile($28);
  var $30=HEAP32[(($sx)>>2)];
  var $31=HEAP32[(($sy)>>2)];
  var $32=$4;
  var $33=Math.floor(((($32)>>>(0)))/(2));
  var $34=$5;
  var $35=Math.floor(((($34)>>>(0)))/(2));
  var $36=HEAP32[(($ex)>>2)];
  var $37=HEAP32[(($ey)>>2)];
  var $38=$1;
  var $39=_getSvgPen($38);
  var $40=_fprintf($29, ((5259052)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 28)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$30,HEAP32[(((tempInt)+(4))>>2)]=$31,HEAP32[(((tempInt)+(8))>>2)]=$33,HEAP32[(((tempInt)+(12))>>2)]=$35,HEAP32[(((tempInt)+(16))>>2)]=$36,HEAP32[(((tempInt)+(20))>>2)]=$37,HEAP32[(((tempInt)+(24))>>2)]=$39,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _SvgSetPen($ctx, $col) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$ctx;
      $2=$col;
      var $3=$2;
      var $4=_svgColour($3);
      var $5=$1;
      var $6=_getSvgCtx($5);
      var $7=(($6+4)|0);
      HEAP32[(($7)>>2)]=$4;
      var $8=$1;
      var $9=_getSvgCtx($8);
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|(0))==0;
      if ($12) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $14=$2;
      var $15=_sprintf(((5269204)|0), ((5268228)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$14,tempInt));
      var $16=$1;
      var $17=_getSvgCtx($16);
      var $18=(($17+4)|0);
      HEAP32[(($18)>>2)]=((5269204)|0);
      label = 3; break;
    case 3: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgSetBgPen($ctx, $col) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$ctx;
      $2=$col;
      var $3=$2;
      var $4=_svgColour($3);
      var $5=$1;
      var $6=_getSvgCtx($5);
      var $7=(($6+8)|0);
      HEAP32[(($7)>>2)]=$4;
      var $8=$1;
      var $9=_getSvgCtx($8);
      var $10=(($9+8)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|(0))==0;
      if ($12) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $14=$2;
      var $15=_sprintf(((5269216)|0), ((5268228)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$14,tempInt));
      var $16=$1;
      var $17=_getSvgCtx($16);
      var $18=(($17+8)|0);
      HEAP32[(($18)>>2)]=((5269216)|0);
      label = 3; break;
    case 3: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgClose($ctx) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $context;
      $1=$ctx;
      var $2=$1;
      var $3=_getSvgCtx($2);
      $context=$3;
      var $4=$context;
      var $5=(($4)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=_fprintf($6, ((5267068)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $8=$context;
      var $9=(($8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=HEAP32[((_stdout)>>2)];
      var $12=(($10)|(0))!=(($11)|(0));
      if ($12) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $14=$context;
      var $15=(($14)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=_fclose($16);
      label = 3; break;
    case 3: 
      var $19=$context;
      var $20=$19;
      _free($20);
      var $21=$1;
      var $22=(($21+64)|0);
      HEAP32[(($22)>>2)]=0;
      STACKTOP = __stackBase__;
      return 1;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgInit($w, $h, $file, $outContext) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $context;
      $2=$w;
      $3=$h;
      $4=$file;
      $5=$outContext;
      var $6=_malloc_s(16);
      var $7=$5;
      var $8=(($7+64)|0);
      HEAP32[(($8)>>2)]=$6;
      var $9=$6;
      $context=$9;
      var $10=$context;
      var $11=(($10)|(0))==0;
      if ($11) { label = 2; break; } else { label = 3; break; }
    case 2: 
      $1=0;
      label = 9; break;
    case 3: 
      var $14=$4;
      var $15=_strcmp($14, ((5266840)|0));
      var $16=(($15)|(0))==0;
      if ($16) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $18=HEAP32[((_stdout)>>2)];
      var $19=$context;
      var $20=(($19)|0);
      HEAP32[(($20)>>2)]=$18;
      label = 8; break;
    case 5: 
      var $22=$4;
      var $23=_fopen($22, ((5266692)|0));
      var $24=$context;
      var $25=(($24)|0);
      HEAP32[(($25)>>2)]=$23;
      var $26=$context;
      var $27=(($26)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=(($28)|(0))!=0;
      if ($29) { label = 7; break; } else { label = 6; break; }
    case 6: 
      var $31=HEAP32[((_stderr)>>2)];
      var $32=$4;
      var $33=___errno_location();
      var $34=HEAP32[(($33)>>2)];
      var $35=_strerror($34);
      var $36=_fprintf($31, ((5266548)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$32,HEAP32[(((tempInt)+(4))>>2)]=$35,tempInt));
      $1=0;
      label = 9; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $39=$5;
      _SvgSetPen($39, 0);
      var $40=$5;
      _SvgSetBgPen($40, 16777215);
      var $41=$5;
      _SvgSetFontSize($41, 1);
      var $42=$context;
      var $43=(($42)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=_fprintf($44, ((5266188)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $46=$context;
      var $47=(($46)|0);
      var $48=HEAP32[(($47)>>2)];
      var $49=$2;
      var $50=$3;
      var $51=$2;
      var $52=$3;
      var $53=_fprintf($48, ((5265916)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$49,HEAP32[(((tempInt)+(4))>>2)]=$50,HEAP32[(((tempInt)+(8))>>2)]=$51,HEAP32[(((tempInt)+(12))>>2)]=$52,tempInt));
      var $54=$5;
      var $55=(($54)|0);
      HEAP32[(($55)>>2)]=34;
      var $56=$5;
      var $57=(($56+4)|0);
      HEAP32[(($57)>>2)]=74;
      var $58=$5;
      var $59=(($58+8)|0);
      HEAP32[(($59)>>2)]=22;
      var $60=$5;
      var $61=(($60+12)|0);
      HEAP32[(($61)>>2)]=28;
      var $62=$5;
      var $63=(($62+16)|0);
      HEAP32[(($63)>>2)]=32;
      var $64=$5;
      var $65=(($64+20)|0);
      var $66=$65;
      HEAP32[(($66)>>2)]=12;
      var $67=$5;
      var $68=(($67+24)|0);
      HEAP32[(($68)>>2)]=10;
      var $69=$5;
      var $70=(($69+28)|0);
      HEAP32[(($70)>>2)]=26;
      var $71=$5;
      var $72=(($71+32)|0);
      HEAP32[(($72)>>2)]=42;
      var $73=$5;
      var $74=(($73+36)|0);
      HEAP32[(($74)>>2)]=2;
      var $75=$5;
      var $76=(($75+40)|0);
      HEAP32[(($76)>>2)]=6;
      var $77=$5;
      var $78=(($77+44)|0);
      HEAP32[(($78)>>2)]=90;
      var $79=$5;
      var $80=(($79+48)|0);
      HEAP32[(($80)>>2)]=8;
      var $81=$5;
      var $82=(($81+52)|0);
      HEAP32[(($82)>>2)]=24;
      var $83=$5;
      var $84=(($83+56)|0);
      HEAP32[(($84)>>2)]=70;
      var $85=$5;
      var $86=(($85+60)|0);
      HEAP32[(($86)>>2)]=92;
      $1=1;
      label = 9; break;
    case 9: 
      var $88=$1;
      STACKTOP = __stackBase__;
      return $88;
    default: assert(0, "bad label: " + label);
  }
}
function _yyerror($str) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $s;
      var $line;
      var $t;
      var $found;
      $1=$str;
      var $2=HEAP32[((_stderr)>>2)];
      var $3=_lex_getlinenum();
      var $4=_fprintf($2, ((5259256)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$3,tempInt));
      var $5=$1;
      var $6=_strstr($5, ((5259204)|0));
      $s=$6;
      label = 2; break;
    case 2: 
      var $8=$s;
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 17; break; }
    case 3: 
      $found=0;
      label = 4; break;
    case 4: 
      var $12=$1;
      var $13=$s;
      var $14=(($12)>>>(0)) < (($13)>>>(0));
      if ($14) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $16=HEAP32[((_stderr)>>2)];
      var $17=$1;
      var $18=HEAP8[($17)];
      var $19=(($18 << 24) >> 24);
      var $20=_fprintf($16, ((5259152)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$19,tempInt));
      var $21=$1;
      var $22=(($21+1)|0);
      $1=$22;
      label = 4; break;
    case 6: 
      $t=0;
      label = 7; break;
    case 7: 
      var $25=$t;
      var $26=(($25)|(0)) < 46;
      if ($26) { label = 8; break; } else { var $32 = 0;label = 9; break; }
    case 8: 
      var $28=$found;
      var $29=(($28)|(0))!=0;
      var $30=$29 ^ 1;
      var $32 = $30;label = 9; break;
    case 9: 
      var $32;
      if ($32) { label = 10; break; } else { label = 14; break; }
    case 10: 
      var $34=$t;
      var $35=((5244208+($34<<2))|0);
      var $36=HEAP32[(($35)>>2)];
      var $37=$1;
      var $38=$t;
      var $39=((5244208+($38<<2))|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=_strlen($40);
      var $42=_strncmp($36, $37, $41);
      var $43=(($42)|(0))==0;
      if ($43) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $45=HEAP32[((_stderr)>>2)];
      var $46=$t;
      var $47=((5244024+($46<<2))|0);
      var $48=HEAP32[(($47)>>2)];
      var $49=_fprintf($45, ((5259148)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$48,tempInt));
      var $50=$t;
      var $51=((5244208+($50<<2))|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=_strlen($52);
      var $54=$1;
      var $55=(($54+$53)|0);
      $1=$55;
      $found=1;
      label = 12; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $58=$t;
      var $59=((($58)+(1))|0);
      $t=$59;
      label = 7; break;
    case 14: 
      var $61=$found;
      var $62=(($61)|(0))!=0;
      if ($62) { label = 16; break; } else { label = 15; break; }
    case 15: 
      var $64=HEAP32[((_stderr)>>2)];
      var $65=$1;
      var $66=HEAP8[($65)];
      var $67=(($66 << 24) >> 24);
      var $68=_fprintf($64, ((5259152)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$67,tempInt));
      var $69=$1;
      var $70=(($69+1)|0);
      $1=$70;
      label = 16; break;
    case 16: 
      var $72=$1;
      var $73=_strstr($72, ((5259204)|0));
      $s=$73;
      label = 2; break;
    case 17: 
      var $75=HEAP32[((_stderr)>>2)];
      var $76=$1;
      var $77=_fprintf($75, ((5259140)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$76,tempInt));
      var $78=_lex_getline();
      $line=$78;
      var $79=$line;
      var $80=(($79)|(0))!=0;
      if ($80) { label = 18; break; } else { label = 21; break; }
    case 18: 
      var $82=HEAP32[((_stderr)>>2)];
      var $83=$line;
      var $84=_fprintf($82, ((5259044)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$83,tempInt));
      var $85=$line;
      var $86=_strstr($85, ((5259040)|0));
      var $87=(($86)|(0))!=0;
      if ($87) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $89=HEAP32[((_stderr)>>2)];
      var $90=_fprintf($89, ((5258716)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 20; break;
    case 20: 
      label = 22; break;
    case 21: 
      var $93=HEAP32[((_stderr)>>2)];
      var $94=_fprintf($93, ((5268484)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 22; break;
    case 22: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _removeEscapes($in) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $l;
      var $r;
      var $t;
      var $u;
      $1=$in;
      var $2=$1;
      var $3=_strlen($2);
      var $4=(($3) & 65535);
      $l=$4;
      var $5=$l;
      var $6=(($5)&(65535));
      var $7=((($6)+(1))|0);
      var $8=_malloc_s($7);
      $r=$8;
      $u=0;
      $t=0;
      label = 2; break;
    case 2: 
      var $10=$t;
      var $11=(($10)&(65535));
      var $12=$l;
      var $13=(($12)&(65535));
      var $14=(($11)|(0)) < (($13)|(0));
      if ($14) { label = 3; break; } else { label = 8; break; }
    case 3: 
      var $16=$t;
      var $17=(($16)&(65535));
      var $18=$1;
      var $19=(($18+$17)|0);
      var $20=HEAP8[($19)];
      var $21=$u;
      var $22=(($21)&(65535));
      var $23=$r;
      var $24=(($23+$22)|0);
      HEAP8[($24)]=$20;
      var $25=$t;
      var $26=(($25)&(65535));
      var $27=$1;
      var $28=(($27+$26)|0);
      var $29=HEAP8[($28)];
      var $30=(($29 << 24) >> 24);
      var $31=(($30)|(0))!=92;
      if ($31) { label = 5; break; } else { label = 4; break; }
    case 4: 
      var $33=$t;
      var $34=(($33)&(65535));
      var $35=((($34)+(1))|0);
      var $36=$1;
      var $37=(($36+$35)|0);
      var $38=HEAP8[($37)];
      var $39=(($38 << 24) >> 24);
      var $40=(($39)|(0))!=34;
      if ($40) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $42=$u;
      var $43=((($42)+(1))&65535);
      $u=$43;
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $46=$t;
      var $47=((($46)+(1))&65535);
      $t=$47;
      label = 2; break;
    case 8: 
      var $49=$u;
      var $50=(($49)&(65535));
      var $51=$r;
      var $52=(($51+$50)|0);
      HEAP8[($52)]=0;
      var $53=$1;
      _free($53);
      var $54=$r;
      return $54;
    default: assert(0, "bad label: " + label);
  }
}
function _MscParse($in) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 4)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $m=__stackBase__;
      $1=$in;
      var $2=$1;
      HEAP32[((5244020)>>2)]=$2;
      var $3=$m;
      var $4=_yyparse($3);
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      HEAP32[(($m)>>2)]=0;
      label = 3; break;
    case 3: 
      _lex_destroy();
      var $8=_yylex_destroy();
      var $9=HEAP32[(($m)>>2)];
      STACKTOP = __stackBase__;
      return $9;
    default: assert(0, "bad label: " + label);
  }
}
function _SvgSetFontSize($ctx, $size) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $context;
      $1=$ctx;
      $2=$size;
      var $3=$1;
      var $4=_getSvgCtx($3);
      $context=$4;
      var $5=$2;
      if ((($5)|(0))==0) {
        label = 2; break;
      }
      else if ((($5)|(0))==1) {
        label = 3; break;
      }
      else {
      label = 4; break;
      }
    case 2: 
      var $7=$context;
      var $8=(($7+12)|0);
      HEAP32[(($8)>>2)]=8;
      label = 5; break;
    case 3: 
      var $10=$context;
      var $11=(($10+12)|0);
      HEAP32[(($11)>>2)]=12;
      label = 5; break;
    case 4: 
      ___assert_func(((5267740)|0), 491, ((5269072)|0), ((5267384)|0));
      throw "Reached an unreachable!"
    case 5: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
// WARNING: content after a branch in a label, line: 7189
// WARNING: content after a branch in a label, line: 7190
// WARNING: content after a branch in a label, line: 7191
// WARNING: content after a branch in a label, line: 7192
// WARNING: content after a branch in a label, line: 7193
// WARNING: content after a branch in a label, line: 7194
// WARNING: content after a branch in a label, line: 7195
// WARNING: content after a branch in a label, line: 7196
// WARNING: content after a branch in a label, line: 7197
// WARNING: content after a branch in a label, line: 7198
// WARNING: content after a branch in a label, line: 7199
// WARNING: content after a branch in a label, line: 7200
// WARNING: content after a branch in a label, line: 7201
// WARNING: content after a branch in a label, line: 7202
// WARNING: content after a branch in a label, line: 7203
// WARNING: content after a branch in a label, line: 7204
function _yyparse($yyparse_result) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 1340)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $yystate;
      var $yyerrstatus;
      var $yyssa=__stackBase__;
      var $yyss;
      var $yyssp;
      var $yyvsa=(__stackBase__)+(400);
      var $yyvs;
      var $yyvsp;
      var $yystacksize;
      var $yyn;
      var $yyresult;
      var $yytoken;
      var $yyval=(__stackBase__)+(1200);
      var $yymsgbuf=(__stackBase__)+(1204);
      var $yymsg=(__stackBase__)+(1332);
      var $yymsg_alloc=(__stackBase__)+(1336);
      var $yylen;
      var $yysize;
      var $yyss1;
      var $yyptr;
      var $yynewbytes;
      var $yynewbytes1;
      var $arc;
      var $arc2;
      var $yymsgp;
      var $yysyntax_error_status;
      $1=$yyparse_result;
      var $2=(($yymsgbuf)|0);
      HEAP32[(($yymsg)>>2)]=$2;
      HEAP32[(($yymsg_alloc)>>2)]=128;
      $yylen=0;
      $yytoken=0;
      var $3=(($yyssa)|0);
      $yyss=$3;
      var $4=(($yyvsa)|0);
      $yyvs=$4;
      $yystacksize=200;
      $yystate=0;
      $yyerrstatus=0;
      HEAP32[((5244008)>>2)]=0;
      HEAP32[((5244648)>>2)]=-2;
      var $5=$yyss;
      $yyssp=$5;
      var $6=$yyvs;
      $yyvsp=$6;
      label = 3; break;
    case 2: 
      var $8=$yyssp;
      var $9=(($8+2)|0);
      $yyssp=$9;
      label = 3; break;
    case 3: 
      var $11=$yystate;
      var $12=(($11) & 65535);
      var $13=$yyssp;
      HEAP16[(($13)>>1)]=$12;
      var $14=$yyss;
      var $15=$yystacksize;
      var $16=(($14+($15<<1))|0);
      var $17=((($16)-(2))|0);
      var $18=$yyssp;
      var $19=(($17)>>>(0)) <= (($18)>>>(0));
      if ($19) { label = 4; break; } else { label = 19; break; }
    case 4: 
      var $21=$yyssp;
      var $22=$yyss;
      var $23=$21;
      var $24=$22;
      var $25=((($23)-($24))|0);
      var $26=((((($25)|(0)))/(2))&-1);
      var $27=((($26)+(1))|0);
      $yysize=$27;
      var $28=$yystacksize;
      var $29=10000 <= (($28)>>>(0));
      if ($29) { label = 5; break; } else { label = 6; break; }
    case 5: 
      label = 119; break;
    case 6: 
      var $32=$yystacksize;
      var $33=($32<<1);
      $yystacksize=$33;
      var $34=$yystacksize;
      var $35=10000 < (($34)>>>(0));
      if ($35) { label = 7; break; } else { label = 8; break; }
    case 7: 
      $yystacksize=10000;
      label = 8; break;
    case 8: 
      var $38=$yyss;
      $yyss1=$38;
      var $39=$yystacksize;
      var $40=((($39)*(6))&-1);
      var $41=((($40)+(3))|0);
      var $42=_malloc_s($41);
      var $43=$42;
      $yyptr=$43;
      var $44=$yyptr;
      var $45=(($44)|(0))!=0;
      if ($45) { label = 10; break; } else { label = 9; break; }
    case 9: 
      label = 119; break;
    case 10: 
      label = 11; break;
    case 11: 
      var $49=$yyptr;
      var $50=$49;
      var $51=$50;
      var $52=$yyss;
      var $53=$52;
      var $54=$yysize;
      var $55=($54<<1);
      assert($55 % 1 === 0);_memcpy($51, $53, $55);
      var $56=$yyptr;
      var $57=$56;
      $yyss=$57;
      var $58=$yystacksize;
      var $59=($58<<1);
      var $60=((($59)+(3))|0);
      $yynewbytes=$60;
      var $61=$yynewbytes;
      var $62=Math.floor(((($61)>>>(0)))/(4));
      var $63=$yyptr;
      var $64=(($63+($62<<2))|0);
      $yyptr=$64;
      label = 12; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $67=$yyptr;
      var $68=$67;
      var $69=$68;
      var $70=$yyvs;
      var $71=$70;
      var $72=$yysize;
      var $73=($72<<2);
      assert($73 % 1 === 0);_memcpy($69, $71, $73);
      var $74=$yyptr;
      var $75=$74;
      $yyvs=$75;
      var $76=$yystacksize;
      var $77=($76<<2);
      var $78=((($77)+(3))|0);
      $yynewbytes1=$78;
      var $79=$yynewbytes1;
      var $80=Math.floor(((($79)>>>(0)))/(4));
      var $81=$yyptr;
      var $82=(($81+($80<<2))|0);
      $yyptr=$82;
      label = 14; break;
    case 14: 
      var $84=$yyss1;
      var $85=(($yyssa)|0);
      var $86=(($84)|(0))!=(($85)|(0));
      if ($86) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $88=$yyss1;
      var $89=$88;
      _free($89);
      label = 16; break;
    case 16: 
      var $91=$yyss;
      var $92=$yysize;
      var $93=(($91+($92<<1))|0);
      var $94=((($93)-(2))|0);
      $yyssp=$94;
      var $95=$yyvs;
      var $96=$yysize;
      var $97=(($95+($96<<2))|0);
      var $98=((($97)-(4))|0);
      $yyvsp=$98;
      var $99=$yyss;
      var $100=$yystacksize;
      var $101=(($99+($100<<1))|0);
      var $102=((($101)-(2))|0);
      var $103=$yyssp;
      var $104=(($102)>>>(0)) <= (($103)>>>(0));
      if ($104) { label = 17; break; } else { label = 18; break; }
    case 17: 
      label = 118; break;
    case 18: 
      label = 19; break;
    case 19: 
      var $108=$yystate;
      var $109=(($108)|(0))==4;
      if ($109) { label = 20; break; } else { label = 21; break; }
    case 20: 
      label = 117; break;
    case 21: 
      label = 22; break;
    case 22: 
      var $113=$yystate;
      var $114=((5243900+$113)|0);
      var $115=HEAP8[($114)];
      var $116=(($115 << 24) >> 24);
      $yyn=$116;
      var $117=$yyn;
      var $118=(($117)|(0))==-36;
      if ($118) { label = 23; break; } else { label = 24; break; }
    case 23: 
      label = 41; break;
    case 24: 
      var $121=HEAP32[((5244648)>>2)];
      var $122=(($121)|(0))==-2;
      if ($122) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $124=_yylex();
      HEAP32[((5244648)>>2)]=$124;
      label = 26; break;
    case 26: 
      var $126=HEAP32[((5244648)>>2)];
      var $127=(($126)|(0)) <= 0;
      if ($127) { label = 27; break; } else { label = 28; break; }
    case 27: 
      $yytoken=0;
      HEAP32[((5244648)>>2)]=0;
      label = 32; break;
    case 28: 
      var $130=HEAP32[((5244648)>>2)];
      var $131=(($130)>>>(0)) <= 310;
      if ($131) { label = 29; break; } else { label = 30; break; }
    case 29: 
      var $133=HEAP32[((5244648)>>2)];
      var $134=((5242880+$133)|0);
      var $135=HEAP8[($134)];
      var $136=(($135)&(255));
      var $139 = $136;label = 31; break;
    case 30: 
      var $139 = 2;label = 31; break;
    case 31: 
      var $139;
      $yytoken=$139;
      label = 32; break;
    case 32: 
      var $141=$yytoken;
      var $142=$yyn;
      var $143=((($142)+($141))|0);
      $yyn=$143;
      var $144=$yyn;
      var $145=(($144)|(0)) < 0;
      if ($145) { label = 35; break; } else { label = 33; break; }
    case 33: 
      var $147=$yyn;
      var $148=129 < (($147)|(0));
      if ($148) { label = 35; break; } else { label = 34; break; }
    case 34: 
      var $150=$yyn;
      var $151=((5244516+$150)|0);
      var $152=HEAP8[($151)];
      var $153=(($152 << 24) >> 24);
      var $154=$yytoken;
      var $155=(($153)|(0))!=(($154)|(0));
      if ($155) { label = 35; break; } else { label = 36; break; }
    case 35: 
      label = 41; break;
    case 36: 
      var $158=$yyn;
      var $159=((5243500+$158)|0);
      var $160=HEAP8[($159)];
      var $161=(($160)&(255));
      $yyn=$161;
      var $162=$yyn;
      var $163=(($162)|(0)) <= 0;
      if ($163) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $165=$yyn;
      var $166=(((-$165))|0);
      $yyn=$166;
      label = 44; break;
    case 38: 
      var $168=$yyerrstatus;
      var $169=(($168)|(0))!=0;
      if ($169) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $171=$yyerrstatus;
      var $172=((($171)-(1))|0);
      $yyerrstatus=$172;
      label = 40; break;
    case 40: 
      HEAP32[((5244648)>>2)]=-2;
      var $174=$yyn;
      $yystate=$174;
      var $175=$yyvsp;
      var $176=(($175+4)|0);
      $yyvsp=$176;
      var $177=$176;
      assert(4 % 1 === 0);HEAP32[(($177)>>2)]=HEAP32[((5244012)>>2)];
      label = 2; break;
    case 41: 
      var $179=$yystate;
      var $180=((5244412+$179)|0);
      var $181=HEAP8[($180)];
      var $182=(($181)&(255));
      $yyn=$182;
      var $183=$yyn;
      var $184=(($183)|(0))==0;
      if ($184) { label = 42; break; } else { label = 43; break; }
    case 42: 
      label = 76; break;
    case 43: 
      label = 44; break;
    case 44: 
      var $188=$yyn;
      var $189=((5243736+$188)|0);
      var $190=HEAP8[($189)];
      var $191=(($190)&(255));
      $yylen=$191;
      var $192=$yylen;
      var $193=(((1)-($192))|0);
      var $194=$yyvsp;
      var $195=(($194+($193<<2))|0);
      var $196=$yyval;
      var $197=$195;
      assert(4 % 1 === 0);HEAP32[(($196)>>2)]=HEAP32[(($197)>>2)];
      var $198=$yyn;
      if ((($198)|(0))==2) {
        label = 45; break;
      }
      else if ((($198)|(0))==3) {
        label = 46; break;
      }
      else if ((($198)|(0))==5) {
        label = 47; break;
      }
      else if ((($198)|(0))==6) {
        label = 48; break;
      }
      else if ((($198)|(0))==11) {
        label = 49; break;
      }
      else if ((($198)|(0))==12) {
        label = 50; break;
      }
      else if ((($198)|(0))==13) {
        label = 51; break;
      }
      else if ((($198)|(0))==14) {
        label = 52; break;
      }
      else if ((($198)|(0))==15) {
        label = 53; break;
      }
      else if ((($198)|(0))==16) {
        label = 54; break;
      }
      else if ((($198)|(0))==17) {
        label = 55; break;
      }
      else if ((($198)|(0))==18) {
        label = 56; break;
      }
      else if ((($198)|(0))==20) {
        label = 57; break;
      }
      else if ((($198)|(0))==21) {
        label = 58; break;
      }
      else if ((($198)|(0))==22) {
        label = 59; break;
      }
      else if ((($198)|(0))==23) {
        label = 60; break;
      }
      else if ((($198)|(0))==24) {
        label = 61; break;
      }
      else if ((($198)|(0))==25) {
        label = 62; break;
      }
      else if ((($198)|(0))==26) {
        label = 63; break;
      }
      else if ((($198)|(0))==27) {
        label = 64; break;
      }
      else if ((($198)|(0))==54) {
        label = 65; break;
      }
      else if ((($198)|(0))==55) {
        label = 66; break;
      }
      else if ((($198)|(0))==67) {
        label = 67; break;
      }
      else if ((($198)|(0))==68) {
        label = 68; break;
      }
      else {
      label = 69; break;
      }
    case 45: 
      var $200=$yyvsp;
      var $201=((($200)-(24))|0);
      var $202=$201;
      var $203=HEAP32[(($202)>>2)];
      var $204=$yyvsp;
      var $205=((($204)-(16))|0);
      var $206=$205;
      var $207=HEAP32[(($206)>>2)];
      var $208=$yyvsp;
      var $209=((($208)-(8))|0);
      var $210=$209;
      var $211=HEAP32[(($210)>>2)];
      var $212=_MscAlloc($203, $207, $211);
      var $213=$yyval;
      HEAP32[(($213)>>2)]=$212;
      var $214=$yyval;
      var $215=HEAP32[(($214)>>2)];
      var $216=$1;
      var $217=$216;
      HEAP32[(($217)>>2)]=$215;
      label = 70; break;
    case 46: 
      var $219=$yyvsp;
      var $220=((($219)-(16))|0);
      var $221=$220;
      var $222=HEAP32[(($221)>>2)];
      var $223=$yyvsp;
      var $224=((($223)-(8))|0);
      var $225=$224;
      var $226=HEAP32[(($225)>>2)];
      var $227=_MscAlloc(0, $222, $226);
      var $228=$yyval;
      HEAP32[(($228)>>2)]=$227;
      var $229=$yyval;
      var $230=HEAP32[(($229)>>2)];
      var $231=$1;
      var $232=$231;
      HEAP32[(($232)>>2)]=$230;
      label = 70; break;
    case 47: 
      var $234=$yyvsp;
      var $235=((($234)-(8))|0);
      var $236=$235;
      var $237=HEAP32[(($236)>>2)];
      var $238=$yyvsp;
      var $239=(($238)|0);
      var $240=$239;
      var $241=HEAP32[(($240)>>2)];
      var $242=_MscLinkOpt($237, $241);
      var $243=$yyval;
      HEAP32[(($243)>>2)]=$242;
      label = 70; break;
    case 48: 
      var $245=$yyvsp;
      var $246=((($245)-(8))|0);
      var $247=$246;
      var $248=HEAP32[(($247)>>2)];
      var $249=$yyvsp;
      var $250=(($249)|0);
      var $251=$250;
      var $252=HEAP32[(($251)>>2)];
      var $253=_MscAllocOpt($248, $252);
      var $254=$yyval;
      HEAP32[(($254)>>2)]=$253;
      label = 70; break;
    case 49: 
      var $256=$yyvsp;
      var $257=(($256)|0);
      var $258=$257;
      var $259=HEAP32[(($258)>>2)];
      var $260=_MscLinkEntity(0, $259);
      var $261=$yyval;
      HEAP32[(($261)>>2)]=$260;
      label = 70; break;
    case 50: 
      var $263=$yyvsp;
      var $264=((($263)-(8))|0);
      var $265=$264;
      var $266=HEAP32[(($265)>>2)];
      var $267=$yyvsp;
      var $268=(($267)|0);
      var $269=$268;
      var $270=HEAP32[(($269)>>2)];
      var $271=_MscLinkEntity($266, $270);
      var $272=$yyval;
      HEAP32[(($272)>>2)]=$271;
      label = 70; break;
    case 51: 
      var $274=$yyvsp;
      var $275=(($274)|0);
      var $276=$275;
      var $277=HEAP32[(($276)>>2)];
      var $278=_MscAllocEntity($277);
      var $279=$yyval;
      HEAP32[(($279)>>2)]=$278;
      label = 70; break;
    case 52: 
      var $281=$yyvsp;
      var $282=((($281)-(12))|0);
      var $283=$282;
      var $284=HEAP32[(($283)>>2)];
      var $285=$yyvsp;
      var $286=((($285)-(4))|0);
      var $287=$286;
      var $288=HEAP32[(($287)>>2)];
      _MscEntityLinkAttrib($284, $288);
      label = 70; break;
    case 53: 
      var $290=$yyvsp;
      var $291=(($290)|0);
      var $292=$291;
      var $293=HEAP32[(($292)>>2)];
      var $294=_MscLinkArc(0, $293);
      var $295=$yyval;
      HEAP32[(($295)>>2)]=$294;
      label = 70; break;
    case 54: 
      var $297=$yyvsp;
      var $298=((($297)-(8))|0);
      var $299=$298;
      var $300=HEAP32[(($299)>>2)];
      var $301=$yyvsp;
      var $302=(($301)|0);
      var $303=$302;
      var $304=HEAP32[(($303)>>2)];
      var $305=_MscLinkArc($300, $304);
      var $306=$yyval;
      HEAP32[(($306)>>2)]=$305;
      label = 70; break;
    case 55: 
      var $308=$yyvsp;
      var $309=((($308)-(8))|0);
      var $310=$309;
      var $311=HEAP32[(($310)>>2)];
      var $312=_lex_getlinenum();
      var $313=_MscAllocArc(0, 0, 8, $312);
      var $314=_MscLinkArc($311, $313);
      var $315=$yyvsp;
      var $316=(($315)|0);
      var $317=$316;
      var $318=HEAP32[(($317)>>2)];
      var $319=_MscLinkArc($314, $318);
      var $320=$yyval;
      HEAP32[(($320)>>2)]=$319;
      label = 70; break;
    case 56: 
      var $322=$yyvsp;
      var $323=((($322)-(12))|0);
      var $324=$323;
      var $325=HEAP32[(($324)>>2)];
      var $326=$yyvsp;
      var $327=((($326)-(4))|0);
      var $328=$327;
      var $329=HEAP32[(($328)>>2)];
      _MscArcLinkAttrib($325, $329);
      label = 70; break;
    case 57: 
      var $331=$yyvsp;
      var $332=(($331)|0);
      var $333=$332;
      var $334=HEAP32[(($333)>>2)];
      var $335=_lex_getlinenum();
      var $336=_MscAllocArc(0, 0, $334, $335);
      var $337=$yyval;
      HEAP32[(($337)>>2)]=$336;
      label = 70; break;
    case 58: 
      var $339=$yyvsp;
      var $340=((($339)-(8))|0);
      var $341=$340;
      var $342=HEAP32[(($341)>>2)];
      var $343=$yyvsp;
      var $344=(($343)|0);
      var $345=$344;
      var $346=HEAP32[(($345)>>2)];
      var $347=$yyvsp;
      var $348=((($347)-(4))|0);
      var $349=$348;
      var $350=HEAP32[(($349)>>2)];
      var $351=_lex_getlinenum();
      var $352=_MscAllocArc($342, $346, $350, $351);
      var $353=$yyval;
      HEAP32[(($353)>>2)]=$352;
      label = 70; break;
    case 59: 
      var $355=$yyvsp;
      var $356=((($355)-(8))|0);
      var $357=$356;
      var $358=HEAP32[(($357)>>2)];
      var $359=$yyvsp;
      var $360=(($359)|0);
      var $361=$360;
      var $362=HEAP32[(($361)>>2)];
      var $363=$yyvsp;
      var $364=((($363)-(4))|0);
      var $365=$364;
      var $366=HEAP32[(($365)>>2)];
      var $367=_lex_getlinenum();
      var $368=_MscAllocArc($358, $362, $366, $367);
      $arc=$368;
      var $369=$arc;
      var $370=_strdup_s(((5268476)|0));
      var $371=_MscAllocAttrib(11, $370);
      _MscArcLinkAttrib($369, $371);
      var $372=$arc;
      var $373=$yyval;
      HEAP32[(($373)>>2)]=$372;
      label = 70; break;
    case 60: 
      var $375=$yyvsp;
      var $376=((($375)-(8))|0);
      var $377=$376;
      var $378=HEAP32[(($377)>>2)];
      var $379=$yyvsp;
      var $380=(($379)|0);
      var $381=$380;
      var $382=HEAP32[(($381)>>2)];
      var $383=$yyvsp;
      var $384=((($383)-(4))|0);
      var $385=$384;
      var $386=HEAP32[(($385)>>2)];
      var $387=_lex_getlinenum();
      var $388=_MscAllocArc($378, $382, $386, $387);
      var $389=$yyval;
      HEAP32[(($389)>>2)]=$388;
      label = 70; break;
    case 61: 
      var $391=$yyvsp;
      var $392=((($391)-(8))|0);
      var $393=$392;
      var $394=HEAP32[(($393)>>2)];
      var $395=$yyvsp;
      var $396=(($395)|0);
      var $397=$396;
      var $398=HEAP32[(($397)>>2)];
      var $399=$yyvsp;
      var $400=((($399)-(4))|0);
      var $401=$400;
      var $402=HEAP32[(($401)>>2)];
      var $403=_lex_getlinenum();
      var $404=_MscAllocArc($394, $398, $402, $403);
      $arc2=$404;
      var $405=$arc2;
      var $406=_strdup_s(((5268476)|0));
      var $407=_MscAllocAttrib(10, $406);
      _MscArcLinkAttrib($405, $407);
      var $408=$arc2;
      var $409=$yyval;
      HEAP32[(($409)>>2)]=$408;
      label = 70; break;
    case 62: 
      var $411=$yyvsp;
      var $412=(($411)|0);
      var $413=$412;
      var $414=HEAP32[(($413)>>2)];
      var $415=$yyvsp;
      var $416=((($415)-(8))|0);
      var $417=$416;
      var $418=HEAP32[(($417)>>2)];
      var $419=$yyvsp;
      var $420=((($419)-(4))|0);
      var $421=$420;
      var $422=HEAP32[(($421)>>2)];
      var $423=_lex_getlinenum();
      var $424=_MscAllocArc($414, $418, $422, $423);
      var $425=$yyval;
      HEAP32[(($425)>>2)]=$424;
      label = 70; break;
    case 63: 
      var $427=$yyvsp;
      var $428=((($427)-(8))|0);
      var $429=$428;
      var $430=HEAP32[(($429)>>2)];
      var $431=_strdup_s(((5268452)|0));
      var $432=$yyvsp;
      var $433=((($432)-(4))|0);
      var $434=$433;
      var $435=HEAP32[(($434)>>2)];
      var $436=_lex_getlinenum();
      var $437=_MscAllocArc($430, $431, $435, $436);
      var $438=$yyval;
      HEAP32[(($438)>>2)]=$437;
      label = 70; break;
    case 64: 
      var $440=$yyvsp;
      var $441=(($440)|0);
      var $442=$441;
      var $443=HEAP32[(($442)>>2)];
      var $444=_strdup_s(((5268452)|0));
      var $445=$yyvsp;
      var $446=((($445)-(4))|0);
      var $447=$446;
      var $448=HEAP32[(($447)>>2)];
      var $449=_lex_getlinenum();
      var $450=_MscAllocArc($443, $444, $448, $449);
      var $451=$yyval;
      HEAP32[(($451)>>2)]=$450;
      label = 70; break;
    case 65: 
      var $453=$yyvsp;
      var $454=((($453)-(8))|0);
      var $455=$454;
      var $456=HEAP32[(($455)>>2)];
      var $457=$yyvsp;
      var $458=(($457)|0);
      var $459=$458;
      var $460=HEAP32[(($459)>>2)];
      var $461=_MscLinkAttrib($456, $460);
      var $462=$yyval;
      HEAP32[(($462)>>2)]=$461;
      label = 70; break;
    case 66: 
      var $464=$yyvsp;
      var $465=((($464)-(8))|0);
      var $466=$465;
      var $467=HEAP32[(($466)>>2)];
      var $468=$yyvsp;
      var $469=(($468)|0);
      var $470=$469;
      var $471=HEAP32[(($470)>>2)];
      var $472=_MscAllocAttrib($467, $471);
      var $473=$yyval;
      HEAP32[(($473)>>2)]=$472;
      label = 70; break;
    case 67: 
      var $475=$yyvsp;
      var $476=(($475)|0);
      var $477=$476;
      var $478=HEAP32[(($477)>>2)];
      var $479=_removeEscapes($478);
      var $480=$yyval;
      HEAP32[(($480)>>2)]=$479;
      label = 70; break;
    case 68: 
      var $482=$yyvsp;
      var $483=(($482)|0);
      var $484=$483;
      var $485=HEAP32[(($484)>>2)];
      var $486=$yyval;
      HEAP32[(($486)>>2)]=$485;
      label = 70; break;
    case 69: 
      label = 70; break;
    case 70: 
      var $489=$yylen;
      var $490=$yyvsp;
      var $491=(((-$489))|0);
      var $492=(($490+($491<<2))|0);
      $yyvsp=$492;
      var $493=$yylen;
      var $494=$yyssp;
      var $495=(((-$493))|0);
      var $496=(($494+($495<<1))|0);
      $yyssp=$496;
      $yylen=0;
      var $497=$yyvsp;
      var $498=(($497+4)|0);
      $yyvsp=$498;
      var $499=$498;
      var $500=$yyval;
      assert(4 % 1 === 0);HEAP32[(($499)>>2)]=HEAP32[(($500)>>2)];
      var $501=$yyn;
      var $502=((5243808+$501)|0);
      var $503=HEAP8[($502)];
      var $504=(($503)&(255));
      $yyn=$504;
      var $505=$yyn;
      var $506=((($505)-(56))|0);
      var $507=((5243880+$506)|0);
      var $508=HEAP8[($507)];
      var $509=(($508 << 24) >> 24);
      var $510=$yyssp;
      var $511=HEAP16[(($510)>>1)];
      var $512=(($511 << 16) >> 16);
      var $513=((($509)+($512))|0);
      $yystate=$513;
      var $514=$yystate;
      var $515=0 <= (($514)|(0));
      if ($515) { label = 71; break; } else { label = 74; break; }
    case 71: 
      var $517=$yystate;
      var $518=(($517)|(0)) <= 129;
      if ($518) { label = 72; break; } else { label = 74; break; }
    case 72: 
      var $520=$yystate;
      var $521=((5244516+$520)|0);
      var $522=HEAP8[($521)];
      var $523=(($522 << 24) >> 24);
      var $524=$yyssp;
      var $525=HEAP16[(($524)>>1)];
      var $526=(($525 << 16) >> 16);
      var $527=(($523)|(0))==(($526)|(0));
      if ($527) { label = 73; break; } else { label = 74; break; }
    case 73: 
      var $529=$yystate;
      var $530=((5243500+$529)|0);
      var $531=HEAP8[($530)];
      var $532=(($531)&(255));
      $yystate=$532;
      label = 75; break;
    case 74: 
      var $534=$yyn;
      var $535=((($534)-(56))|0);
      var $536=((5244392+$535)|0);
      var $537=HEAP8[($536)];
      var $538=(($537 << 24) >> 24);
      $yystate=$538;
      label = 75; break;
    case 75: 
      label = 2; break;
    case 76: 
      var $541=HEAP32[((5244648)>>2)];
      var $542=(($541)|(0))==-2;
      if ($542) { label = 77; break; } else { label = 78; break; }
    case 77: 
      var $556 = -2;label = 82; break;
    case 78: 
      var $545=HEAP32[((5244648)>>2)];
      var $546=(($545)>>>(0)) <= 310;
      if ($546) { label = 79; break; } else { label = 80; break; }
    case 79: 
      var $548=HEAP32[((5244648)>>2)];
      var $549=((5242880+$548)|0);
      var $550=HEAP8[($549)];
      var $551=(($550)&(255));
      var $554 = $551;label = 81; break;
    case 80: 
      var $554 = 2;label = 81; break;
    case 81: 
      var $554;
      var $556 = $554;label = 82; break;
    case 82: 
      var $556;
      $yytoken=$556;
      var $557=$yyerrstatus;
      var $558=(($557)|(0))!=0;
      if ($558) { label = 96; break; } else { label = 83; break; }
    case 83: 
      var $560=HEAP32[((5244008)>>2)];
      var $561=((($560)+(1))|0);
      HEAP32[((5244008)>>2)]=$561;
      $yymsgp=((5268328)|0);
      var $562=$yyssp;
      var $563=$yytoken;
      var $564=_yysyntax_error($yymsg_alloc, $yymsg, $562, $563);
      $yysyntax_error_status=$564;
      var $565=$yysyntax_error_status;
      var $566=(($565)|(0))==0;
      if ($566) { label = 84; break; } else { label = 85; break; }
    case 84: 
      var $568=HEAP32[(($yymsg)>>2)];
      $yymsgp=$568;
      label = 93; break;
    case 85: 
      var $570=$yysyntax_error_status;
      var $571=(($570)|(0))==1;
      if ($571) { label = 86; break; } else { label = 92; break; }
    case 86: 
      var $573=HEAP32[(($yymsg)>>2)];
      var $574=(($yymsgbuf)|0);
      var $575=(($573)|(0))!=(($574)|(0));
      if ($575) { label = 87; break; } else { label = 88; break; }
    case 87: 
      var $577=HEAP32[(($yymsg)>>2)];
      _free($577);
      label = 88; break;
    case 88: 
      var $579=HEAP32[(($yymsg_alloc)>>2)];
      var $580=_malloc_s($579);
      HEAP32[(($yymsg)>>2)]=$580;
      var $581=HEAP32[(($yymsg)>>2)];
      var $582=(($581)|(0))!=0;
      if ($582) { label = 90; break; } else { label = 89; break; }
    case 89: 
      var $584=(($yymsgbuf)|0);
      HEAP32[(($yymsg)>>2)]=$584;
      HEAP32[(($yymsg_alloc)>>2)]=128;
      $yysyntax_error_status=2;
      label = 91; break;
    case 90: 
      var $586=$yyssp;
      var $587=$yytoken;
      var $588=_yysyntax_error($yymsg_alloc, $yymsg, $586, $587);
      $yysyntax_error_status=$588;
      var $589=HEAP32[(($yymsg)>>2)];
      $yymsgp=$589;
      label = 91; break;
    case 91: 
      label = 92; break;
    case 92: 
      label = 93; break;
    case 93: 
      var $593=$yymsgp;
      _yyerror($593);
      var $594=$yysyntax_error_status;
      var $595=(($594)|(0))==2;
      if ($595) { label = 94; break; } else { label = 95; break; }
    case 94: 
      label = 119; break;
    case 95: 
      label = 96; break;
    case 96: 
      var $599=$yyerrstatus;
      var $600=(($599)|(0))==3;
      if ($600) { label = 97; break; } else { label = 103; break; }
    case 97: 
      var $602=HEAP32[((5244648)>>2)];
      var $603=(($602)|(0)) <= 0;
      if ($603) { label = 98; break; } else { label = 101; break; }
    case 98: 
      var $605=HEAP32[((5244648)>>2)];
      var $606=(($605)|(0))==0;
      if ($606) { label = 99; break; } else { label = 100; break; }
    case 99: 
      label = 118; break;
    case 100: 
      label = 102; break;
    case 101: 
      var $610=$yytoken;
      _yydestruct(((5268272)|0), $610, 5244012);
      HEAP32[((5244648)>>2)]=-2;
      label = 102; break;
    case 102: 
      label = 103; break;
    case 103: 
      label = 104; break;
    case 104: 
      $yyerrstatus=3;
      label = 105; break;
    case 105: 
      var $627=$yystate;
      var $628=((5243900+$627)|0);
      var $629=HEAP8[($628)];
      var $630=(($629 << 24) >> 24);
      $yyn=$630;
      var $631=$yyn;
      var $632=(($631)|(0))==-36;
      if ($632) { label = 113; break; } else { label = 106; break; }
    case 106: 
      var $634=$yyn;
      var $635=((($634)+(1))|0);
      $yyn=$635;
      var $636=$yyn;
      var $637=0 <= (($636)|(0));
      if ($637) { label = 107; break; } else { label = 112; break; }
    case 107: 
      var $639=$yyn;
      var $640=(($639)|(0)) <= 129;
      if ($640) { label = 108; break; } else { label = 112; break; }
    case 108: 
      var $642=$yyn;
      var $643=((5244516+$642)|0);
      var $644=HEAP8[($643)];
      var $645=(($644 << 24) >> 24);
      var $646=(($645)|(0))==1;
      if ($646) { label = 109; break; } else { label = 112; break; }
    case 109: 
      var $648=$yyn;
      var $649=((5243500+$648)|0);
      var $650=HEAP8[($649)];
      var $651=(($650)&(255));
      $yyn=$651;
      var $652=$yyn;
      var $653=0 < (($652)|(0));
      if ($653) { label = 110; break; } else { label = 111; break; }
    case 110: 
      label = 116; break;
    case 111: 
      label = 112; break;
    case 112: 
      label = 113; break;
    case 113: 
      var $658=$yyssp;
      var $659=$yyss;
      var $660=(($658)|(0))==(($659)|(0));
      if ($660) { label = 114; break; } else { label = 115; break; }
    case 114: 
      label = 118; break;
    case 115: 
      var $663=$yystate;
      var $664=((5243632+$663)|0);
      var $665=HEAP8[($664)];
      var $666=(($665)&(255));
      var $667=$yyvsp;
      _yydestruct(((5268256)|0), $666, $667);
      var $668=$yyvsp;
      var $669=((($668)-(4))|0);
      $yyvsp=$669;
      var $670=$yyssp;
      var $671=((($670)-(2))|0);
      $yyssp=$671;
      var $672=$yyssp;
      var $673=HEAP16[(($672)>>1)];
      var $674=(($673 << 16) >> 16);
      $yystate=$674;
      label = 105; break;
    case 116: 
      var $676=$yyvsp;
      var $677=(($676+4)|0);
      $yyvsp=$677;
      var $678=$677;
      assert(4 % 1 === 0);HEAP32[(($678)>>2)]=HEAP32[((5244012)>>2)];
      var $679=$yyn;
      $yystate=$679;
      label = 2; break;
    case 117: 
      $yyresult=0;
      label = 120; break;
    case 118: 
      $yyresult=1;
      label = 120; break;
    case 119: 
      _yyerror(((5268236)|0));
      $yyresult=2;
      label = 120; break;
    case 120: 
      var $684=HEAP32[((5244648)>>2)];
      var $685=(($684)|(0))!=-2;
      if ($685) { label = 121; break; } else { label = 125; break; }
    case 121: 
      var $687=HEAP32[((5244648)>>2)];
      var $688=(($687)>>>(0)) <= 310;
      if ($688) { label = 122; break; } else { label = 123; break; }
    case 122: 
      var $690=HEAP32[((5244648)>>2)];
      var $691=((5242880+$690)|0);
      var $692=HEAP8[($691)];
      var $693=(($692)&(255));
      var $696 = $693;label = 124; break;
    case 123: 
      var $696 = 2;label = 124; break;
    case 124: 
      var $696;
      $yytoken=$696;
      var $697=$yytoken;
      _yydestruct(((5268196)|0), $697, 5244012);
      label = 125; break;
    case 125: 
      var $699=$yylen;
      var $700=$yyvsp;
      var $701=(((-$699))|0);
      var $702=(($700+($701<<2))|0);
      $yyvsp=$702;
      var $703=$yylen;
      var $704=$yyssp;
      var $705=(((-$703))|0);
      var $706=(($704+($705<<1))|0);
      $yyssp=$706;
      label = 126; break;
    case 126: 
      var $708=$yyssp;
      var $709=$yyss;
      var $710=(($708)|(0))!=(($709)|(0));
      if ($710) { label = 127; break; } else { label = 128; break; }
    case 127: 
      var $712=$yyssp;
      var $713=HEAP16[(($712)>>1)];
      var $714=(($713 << 16) >> 16);
      var $715=((5243632+$714)|0);
      var $716=HEAP8[($715)];
      var $717=(($716)&(255));
      var $718=$yyvsp;
      _yydestruct(((5268176)|0), $717, $718);
      var $719=$yyvsp;
      var $720=((($719)-(4))|0);
      $yyvsp=$720;
      var $721=$yyssp;
      var $722=((($721)-(2))|0);
      $yyssp=$722;
      label = 126; break;
    case 128: 
      var $724=$yyss;
      var $725=(($yyssa)|0);
      var $726=(($724)|(0))!=(($725)|(0));
      if ($726) { label = 129; break; } else { label = 130; break; }
    case 129: 
      var $728=$yyss;
      var $729=$728;
      _free($729);
      label = 130; break;
    case 130: 
      var $731=HEAP32[(($yymsg)>>2)];
      var $732=(($yymsgbuf)|0);
      var $733=(($731)|(0))!=(($732)|(0));
      if ($733) { label = 131; break; } else { label = 132; break; }
    case 131: 
      var $735=HEAP32[(($yymsg)>>2)];
      _free($735);
      label = 132; break;
    case 132: 
      var $737=$yyresult;
      STACKTOP = __stackBase__;
      return $737;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrettyOptType($t) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$t;
      var $3=$2;
      if ((($3)|(0))==0) {
        label = 2; break;
      }
      else if ((($3)|(0))==1) {
        label = 3; break;
      }
      else if ((($3)|(0))==2) {
        label = 4; break;
      }
      else if ((($3)|(0))==3) {
        label = 5; break;
      }
      else {
      label = 6; break;
      }
    case 2: 
      $1=((5265604)|0);
      label = 7; break;
    case 3: 
      $1=((5263304)|0);
      label = 7; break;
    case 4: 
      $1=((5260992)|0);
      label = 7; break;
    case 5: 
      $1=((5260672)|0);
      label = 7; break;
    case 6: 
      $1=((5260268)|0);
      label = 7; break;
    case 7: 
      var $10=$1;
      return $10;
    default: assert(0, "bad label: " + label);
  }
}
function _yydestruct($yymsg, $yytype, $yyvaluep) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $1=$yymsg;
      $2=$yytype;
      $3=$yyvaluep;
      var $4=$3;
      var $5=$1;
      var $6=(($5)|(0))!=0;
      if ($6) { label = 3; break; } else { label = 2; break; }
    case 2: 
      $1=((5268164)|0);
      label = 3; break;
    case 3: 
      var $9=$2;
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yystrlen($yystr) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $yylen;
      $1=$yystr;
      $yylen=0;
      label = 2; break;
    case 2: 
      var $3=$yylen;
      var $4=$1;
      var $5=(($4+$3)|0);
      var $6=HEAP8[($5)];
      var $7=(($6 << 24) >> 24)!=0;
      if ($7) { label = 3; break; } else { label = 5; break; }
    case 3: 
      label = 4; break;
    case 4: 
      var $10=$yylen;
      var $11=((($10)+(1))|0);
      $yylen=$11;
      label = 2; break;
    case 5: 
      var $13=$yylen;
      return $13;
    default: assert(0, "bad label: " + label);
  }
}
function _yystpcpy($yydest, $yysrc) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $yyd;
      var $yys;
      $1=$yydest;
      $2=$yysrc;
      var $3=$1;
      $yyd=$3;
      var $4=$2;
      $yys=$4;
      label = 2; break;
    case 2: 
      var $6=$yys;
      var $7=(($6+1)|0);
      $yys=$7;
      var $8=HEAP8[($6)];
      var $9=$yyd;
      var $10=(($9+1)|0);
      $yyd=$10;
      HEAP8[($9)]=$8;
      var $11=(($8 << 24) >> 24);
      var $12=(($11)|(0))!=0;
      if ($12) { label = 3; break; } else { label = 4; break; }
    case 3: 
      label = 2; break;
    case 4: 
      var $15=$yyd;
      var $16=((($15)-(1))|0);
      return $16;
    default: assert(0, "bad label: " + label);
  }
}
function _MscFindOpt($list, $type) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $elem;
      $2=$list;
      $3=$type;
      var $4=$2;
      $elem=$4;
      label = 2; break;
    case 2: 
      var $6=$elem;
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { var $15 = 0;label = 4; break; }
    case 3: 
      var $9=$elem;
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=$3;
      var $13=(($11)|(0))!=(($12)|(0));
      var $15 = $13;label = 4; break;
    case 4: 
      var $15;
      if ($15) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $17=$elem;
      var $18=(($17+8)|0);
      var $19=HEAP32[(($18)>>2)];
      $elem=$19;
      label = 2; break;
    case 6: 
      var $21=$elem;
      var $22=(($21)|(0))!=0;
      if ($22) { label = 7; break; } else { label = 9; break; }
    case 7: 
      var $24=$elem;
      var $25=(($24)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=$3;
      var $28=(($26)|(0))==(($27)|(0));
      if ($28) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $30=$elem;
      $1=$30;
      label = 10; break;
    case 9: 
      $1=0;
      label = 10; break;
    case 10: 
      var $33=$1;
      return $33;
    default: assert(0, "bad label: " + label);
  }
}
function _yysyntax_error($yymsg_alloc, $yymsg, $yyssp, $yytoken) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 20)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $yysize0;
      var $yysize;
      var $yysize1;
      var $yyformat;
      var $yyarg=__stackBase__;
      var $yycount;
      var $yyn;
      var $yyxbegin;
      var $yychecklim;
      var $yyxend;
      var $yyx;
      var $yyp;
      var $yyi;
      $2=$yymsg_alloc;
      $3=$yymsg;
      $4=$yyssp;
      $5=$yytoken;
      var $6=$5;
      var $7=((5243192+($6<<2))|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=_yytnamerr(0, $8);
      $yysize0=$9;
      var $10=$yysize0;
      $yysize=$10;
      $yyformat=0;
      $yycount=0;
      var $11=$5;
      var $12=(($11)|(0))!=-2;
      if ($12) { label = 2; break; } else { label = 23; break; }
    case 2: 
      var $14=$4;
      var $15=HEAP16[(($14)>>1)];
      var $16=(($15 << 16) >> 16);
      var $17=((5243900+$16)|0);
      var $18=HEAP8[($17)];
      var $19=(($18 << 24) >> 24);
      $yyn=$19;
      var $20=$5;
      var $21=((5243192+($20<<2))|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=$yycount;
      var $24=((($23)+(1))|0);
      $yycount=$24;
      var $25=(($yyarg+($23<<2))|0);
      HEAP32[(($25)>>2)]=$22;
      var $26=$yyn;
      var $27=(($26)|(0))==-36;
      if ($27) { label = 22; break; } else { label = 3; break; }
    case 3: 
      var $29=$yyn;
      var $30=(($29)|(0)) < 0;
      if ($30) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $32=$yyn;
      var $33=(((-$32))|0);
      var $36 = $33;label = 6; break;
    case 5: 
      var $36 = 0;label = 6; break;
    case 6: 
      var $36;
      $yyxbegin=$36;
      var $37=$yyn;
      var $38=(((129)-($37))|0);
      var $39=((($38)+(1))|0);
      $yychecklim=$39;
      var $40=$yychecklim;
      var $41=(($40)|(0)) < 56;
      if ($41) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $43=$yychecklim;
      var $46 = $43;label = 9; break;
    case 8: 
      var $46 = 56;label = 9; break;
    case 9: 
      var $46;
      $yyxend=$46;
      var $47=$yyxbegin;
      $yyx=$47;
      label = 10; break;
    case 10: 
      var $49=$yyx;
      var $50=$yyxend;
      var $51=(($49)|(0)) < (($50)|(0));
      if ($51) { label = 11; break; } else { label = 21; break; }
    case 11: 
      var $53=$yyx;
      var $54=$yyn;
      var $55=((($53)+($54))|0);
      var $56=((5244516+$55)|0);
      var $57=HEAP8[($56)];
      var $58=(($57 << 24) >> 24);
      var $59=$yyx;
      var $60=(($58)|(0))==(($59)|(0));
      if ($60) { label = 12; break; } else { label = 19; break; }
    case 12: 
      var $62=$yyx;
      var $63=(($62)|(0))!=1;
      if ($63) { label = 13; break; } else { label = 19; break; }
    case 13: 
      var $65=$yycount;
      var $66=(($65)|(0))==5;
      if ($66) { label = 14; break; } else { label = 15; break; }
    case 14: 
      $yycount=1;
      var $68=$yysize0;
      $yysize=$68;
      label = 21; break;
    case 15: 
      var $70=$yyx;
      var $71=((5243192+($70<<2))|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=$yycount;
      var $74=((($73)+(1))|0);
      $yycount=$74;
      var $75=(($yyarg+($73<<2))|0);
      HEAP32[(($75)>>2)]=$72;
      var $76=$yysize;
      var $77=$yyx;
      var $78=((5243192+($77<<2))|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=_yytnamerr(0, $79);
      var $81=((($76)+($80))|0);
      $yysize1=$81;
      var $82=$yysize;
      var $83=$yysize1;
      var $84=(($82)>>>(0)) <= (($83)>>>(0));
      if ($84) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $86=$yysize1;
      var $87=(($86)>>>(0)) <= 4294967295;
      if ($87) { label = 18; break; } else { label = 17; break; }
    case 17: 
      $1=2;
      label = 47; break;
    case 18: 
      var $90=$yysize1;
      $yysize=$90;
      label = 19; break;
    case 19: 
      label = 20; break;
    case 20: 
      var $93=$yyx;
      var $94=((($93)+(1))|0);
      $yyx=$94;
      label = 10; break;
    case 21: 
      label = 22; break;
    case 22: 
      label = 23; break;
    case 23: 
      var $98=$yycount;
      if ((($98)|(0))==0) {
        label = 24; break;
      }
      else if ((($98)|(0))==1) {
        label = 25; break;
      }
      else if ((($98)|(0))==2) {
        label = 26; break;
      }
      else if ((($98)|(0))==3) {
        label = 27; break;
      }
      else if ((($98)|(0))==4) {
        label = 28; break;
      }
      else if ((($98)|(0))==5) {
        label = 29; break;
      }
      else {
      label = 30; break;
      }
    case 24: 
      $yyformat=((5268328)|0);
      label = 30; break;
    case 25: 
      $yyformat=((5268108)|0);
      label = 30; break;
    case 26: 
      $yyformat=((5268064)|0);
      label = 30; break;
    case 27: 
      $yyformat=((5268004)|0);
      label = 30; break;
    case 28: 
      $yyformat=((5267888)|0);
      label = 30; break;
    case 29: 
      $yyformat=((5267776)|0);
      label = 30; break;
    case 30: 
      var $106=$yysize;
      var $107=$yyformat;
      var $108=_yystrlen($107);
      var $109=((($106)+($108))|0);
      $yysize1=$109;
      var $110=$yysize;
      var $111=$yysize1;
      var $112=(($110)>>>(0)) <= (($111)>>>(0));
      if ($112) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $114=$yysize1;
      var $115=(($114)>>>(0)) <= 4294967295;
      if ($115) { label = 33; break; } else { label = 32; break; }
    case 32: 
      $1=2;
      label = 47; break;
    case 33: 
      var $118=$yysize1;
      $yysize=$118;
      var $119=$2;
      var $120=HEAP32[(($119)>>2)];
      var $121=$yysize;
      var $122=(($120)>>>(0)) < (($121)>>>(0));
      if ($122) { label = 34; break; } else { label = 38; break; }
    case 34: 
      var $124=$yysize;
      var $125=($124<<1);
      var $126=$2;
      HEAP32[(($126)>>2)]=$125;
      var $127=$yysize;
      var $128=$2;
      var $129=HEAP32[(($128)>>2)];
      var $130=(($127)>>>(0)) <= (($129)>>>(0));
      if ($130) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $132=$2;
      var $133=HEAP32[(($132)>>2)];
      var $134=(($133)>>>(0)) <= 4294967295;
      if ($134) { label = 37; break; } else { label = 36; break; }
    case 36: 
      var $136=$2;
      HEAP32[(($136)>>2)]=-1;
      label = 37; break;
    case 37: 
      $1=1;
      label = 47; break;
    case 38: 
      var $139=$3;
      var $140=HEAP32[(($139)>>2)];
      $yyp=$140;
      $yyi=0;
      label = 39; break;
    case 39: 
      var $142=$yyformat;
      var $143=HEAP8[($142)];
      var $144=$yyp;
      HEAP8[($144)]=$143;
      var $145=(($143 << 24) >> 24);
      var $146=(($145)|(0))!=0;
      if ($146) { label = 40; break; } else { label = 46; break; }
    case 40: 
      var $148=$yyp;
      var $149=HEAP8[($148)];
      var $150=(($149 << 24) >> 24);
      var $151=(($150)|(0))==37;
      if ($151) { label = 41; break; } else { label = 44; break; }
    case 41: 
      var $153=$yyformat;
      var $154=(($153+1)|0);
      var $155=HEAP8[($154)];
      var $156=(($155 << 24) >> 24);
      var $157=(($156)|(0))==115;
      if ($157) { label = 42; break; } else { label = 44; break; }
    case 42: 
      var $159=$yyi;
      var $160=$yycount;
      var $161=(($159)|(0)) < (($160)|(0));
      if ($161) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $163=$yyp;
      var $164=$yyi;
      var $165=((($164)+(1))|0);
      $yyi=$165;
      var $166=(($yyarg+($164<<2))|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=_yytnamerr($163, $167);
      var $169=$yyp;
      var $170=(($169+$168)|0);
      $yyp=$170;
      var $171=$yyformat;
      var $172=(($171+2)|0);
      $yyformat=$172;
      label = 45; break;
    case 44: 
      var $174=$yyp;
      var $175=(($174+1)|0);
      $yyp=$175;
      var $176=$yyformat;
      var $177=(($176+1)|0);
      $yyformat=$177;
      label = 45; break;
    case 45: 
      label = 39; break;
    case 46: 
      $1=0;
      label = 47; break;
    case 47: 
      var $181=$1;
      STACKTOP = __stackBase__;
      return $181;
    default: assert(0, "bad label: " + label);
  }
}
function _yytnamerr($yyres, $yystr) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $yyn;
      var $yyp;
      $2=$yyres;
      $3=$yystr;
      var $4=$3;
      var $5=HEAP8[($4)];
      var $6=(($5 << 24) >> 24);
      var $7=(($6)|(0))==34;
      if ($7) { label = 2; break; } else { label = 16; break; }
    case 2: 
      $yyn=0;
      var $9=$3;
      $yyp=$9;
      label = 3; break;
    case 3: 
      var $11=$yyp;
      var $12=(($11+1)|0);
      $yyp=$12;
      var $13=HEAP8[($12)];
      var $14=(($13 << 24) >> 24);
      if ((($14)|(0))==39 | (($14)|(0))==44) {
        label = 4; break;
      }
      else if ((($14)|(0))==92) {
        label = 5; break;
      }
      else if ((($14)|(0))==34) {
        label = 11; break;
      }
      else {
      label = 8; break;
      }
    case 4: 
      label = 15; break;
    case 5: 
      var $17=$yyp;
      var $18=(($17+1)|0);
      $yyp=$18;
      var $19=HEAP8[($18)];
      var $20=(($19 << 24) >> 24);
      var $21=(($20)|(0))!=92;
      if ($21) { label = 6; break; } else { label = 7; break; }
    case 6: 
      label = 15; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $25=$2;
      var $26=(($25)|(0))!=0;
      if ($26) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $28=$yyp;
      var $29=HEAP8[($28)];
      var $30=$yyn;
      var $31=$2;
      var $32=(($31+$30)|0);
      HEAP8[($32)]=$29;
      label = 10; break;
    case 10: 
      var $34=$yyn;
      var $35=((($34)+(1))|0);
      $yyn=$35;
      label = 14; break;
    case 11: 
      var $37=$2;
      var $38=(($37)|(0))!=0;
      if ($38) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $40=$yyn;
      var $41=$2;
      var $42=(($41+$40)|0);
      HEAP8[($42)]=0;
      label = 13; break;
    case 13: 
      var $44=$yyn;
      $1=$44;
      label = 19; break;
    case 14: 
      label = 3; break;
    case 15: 
      label = 16; break;
    case 16: 
      var $48=$2;
      var $49=(($48)|(0))!=0;
      if ($49) { label = 18; break; } else { label = 17; break; }
    case 17: 
      var $51=$3;
      var $52=_yystrlen($51);
      $1=$52;
      label = 19; break;
    case 18: 
      var $54=$2;
      var $55=$3;
      var $56=_yystpcpy($54, $55);
      var $57=$2;
      var $58=$56;
      var $59=$57;
      var $60=((($58)-($59))|0);
      $1=$60;
      label = 19; break;
    case 19: 
      var $62=$1;
      return $62;
    default: assert(0, "bad label: " + label);
  }
}
function _MscAllocOpt($type, $value) {
  var label = 0;
  var $1;
  var $2;
  var $a;
  $1=$type;
  $2=$value;
  var $3=_malloc_s(12);
  var $4=$3;
  $a=$4;
  var $5=$1;
  var $6=$a;
  var $7=(($6)|0);
  HEAP32[(($7)>>2)]=$5;
  var $8=$2;
  var $9=$a;
  var $10=(($9+4)|0);
  HEAP32[(($10)>>2)]=$8;
  var $11=$a;
  var $12=(($11+8)|0);
  HEAP32[(($12)>>2)]=0;
  var $13=$a;
  return $13;
}
function _MscPrintOptList($list) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $elem;
      $1=$list;
      var $2=$1;
      $elem=$2;
      label = 2; break;
    case 2: 
      var $4=$elem;
      var $5=(($4)|(0))!=0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $7=$elem;
      var $8=$elem;
      var $9=(($8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=_MscPrettyOptType($10);
      var $12=$elem;
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=_printf(((5259976)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 12)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$7,HEAP32[(((tempInt)+(4))>>2)]=$11,HEAP32[(((tempInt)+(8))>>2)]=$14,tempInt));
      var $16=$elem;
      var $17=(($16+8)|0);
      var $18=HEAP32[(($17)>>2)];
      $elem=$18;
      label = 2; break;
    case 4: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscAllocEntity($entityName) {
  var label = 0;
  var $1;
  var $e;
  $1=$entityName;
  var $2=_malloc_s(12);
  var $3=$2;
  $e=$3;
  var $4=$1;
  var $5=$e;
  var $6=(($5)|0);
  HEAP32[(($6)>>2)]=$4;
  var $7=$e;
  var $8=(($7+4)|0);
  HEAP32[(($8)>>2)]=0;
  var $9=$e;
  var $10=(($9+8)|0);
  HEAP32[(($10)>>2)]=0;
  var $11=$e;
  return $11;
}
function _MscLinkEntity($list, $elem) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$list;
      $2=$elem;
      var $3=$1;
      var $4=(($3)|(0))==0;
      if ($4) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $6=_zalloc_s(12);
      var $7=$6;
      $1=$7;
      label = 3; break;
    case 3: 
      var $9=$1;
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|(0))==0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$2;
      var $15=$1;
      var $16=(($15+8)|0);
      HEAP32[(($16)>>2)]=$14;
      var $17=$1;
      var $18=(($17+4)|0);
      HEAP32[(($18)>>2)]=$14;
      label = 6; break;
    case 5: 
      var $20=$2;
      var $21=$1;
      var $22=(($21+8)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=(($23+8)|0);
      HEAP32[(($24)>>2)]=$20;
      var $25=$2;
      var $26=$1;
      var $27=(($26+8)|0);
      HEAP32[(($27)>>2)]=$25;
      label = 6; break;
    case 6: 
      var $29=$1;
      var $30=(($29)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=((($31)+(1))|0);
      HEAP32[(($30)>>2)]=$32;
      var $33=$1;
      return $33;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrintEntityList($list) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $elem;
      $1=$list;
      var $2=$1;
      var $3=(($2+4)|0);
      var $4=HEAP32[(($3)>>2)];
      $elem=$4;
      label = 2; break;
    case 2: 
      var $6=$elem;
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$elem;
      var $10=$elem;
      var $11=(($10)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=_printf(((5259720)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$9,HEAP32[(((tempInt)+(4))>>2)]=$12,tempInt));
      var $14=$elem;
      var $15=(($14+4)|0);
      var $16=HEAP32[(($15)>>2)];
      _MscPrintAttrib($16);
      var $17=$elem;
      var $18=(($17+8)|0);
      var $19=HEAP32[(($18)>>2)];
      $elem=$19;
      label = 2; break;
    case 4: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrintAttrib($att) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$att;
      label = 2; break;
    case 2: 
      var $3=$1;
      var $4=(($3)|(0))!=0;
      if ($4) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $6=$1;
      var $7=(($6)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=_MscPrettyAttribType($8);
      var $10=$1;
      var $11=(($10+4)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=_printf(((5268052)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$9,HEAP32[(((tempInt)+(4))>>2)]=$12,tempInt));
      var $14=$1;
      var $15=(($14+8)|0);
      var $16=HEAP32[(($15)>>2)];
      $1=$16;
      label = 2; break;
    case 4: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscLinkOpt($head, $newHead) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $tail;
      $1=$head;
      $2=$newHead;
      var $3=$2;
      $tail=$3;
      var $4=$2;
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5266832)|0), 155, ((5269116)|0), ((5267768)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $11=$tail;
      var $12=(($11+8)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=(($13)|(0))!=0;
      if ($14) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $16=$tail;
      var $17=(($16+8)|0);
      var $18=HEAP32[(($17)>>2)];
      $tail=$18;
      label = 5; break;
    case 7: 
      var $20=$1;
      var $21=$tail;
      var $22=(($21+8)|0);
      HEAP32[(($22)>>2)]=$20;
      var $23=$2;
      return $23;
    default: assert(0, "bad label: " + label);
  }
}
function _MscAllocArc($srcEntity, $dstEntity, $type, $inputLine) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $a;
      $1=$srcEntity;
      $2=$dstEntity;
      $3=$type;
      $4=$inputLine;
      var $5=_malloc_s(24);
      var $6=$5;
      $a=$6;
      var $7=$3;
      var $8=(($7)|(0))==5;
      if ($8) { label = 2; break; } else { label = 7; break; }
    case 2: 
      var $10=$1;
      var $11=(($10)|(0))==0;
      if ($11) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $13=$2;
      var $14=(($13)|(0))==0;
      if ($14) { label = 4; break; } else { label = 5; break; }
    case 4: 
      label = 6; break;
    case 5: 
      ___assert_func(((5266832)|0), 292, ((5269164)|0), ((5259288)|0));
      throw "Reached an unreachable!"
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $20=$4;
      var $21=$a;
      var $22=(($21+12)|0);
      HEAP32[(($22)>>2)]=$20;
      var $23=$1;
      var $24=$a;
      var $25=(($24)|0);
      HEAP32[(($25)>>2)]=$23;
      var $26=$2;
      var $27=$a;
      var $28=(($27+4)|0);
      HEAP32[(($28)>>2)]=$26;
      var $29=$3;
      var $30=$a;
      var $31=(($30+8)|0);
      HEAP32[(($31)>>2)]=$29;
      var $32=$a;
      var $33=(($32+20)|0);
      HEAP32[(($33)>>2)]=0;
      var $34=$a;
      var $35=(($34+16)|0);
      HEAP32[(($35)>>2)]=0;
      var $36=$a;
      return $36;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrettyAttribType($t) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$t;
      var $3=$2;
      if ((($3)|(0))==0) {
        label = 2; break;
      }
      else if ((($3)|(0))==2) {
        label = 3; break;
      }
      else if ((($3)|(0))==1) {
        label = 4; break;
      }
      else if ((($3)|(0))==3) {
        label = 5; break;
      }
      else if ((($3)|(0))==4) {
        label = 6; break;
      }
      else if ((($3)|(0))==5) {
        label = 7; break;
      }
      else if ((($3)|(0))==6) {
        label = 8; break;
      }
      else if ((($3)|(0))==7) {
        label = 9; break;
      }
      else if ((($3)|(0))==8) {
        label = 10; break;
      }
      else if ((($3)|(0))==9) {
        label = 11; break;
      }
      else if ((($3)|(0))==10) {
        label = 12; break;
      }
      else if ((($3)|(0))==11) {
        label = 13; break;
      }
      else if ((($3)|(0))==12) {
        label = 14; break;
      }
      else {
      label = 15; break;
      }
    case 2: 
      $1=((5267600)|0);
      label = 16; break;
    case 3: 
      $1=((5267188)|0);
      label = 16; break;
    case 4: 
      $1=((5266968)|0);
      label = 16; break;
    case 5: 
      $1=((5266788)|0);
      label = 16; break;
    case 6: 
      $1=((5266656)|0);
      label = 16; break;
    case 7: 
      $1=((5266512)|0);
      label = 16; break;
    case 8: 
      $1=((5266152)|0);
      label = 16; break;
    case 9: 
      $1=((5265880)|0);
      label = 16; break;
    case 10: 
      $1=((5265716)|0);
      label = 16; break;
    case 11: 
      $1=((5265652)|0);
      label = 16; break;
    case 12: 
      $1=((5265560)|0);
      label = 16; break;
    case 13: 
      $1=((5265416)|0);
      label = 16; break;
    case 14: 
      $1=((5264236)|0);
      label = 16; break;
    case 15: 
      $1=((5260268)|0);
      label = 16; break;
    case 16: 
      var $19=$1;
      return $19;
    default: assert(0, "bad label: " + label);
  }
}
function _MscResetEntityIterator($m) {
  var label = 0;
  var $1;
  $1=$m;
  var $2=$1;
  var $3=(($2+4)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4+4)|0);
  var $6=HEAP32[(($5)>>2)];
  var $7=$1;
  var $8=(($7+16)|0);
  HEAP32[(($8)>>2)]=$6;
  return;
}
function _MscResetArcIterator($m) {
  var label = 0;
  var $1;
  $1=$m;
  var $2=$1;
  var $3=(($2+8)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4+8)|0);
  var $6=HEAP32[(($5)>>2)];
  var $7=$1;
  var $8=(($7+12)|0);
  HEAP32[(($8)>>2)]=$6;
  return;
}
function _MscGetNumOpts($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $elem;
      var $count;
      $1=$m;
      var $2=$1;
      var $3=(($2)|0);
      var $4=HEAP32[(($3)>>2)];
      $elem=$4;
      $count=0;
      label = 2; break;
    case 2: 
      var $6=$elem;
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$count;
      var $10=((($9)+(1))|0);
      $count=$10;
      var $11=$elem;
      var $12=(($11+8)|0);
      var $13=HEAP32[(($12)>>2)];
      $elem=$13;
      label = 2; break;
    case 4: 
      var $15=$count;
      return $15;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetNumEntities($m) {
  var label = 0;
  var $1;
  $1=$m;
  var $2=$1;
  var $3=(($2+4)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4)|0);
  var $6=HEAP32[(($5)>>2)];
  return $6;
}
function _MscGetNumParallelArcs($m) {
  var label = 0;
  var $1;
  $1=$m;
  var $2=$1;
  var $3=(($2+8)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4+4)|0);
  var $6=HEAP32[(($5)>>2)];
  return $6;
}
function _MscGetNumArcs($m) {
  var label = 0;
  var $1;
  $1=$m;
  var $2=$1;
  var $3=(($2+8)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4)|0);
  var $6=HEAP32[(($5)>>2)];
  return $6;
}
function _MscNextEntity($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$m;
      var $3=$2;
      var $4=(($3+16)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5+8)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|(0))!=0;
      if ($8) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $10=$2;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+8)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$2;
      var $16=(($15+16)|0);
      HEAP32[(($16)>>2)]=$14;
      $1=1;
      label = 4; break;
    case 3: 
      $1=0;
      label = 4; break;
    case 4: 
      var $19=$1;
      return $19;
    default: assert(0, "bad label: " + label);
  }
}
function _findAttrib($attr, $a) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $2=$attr;
      $3=$a;
      label = 2; break;
    case 2: 
      var $5=$2;
      var $6=(($5)|(0))!=0;
      if ($6) { label = 3; break; } else { var $14 = 0;label = 4; break; }
    case 3: 
      var $8=$2;
      var $9=(($8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=$3;
      var $12=(($10)|(0))!=(($11)|(0));
      var $14 = $12;label = 4; break;
    case 4: 
      var $14;
      if ($14) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $16=$2;
      var $17=(($16+8)|0);
      var $18=HEAP32[(($17)>>2)];
      $2=$18;
      label = 2; break;
    case 6: 
      var $20=$2;
      var $21=(($20)|(0))!=0;
      if ($21) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $23=$2;
      var $24=(($23+4)|0);
      var $25=HEAP32[(($24)>>2)];
      $1=$25;
      label = 9; break;
    case 8: 
      $1=0;
      label = 9; break;
    case 9: 
      var $28=$1;
      return $28;
    default: assert(0, "bad label: " + label);
  }
}
function _MscNextArc($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$m;
      var $3=$2;
      var $4=(($3+12)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5+20)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|(0))!=0;
      if ($8) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $10=$2;
      var $11=(($10+12)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+20)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$2;
      var $16=(($15+12)|0);
      HEAP32[(($16)>>2)]=$14;
      $1=1;
      label = 4; break;
    case 3: 
      $1=0;
      label = 4; break;
    case 4: 
      var $19=$1;
      return $19;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetCurrentArcSource($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$m;
      var $2=$1;
      var $3=(($2+12)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $7=$1;
      var $8=(($7+12)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $14 = $11;label = 4; break;
    case 3: 
      var $14 = 0;label = 4; break;
    case 4: 
      var $14;
      return $14;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetCurrentArcDest($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$m;
      var $2=$1;
      var $3=(($2+12)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $7=$1;
      var $8=(($7+12)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $14 = $11;label = 4; break;
    case 3: 
      var $14 = 0;label = 4; break;
    case 4: 
      var $14;
      return $14;
    default: assert(0, "bad label: " + label);
  }
}
function _MscLinkArc($list, $elem) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$list;
      $2=$elem;
      var $3=$1;
      var $4=(($3)|(0))==0;
      if ($4) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $6=_zalloc_s(16);
      var $7=$6;
      $1=$7;
      label = 3; break;
    case 3: 
      var $9=$1;
      var $10=(($9+8)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|(0))==0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$2;
      var $15=$1;
      var $16=(($15+12)|0);
      HEAP32[(($16)>>2)]=$14;
      var $17=$1;
      var $18=(($17+8)|0);
      HEAP32[(($18)>>2)]=$14;
      label = 6; break;
    case 5: 
      var $20=$2;
      var $21=$1;
      var $22=(($21+12)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=(($23+20)|0);
      HEAP32[(($24)>>2)]=$20;
      var $25=$2;
      var $26=$1;
      var $27=(($26+12)|0);
      HEAP32[(($27)>>2)]=$25;
      label = 6; break;
    case 6: 
      var $29=$1;
      var $30=(($29)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=((($31)+(1))|0);
      HEAP32[(($30)>>2)]=$32;
      var $33=$2;
      var $34=(($33+8)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=(($35)|(0))==8;
      if ($36) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $38=$1;
      var $39=(($38+4)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=((($40)+(2))|0);
      HEAP32[(($39)>>2)]=$41;
      label = 8; break;
    case 8: 
      var $43=$1;
      return $43;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrintArcList($list) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $elem;
      $1=$list;
      var $2=$1;
      var $3=(($2+8)|0);
      var $4=HEAP32[(($3)>>2)];
      $elem=$4;
      label = 2; break;
    case 2: 
      var $6=$elem;
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$elem;
      var $10=$elem;
      var $11=(($10)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=$elem;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=_printf(((5268456)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 12)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$9,HEAP32[(((tempInt)+(4))>>2)]=$12,HEAP32[(((tempInt)+(8))>>2)]=$15,tempInt));
      var $17=$elem;
      var $18=(($17+16)|0);
      var $19=HEAP32[(($18)>>2)];
      _MscPrintAttrib($19);
      var $20=$elem;
      var $21=(($20+20)|0);
      var $22=HEAP32[(($21)>>2)];
      $elem=$22;
      label = 2; break;
    case 4: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscAllocAttrib($type, $value) {
  var label = 0;
  var $1;
  var $2;
  var $a;
  $1=$type;
  $2=$value;
  var $3=_malloc_s(12);
  var $4=$3;
  $a=$4;
  var $5=$1;
  var $6=$a;
  var $7=(($6)|0);
  HEAP32[(($7)>>2)]=$5;
  var $8=$2;
  var $9=$a;
  var $10=(($9+4)|0);
  HEAP32[(($10)>>2)]=$8;
  var $11=$a;
  var $12=(($11+8)|0);
  HEAP32[(($12)>>2)]=0;
  var $13=$a;
  return $13;
}
function _MscArcLinkAttrib($arc, $att) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$arc;
      $2=$att;
      var $3=$1;
      var $4=(($3+16)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5)|(0))!=0;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $8=$1;
      var $9=(($8+16)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=$2;
      var $12=_MscLinkAttrib($10, $11);
      var $13=$1;
      var $14=(($13+16)|0);
      HEAP32[(($14)>>2)]=$12;
      label = 4; break;
    case 3: 
      var $16=$2;
      var $17=$1;
      var $18=(($17+16)|0);
      HEAP32[(($18)>>2)]=$16;
      label = 4; break;
    case 4: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscEntityLinkAttrib($ent, $att) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$ent;
      $2=$att;
      var $3=$1;
      var $4=(($3+4)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5)|(0))!=0;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $8=$1;
      var $9=(($8+4)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=$2;
      var $12=_MscLinkAttrib($10, $11);
      var $13=$1;
      var $14=(($13+4)|0);
      HEAP32[(($14)>>2)]=$12;
      label = 4; break;
    case 3: 
      var $16=$2;
      var $17=$1;
      var $18=(($17+4)|0);
      HEAP32[(($18)>>2)]=$16;
      label = 4; break;
    case 4: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscAlloc($optList, $entityList, $arcList) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $m;
  $1=$optList;
  $2=$entityList;
  $3=$arcList;
  var $4=_malloc_s(20);
  var $5=$4;
  $m=$5;
  var $6=$1;
  var $7=$m;
  var $8=(($7)|0);
  HEAP32[(($8)>>2)]=$6;
  var $9=$2;
  var $10=$m;
  var $11=(($10+4)|0);
  HEAP32[(($11)>>2)]=$9;
  var $12=$3;
  var $13=$m;
  var $14=(($13+8)|0);
  HEAP32[(($14)>>2)]=$12;
  var $15=$m;
  _MscResetEntityIterator($15);
  var $16=$m;
  _MscResetArcIterator($16);
  var $17=$m;
  return $17;
}
function _MscFree($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $opt;
      var $entity;
      var $arc;
      var $next;
      var $next1;
      var $next2;
      $1=$m;
      var $2=$1;
      var $3=(($2)|0);
      var $4=HEAP32[(($3)>>2)];
      $opt=$4;
      var $5=$1;
      var $6=(($5+4)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7+4)|0);
      var $9=HEAP32[(($8)>>2)];
      $entity=$9;
      var $10=$1;
      var $11=(($10+8)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+8)|0);
      var $14=HEAP32[(($13)>>2)];
      $arc=$14;
      label = 2; break;
    case 2: 
      var $16=$opt;
      var $17=(($16)|(0))!=0;
      if ($17) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $19=$opt;
      var $20=(($19+8)|0);
      var $21=HEAP32[(($20)>>2)];
      $next=$21;
      var $22=$opt;
      var $23=(($22+4)|0);
      var $24=HEAP32[(($23)>>2)];
      _free($24);
      var $25=$opt;
      var $26=$25;
      _free($26);
      var $27=$next;
      $opt=$27;
      label = 2; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $30=$entity;
      var $31=(($30)|(0))!=0;
      if ($31) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $33=$entity;
      var $34=(($33+8)|0);
      var $35=HEAP32[(($34)>>2)];
      $next1=$35;
      var $36=$entity;
      var $37=(($36+4)|0);
      var $38=HEAP32[(($37)>>2)];
      _freeAttribList($38);
      var $39=$entity;
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      _free($41);
      var $42=$entity;
      var $43=$42;
      _free($43);
      var $44=$next1;
      $entity=$44;
      label = 5; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $47=$arc;
      var $48=(($47)|(0))!=0;
      if ($48) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $50=$arc;
      var $51=(($50+20)|0);
      var $52=HEAP32[(($51)>>2)];
      $next2=$52;
      var $53=$arc;
      var $54=(($53+16)|0);
      var $55=HEAP32[(($54)>>2)];
      _freeAttribList($55);
      var $56=$arc;
      var $57=(($56+4)|0);
      var $58=HEAP32[(($57)>>2)];
      _free($58);
      var $59=$arc;
      var $60=(($59)|0);
      var $61=HEAP32[(($60)>>2)];
      _free($61);
      var $62=$arc;
      var $63=$62;
      _free($63);
      var $64=$next2;
      $arc=$64;
      label = 8; break;
    case 10: 
      var $66=$1;
      var $67=(($66+4)|0);
      var $68=HEAP32[(($67)>>2)];
      var $69=$68;
      _free($69);
      var $70=$1;
      var $71=(($70+8)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=$72;
      _free($73);
      var $74=$1;
      var $75=$74;
      _free($75);
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _freeAttribList($attr) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $next;
      $1=$attr;
      label = 2; break;
    case 2: 
      var $3=$1;
      var $4=(($3)|(0))!=0;
      if ($4) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $6=$1;
      var $7=(($6+8)|0);
      var $8=HEAP32[(($7)>>2)];
      $next=$8;
      var $9=$1;
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      _free($11);
      var $12=$1;
      var $13=$12;
      _free($13);
      var $14=$next;
      $1=$14;
      label = 2; break;
    case 4: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _MscPrint($m) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  $1=$m;
  var $2=$1;
  var $3=_MscGetNumOpts($2);
  var $4=_printf(((5264068)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$3,tempInt));
  var $5=$1;
  var $6=(($5)|0);
  var $7=HEAP32[(($6)>>2)];
  _MscPrintOptList($7);
  var $8=$1;
  var $9=_MscGetNumEntities($8);
  var $10=$1;
  var $11=_MscGetNumParallelArcs($10);
  var $12=_printf(((5263868)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$9,HEAP32[(((tempInt)+(4))>>2)]=$11,tempInt));
  var $13=$1;
  var $14=(($13+4)|0);
  var $15=HEAP32[(($14)>>2)];
  _MscPrintEntityList($15);
  var $16=$1;
  var $17=_MscGetNumArcs($16);
  var $18=_printf(((5263748)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$17,tempInt));
  var $19=$1;
  var $20=(($19+8)|0);
  var $21=HEAP32[(($20)>>2)];
  _MscPrintArcList($21);
  STACKTOP = __stackBase__;
  return;
}
function _MscGetCurrentEntAttrib($m, $a) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $r;
      $2=$m;
      $3=$a;
      var $4=$2;
      var $5=(($4+16)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 2; break; }
    case 2: 
      $1=0;
      label = 7; break;
    case 3: 
      var $10=$2;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$3;
      var $16=_findAttrib($14, $15);
      $r=$16;
      var $17=$r;
      var $18=(($17)|(0))==0;
      if ($18) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $20=$3;
      var $21=(($20)|(0))==0;
      if ($21) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $23=$2;
      var $24=(($23+16)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25)|0);
      var $27=HEAP32[(($26)>>2)];
      $1=$27;
      label = 7; break;
    case 6: 
      var $29=$r;
      $1=$29;
      label = 7; break;
    case 7: 
      var $31=$1;
      return $31;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetEntAttrib($m, $entIdx, $a) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $entity;
      var $r;
      $2=$m;
      $3=$entIdx;
      $4=$a;
      var $5=$2;
      var $6=(($5+4)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7+4)|0);
      var $9=HEAP32[(($8)>>2)];
      $entity=$9;
      label = 2; break;
    case 2: 
      var $11=$3;
      var $12=(($11)>>>(0)) > 0;
      if ($12) { label = 3; break; } else { var $17 = 0;label = 4; break; }
    case 3: 
      var $14=$entity;
      var $15=(($14)|(0))!=0;
      var $17 = $15;label = 4; break;
    case 4: 
      var $17;
      if ($17) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $19=$entity;
      var $20=(($19+8)|0);
      var $21=HEAP32[(($20)>>2)];
      $entity=$21;
      var $22=$3;
      var $23=((($22)-(1))|0);
      $3=$23;
      label = 2; break;
    case 6: 
      var $25=$entity;
      var $26=(($25)|(0))!=0;
      if ($26) { label = 7; break; } else { label = 11; break; }
    case 7: 
      var $28=$entity;
      var $29=(($28+4)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$4;
      var $32=_findAttrib($30, $31);
      $r=$32;
      var $33=$r;
      var $34=(($33)|(0))==0;
      if ($34) { label = 8; break; } else { label = 10; break; }
    case 8: 
      var $36=$4;
      var $37=(($36)|(0))==0;
      if ($37) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $39=$2;
      var $40=(($39+16)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=(($41)|0);
      var $43=HEAP32[(($42)>>2)];
      $1=$43;
      label = 12; break;
    case 10: 
      var $45=$r;
      $1=$45;
      label = 12; break;
    case 11: 
      $1=0;
      label = 12; break;
    case 12: 
      var $48=$1;
      return $48;
    default: assert(0, "bad label: " + label);
  }
}
function _MscLinkAttrib($head, $newHead) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $tail;
      $1=$head;
      $2=$newHead;
      var $3=$2;
      $tail=$3;
      var $4=$2;
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5266832)|0), 391, ((5269128)|0), ((5267768)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $11=$tail;
      var $12=(($11+8)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=(($13)|(0))!=0;
      if ($14) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $16=$tail;
      var $17=(($16+8)|0);
      var $18=HEAP32[(($17)>>2)];
      $tail=$18;
      label = 5; break;
    case 7: 
      var $20=$1;
      var $21=$tail;
      var $22=(($21+8)|0);
      HEAP32[(($22)>>2)]=$20;
      var $23=$2;
      return $23;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetEntityIndex($m, $label) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $entity;
      var $c;
      $2=$m;
      $3=$label;
      var $4=$2;
      var $5=(($4+4)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=(($6+4)|0);
      var $8=HEAP32[(($7)>>2)];
      $entity=$8;
      $c=0;
      var $9=$3;
      var $10=(($9)|(0))!=0;
      if ($10) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5266832)|0), 592, ((5269144)|0), ((5267600)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $16=$entity;
      var $17=(($16)|(0))!=0;
      if ($17) { label = 6; break; } else { var $26 = 0;label = 7; break; }
    case 6: 
      var $19=$entity;
      var $20=(($19)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$3;
      var $23=_strcmp($21, $22);
      var $24=(($23)|(0))!=0;
      var $26 = $24;label = 7; break;
    case 7: 
      var $26;
      if ($26) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $28=$entity;
      var $29=(($28+8)|0);
      var $30=HEAP32[(($29)>>2)];
      $entity=$30;
      var $31=$c;
      var $32=((($31)+(1))|0);
      $c=$32;
      label = 5; break;
    case 9: 
      var $34=$entity;
      var $35=(($34)|(0))==0;
      if ($35) { label = 10; break; } else { label = 11; break; }
    case 10: 
      $1=-1;
      label = 12; break;
    case 11: 
      var $38=$c;
      $1=$38;
      label = 12; break;
    case 12: 
      var $40=$1;
      return $40;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetCurrentArcType($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$m;
      var $2=$1;
      var $3=(($2+12)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|(0))!=0;
      if ($5) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $7=$1;
      var $8=(($7+12)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9+8)|0);
      var $11=HEAP32[(($10)>>2)];
      var $14 = $11;label = 4; break;
    case 3: 
      var $14 = 14;label = 4; break;
    case 4: 
      var $14;
      return $14;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetCurrentArcAttrib($m, $a) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $attr;
      $2=$m;
      $3=$a;
      var $4=$2;
      var $5=(($4+12)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 2; break; }
    case 2: 
      $1=0;
      label = 11; break;
    case 3: 
      var $10=$2;
      var $11=(($10+12)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+16)|0);
      var $14=HEAP32[(($13)>>2)];
      $attr=$14;
      label = 4; break;
    case 4: 
      var $16=$attr;
      var $17=(($16)|(0))!=0;
      if ($17) { label = 5; break; } else { var $25 = 0;label = 6; break; }
    case 5: 
      var $19=$attr;
      var $20=(($19)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$3;
      var $23=(($21)|(0))!=(($22)|(0));
      var $25 = $23;label = 6; break;
    case 6: 
      var $25;
      if ($25) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $27=$attr;
      var $28=(($27+8)|0);
      var $29=HEAP32[(($28)>>2)];
      $attr=$29;
      label = 4; break;
    case 8: 
      var $31=$attr;
      var $32=(($31)|(0))!=0;
      if ($32) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $34=$attr;
      var $35=(($34+4)|0);
      var $36=HEAP32[(($35)>>2)];
      $1=$36;
      label = 11; break;
    case 10: 
      $1=0;
      label = 11; break;
    case 11: 
      var $39=$1;
      return $39;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetCurrentArcInputLine($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $2=$m;
      var $3=$2;
      var $4=(($3+12)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5)|(0))!=0;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $8=$2;
      var $9=(($8+12)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($10+12)|0);
      var $12=HEAP32[(($11)>>2)];
      $1=$12;
      label = 4; break;
    case 3: 
      $1=0;
      label = 4; break;
    case 4: 
      var $15=$1;
      return $15;
    default: assert(0, "bad label: " + label);
  }
}
function _getPsCtx($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=(($2+64)|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=$4;
  return $5;
}
function _MscGetOptAsFloat($m, $type, $f) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $opt;
      $2=$m;
      $3=$type;
      $4=$f;
      var $5=$2;
      var $6=(($5)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$3;
      var $9=_MscFindOpt($7, $8);
      $opt=$9;
      var $10=$opt;
      var $11=(($10)|(0))!=0;
      if ($11) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $13=$opt;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=_atof($15);
      var $17=$16;
      var $18=$4;
      HEAPF32[(($18)>>2)]=$17;
      var $19=$4;
      var $20=HEAPF32[(($19)>>2)];
      var $21=$20 != 0;
      var $22=(($21)&(1));
      $1=$22;
      label = 4; break;
    case 3: 
      $1=0;
      label = 4; break;
    case 4: 
      var $25=$1;
      return $25;
    default: assert(0, "bad label: " + label);
  }
}
function _MscGetOptAsBoolean($m, $type, $b) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $opt;
      var $v;
      $2=$m;
      $3=$type;
      $4=$b;
      var $5=$2;
      var $6=(($5)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$3;
      var $9=_MscFindOpt($7, $8);
      $opt=$9;
      var $10=$opt;
      var $11=(($10)|(0))!=0;
      if ($11) { label = 2; break; } else { label = 13; break; }
    case 2: 
      var $13=$opt;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      $v=$15;
      var $16=$v;
      var $17=_strcasecmp($16, ((5263628)|0));
      var $18=(($17)|(0))==0;
      if ($18) { label = 6; break; } else { label = 3; break; }
    case 3: 
      var $20=$v;
      var $21=_strcasecmp($20, ((5263560)|0));
      var $22=(($21)|(0))==0;
      if ($22) { label = 6; break; } else { label = 4; break; }
    case 4: 
      var $24=$v;
      var $25=_strcasecmp($24, ((5263416)|0));
      var $26=(($25)|(0))==0;
      if ($26) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $28=$v;
      var $29=_strcasecmp($28, ((5263328)|0));
      var $30=(($29)|(0))==0;
      if ($30) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $32=$4;
      HEAP32[(($32)>>2)]=1;
      $1=1;
      label = 14; break;
    case 7: 
      var $34=$v;
      var $35=_strcasecmp($34, ((5263220)|0));
      var $36=(($35)|(0))==0;
      if ($36) { label = 11; break; } else { label = 8; break; }
    case 8: 
      var $38=$v;
      var $39=_strcasecmp($38, ((5262996)|0));
      var $40=(($39)|(0))==0;
      if ($40) { label = 11; break; } else { label = 9; break; }
    case 9: 
      var $42=$v;
      var $43=_strcasecmp($42, ((5261808)|0));
      var $44=(($43)|(0))==0;
      if ($44) { label = 11; break; } else { label = 10; break; }
    case 10: 
      var $46=$v;
      var $47=_strcasecmp($46, ((5261780)|0));
      var $48=(($47)|(0))==0;
      if ($48) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $50=$4;
      HEAP32[(($50)>>2)]=0;
      $1=1;
      label = 14; break;
    case 12: 
      var $52=HEAP32[((_stderr)>>2)];
      var $53=$v;
      var $54=_fprintf($52, ((5261560)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$53,tempInt));
      $1=0;
      label = 14; break;
    case 13: 
      $1=0;
      label = 14; break;
    case 14: 
      var $57=$1;
      STACKTOP = __stackBase__;
      return $57;
    default: assert(0, "bad label: " + label);
  }
}
function _PsTextWidth($ctx, $string) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $width;
      var $i;
      var $w;
      $1=$ctx;
      $2=$string;
      $width=0;
      label = 2; break;
    case 2: 
      var $4=$2;
      var $5=HEAP8[($4)];
      var $6=(($5 << 24) >> 24);
      var $7=(($6)|(0))!=0;
      if ($7) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $9=$2;
      var $10=HEAP8[($9)];
      var $11=(($10 << 24) >> 24);
      var $12=$11 & 255;
      $i=$12;
      var $13=$i;
      var $14=((((5270284)|0)+($13<<2))|0);
      var $15=HEAP32[(($14)>>2)];
      $w=$15;
      var $16=$w;
      var $17=(($16)>>>(0)) > 0;
      if ($17) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $19=$w;
      var $22 = $19;label = 6; break;
    case 5: 
      var $22 = 0;label = 6; break;
    case 6: 
      var $22;
      var $23=$width;
      var $24=((($23)+($22))|0);
      $width=$24;
      var $25=$2;
      var $26=(($25+1)|0);
      $2=$26;
      label = 2; break;
    case 7: 
      var $28=$1;
      var $29=$width;
      var $30=_getSpace288($28, $29);
      return $30;
    default: assert(0, "bad label: " + label);
  }
}
function _getSpace288($ctx, $thousanths) {
  var label = 0;
  var $1;
  var $2;
  $1=$ctx;
  $2=$thousanths;
  var $3=$2;
  var $4=$1;
  var $5=_getPsCtx($4);
  var $6=(($5+4)|0);
  var $7=HEAP32[(($6)>>2)];
  var $8=Math.imul($3,$7);
  var $9=((($8)+(500))|0);
  var $10=((((($9)|(0)))/(1000))&-1);
  return $10;
}
function _PsTextHeight($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=HEAP32[((((5270276)|0))>>2)];
  var $4=HEAP32[((((5270280)|0))>>2)];
  var $5=((($3)-($4))|0);
  var $6=_getSpace288($2, $5);
  return $6;
}
function _PsLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=_getPsFile($6);
  var $8=$2;
  var $9=$3;
  var $10=(((-$9))|0);
  var $11=$4;
  var $12=$5;
  var $13=(((-$12))|0);
  var $14=_fprintf($7, ((5264132)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$8,HEAP32[(((tempInt)+(4))>>2)]=$10,HEAP32[(((tempInt)+(8))>>2)]=$11,HEAP32[(((tempInt)+(12))>>2)]=$13,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _getPsFile($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  var $2=$1;
  var $3=_getPsCtx($2);
  var $4=(($3)|0);
  var $5=HEAP32[(($4)>>2)];
  return $5;
}
function _PsDottedLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=_getPsFile($6);
  var $8=_fprintf($7, ((5267452)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $9=$1;
  var $10=$2;
  var $11=$3;
  var $12=$4;
  var $13=$5;
  _PsLine($9, $10, $11, $12, $13);
  var $14=$1;
  var $15=_getPsFile($14);
  var $16=_fprintf($15, ((5265540)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsFilledRectangle($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  var $6=$1;
  var $7=_getPsFile($6);
  var $8=$2;
  var $9=$3;
  var $10=(((-$9))|0);
  var $11=$4;
  var $12=$3;
  var $13=(((-$12))|0);
  var $14=$4;
  var $15=$5;
  var $16=(((-$15))|0);
  var $17=$2;
  var $18=$5;
  var $19=(((-$18))|0);
  var $20=_fprintf($7, ((5263128)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 32)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$8,HEAP32[(((tempInt)+(4))>>2)]=$10,HEAP32[(((tempInt)+(8))>>2)]=$11,HEAP32[(((tempInt)+(12))>>2)]=$13,HEAP32[(((tempInt)+(16))>>2)]=$14,HEAP32[(((tempInt)+(20))>>2)]=$16,HEAP32[(((tempInt)+(24))>>2)]=$17,HEAP32[(((tempInt)+(28))>>2)]=$19,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsTextR($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getPsCtx($5);
  $context=$6;
  var $7=$1;
  var $8=_getPsFile($7);
  var $9=_fprintf($8, ((5260960)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $10=$1;
  var $11=$4;
  _writeEscaped289($10, $11);
  var $12=$1;
  var $13=_getPsFile($12);
  var $14=_fprintf($13, ((5260644)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $15=$1;
  var $16=$context;
  var $17=(($16+12)|0);
  var $18=HEAP32[(($17)>>2)];
  _setColour($15, $18);
  var $19=$1;
  var $20=_getPsFile($19);
  var $21=$2;
  var $22=$3;
  var $23=(((-$22))|0);
  var $24=$1;
  var $25=HEAP32[((((5270280)|0))>>2)];
  var $26=_getSpace288($24, $25);
  var $27=((($23)-($26))|0);
  var $28=$1;
  var $29=HEAP32[((((5270276)|0))>>2)];
  var $30=_getSpace288($28, $29);
  var $31=_fprintf($20, ((5260176)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 12)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$21,HEAP32[(((tempInt)+(4))>>2)]=$27,HEAP32[(((tempInt)+(8))>>2)]=$30,tempInt));
  var $32=$1;
  var $33=$context;
  var $34=(($33+8)|0);
  var $35=HEAP32[(($34)>>2)];
  _setColour($32, $35);
  var $36=$1;
  var $37=_getPsFile($36);
  var $38=$2;
  var $39=$3;
  var $40=(((-$39))|0);
  var $41=$1;
  var $42=HEAP32[((((5270280)|0))>>2)];
  var $43=_getSpace288($41, $42);
  var $44=((($40)-($43))|0);
  var $45=_fprintf($37, ((5259940)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$38,HEAP32[(((tempInt)+(4))>>2)]=$44,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _writeEscaped289($ctx, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 8)|0; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $f;
      var $code=__stackBase__;
      var $bytes=(__stackBase__)+(4);
      $1=$ctx;
      $2=$string;
      var $3=$1;
      var $4=_getPsFile($3);
      $f=$4;
      label = 2; break;
    case 2: 
      var $6=$2;
      var $7=HEAP8[($6)];
      var $8=(($7 << 24) >> 24);
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 11; break; }
    case 3: 
      var $11=$2;
      var $12=HEAP8[($11)];
      var $13=(($12 << 24) >> 24);
      if ((($13)|(0))==40) {
        label = 4; break;
      }
      else if ((($13)|(0))==41) {
        label = 5; break;
      }
      else {
      label = 6; break;
      }
    case 4: 
      var $15=$f;
      var $16=_fprintf($15, ((5261004)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 10; break;
    case 5: 
      var $18=$f;
      var $19=_fprintf($18, ((5260964)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      label = 10; break;
    case 6: 
      var $21=$2;
      var $22=_Utf8Decode($21, $code, $bytes);
      var $23=(($22)|(0))!=0;
      if ($23) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $25=$f;
      var $26=HEAP32[(($code)>>2)];
      var $27=_fprintf($25, ((5260908)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$26,tempInt));
      var $28=HEAP32[(($bytes)>>2)];
      var $29=((($28)-(1))|0);
      var $30=$2;
      var $31=(($30+$29)|0);
      $2=$31;
      label = 9; break;
    case 8: 
      var $33=$2;
      var $34=HEAP8[($33)];
      var $35=(($34 << 24) >> 24);
      var $36=$f;
      var $37=_fputc($35, $36);
      label = 9; break;
    case 9: 
      label = 10; break;
    case 10: 
      var $40=$2;
      var $41=(($40+1)|0);
      $2=$41;
      label = 2; break;
    case 11: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _setColour($ctx, $col) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $r;
  var $g;
  var $b;
  $1=$ctx;
  $2=$col;
  var $3=$2;
  var $4=$3 & 16711680;
  var $5=$4 >>> 16;
  var $6=(($5)>>>(0));
  $r=$6;
  var $7=$2;
  var $8=$7 & 65280;
  var $9=$8 >>> 8;
  var $10=(($9)>>>(0));
  $g=$10;
  var $11=$2;
  var $12=$11 & 255;
  var $13=$12 >>> 0;
  var $14=(($13)>>>(0));
  $b=$14;
  var $15=$r;
  var $16=($15)/(255);
  $r=$16;
  var $17=$g;
  var $18=($17)/(255);
  $g=$18;
  var $19=$b;
  var $20=($19)/(255);
  $b=$20;
  var $21=$1;
  var $22=_getPsFile($21);
  var $23=$r;
  var $24=$23;
  var $25=$g;
  var $26=$25;
  var $27=$b;
  var $28=$27;
  var $29=_fprintf($22, ((5261036)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 24)|0,assert((STACKTOP|0) < (STACK_MAX|0)),(HEAPF64[(tempDoublePtr)>>3]=$24,HEAP32[((tempInt)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((tempInt)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),(HEAPF64[(tempDoublePtr)>>3]=$26,HEAP32[(((tempInt)+(8))>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[((((tempInt)+(8))+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),(HEAPF64[(tempDoublePtr)>>3]=$28,HEAP32[(((tempInt)+(16))>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[((((tempInt)+(16))+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsTextL($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getPsCtx($5);
  $context=$6;
  var $7=$1;
  var $8=$context;
  var $9=(($8+12)|0);
  var $10=HEAP32[(($9)>>2)];
  _setColour($7, $10);
  var $11=$1;
  var $12=$2;
  var $13=$3;
  var $14=(((-$13))|0);
  var $15=$2;
  var $16=((($15)+(10))|0);
  var $17=$3;
  var $18=(((-$17))|0);
  var $19=((($18)+(10))|0);
  _PsFilledRectangle($11, $12, $14, $16, $19);
  var $20=$1;
  var $21=$context;
  var $22=(($21+8)|0);
  var $23=HEAP32[(($22)>>2)];
  _setColour($20, $23);
  var $24=$1;
  var $25=_getPsFile($24);
  var $26=$2;
  var $27=$3;
  var $28=(((-$27))|0);
  var $29=$1;
  var $30=HEAP32[((((5270280)|0))>>2)];
  var $31=_getSpace288($29, $30);
  var $32=((($28)-($31))|0);
  var $33=_fprintf($25, ((5259696)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$26,HEAP32[(((tempInt)+(4))>>2)]=$32,tempInt));
  var $34=$1;
  var $35=$4;
  _writeEscaped289($34, $35);
  var $36=$1;
  var $37=_getPsFile($36);
  var $38=_fprintf($37, ((5259212)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsTextC($ctx, $x, $y, $string) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $context;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  var $5=$1;
  var $6=_getPsCtx($5);
  $context=$6;
  var $7=$1;
  var $8=_getPsFile($7);
  var $9=_fprintf($8, ((5260960)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $10=$1;
  var $11=$4;
  _writeEscaped289($10, $11);
  var $12=$1;
  var $13=_getPsFile($12);
  var $14=_fprintf($13, ((5260644)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $15=$1;
  var $16=$context;
  var $17=(($16+12)|0);
  var $18=HEAP32[(($17)>>2)];
  _setColour($15, $18);
  var $19=$1;
  var $20=_getPsFile($19);
  var $21=$2;
  var $22=$3;
  var $23=(((-$22))|0);
  var $24=$1;
  var $25=HEAP32[((((5270276)|0))>>2)];
  var $26=_getSpace288($24, $25);
  var $27=_fprintf($20, ((5268344)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 12)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$21,HEAP32[(((tempInt)+(4))>>2)]=$23,HEAP32[(((tempInt)+(8))>>2)]=$26,tempInt));
  var $28=$1;
  var $29=$context;
  var $30=(($29+8)|0);
  var $31=HEAP32[(($30)>>2)];
  _setColour($28, $31);
  var $32=$1;
  var $33=_getPsFile($32);
  var $34=$2;
  var $35=$3;
  var $36=(((-$35))|0);
  var $37=$1;
  var $38=HEAP32[((((5270280)|0))>>2)];
  var $39=_getSpace288($37, $38);
  var $40=((($36)-($39))|0);
  var $41=_fprintf($33, ((5267944)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$34,HEAP32[(((tempInt)+(4))>>2)]=$40,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsFilledTriangle($ctx, $x1, $y1, $x2, $y2, $x3, $y3) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  $6=$x3;
  $7=$y3;
  var $8=$1;
  var $9=_getPsFile($8);
  var $10=$2;
  var $11=$3;
  var $12=(((-$11))|0);
  var $13=$4;
  var $14=$5;
  var $15=(((-$14))|0);
  var $16=$6;
  var $17=$7;
  var $18=(((-$17))|0);
  var $19=_fprintf($9, ((5267516)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 24)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$10,HEAP32[(((tempInt)+(4))>>2)]=$12,HEAP32[(((tempInt)+(8))>>2)]=$13,HEAP32[(((tempInt)+(12))>>2)]=$15,HEAP32[(((tempInt)+(16))>>2)]=$16,HEAP32[(((tempInt)+(20))>>2)]=$18,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsFilledCircle($ctx, $x, $y, $r) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$r;
  var $5=$1;
  var $6=_getPsFile($5);
  var $7=$2;
  var $8=$3;
  var $9=(((-$8))|0);
  var $10=$4;
  var $11=_fprintf($6, ((5267136)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 12)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$7,HEAP32[(((tempInt)+(4))>>2)]=$9,HEAP32[(((tempInt)+(8))>>2)]=$10,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  var $8=$1;
  var $9=_getPsFile($8);
  var $10=$2;
  var $11=$3;
  var $12=(((-$11))|0);
  var $13=$4;
  var $14=$5;
  var $15=$6;
  var $16=$7;
  var $17=_fprintf($9, ((5266908)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 24)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$10,HEAP32[(((tempInt)+(4))>>2)]=$12,HEAP32[(((tempInt)+(8))>>2)]=$13,HEAP32[(((tempInt)+(12))>>2)]=$14,HEAP32[(((tempInt)+(16))>>2)]=$15,HEAP32[(((tempInt)+(20))>>2)]=$16,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsDottedArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  var $8=$1;
  var $9=_getPsFile($8);
  var $10=_fprintf($9, ((5267452)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  var $11=$1;
  var $12=$2;
  var $13=$3;
  var $14=$4;
  var $15=$5;
  var $16=$6;
  var $17=$7;
  _PsArc($11, $12, $13, $14, $15, $16, $17);
  var $18=$1;
  var $19=_getPsFile($18);
  var $20=_fprintf($19, ((5265540)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _PsSetBgPen($ctx, $col) {
  var label = 0;
  var $1;
  var $2;
  var $context;
  $1=$ctx;
  $2=$col;
  var $3=$1;
  var $4=_getPsCtx($3);
  $context=$4;
  var $5=$2;
  var $6=$context;
  var $7=(($6+12)|0);
  HEAP32[(($7)>>2)]=$5;
  return;
}
function _PsClose($ctx) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $context;
      $1=$ctx;
      var $2=$1;
      var $3=_getPsCtx($2);
      $context=$3;
      var $4=$context;
      var $5=(($4)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=HEAP32[((_stdout)>>2)];
      var $8=(($6)|(0))!=(($7)|(0));
      if ($8) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $10=$context;
      var $11=(($10)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=_fclose($12);
      label = 3; break;
    case 3: 
      var $15=$context;
      var $16=$15;
      _free($16);
      var $17=$1;
      var $18=(($17+64)|0);
      HEAP32[(($18)>>2)]=0;
      return 1;
    default: assert(0, "bad label: " + label);
  }
}
function _PsSetPen($ctx, $col) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $context;
      $1=$ctx;
      $2=$col;
      var $3=$1;
      var $4=_getPsCtx($3);
      $context=$4;
      var $5=$2;
      var $6=(($5)|(0))!=-16777216;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      label = 4; break;
    case 3: 
      ___assert_func(((5266776)|0), 430, ((5269088)|0), ((5266628)|0));
      throw "Reached an unreachable!"
      label = 4; break;
    case 4: 
      var $11=$context;
      var $12=(($11+8)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=$2;
      var $15=(($13)|(0))!=(($14)|(0));
      if ($15) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $17=$1;
      var $18=$2;
      _setColour($17, $18);
      var $19=$2;
      var $20=$context;
      var $21=(($20+8)|0);
      HEAP32[(($21)>>2)]=$19;
      label = 6; break;
    case 6: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _PsSetFontSize($ctx, $size) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $context;
      $1=$ctx;
      $2=$size;
      var $3=$1;
      var $4=_getPsCtx($3);
      $context=$4;
      var $5=$2;
      if ((($5)|(0))==0) {
        label = 2; break;
      }
      else if ((($5)|(0))==1) {
        label = 3; break;
      }
      else {
      label = 4; break;
      }
    case 2: 
      var $7=$1;
      var $8=_getPsCtx($7);
      var $9=(($8+4)|0);
      HEAP32[(($9)>>2)]=8;
      label = 5; break;
    case 3: 
      var $11=$1;
      var $12=_getPsCtx($11);
      var $13=(($12+4)|0);
      HEAP32[(($13)>>2)]=12;
      label = 5; break;
    case 4: 
      ___assert_func(((5266776)|0), 468, ((5269100)|0), ((5266508)|0));
      throw "Reached an unreachable!"
    case 5: 
      var $16=$context;
      var $17=(($16)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=_fprintf($18, ((5266128)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $20=$context;
      var $21=(($20)|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=$1;
      var $24=_getPsCtx($23);
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=_fprintf($22, ((5265864)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$26,tempInt));
      var $28=$context;
      var $29=(($28)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=_fprintf($30, ((5265704)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _clo($c) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $t;
      $1=$c;
      $t=0;
      label = 2; break;
    case 2: 
      var $3=$1;
      var $4=(($3 << 24) >> 24);
      var $5=$t;
      var $6=128 >> (($5)|(0));
      var $7=$4 & $6;
      var $8=(($7)|(0))!=0;
      if ($8) { label = 3; break; } else { var $13 = 0;label = 4; break; }
    case 3: 
      var $10=$t;
      var $11=(($10)>>>(0)) < 8;
      var $13 = $11;label = 4; break;
    case 4: 
      var $13;
      if ($13) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $15=$t;
      var $16=((($15)+(1))|0);
      $t=$16;
      label = 2; break;
    case 6: 
      var $18=$t;
      return $18;
    default: assert(0, "bad label: " + label);
  }
}
function _PsInit($w, $h, $file, $outContext) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $context;
      $2=$w;
      $3=$h;
      $4=$file;
      $5=$outContext;
      var $6=_malloc_s(16);
      var $7=$5;
      var $8=(($7+64)|0);
      HEAP32[(($8)>>2)]=$6;
      var $9=$6;
      $context=$9;
      var $10=$context;
      var $11=(($10)|(0))==0;
      if ($11) { label = 2; break; } else { label = 3; break; }
    case 2: 
      $1=0;
      label = 9; break;
    case 3: 
      var $14=$4;
      var $15=_strcmp($14, ((5265648)|0));
      var $16=(($15)|(0))==0;
      if ($16) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $18=HEAP32[((_stdout)>>2)];
      var $19=$context;
      var $20=(($19)|0);
      HEAP32[(($20)>>2)]=$18;
      label = 8; break;
    case 5: 
      var $22=$4;
      var $23=_fopen($22, ((5265556)|0));
      var $24=$context;
      var $25=(($24)|0);
      HEAP32[(($25)>>2)]=$23;
      var $26=$context;
      var $27=(($26)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=(($28)|(0))!=0;
      if ($29) { label = 7; break; } else { label = 6; break; }
    case 6: 
      var $31=HEAP32[((_stderr)>>2)];
      var $32=$4;
      var $33=___errno_location();
      var $34=HEAP32[(($33)>>2)];
      var $35=_strerror($34);
      var $36=_fprintf($31, ((5265368)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$32,HEAP32[(((tempInt)+(4))>>2)]=$35,tempInt));
      $1=0;
      label = 9; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $39=$context;
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=$2;
      var $43=(($42)>>>(0));
      var $44=($43)*(0.699999988079071);
      var $45=$44;
      var $46=$3;
      var $47=(($46)>>>(0));
      var $48=($47)*(0.699999988079071);
      var $49=$48;
      var $50=_fprintf($41, ((5264176)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert((STACKTOP|0) < (STACK_MAX|0)),(HEAPF64[(tempDoublePtr)>>3]=$45,HEAP32[((tempInt)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((tempInt)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),(HEAPF64[(tempDoublePtr)>>3]=$49,HEAP32[(((tempInt)+(8))>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[((((tempInt)+(8))+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),tempInt));
      var $51=$context;
      var $52=(($51)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=_fprintf($53, ((5264044)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5263860)|0),tempInt));
      var $55=$context;
      var $56=(($55)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=_fprintf($57, ((5263728)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $59=$context;
      var $60=(($59)|0);
      var $61=HEAP32[(($60)>>2)];
      var $62=_fprintf($61, ((5263612)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert((STACKTOP|0) < (STACK_MAX|0)),(HEAPF64[(tempDoublePtr)>>3]=0.699999988079071,HEAP32[((tempInt)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((tempInt)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),(HEAPF64[(tempDoublePtr)>>3]=0.699999988079071,HEAP32[(((tempInt)+(8))>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[((((tempInt)+(8))+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]),tempInt));
      var $63=$context;
      var $64=(($63)|0);
      var $65=HEAP32[(($64)>>2)];
      var $66=_fprintf($65, ((5263548)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $67=$context;
      var $68=(($67)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=$3;
      var $71=_fprintf($69, ((5263400)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$70,tempInt));
      var $72=$context;
      var $73=(($72)|0);
      var $74=HEAP32[(($73)>>2)];
      var $75=$2;
      var $76=$3;
      var $77=_fprintf($74, ((5263312)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$75,HEAP32[(((tempInt)+(4))>>2)]=$76,tempInt));
      var $78=$context;
      var $79=(($78)|0);
      var $80=HEAP32[(($79)>>2)];
      var $81=$2;
      var $82=_fprintf($80, ((5263204)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$81,tempInt));
      var $83=$context;
      var $84=(($83)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=_fprintf($85, ((5262984)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $87=$context;
      var $88=(($87)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=_fprintf($89, ((5261800)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $91=$context;
      var $92=(($91)|0);
      var $93=HEAP32[(($92)>>2)];
      var $94=_fprintf($93, ((5261764)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $95=$context;
      var $96=(($95)|0);
      var $97=HEAP32[(($96)>>2)];
      var $98=_fprintf($97, ((5261544)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $99=$context;
      var $100=(($99)|0);
      var $101=HEAP32[(($100)>>2)];
      var $102=_fprintf($101, ((5266128)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $103=$context;
      var $104=(($103)|0);
      var $105=HEAP32[(($104)>>2)];
      var $106=_fprintf($105, ((5261496)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $107=$context;
      var $108=(($107)|0);
      var $109=HEAP32[(($108)>>2)];
      var $110=_fprintf($109, ((5265704)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $111=$5;
      _PsSetFontSize($111, 1);
      var $112=$context;
      var $113=(($112)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$3;
      var $116=_fprintf($114, ((5261448)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$115,tempInt));
      var $117=$context;
      var $118=(($117)|0);
      var $119=HEAP32[(($118)>>2)];
      var $120=_fprintf($119, ((5261084)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $121=$context;
      var $122=(($121+8)|0);
      HEAP32[(($122)>>2)]=0;
      var $123=$context;
      var $124=(($123+12)|0);
      HEAP32[(($124)>>2)]=16777215;
      var $125=$5;
      var $126=(($125)|0);
      HEAP32[(($126)>>2)]=36;
      var $127=$5;
      var $128=(($127+4)|0);
      HEAP32[(($128)>>2)]=66;
      var $129=$5;
      var $130=(($129+8)|0);
      HEAP32[(($130)>>2)]=38;
      var $131=$5;
      var $132=(($131+12)|0);
      HEAP32[(($132)>>2)]=52;
      var $133=$5;
      var $134=(($133+16)|0);
      HEAP32[(($134)>>2)]=40;
      var $135=$5;
      var $136=(($135+20)|0);
      var $137=$136;
      HEAP32[(($137)>>2)]=30;
      var $138=$5;
      var $139=(($138+24)|0);
      HEAP32[(($139)>>2)]=48;
      var $140=$5;
      var $141=(($140+28)|0);
      HEAP32[(($141)>>2)]=82;
      var $142=$5;
      var $143=(($142+32)|0);
      HEAP32[(($143)>>2)]=20;
      var $144=$5;
      var $145=(($144+36)|0);
      HEAP32[(($145)>>2)]=80;
      var $146=$5;
      var $147=(($146+40)|0);
      HEAP32[(($147)>>2)]=76;
      var $148=$5;
      var $149=(($148+44)|0);
      HEAP32[(($149)>>2)]=60;
      var $150=$5;
      var $151=(($150+48)|0);
      HEAP32[(($151)>>2)]=56;
      var $152=$5;
      var $153=(($152+52)|0);
      HEAP32[(($153)>>2)]=64;
      var $154=$5;
      var $155=(($154+56)|0);
      HEAP32[(($155)>>2)]=68;
      var $156=$5;
      var $157=(($156+60)|0);
      HEAP32[(($157)>>2)]=18;
      $1=1;
      label = 9; break;
    case 9: 
      var $159=$1;
      STACKTOP = __stackBase__;
      return $159;
    default: assert(0, "bad label: " + label);
  }
}
function _Utf8Decode($s, $r, $bytes) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $t;
      $2=$s;
      $3=$r;
      $4=$bytes;
      var $5=$2;
      var $6=HEAP8[($5)];
      var $7=(($6 << 24) >> 24);
      var $8=$7 & 128;
      var $9=(($8)|(0))==0;
      if ($9) { label = 2; break; } else { label = 3; break; }
    case 2: 
      $1=0;
      label = 13; break;
    case 3: 
      var $12=$2;
      var $13=HEAP8[($12)];
      var $14=_clo($13);
      var $15=$4;
      HEAP32[(($15)>>2)]=$14;
      var $16=$3;
      HEAP32[(($16)>>2)]=0;
      $t=0;
      label = 4; break;
    case 4: 
      var $18=$t;
      var $19=$4;
      var $20=HEAP32[(($19)>>2)];
      var $21=(($18)>>>(0)) < (($20)>>>(0));
      if ($21) { label = 5; break; } else { var $30 = 0;label = 6; break; }
    case 5: 
      var $23=$t;
      var $24=$2;
      var $25=(($24+$23)|0);
      var $26=HEAP8[($25)];
      var $27=(($26 << 24) >> 24);
      var $28=(($27)|(0))!=0;
      var $30 = $28;label = 6; break;
    case 6: 
      var $30;
      if ($30) { label = 7; break; } else { label = 12; break; }
    case 7: 
      var $32=$3;
      var $33=HEAP32[(($32)>>2)];
      var $34=$33 << 6;
      HEAP32[(($32)>>2)]=$34;
      var $35=$t;
      var $36=(($35)|(0))==0;
      if ($36) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $38=$t;
      var $39=$2;
      var $40=(($39+$38)|0);
      var $41=HEAP8[($40)];
      var $42=(($41 << 24) >> 24);
      var $43=$4;
      var $44=HEAP32[(($43)>>2)];
      var $45=((($44)+(1))|0);
      var $46=255 >> (($45)|(0));
      var $47=$42 & $46;
      var $48=$3;
      var $49=HEAP32[(($48)>>2)];
      var $50=$49 | $47;
      HEAP32[(($48)>>2)]=$50;
      label = 10; break;
    case 9: 
      var $52=$t;
      var $53=$2;
      var $54=(($53+$52)|0);
      var $55=HEAP8[($54)];
      var $56=(($55 << 24) >> 24);
      var $57=$56 & 63;
      var $58=$3;
      var $59=HEAP32[(($58)>>2)];
      var $60=$59 | $57;
      HEAP32[(($58)>>2)]=$60;
      label = 10; break;
    case 10: 
      label = 11; break;
    case 11: 
      var $63=$t;
      var $64=((($63)+(1))|0);
      $t=$64;
      label = 4; break;
    case 12: 
      var $66=$t;
      var $67=$4;
      var $68=HEAP32[(($67)>>2)];
      var $69=(($66)|(0))==(($68)|(0));
      var $70=(($69)&(1));
      $1=$70;
      label = 13; break;
    case 13: 
      var $72=$1;
      return $72;
    default: assert(0, "bad label: " + label);
  }
}
function _realloc_s($ptr, $size) {
  var label = 0;
  var $1;
  var $2;
  var $r;
  $1=$ptr;
  $2=$size;
  var $3=$1;
  var $4=$2;
  var $5=_realloc($3, $4);
  $r=$5;
  var $6=$r;
  _checkNotNull($6, ((5263528)|0));
  var $7=$r;
  return $7;
}
function _malloc_s($size) {
  var label = 0;
  var $1;
  var $r;
  $1=$size;
  var $2=$1;
  var $3=_malloc($2);
  $r=$3;
  var $4=$r;
  _checkNotNull($4, ((5267276)|0));
  var $5=$r;
  return $5;
}
function _zalloc_s($size) {
  var label = 0;
  var $1;
  var $r;
  $1=$size;
  var $2=$1;
  var $3=_malloc($2);
  $r=$3;
  var $4=$r;
  _checkNotNull($4, ((5267276)|0));
  var $5=$r;
  var $6=$1;
  _memset($5, 0, $6);
  var $7=$r;
  return $7;
}
function _strdup_s($s) {
  var label = 0;
  var $1;
  var $r;
  $1=$s;
  var $2=$1;
  var $3=_strdup($2);
  $r=$3;
  var $4=$r;
  _checkNotNull($4, ((5265452)|0));
  var $5=$r;
  return $5;
}
function _checkNotNull($p, $message) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      $1=$p;
      $2=$message;
      var $3=$1;
      var $4=(($3)|(0))!=0;
      if ($4) { label = 3; break; } else { label = 2; break; }
    case 2: 
      var $6=HEAP32[((_stderr)>>2)];
      var $7=$2;
      var $8=_fprintf($6, ((5260940)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$7,tempInt));
      _exit(1);
      throw "Reached an unreachable!"
    case 3: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yylex() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $yy_current_state;
      var $yy_cp;
      var $yy_bp;
      var $yy_act;
      var $yy_c;
      var $yy_amount_of_matched_text;
      var $yy_next_state;
      var $2=HEAP32[((5245888)>>2)];
      var $3=(($2)|(0))!=0;
      if ($3) { label = 13; break; } else { label = 2; break; }
    case 2: 
      HEAP32[((5245888)>>2)]=1;
      var $5=HEAP32[((5244652)>>2)];
      var $6=(($5)|(0))!=0;
      if ($6) { label = 4; break; } else { label = 3; break; }
    case 3: 
      HEAP32[((5244652)>>2)]=1;
      label = 4; break;
    case 4: 
      var $9=HEAP32[((5244020)>>2)];
      var $10=(($9)|(0))!=0;
      if ($10) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $12=HEAP32[((_stdin)>>2)];
      HEAP32[((5244020)>>2)]=$12;
      label = 6; break;
    case 6: 
      var $14=HEAP32[((5244004)>>2)];
      var $15=(($14)|(0))!=0;
      if ($15) { label = 8; break; } else { label = 7; break; }
    case 7: 
      var $17=HEAP32[((_stdout)>>2)];
      HEAP32[((5244004)>>2)]=$17;
      label = 8; break;
    case 8: 
      var $19=HEAP32[((5248552)>>2)];
      var $20=(($19)|(0))!=0;
      if ($20) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $22=HEAP32[((5248544)>>2)];
      var $23=HEAP32[((5248552)>>2)];
      var $24=(($23+($22<<2))|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25)|(0))!=0;
      if ($26) { label = 12; break; } else { label = 11; break; }
    case 10: 
      if (0) { label = 12; break; } else { label = 11; break; }
    case 11: 
      _yyensure_buffer_stack();
      var $29=HEAP32[((5244020)>>2)];
      var $30=_yy_create_buffer($29, 16384);
      var $31=HEAP32[((5248544)>>2)];
      var $32=HEAP32[((5248552)>>2)];
      var $33=(($32+($31<<2))|0);
      HEAP32[(($33)>>2)]=$30;
      label = 12; break;
    case 12: 
      _yy_load_buffer_state();
      label = 13; break;
    case 13: 
      label = 14; break;
    case 14: 
      var $37=HEAP32[((5248540)>>2)];
      $yy_cp=$37;
      var $38=HEAP8[(5245892)];
      var $39=$yy_cp;
      HEAP8[($39)]=$38;
      var $40=$yy_cp;
      $yy_bp=$40;
      var $41=HEAP32[((5244652)>>2)];
      $yy_current_state=$41;
      label = 15; break;
    case 15: 
      label = 16; break;
    case 16: 
      var $44=$yy_cp;
      var $45=HEAP8[($44)];
      var $46=(($45)&(255));
      var $47=((5245896+($46<<2))|0);
      var $48=HEAP32[(($47)>>2)];
      var $49=(($48) & 255);
      $yy_c=$49;
      var $50=$yy_current_state;
      var $51=((5249216+($50<<1))|0);
      var $52=HEAP16[(($51)>>1)];
      var $53=(($52 << 16) >> 16)!=0;
      if ($53) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $55=$yy_current_state;
      HEAP32[((5245880)>>2)]=$55;
      var $56=$yy_cp;
      HEAP32[((5245884)>>2)]=$56;
      label = 18; break;
    case 18: 
      label = 19; break;
    case 19: 
      var $59=$yy_current_state;
      var $60=((5248556+($59<<1))|0);
      var $61=HEAP16[(($60)>>1)];
      var $62=(($61 << 16) >> 16);
      var $63=$yy_c;
      var $64=(($63)&(255));
      var $65=((($62)+($64))|0);
      var $66=((5247584+($65<<1))|0);
      var $67=HEAP16[(($66)>>1)];
      var $68=(($67 << 16) >> 16);
      var $69=$yy_current_state;
      var $70=(($68)|(0))!=(($69)|(0));
      if ($70) { label = 20; break; } else { label = 23; break; }
    case 20: 
      var $72=$yy_current_state;
      var $73=((5246924+($72<<1))|0);
      var $74=HEAP16[(($73)>>1)];
      var $75=(($74 << 16) >> 16);
      $yy_current_state=$75;
      var $76=$yy_current_state;
      var $77=(($76)|(0)) >= 316;
      if ($77) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $79=$yy_c;
      var $80=(($79)&(255));
      var $81=((5245616+($80<<2))|0);
      var $82=HEAP32[(($81)>>2)];
      var $83=(($82) & 255);
      $yy_c=$83;
      label = 22; break;
    case 22: 
      label = 19; break;
    case 23: 
      var $86=$yy_current_state;
      var $87=((5248556+($86<<1))|0);
      var $88=HEAP16[(($87)>>1)];
      var $89=(($88 << 16) >> 16);
      var $90=$yy_c;
      var $91=(($90)&(255));
      var $92=((($89)+($91))|0);
      var $93=((5244656+($92<<1))|0);
      var $94=HEAP16[(($93)>>1)];
      var $95=(($94 << 16) >> 16);
      $yy_current_state=$95;
      var $96=$yy_cp;
      var $97=(($96+1)|0);
      $yy_cp=$97;
      label = 24; break;
    case 24: 
      var $99=$yy_current_state;
      var $100=((5248556+($99<<1))|0);
      var $101=HEAP16[(($100)>>1)];
      var $102=(($101 << 16) >> 16);
      var $103=(($102)|(0))!=411;
      if ($103) { label = 16; break; } else { label = 25; break; }
    case 25: 
      label = 26; break;
    case 26: 
      var $106=$yy_current_state;
      var $107=((5249216+($106<<1))|0);
      var $108=HEAP16[(($107)>>1)];
      var $109=(($108 << 16) >> 16);
      $yy_act=$109;
      var $110=$yy_act;
      var $111=(($110)|(0))==0;
      if ($111) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $113=HEAP32[((5245884)>>2)];
      $yy_cp=$113;
      var $114=HEAP32[((5245880)>>2)];
      $yy_current_state=$114;
      var $115=$yy_current_state;
      var $116=((5249216+($115<<1))|0);
      var $117=HEAP16[(($116)>>1)];
      var $118=(($117 << 16) >> 16);
      $yy_act=$118;
      label = 28; break;
    case 28: 
      var $120=$yy_bp;
      HEAP32[((5243496)>>2)]=$120;
      var $121=$yy_cp;
      var $122=$yy_bp;
      var $123=$121;
      var $124=$122;
      var $125=((($123)-($124))|0);
      HEAP32[((5244016)>>2)]=$125;
      var $126=$yy_cp;
      var $127=HEAP8[($126)];
      HEAP8[(5245892)]=$127;
      var $128=$yy_cp;
      HEAP8[($128)]=0;
      var $129=$yy_cp;
      HEAP32[((5248540)>>2)]=$129;
      label = 29; break;
    case 29: 
      var $131=$yy_act;
      if ((($131)|(0))==0) {
        label = 30; break;
      }
      else if ((($131)|(0))==1) {
        label = 31; break;
      }
      else if ((($131)|(0))==2) {
        label = 32; break;
      }
      else if ((($131)|(0))==3) {
        label = 33; break;
      }
      else if ((($131)|(0))==4) {
        label = 34; break;
      }
      else if ((($131)|(0))==5) {
        label = 35; break;
      }
      else if ((($131)|(0))==6) {
        label = 36; break;
      }
      else if ((($131)|(0))==7) {
        label = 37; break;
      }
      else if ((($131)|(0))==8) {
        label = 38; break;
      }
      else if ((($131)|(0))==9) {
        label = 39; break;
      }
      else if ((($131)|(0))==10) {
        label = 40; break;
      }
      else if ((($131)|(0))==11) {
        label = 41; break;
      }
      else if ((($131)|(0))==12) {
        label = 42; break;
      }
      else if ((($131)|(0))==13) {
        label = 43; break;
      }
      else if ((($131)|(0))==14) {
        label = 44; break;
      }
      else if ((($131)|(0))==15) {
        label = 45; break;
      }
      else if ((($131)|(0))==16) {
        label = 46; break;
      }
      else if ((($131)|(0))==17) {
        label = 47; break;
      }
      else if ((($131)|(0))==18) {
        label = 48; break;
      }
      else if ((($131)|(0))==19) {
        label = 49; break;
      }
      else if ((($131)|(0))==20) {
        label = 50; break;
      }
      else if ((($131)|(0))==21) {
        label = 51; break;
      }
      else if ((($131)|(0))==22) {
        label = 52; break;
      }
      else if ((($131)|(0))==23) {
        label = 53; break;
      }
      else if ((($131)|(0))==24) {
        label = 54; break;
      }
      else if ((($131)|(0))==25) {
        label = 55; break;
      }
      else if ((($131)|(0))==26) {
        label = 56; break;
      }
      else if ((($131)|(0))==27) {
        label = 57; break;
      }
      else if ((($131)|(0))==28) {
        label = 58; break;
      }
      else if ((($131)|(0))==29) {
        label = 59; break;
      }
      else if ((($131)|(0))==30) {
        label = 60; break;
      }
      else if ((($131)|(0))==31) {
        label = 61; break;
      }
      else if ((($131)|(0))==32) {
        label = 62; break;
      }
      else if ((($131)|(0))==33) {
        label = 63; break;
      }
      else if ((($131)|(0))==34) {
        label = 64; break;
      }
      else if ((($131)|(0))==35) {
        label = 65; break;
      }
      else if ((($131)|(0))==36) {
        label = 66; break;
      }
      else if ((($131)|(0))==37) {
        label = 67; break;
      }
      else if ((($131)|(0))==38) {
        label = 68; break;
      }
      else if ((($131)|(0))==39) {
        label = 69; break;
      }
      else if ((($131)|(0))==40) {
        label = 70; break;
      }
      else if ((($131)|(0))==41) {
        label = 71; break;
      }
      else if ((($131)|(0))==42) {
        label = 72; break;
      }
      else if ((($131)|(0))==43) {
        label = 73; break;
      }
      else if ((($131)|(0))==44) {
        label = 74; break;
      }
      else if ((($131)|(0))==45) {
        label = 75; break;
      }
      else if ((($131)|(0))==46) {
        label = 76; break;
      }
      else if ((($131)|(0))==47) {
        label = 77; break;
      }
      else if ((($131)|(0))==48) {
        label = 78; break;
      }
      else if ((($131)|(0))==49) {
        label = 79; break;
      }
      else if ((($131)|(0))==50) {
        label = 80; break;
      }
      else if ((($131)|(0))==51) {
        label = 81; break;
      }
      else if ((($131)|(0))==52) {
        label = 82; break;
      }
      else if ((($131)|(0))==53) {
        label = 83; break;
      }
      else if ((($131)|(0))==54) {
        label = 84; break;
      }
      else if ((($131)|(0))==55) {
        label = 85; break;
      }
      else if ((($131)|(0))==56) {
        label = 86; break;
      }
      else if ((($131)|(0))==57) {
        label = 87; break;
      }
      else if ((($131)|(0))==58) {
        label = 88; break;
      }
      else if ((($131)|(0))==59) {
        label = 89; break;
      }
      else if ((($131)|(0))==60) {
        label = 90; break;
      }
      else if ((($131)|(0))==61) {
        label = 91; break;
      }
      else if ((($131)|(0))==62) {
        label = 92; break;
      }
      else if ((($131)|(0))==63) {
        label = 93; break;
      }
      else if ((($131)|(0))==64) {
        label = 94; break;
      }
      else if ((($131)|(0))==65) {
        label = 95; break;
      }
      else if ((($131)|(0))==66) {
        label = 96; break;
      }
      else if ((($131)|(0))==67) {
        label = 97; break;
      }
      else if ((($131)|(0))==68) {
        label = 98; break;
      }
      else if ((($131)|(0))==69) {
        label = 99; break;
      }
      else if ((($131)|(0))==70) {
        label = 100; break;
      }
      else if ((($131)|(0))==71) {
        label = 101; break;
      }
      else if ((($131)|(0))==73 | (($131)|(0))==74 | (($131)|(0))==75) {
        label = 106; break;
      }
      else if ((($131)|(0))==72) {
        label = 107; break;
      }
      else {
      label = 124; break;
      }
    case 30: 
      var $133=HEAP8[(5245892)];
      var $134=$yy_cp;
      HEAP8[($134)]=$133;
      var $135=HEAP32[((5245884)>>2)];
      $yy_cp=$135;
      var $136=HEAP32[((5245880)>>2)];
      $yy_current_state=$136;
      label = 26; break;
    case 31: 
      HEAP32[((5249968)>>2)]=1;
      HEAP32[((5244652)>>2)]=5;
      label = 125; break;
    case 32: 
      var $139=HEAP32[((5243496)>>2)];
      _newline($139, 2);
      HEAP32[((5244652)>>2)]=5;
      label = 125; break;
    case 33: 
      var $141=HEAP32[((5243496)>>2)];
      _newline($141, 1);
      HEAP32[((5244652)>>2)]=5;
      label = 125; break;
    case 34: 
      var $143=HEAP32[((5243496)>>2)];
      var $144=(($143)|0);
      var $145=HEAP8[($144)];
      var $146=(($145 << 24) >> 24);
      var $147=HEAP32[((5243496)>>2)];
      _yyunput($146, $147);
      HEAP32[((5244652)>>2)]=5;
      label = 125; break;
    case 35: 
      HEAP32[((5244652)>>2)]=5;
      label = 125; break;
    case 36: 
      label = 125; break;
    case 37: 
      label = 125; break;
    case 38: 
      var $152=HEAP32[((5243496)>>2)];
      _newline($152, 2);
      label = 125; break;
    case 39: 
      var $154=HEAP32[((5243496)>>2)];
      _newline($154, 1);
      label = 125; break;
    case 40: 
      HEAP32[((5244652)>>2)]=3;
      label = 125; break;
    case 41: 
      var $157=HEAP32[((5243496)>>2)];
      _newline($157, 2);
      label = 125; break;
    case 42: 
      var $159=HEAP32[((5243496)>>2)];
      _newline($159, 1);
      label = 125; break;
    case 43: 
      var $161=HEAP8[(5245892)];
      var $162=$yy_cp;
      HEAP8[($162)]=$161;
      var $163=$yy_cp;
      var $164=((($163)-(1))|0);
      $yy_cp=$164;
      HEAP32[((5248540)>>2)]=$164;
      var $165=$yy_bp;
      HEAP32[((5243496)>>2)]=$165;
      var $166=$yy_cp;
      var $167=$yy_bp;
      var $168=$166;
      var $169=$167;
      var $170=((($168)-($169))|0);
      HEAP32[((5244016)>>2)]=$170;
      var $171=$yy_cp;
      var $172=HEAP8[($171)];
      HEAP8[(5245892)]=$172;
      var $173=$yy_cp;
      HEAP8[($173)]=0;
      var $174=$yy_cp;
      HEAP32[((5248540)>>2)]=$174;
      label = 125; break;
    case 44: 
      var $176=HEAP8[(5245892)];
      var $177=$yy_cp;
      HEAP8[($177)]=$176;
      var $178=$yy_cp;
      var $179=((($178)-(1))|0);
      $yy_cp=$179;
      HEAP32[((5248540)>>2)]=$179;
      var $180=$yy_bp;
      HEAP32[((5243496)>>2)]=$180;
      var $181=$yy_cp;
      var $182=$yy_bp;
      var $183=$181;
      var $184=$182;
      var $185=((($183)-($184))|0);
      HEAP32[((5244016)>>2)]=$185;
      var $186=$yy_cp;
      var $187=HEAP8[($186)];
      HEAP8[(5245892)]=$187;
      var $188=$yy_cp;
      HEAP8[($188)]=0;
      var $189=$yy_cp;
      HEAP32[((5248540)>>2)]=$189;
      label = 125; break;
    case 45: 
      $1=267;
      label = 126; break;
    case 46: 
      HEAP32[((5244012)>>2)]=0;
      $1=300;
      label = 126; break;
    case 47: 
      HEAP32[((5244012)>>2)]=1;
      $1=301;
      label = 126; break;
    case 48: 
      HEAP32[((5244012)>>2)]=2;
      $1=302;
      label = 126; break;
    case 49: 
      HEAP32[((5244012)>>2)]=3;
      $1=303;
      label = 126; break;
    case 50: 
      HEAP32[((5244012)>>2)]=2;
      $1=269;
      label = 126; break;
    case 51: 
      HEAP32[((5244012)>>2)]=0;
      $1=268;
      label = 126; break;
    case 52: 
      HEAP32[((5244012)>>2)]=3;
      $1=271;
      label = 126; break;
    case 53: 
      HEAP32[((5244012)>>2)]=1;
      $1=270;
      label = 126; break;
    case 54: 
      HEAP32[((5244012)>>2)]=4;
      $1=272;
      label = 126; break;
    case 55: 
      HEAP32[((5244012)>>2)]=5;
      $1=273;
      label = 126; break;
    case 56: 
      HEAP32[((5244012)>>2)]=6;
      $1=274;
      label = 126; break;
    case 57: 
      HEAP32[((5244012)>>2)]=7;
      $1=275;
      label = 126; break;
    case 58: 
      HEAP32[((5244012)>>2)]=8;
      $1=276;
      label = 126; break;
    case 59: 
      HEAP32[((5244012)>>2)]=9;
      $1=277;
      label = 126; break;
    case 60: 
      HEAP32[((5244012)>>2)]=12;
      $1=310;
      label = 126; break;
    case 61: 
      HEAP32[((5244012)>>2)]=5;
      $1=299;
      label = 126; break;
    case 62: 
      HEAP32[((5244012)>>2)]=6;
      $1=299;
      label = 126; break;
    case 63: 
      HEAP32[((5244012)>>2)]=7;
      $1=299;
      label = 126; break;
    case 64: 
      HEAP32[((5244012)>>2)]=2;
      $1=280;
      label = 126; break;
    case 65: 
      HEAP32[((5244012)>>2)]=2;
      $1=281;
      label = 126; break;
    case 66: 
      HEAP32[((5244012)>>2)]=2;
      $1=282;
      label = 126; break;
    case 67: 
      HEAP32[((5244012)>>2)]=2;
      $1=306;
      label = 126; break;
    case 68: 
      HEAP32[((5244012)>>2)]=13;
      $1=278;
      label = 126; break;
    case 69: 
      HEAP32[((5244012)>>2)]=13;
      $1=279;
      label = 126; break;
    case 70: 
      HEAP32[((5244012)>>2)]=0;
      $1=283;
      label = 126; break;
    case 71: 
      HEAP32[((5244012)>>2)]=0;
      $1=284;
      label = 126; break;
    case 72: 
      HEAP32[((5244012)>>2)]=0;
      $1=285;
      label = 126; break;
    case 73: 
      HEAP32[((5244012)>>2)]=0;
      $1=307;
      label = 126; break;
    case 74: 
      HEAP32[((5244012)>>2)]=1;
      $1=286;
      label = 126; break;
    case 75: 
      HEAP32[((5244012)>>2)]=1;
      $1=287;
      label = 126; break;
    case 76: 
      HEAP32[((5244012)>>2)]=1;
      $1=288;
      label = 126; break;
    case 77: 
      HEAP32[((5244012)>>2)]=1;
      $1=308;
      label = 126; break;
    case 78: 
      HEAP32[((5244012)>>2)]=4;
      $1=289;
      label = 126; break;
    case 79: 
      HEAP32[((5244012)>>2)]=4;
      $1=290;
      label = 126; break;
    case 80: 
      HEAP32[((5244012)>>2)]=4;
      $1=291;
      label = 126; break;
    case 81: 
      HEAP32[((5244012)>>2)]=4;
      $1=309;
      label = 126; break;
    case 82: 
      HEAP32[((5244012)>>2)]=3;
      $1=292;
      label = 126; break;
    case 83: 
      HEAP32[((5244012)>>2)]=3;
      $1=293;
      label = 126; break;
    case 84: 
      HEAP32[((5244012)>>2)]=3;
      $1=294;
      label = 126; break;
    case 85: 
      HEAP32[((5244012)>>2)]=9;
      $1=295;
      label = 126; break;
    case 86: 
      HEAP32[((5244012)>>2)]=10;
      $1=296;
      label = 126; break;
    case 87: 
      HEAP32[((5244012)>>2)]=11;
      $1=297;
      label = 126; break;
    case 88: 
      HEAP32[((5244012)>>2)]=12;
      $1=298;
      label = 126; break;
    case 89: 
      var $235=HEAP32[((5243496)>>2)];
      var $236=_strdup_s($235);
      HEAP32[((((5244012)|0))>>2)]=$236;
      $1=258;
      label = 126; break;
    case 90: 
      var $238=HEAP32[((5243496)>>2)];
      var $239=_strdup_s($238);
      var $240=_trimQstring($239);
      HEAP32[((((5244012)|0))>>2)]=$240;
      $1=259;
      label = 126; break;
    case 91: 
      $1=260;
      label = 126; break;
    case 92: 
      $1=261;
      label = 126; break;
    case 93: 
      $1=262;
      label = 126; break;
    case 94: 
      $1=263;
      label = 126; break;
    case 95: 
      $1=264;
      label = 126; break;
    case 96: 
      $1=265;
      label = 126; break;
    case 97: 
      $1=266;
      label = 126; break;
    case 98: 
      $1=304;
      label = 126; break;
    case 99: 
      label = 125; break;
    case 100: 
      $1=305;
      label = 126; break;
    case 101: 
      label = 102; break;
    case 102: 
      var $253=HEAP32[((5243496)>>2)];
      var $254=HEAP32[((5244016)>>2)];
      var $255=HEAP32[((5244004)>>2)];
      var $256=_fwrite($253, $254, 1, $255);
      var $257=(($256)|(0))!=0;
      if ($257) { label = 103; break; } else { label = 104; break; }
    case 103: 
      label = 104; break;
    case 104: 
      label = 105; break;
    case 105: 
      label = 125; break;
    case 106: 
      $1=0;
      label = 126; break;
    case 107: 
      var $263=$yy_cp;
      var $264=HEAP32[((5243496)>>2)];
      var $265=$263;
      var $266=$264;
      var $267=((($265)-($266))|0);
      var $268=((($267)-(1))|0);
      $yy_amount_of_matched_text=$268;
      var $269=HEAP8[(5245892)];
      var $270=$yy_cp;
      HEAP8[($270)]=$269;
      var $271=HEAP32[((5248544)>>2)];
      var $272=HEAP32[((5248552)>>2)];
      var $273=(($272+($271<<2))|0);
      var $274=HEAP32[(($273)>>2)];
      var $275=(($274+44)|0);
      var $276=HEAP32[(($275)>>2)];
      var $277=(($276)|(0))==0;
      if ($277) { label = 108; break; } else { label = 109; break; }
    case 108: 
      var $279=HEAP32[((5248544)>>2)];
      var $280=HEAP32[((5248552)>>2)];
      var $281=(($280+($279<<2))|0);
      var $282=HEAP32[(($281)>>2)];
      var $283=(($282+16)|0);
      var $284=HEAP32[(($283)>>2)];
      HEAP32[((5245612)>>2)]=$284;
      var $285=HEAP32[((5244020)>>2)];
      var $286=HEAP32[((5248544)>>2)];
      var $287=HEAP32[((5248552)>>2)];
      var $288=(($287+($286<<2))|0);
      var $289=HEAP32[(($288)>>2)];
      var $290=(($289)|0);
      HEAP32[(($290)>>2)]=$285;
      var $291=HEAP32[((5248544)>>2)];
      var $292=HEAP32[((5248552)>>2)];
      var $293=(($292+($291<<2))|0);
      var $294=HEAP32[(($293)>>2)];
      var $295=(($294+44)|0);
      HEAP32[(($295)>>2)]=1;
      label = 109; break;
    case 109: 
      var $297=HEAP32[((5248540)>>2)];
      var $298=HEAP32[((5245612)>>2)];
      var $299=HEAP32[((5248544)>>2)];
      var $300=HEAP32[((5248552)>>2)];
      var $301=(($300+($299<<2))|0);
      var $302=HEAP32[(($301)>>2)];
      var $303=(($302+4)|0);
      var $304=HEAP32[(($303)>>2)];
      var $305=(($304+$298)|0);
      var $306=(($297)>>>(0)) <= (($305)>>>(0));
      if ($306) { label = 110; break; } else { label = 113; break; }
    case 110: 
      var $308=HEAP32[((5243496)>>2)];
      var $309=$yy_amount_of_matched_text;
      var $310=(($308+$309)|0);
      HEAP32[((5248540)>>2)]=$310;
      var $311=_yy_get_previous_state();
      $yy_current_state=$311;
      var $312=$yy_current_state;
      var $313=_yy_try_NUL_trans($312);
      $yy_next_state=$313;
      var $314=HEAP32[((5243496)>>2)];
      var $315=(($314)|0);
      $yy_bp=$315;
      var $316=$yy_next_state;
      var $317=(($316)|(0))!=0;
      if ($317) { label = 111; break; } else { label = 112; break; }
    case 111: 
      var $319=HEAP32[((5248540)>>2)];
      var $320=(($319+1)|0);
      HEAP32[((5248540)>>2)]=$320;
      $yy_cp=$320;
      var $321=$yy_next_state;
      $yy_current_state=$321;
      label = 15; break;
    case 112: 
      var $323=HEAP32[((5248540)>>2)];
      $yy_cp=$323;
      label = 26; break;
    case 113: 
      var $325=_yy_get_next_buffer();
      if ((($325)|(0))==1) {
        label = 114; break;
      }
      else if ((($325)|(0))==0) {
        label = 120; break;
      }
      else if ((($325)|(0))==2) {
        label = 121; break;
      }
      else {
      label = 122; break;
      }
    case 114: 
      HEAP32[((5246920)>>2)]=0;
      var $327=_yywrap();
      var $328=(($327)|(0))!=0;
      if ($328) { label = 115; break; } else { label = 116; break; }
    case 115: 
      var $330=HEAP32[((5243496)>>2)];
      var $331=(($330)|0);
      HEAP32[((5248540)>>2)]=$331;
      var $332=HEAP32[((5244652)>>2)];
      var $333=((($332)-(1))|0);
      var $334=((((($333)|(0)))/(2))&-1);
      var $335=((($334)+(72))|0);
      var $336=((($335)+(1))|0);
      $yy_act=$336;
      label = 29; break;
    case 116: 
      var $338=HEAP32[((5246920)>>2)];
      var $339=(($338)|(0))!=0;
      if ($339) { label = 118; break; } else { label = 117; break; }
    case 117: 
      var $341=HEAP32[((5244020)>>2)];
      _yyrestart($341);
      label = 118; break;
    case 118: 
      label = 119; break;
    case 119: 
      label = 122; break;
    case 120: 
      var $345=HEAP32[((5243496)>>2)];
      var $346=$yy_amount_of_matched_text;
      var $347=(($345+$346)|0);
      HEAP32[((5248540)>>2)]=$347;
      var $348=_yy_get_previous_state();
      $yy_current_state=$348;
      var $349=HEAP32[((5248540)>>2)];
      $yy_cp=$349;
      var $350=HEAP32[((5243496)>>2)];
      var $351=(($350)|0);
      $yy_bp=$351;
      label = 15; break;
    case 121: 
      var $353=HEAP32[((5245612)>>2)];
      var $354=HEAP32[((5248544)>>2)];
      var $355=HEAP32[((5248552)>>2)];
      var $356=(($355+($354<<2))|0);
      var $357=HEAP32[(($356)>>2)];
      var $358=(($357+4)|0);
      var $359=HEAP32[(($358)>>2)];
      var $360=(($359+$353)|0);
      HEAP32[((5248540)>>2)]=$360;
      var $361=_yy_get_previous_state();
      $yy_current_state=$361;
      var $362=HEAP32[((5248540)>>2)];
      $yy_cp=$362;
      var $363=HEAP32[((5243496)>>2)];
      var $364=(($363)|0);
      $yy_bp=$364;
      label = 26; break;
    case 122: 
      label = 123; break;
    case 123: 
      label = 125; break;
    case 124: 
      _yy_fatal_error(((5263348)|0));
      label = 125; break;
    case 125: 
      label = 14; break;
    case 126: 
      var $370=$1;
      return $370;
    default: assert(0, "bad label: " + label);
  }
}
function _yyensure_buffer_stack() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $num_to_alloc;
      var $grow_size;
      var $1=HEAP32[((5248552)>>2)];
      var $2=(($1)|(0))!=0;
      if ($2) { label = 5; break; } else { label = 2; break; }
    case 2: 
      $num_to_alloc=1;
      var $4=$num_to_alloc;
      var $5=($4<<2);
      var $6=_yyalloc($5);
      var $7=$6;
      HEAP32[((5248552)>>2)]=$7;
      var $8=HEAP32[((5248552)>>2)];
      var $9=(($8)|(0))!=0;
      if ($9) { label = 4; break; } else { label = 3; break; }
    case 3: 
      _yy_fatal_error(((5260116)|0));
      label = 4; break;
    case 4: 
      var $12=HEAP32[((5248552)>>2)];
      var $13=$12;
      var $14=$num_to_alloc;
      var $15=($14<<2);
      _memset($13, 0, $15);
      var $16=$num_to_alloc;
      HEAP32[((5248548)>>2)]=$16;
      HEAP32[((5248544)>>2)]=0;
      label = 9; break;
    case 5: 
      var $18=HEAP32[((5248544)>>2)];
      var $19=HEAP32[((5248548)>>2)];
      var $20=((($19)-(1))|0);
      var $21=(($18)>>>(0)) >= (($20)>>>(0));
      if ($21) { label = 6; break; } else { label = 9; break; }
    case 6: 
      $grow_size=8;
      var $23=HEAP32[((5248548)>>2)];
      var $24=$grow_size;
      var $25=((($23)+($24))|0);
      $num_to_alloc=$25;
      var $26=HEAP32[((5248552)>>2)];
      var $27=$26;
      var $28=$num_to_alloc;
      var $29=($28<<2);
      var $30=_yyrealloc($27, $29);
      var $31=$30;
      HEAP32[((5248552)>>2)]=$31;
      var $32=HEAP32[((5248552)>>2)];
      var $33=(($32)|(0))!=0;
      if ($33) { label = 8; break; } else { label = 7; break; }
    case 7: 
      _yy_fatal_error(((5260116)|0));
      label = 8; break;
    case 8: 
      var $36=HEAP32[((5248552)>>2)];
      var $37=HEAP32[((5248548)>>2)];
      var $38=(($36+($37<<2))|0);
      var $39=$38;
      var $40=$grow_size;
      var $41=($40<<2);
      _memset($39, 0, $41);
      var $42=$num_to_alloc;
      HEAP32[((5248548)>>2)]=$42;
      label = 9; break;
    case 9: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_load_buffer_state() {
  var label = 0;
  var $1=HEAP32[((5248544)>>2)];
  var $2=HEAP32[((5248552)>>2)];
  var $3=(($2+($1<<2))|0);
  var $4=HEAP32[(($3)>>2)];
  var $5=(($4+16)|0);
  var $6=HEAP32[(($5)>>2)];
  HEAP32[((5245612)>>2)]=$6;
  var $7=HEAP32[((5248544)>>2)];
  var $8=HEAP32[((5248552)>>2)];
  var $9=(($8+($7<<2))|0);
  var $10=HEAP32[(($9)>>2)];
  var $11=(($10+8)|0);
  var $12=HEAP32[(($11)>>2)];
  HEAP32[((5248540)>>2)]=$12;
  HEAP32[((5243496)>>2)]=$12;
  var $13=HEAP32[((5248544)>>2)];
  var $14=HEAP32[((5248552)>>2)];
  var $15=(($14+($13<<2))|0);
  var $16=HEAP32[(($15)>>2)];
  var $17=(($16)|0);
  var $18=HEAP32[(($17)>>2)];
  HEAP32[((5244020)>>2)]=$18;
  var $19=HEAP32[((5248540)>>2)];
  var $20=HEAP8[($19)];
  HEAP8[(5245892)]=$20;
  return;
}
function _yy_get_previous_state() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $yy_current_state;
      var $yy_cp;
      var $yy_c;
      var $1=HEAP32[((5244652)>>2)];
      $yy_current_state=$1;
      var $2=HEAP32[((5243496)>>2)];
      var $3=(($2)|0);
      $yy_cp=$3;
      label = 2; break;
    case 2: 
      var $5=$yy_cp;
      var $6=HEAP32[((5248540)>>2)];
      var $7=(($5)>>>(0)) < (($6)>>>(0));
      if ($7) { label = 3; break; } else { label = 15; break; }
    case 3: 
      var $9=$yy_cp;
      var $10=HEAP8[($9)];
      var $11=(($10 << 24) >> 24);
      var $12=(($11)|(0))!=0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$yy_cp;
      var $15=HEAP8[($14)];
      var $16=(($15)&(255));
      var $17=((5245896+($16<<2))|0);
      var $18=HEAP32[(($17)>>2)];
      var $21 = $18;label = 6; break;
    case 5: 
      var $21 = 1;label = 6; break;
    case 6: 
      var $21;
      var $22=(($21) & 255);
      $yy_c=$22;
      var $23=$yy_current_state;
      var $24=((5249216+($23<<1))|0);
      var $25=HEAP16[(($24)>>1)];
      var $26=(($25 << 16) >> 16)!=0;
      if ($26) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $28=$yy_current_state;
      HEAP32[((5245880)>>2)]=$28;
      var $29=$yy_cp;
      HEAP32[((5245884)>>2)]=$29;
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $32=$yy_current_state;
      var $33=((5248556+($32<<1))|0);
      var $34=HEAP16[(($33)>>1)];
      var $35=(($34 << 16) >> 16);
      var $36=$yy_c;
      var $37=(($36)&(255));
      var $38=((($35)+($37))|0);
      var $39=((5247584+($38<<1))|0);
      var $40=HEAP16[(($39)>>1)];
      var $41=(($40 << 16) >> 16);
      var $42=$yy_current_state;
      var $43=(($41)|(0))!=(($42)|(0));
      if ($43) { label = 10; break; } else { label = 13; break; }
    case 10: 
      var $45=$yy_current_state;
      var $46=((5246924+($45<<1))|0);
      var $47=HEAP16[(($46)>>1)];
      var $48=(($47 << 16) >> 16);
      $yy_current_state=$48;
      var $49=$yy_current_state;
      var $50=(($49)|(0)) >= 316;
      if ($50) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $52=$yy_c;
      var $53=(($52)&(255));
      var $54=((5245616+($53<<2))|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=(($55) & 255);
      $yy_c=$56;
      label = 12; break;
    case 12: 
      label = 9; break;
    case 13: 
      var $59=$yy_current_state;
      var $60=((5248556+($59<<1))|0);
      var $61=HEAP16[(($60)>>1)];
      var $62=(($61 << 16) >> 16);
      var $63=$yy_c;
      var $64=(($63)&(255));
      var $65=((($62)+($64))|0);
      var $66=((5244656+($65<<1))|0);
      var $67=HEAP16[(($66)>>1)];
      var $68=(($67 << 16) >> 16);
      $yy_current_state=$68;
      label = 14; break;
    case 14: 
      var $70=$yy_cp;
      var $71=(($70+1)|0);
      $yy_cp=$71;
      label = 2; break;
    case 15: 
      var $73=$yy_current_state;
      return $73;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_try_NUL_trans($yy_current_state) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $yy_is_jam;
      var $yy_cp;
      var $yy_c;
      $1=$yy_current_state;
      var $2=HEAP32[((5248540)>>2)];
      $yy_cp=$2;
      $yy_c=1;
      var $3=$1;
      var $4=((5249216+($3<<1))|0);
      var $5=HEAP16[(($4)>>1)];
      var $6=(($5 << 16) >> 16)!=0;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $8=$1;
      HEAP32[((5245880)>>2)]=$8;
      var $9=$yy_cp;
      HEAP32[((5245884)>>2)]=$9;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      var $12=$1;
      var $13=((5248556+($12<<1))|0);
      var $14=HEAP16[(($13)>>1)];
      var $15=(($14 << 16) >> 16);
      var $16=$yy_c;
      var $17=(($16)&(255));
      var $18=((($15)+($17))|0);
      var $19=((5247584+($18<<1))|0);
      var $20=HEAP16[(($19)>>1)];
      var $21=(($20 << 16) >> 16);
      var $22=$1;
      var $23=(($21)|(0))!=(($22)|(0));
      if ($23) { label = 5; break; } else { label = 8; break; }
    case 5: 
      var $25=$1;
      var $26=((5246924+($25<<1))|0);
      var $27=HEAP16[(($26)>>1)];
      var $28=(($27 << 16) >> 16);
      $1=$28;
      var $29=$1;
      var $30=(($29)|(0)) >= 316;
      if ($30) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $32=$yy_c;
      var $33=(($32)&(255));
      var $34=((5245616+($33<<2))|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=(($35) & 255);
      $yy_c=$36;
      label = 7; break;
    case 7: 
      label = 4; break;
    case 8: 
      var $39=$1;
      var $40=((5248556+($39<<1))|0);
      var $41=HEAP16[(($40)>>1)];
      var $42=(($41 << 16) >> 16);
      var $43=$yy_c;
      var $44=(($43)&(255));
      var $45=((($42)+($44))|0);
      var $46=((5244656+($45<<1))|0);
      var $47=HEAP16[(($46)>>1)];
      var $48=(($47 << 16) >> 16);
      $1=$48;
      var $49=$1;
      var $50=(($49)|(0))==315;
      var $51=(($50)&(1));
      $yy_is_jam=$51;
      var $52=$yy_is_jam;
      var $53=(($52)|(0))!=0;
      if ($53) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $58 = 0;label = 11; break;
    case 10: 
      var $56=$1;
      var $58 = $56;label = 11; break;
    case 11: 
      var $58;
      return $58;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_create_buffer($file, $size) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $b;
      $1=$file;
      $2=$size;
      var $3=_yyalloc(48);
      var $4=$3;
      $b=$4;
      var $5=$b;
      var $6=(($5)|(0))!=0;
      if ($6) { label = 3; break; } else { label = 2; break; }
    case 2: 
      _yy_fatal_error(((5267192)|0));
      label = 3; break;
    case 3: 
      var $9=$2;
      var $10=$b;
      var $11=(($10+12)|0);
      HEAP32[(($11)>>2)]=$9;
      var $12=$b;
      var $13=(($12+12)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=((($14)+(2))|0);
      var $16=_yyalloc($15);
      var $17=$b;
      var $18=(($17+4)|0);
      HEAP32[(($18)>>2)]=$16;
      var $19=$b;
      var $20=(($19+4)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=(($21)|(0))!=0;
      if ($22) { label = 5; break; } else { label = 4; break; }
    case 4: 
      _yy_fatal_error(((5267192)|0));
      label = 5; break;
    case 5: 
      var $25=$b;
      var $26=(($25+20)|0);
      HEAP32[(($26)>>2)]=1;
      var $27=$b;
      var $28=$1;
      _yy_init_buffer($27, $28);
      var $29=$b;
      return $29;
    default: assert(0, "bad label: " + label);
  }
}
function _newline($text, $n) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $yyless_macro_arg;
      $1=$text;
      $2=$n;
      var $3=HEAP32[((5249972)>>2)];
      var $4=((($3)+(1))|0);
      HEAP32[((5249972)>>2)]=$4;
      var $5=HEAP32[((5249976)>>2)];
      var $6=(($5)|(0))!=0;
      if ($6) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $8=HEAP32[((5249976)>>2)];
      _free($8);
      label = 3; break;
    case 3: 
      var $10=$1;
      var $11=$2;
      var $12=(($10+$11)|0);
      var $13=_strdup($12);
      HEAP32[((5249976)>>2)]=$13;
      label = 4; break;
    case 4: 
      var $15=$2;
      $yyless_macro_arg=$15;
      var $16=HEAP8[(5245892)];
      var $17=HEAP32[((5244016)>>2)];
      var $18=HEAP32[((5243496)>>2)];
      var $19=(($18+$17)|0);
      HEAP8[($19)]=$16;
      var $20=HEAP32[((5243496)>>2)];
      var $21=$yyless_macro_arg;
      var $22=(($20+$21)|0);
      HEAP32[((5248540)>>2)]=$22;
      var $23=HEAP32[((5248540)>>2)];
      var $24=HEAP8[($23)];
      HEAP8[(5245892)]=$24;
      var $25=HEAP32[((5248540)>>2)];
      HEAP8[($25)]=0;
      var $26=$yyless_macro_arg;
      HEAP32[((5244016)>>2)]=$26;
      label = 5; break;
    case 5: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yyunput($c, $yy_bp) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $yy_cp;
      var $number_to_move;
      var $dest;
      var $source;
      $1=$c;
      $2=$yy_bp;
      var $3=HEAP32[((5248540)>>2)];
      $yy_cp=$3;
      var $4=HEAP8[(5245892)];
      var $5=$yy_cp;
      HEAP8[($5)]=$4;
      var $6=$yy_cp;
      var $7=HEAP32[((5248544)>>2)];
      var $8=HEAP32[((5248552)>>2)];
      var $9=(($8+($7<<2))|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($10+4)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+2)|0);
      var $14=(($6)>>>(0)) < (($13)>>>(0));
      if ($14) { label = 2; break; } else { label = 8; break; }
    case 2: 
      var $16=HEAP32[((5245612)>>2)];
      var $17=((($16)+(2))|0);
      $number_to_move=$17;
      var $18=HEAP32[((5248544)>>2)];
      var $19=HEAP32[((5248552)>>2)];
      var $20=(($19+($18<<2))|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=(($21+12)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=((($23)+(2))|0);
      var $25=HEAP32[((5248544)>>2)];
      var $26=HEAP32[((5248552)>>2)];
      var $27=(($26+($25<<2))|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=(($28+4)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=(($30+$24)|0);
      $dest=$31;
      var $32=$number_to_move;
      var $33=HEAP32[((5248544)>>2)];
      var $34=HEAP32[((5248552)>>2)];
      var $35=(($34+($33<<2))|0);
      var $36=HEAP32[(($35)>>2)];
      var $37=(($36+4)|0);
      var $38=HEAP32[(($37)>>2)];
      var $39=(($38+$32)|0);
      $source=$39;
      label = 3; break;
    case 3: 
      var $41=$source;
      var $42=HEAP32[((5248544)>>2)];
      var $43=HEAP32[((5248552)>>2)];
      var $44=(($43+($42<<2))|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=(($45+4)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($41)>>>(0)) > (($47)>>>(0));
      if ($48) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $50=$source;
      var $51=((($50)-(1))|0);
      $source=$51;
      var $52=HEAP8[($51)];
      var $53=$dest;
      var $54=((($53)-(1))|0);
      $dest=$54;
      HEAP8[($54)]=$52;
      label = 3; break;
    case 5: 
      var $56=$dest;
      var $57=$source;
      var $58=$56;
      var $59=$57;
      var $60=((($58)-($59))|0);
      var $61=$yy_cp;
      var $62=(($61+$60)|0);
      $yy_cp=$62;
      var $63=$dest;
      var $64=$source;
      var $65=$63;
      var $66=$64;
      var $67=((($65)-($66))|0);
      var $68=$2;
      var $69=(($68+$67)|0);
      $2=$69;
      var $70=HEAP32[((5248544)>>2)];
      var $71=HEAP32[((5248552)>>2)];
      var $72=(($71+($70<<2))|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=(($73+12)|0);
      var $75=HEAP32[(($74)>>2)];
      HEAP32[((5245612)>>2)]=$75;
      var $76=HEAP32[((5248544)>>2)];
      var $77=HEAP32[((5248552)>>2)];
      var $78=(($77+($76<<2))|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=(($79+16)|0);
      HEAP32[(($80)>>2)]=$75;
      var $81=$yy_cp;
      var $82=HEAP32[((5248544)>>2)];
      var $83=HEAP32[((5248552)>>2)];
      var $84=(($83+($82<<2))|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=(($85+4)|0);
      var $87=HEAP32[(($86)>>2)];
      var $88=(($87+2)|0);
      var $89=(($81)>>>(0)) < (($88)>>>(0));
      if ($89) { label = 6; break; } else { label = 7; break; }
    case 6: 
      _yy_fatal_error(((5259892)|0));
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $93=$1;
      var $94=(($93) & 255);
      var $95=$yy_cp;
      var $96=((($95)-(1))|0);
      $yy_cp=$96;
      HEAP8[($96)]=$94;
      var $97=$2;
      HEAP32[((5243496)>>2)]=$97;
      var $98=$yy_cp;
      var $99=HEAP8[($98)];
      HEAP8[(5245892)]=$99;
      var $100=$yy_cp;
      HEAP32[((5248540)>>2)]=$100;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _trimQstring($s) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $i;
      var $o;
      var $skipmode;
      $1=$s;
      $i=0;
      $o=0;
      $skipmode=0;
      var $2=$i;
      var $3=$1;
      var $4=(($3+$2)|0);
      var $5=HEAP8[($4)];
      var $6=(($5 << 24) >> 24);
      var $7=(($6)|(0))==34;
      if ($7) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $9=$i;
      var $10=((($9)+(1))|0);
      $i=$10;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      var $13=$i;
      var $14=$1;
      var $15=(($14+$13)|0);
      var $16=HEAP8[($15)];
      var $17=(($16 << 24) >> 24);
      var $18=(($17)|(0))!=0;
      if ($18) { label = 5; break; } else { label = 16; break; }
    case 5: 
      var $20=$i;
      var $21=$1;
      var $22=(($21+$20)|0);
      var $23=HEAP8[($22)];
      var $24=(($23 << 24) >> 24);
      var $25=(($24)|(0))==13;
      if ($25) { label = 8; break; } else { label = 6; break; }
    case 6: 
      var $27=$i;
      var $28=$1;
      var $29=(($28+$27)|0);
      var $30=HEAP8[($29)];
      var $31=(($30 << 24) >> 24);
      var $32=(($31)|(0))==10;
      if ($32) { label = 8; break; } else { label = 7; break; }
    case 7: 
      var $34=$i;
      var $35=$1;
      var $36=(($35+$34)|0);
      var $37=HEAP8[($36)];
      var $38=(($37 << 24) >> 24);
      var $39=(($38)|(0))==12;
      if ($39) { label = 8; break; } else { label = 9; break; }
    case 8: 
      $skipmode=1;
      label = 15; break;
    case 9: 
      var $42=$skipmode;
      var $43=(($42)|(0))!=0;
      if ($43) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $45=$i;
      var $46=$1;
      var $47=(($46+$45)|0);
      var $48=HEAP8[($47)];
      var $49=(($48 << 24) >> 24);
      var $50=_isspace($49);
      var $51=(($50)|(0))!=0;
      if ($51) { label = 14; break; } else { label = 11; break; }
    case 11: 
      var $53=$skipmode;
      var $54=(($53)|(0))!=0;
      if ($54) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $56=$o;
      var $57=$1;
      var $58=(($57+$56)|0);
      HEAP8[($58)]=32;
      var $59=$o;
      var $60=((($59)+(1))|0);
      $o=$60;
      label = 13; break;
    case 13: 
      $skipmode=0;
      var $62=$i;
      var $63=$1;
      var $64=(($63+$62)|0);
      var $65=HEAP8[($64)];
      var $66=$o;
      var $67=$1;
      var $68=(($67+$66)|0);
      HEAP8[($68)]=$65;
      var $69=$o;
      var $70=((($69)+(1))|0);
      $o=$70;
      label = 14; break;
    case 14: 
      label = 15; break;
    case 15: 
      var $73=$i;
      var $74=((($73)+(1))|0);
      $i=$74;
      label = 4; break;
    case 16: 
      var $76=$o;
      var $77=$1;
      var $78=(($77+$76)|0);
      HEAP8[($78)]=0;
      var $79=$o;
      var $80=(($79)|(0)) >= 1;
      if ($80) { label = 17; break; } else { label = 19; break; }
    case 17: 
      var $82=$o;
      var $83=((($82)-(1))|0);
      var $84=$1;
      var $85=(($84+$83)|0);
      var $86=HEAP8[($85)];
      var $87=(($86 << 24) >> 24);
      var $88=(($87)|(0))==34;
      if ($88) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $90=$o;
      var $91=((($90)-(1))|0);
      var $92=$1;
      var $93=(($92+$91)|0);
      HEAP8[($93)]=0;
      label = 19; break;
    case 19: 
      var $95=$1;
      return $95;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_init_globals() {
  var label = 0;
  HEAP32[((5248552)>>2)]=0;
  HEAP32[((5248544)>>2)]=0;
  HEAP32[((5248548)>>2)]=0;
  HEAP32[((5248540)>>2)]=0;
  HEAP32[((5245888)>>2)]=0;
  HEAP32[((5244652)>>2)]=0;
  HEAP32[((5244020)>>2)]=0;
  HEAP32[((5244004)>>2)]=0;
  return 0;
}
function _lex_getlinenum() {
  var label = 0;
  var $1=HEAP32[((5249972)>>2)];
  return $1;
}
function _lex_getline() {
  var label = 0;
  var $1=HEAP32[((5249976)>>2)];
  return $1;
}
function _lex_getutf8() {
  var label = 0;
  var $1=HEAP32[((5249968)>>2)];
  return $1;
}
function _yy_get_next_buffer() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $dest;
      var $source;
      var $number_to_move;
      var $i;
      var $ret_val;
      var $num_to_read;
      var $b;
      var $yy_c_buf_p_offset;
      var $new_size;
      var $c;
      var $n;
      var $new_size1;
      var $2=HEAP32[((5248544)>>2)];
      var $3=HEAP32[((5248552)>>2)];
      var $4=(($3+($2<<2))|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5+4)|0);
      var $7=HEAP32[(($6)>>2)];
      $dest=$7;
      var $8=HEAP32[((5243496)>>2)];
      $source=$8;
      var $9=HEAP32[((5248540)>>2)];
      var $10=HEAP32[((5245612)>>2)];
      var $11=((($10)+(1))|0);
      var $12=HEAP32[((5248544)>>2)];
      var $13=HEAP32[((5248552)>>2)];
      var $14=(($13+($12<<2))|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=(($15+4)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($17+$11)|0);
      var $19=(($9)>>>(0)) > (($18)>>>(0));
      if ($19) { label = 2; break; } else { label = 3; break; }
    case 2: 
      _yy_fatal_error(((5259632)|0));
      label = 3; break;
    case 3: 
      var $22=HEAP32[((5248544)>>2)];
      var $23=HEAP32[((5248552)>>2)];
      var $24=(($23+($22<<2))|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25+40)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=(($27)|(0))==0;
      if ($28) { label = 4; break; } else { label = 7; break; }
    case 4: 
      var $30=HEAP32[((5248540)>>2)];
      var $31=HEAP32[((5243496)>>2)];
      var $32=$30;
      var $33=$31;
      var $34=((($32)-($33))|0);
      var $35=(($34)|0);
      var $36=(($35)|(0))==1;
      if ($36) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $1=1;
      label = 63; break;
    case 6: 
      $1=2;
      label = 63; break;
    case 7: 
      var $40=HEAP32[((5248540)>>2)];
      var $41=HEAP32[((5243496)>>2)];
      var $42=$40;
      var $43=$41;
      var $44=((($42)-($43))|0);
      var $45=((($44)-(1))|0);
      $number_to_move=$45;
      $i=0;
      label = 8; break;
    case 8: 
      var $47=$i;
      var $48=$number_to_move;
      var $49=(($47)|(0)) < (($48)|(0));
      if ($49) { label = 9; break; } else { label = 11; break; }
    case 9: 
      var $51=$source;
      var $52=(($51+1)|0);
      $source=$52;
      var $53=HEAP8[($51)];
      var $54=$dest;
      var $55=(($54+1)|0);
      $dest=$55;
      HEAP8[($54)]=$53;
      label = 10; break;
    case 10: 
      var $57=$i;
      var $58=((($57)+(1))|0);
      $i=$58;
      label = 8; break;
    case 11: 
      var $60=HEAP32[((5248544)>>2)];
      var $61=HEAP32[((5248552)>>2)];
      var $62=(($61+($60<<2))|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=(($63+44)|0);
      var $65=HEAP32[(($64)>>2)];
      var $66=(($65)|(0))==2;
      if ($66) { label = 12; break; } else { label = 13; break; }
    case 12: 
      HEAP32[((5245612)>>2)]=0;
      var $68=HEAP32[((5248544)>>2)];
      var $69=HEAP32[((5248552)>>2)];
      var $70=(($69+($68<<2))|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=(($71+16)|0);
      HEAP32[(($72)>>2)]=0;
      label = 52; break;
    case 13: 
      var $74=HEAP32[((5248544)>>2)];
      var $75=HEAP32[((5248552)>>2)];
      var $76=(($75+($74<<2))|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=(($77+12)|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=$number_to_move;
      var $81=((($79)-($80))|0);
      var $82=((($81)-(1))|0);
      $num_to_read=$82;
      label = 14; break;
    case 14: 
      var $84=$num_to_read;
      var $85=(($84)|(0)) <= 0;
      if ($85) { label = 15; break; } else { label = 27; break; }
    case 15: 
      var $87=HEAP32[((5248552)>>2)];
      var $88=(($87)|(0))!=0;
      if ($88) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $90=HEAP32[((5248544)>>2)];
      var $91=HEAP32[((5248552)>>2)];
      var $92=(($91+($90<<2))|0);
      var $93=HEAP32[(($92)>>2)];
      var $96 = $93;label = 18; break;
    case 17: 
      var $96 = 0;label = 18; break;
    case 18: 
      var $96;
      $b=$96;
      var $97=HEAP32[((5248540)>>2)];
      var $98=$b;
      var $99=(($98+4)|0);
      var $100=HEAP32[(($99)>>2)];
      var $101=$97;
      var $102=$100;
      var $103=((($101)-($102))|0);
      $yy_c_buf_p_offset=$103;
      var $104=$b;
      var $105=(($104+20)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=(($106)|(0))!=0;
      if ($107) { label = 19; break; } else { label = 23; break; }
    case 19: 
      var $109=$b;
      var $110=(($109+12)|0);
      var $111=HEAP32[(($110)>>2)];
      var $112=($111<<1);
      $new_size=$112;
      var $113=$new_size;
      var $114=(($113)|(0)) <= 0;
      if ($114) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $116=$b;
      var $117=(($116+12)|0);
      var $118=HEAP32[(($117)>>2)];
      var $119=Math.floor(((($118)>>>(0)))/(8));
      var $120=$b;
      var $121=(($120+12)|0);
      var $122=HEAP32[(($121)>>2)];
      var $123=((($122)+($119))|0);
      HEAP32[(($121)>>2)]=$123;
      label = 22; break;
    case 21: 
      var $125=$b;
      var $126=(($125+12)|0);
      var $127=HEAP32[(($126)>>2)];
      var $128=($127<<1);
      HEAP32[(($126)>>2)]=$128;
      label = 22; break;
    case 22: 
      var $130=$b;
      var $131=(($130+4)|0);
      var $132=HEAP32[(($131)>>2)];
      var $133=$b;
      var $134=(($133+12)|0);
      var $135=HEAP32[(($134)>>2)];
      var $136=((($135)+(2))|0);
      var $137=_yyrealloc($132, $136);
      var $138=$b;
      var $139=(($138+4)|0);
      HEAP32[(($139)>>2)]=$137;
      label = 24; break;
    case 23: 
      var $141=$b;
      var $142=(($141+4)|0);
      HEAP32[(($142)>>2)]=0;
      label = 24; break;
    case 24: 
      var $144=$b;
      var $145=(($144+4)|0);
      var $146=HEAP32[(($145)>>2)];
      var $147=(($146)|(0))!=0;
      if ($147) { label = 26; break; } else { label = 25; break; }
    case 25: 
      _yy_fatal_error(((5259160)|0));
      label = 26; break;
    case 26: 
      var $150=$yy_c_buf_p_offset;
      var $151=$b;
      var $152=(($151+4)|0);
      var $153=HEAP32[(($152)>>2)];
      var $154=(($153+$150)|0);
      HEAP32[((5248540)>>2)]=$154;
      var $155=HEAP32[((5248544)>>2)];
      var $156=HEAP32[((5248552)>>2)];
      var $157=(($156+($155<<2))|0);
      var $158=HEAP32[(($157)>>2)];
      var $159=(($158+12)|0);
      var $160=HEAP32[(($159)>>2)];
      var $161=$number_to_move;
      var $162=((($160)-($161))|0);
      var $163=((($162)-(1))|0);
      $num_to_read=$163;
      label = 14; break;
    case 27: 
      var $165=$num_to_read;
      var $166=(($165)|(0)) > 8192;
      if ($166) { label = 28; break; } else { label = 29; break; }
    case 28: 
      $num_to_read=8192;
      label = 29; break;
    case 29: 
      var $169=HEAP32[((5248544)>>2)];
      var $170=HEAP32[((5248552)>>2)];
      var $171=(($170+($169<<2))|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=(($172+24)|0);
      var $174=HEAP32[(($173)>>2)];
      var $175=(($174)|(0))!=0;
      if ($175) { label = 30; break; } else { label = 43; break; }
    case 30: 
      $c=42;
      $n=0;
      label = 31; break;
    case 31: 
      var $178=$n;
      var $179=$num_to_read;
      var $180=(($178)>>>(0)) < (($179)>>>(0));
      if ($180) { label = 32; break; } else { var $189 = 0;label = 34; break; }
    case 32: 
      var $182=HEAP32[((5244020)>>2)];
      var $183=_fgetc($182);
      $c=$183;
      var $184=(($183)|(0))!=-1;
      if ($184) { label = 33; break; } else { var $189 = 0;label = 34; break; }
    case 33: 
      var $186=$c;
      var $187=(($186)|(0))!=10;
      var $189 = $187;label = 34; break;
    case 34: 
      var $189;
      if ($189) { label = 35; break; } else { label = 37; break; }
    case 35: 
      var $191=$c;
      var $192=(($191) & 255);
      var $193=$n;
      var $194=$number_to_move;
      var $195=HEAP32[((5248544)>>2)];
      var $196=HEAP32[((5248552)>>2)];
      var $197=(($196+($195<<2))|0);
      var $198=HEAP32[(($197)>>2)];
      var $199=(($198+4)|0);
      var $200=HEAP32[(($199)>>2)];
      var $201=(($200+$194)|0);
      var $202=(($201+$193)|0);
      HEAP8[($202)]=$192;
      label = 36; break;
    case 36: 
      var $204=$n;
      var $205=((($204)+(1))|0);
      $n=$205;
      label = 31; break;
    case 37: 
      var $207=$c;
      var $208=(($207)|(0))==10;
      if ($208) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $210=$c;
      var $211=(($210) & 255);
      var $212=$n;
      var $213=((($212)+(1))|0);
      $n=$213;
      var $214=$number_to_move;
      var $215=HEAP32[((5248544)>>2)];
      var $216=HEAP32[((5248552)>>2)];
      var $217=(($216+($215<<2))|0);
      var $218=HEAP32[(($217)>>2)];
      var $219=(($218+4)|0);
      var $220=HEAP32[(($219)>>2)];
      var $221=(($220+$214)|0);
      var $222=(($221+$212)|0);
      HEAP8[($222)]=$211;
      label = 39; break;
    case 39: 
      var $224=$c;
      var $225=(($224)|(0))==-1;
      if ($225) { label = 40; break; } else { label = 42; break; }
    case 40: 
      var $227=HEAP32[((5244020)>>2)];
      var $228=_ferror($227);
      var $229=(($228)|(0))!=0;
      if ($229) { label = 41; break; } else { label = 42; break; }
    case 41: 
      _yy_fatal_error(((5268296)|0));
      label = 42; break;
    case 42: 
      var $232=$n;
      HEAP32[((5245612)>>2)]=$232;
      label = 51; break;
    case 43: 
      var $234=___errno_location();
      HEAP32[(($234)>>2)]=0;
      label = 44; break;
    case 44: 
      var $236=$number_to_move;
      var $237=HEAP32[((5248544)>>2)];
      var $238=HEAP32[((5248552)>>2)];
      var $239=(($238+($237<<2))|0);
      var $240=HEAP32[(($239)>>2)];
      var $241=(($240+4)|0);
      var $242=HEAP32[(($241)>>2)];
      var $243=(($242+$236)|0);
      var $244=$num_to_read;
      var $245=HEAP32[((5244020)>>2)];
      var $246=_fread($243, 1, $244, $245);
      HEAP32[((5245612)>>2)]=$246;
      var $247=(($246)|(0))==0;
      if ($247) { label = 45; break; } else { var $253 = 0;label = 46; break; }
    case 45: 
      var $249=HEAP32[((5244020)>>2)];
      var $250=_ferror($249);
      var $251=(($250)|(0))!=0;
      var $253 = $251;label = 46; break;
    case 46: 
      var $253;
      if ($253) { label = 47; break; } else { label = 50; break; }
    case 47: 
      var $255=___errno_location();
      var $256=HEAP32[(($255)>>2)];
      var $257=(($256)|(0))!=4;
      if ($257) { label = 48; break; } else { label = 49; break; }
    case 48: 
      _yy_fatal_error(((5268296)|0));
      label = 50; break;
    case 49: 
      var $260=___errno_location();
      HEAP32[(($260)>>2)]=0;
      var $261=HEAP32[((5244020)>>2)];
      _clearerr($261);
      label = 44; break;
    case 50: 
      label = 51; break;
    case 51: 
      var $264=HEAP32[((5245612)>>2)];
      var $265=HEAP32[((5248544)>>2)];
      var $266=HEAP32[((5248552)>>2)];
      var $267=(($266+($265<<2))|0);
      var $268=HEAP32[(($267)>>2)];
      var $269=(($268+16)|0);
      HEAP32[(($269)>>2)]=$264;
      label = 52; break;
    case 52: 
      var $271=HEAP32[((5245612)>>2)];
      var $272=(($271)|(0))==0;
      if ($272) { label = 53; break; } else { label = 57; break; }
    case 53: 
      var $274=$number_to_move;
      var $275=(($274)|(0))==0;
      if ($275) { label = 54; break; } else { label = 55; break; }
    case 54: 
      $ret_val=1;
      var $277=HEAP32[((5244020)>>2)];
      _yyrestart($277);
      label = 56; break;
    case 55: 
      $ret_val=2;
      var $279=HEAP32[((5248544)>>2)];
      var $280=HEAP32[((5248552)>>2)];
      var $281=(($280+($279<<2))|0);
      var $282=HEAP32[(($281)>>2)];
      var $283=(($282+44)|0);
      HEAP32[(($283)>>2)]=2;
      label = 56; break;
    case 56: 
      label = 58; break;
    case 57: 
      $ret_val=0;
      label = 58; break;
    case 58: 
      var $287=HEAP32[((5245612)>>2)];
      var $288=$number_to_move;
      var $289=((($287)+($288))|0);
      var $290=HEAP32[((5248544)>>2)];
      var $291=HEAP32[((5248552)>>2)];
      var $292=(($291+($290<<2))|0);
      var $293=HEAP32[(($292)>>2)];
      var $294=(($293+12)|0);
      var $295=HEAP32[(($294)>>2)];
      var $296=(($289)>>>(0)) > (($295)>>>(0));
      if ($296) { label = 59; break; } else { label = 62; break; }
    case 59: 
      var $298=HEAP32[((5245612)>>2)];
      var $299=$number_to_move;
      var $300=((($298)+($299))|0);
      var $301=HEAP32[((5245612)>>2)];
      var $302=$301 >> 1;
      var $303=((($300)+($302))|0);
      $new_size1=$303;
      var $304=HEAP32[((5248544)>>2)];
      var $305=HEAP32[((5248552)>>2)];
      var $306=(($305+($304<<2))|0);
      var $307=HEAP32[(($306)>>2)];
      var $308=(($307+4)|0);
      var $309=HEAP32[(($308)>>2)];
      var $310=$new_size1;
      var $311=_yyrealloc($309, $310);
      var $312=HEAP32[((5248544)>>2)];
      var $313=HEAP32[((5248552)>>2)];
      var $314=(($313+($312<<2))|0);
      var $315=HEAP32[(($314)>>2)];
      var $316=(($315+4)|0);
      HEAP32[(($316)>>2)]=$311;
      var $317=HEAP32[((5248544)>>2)];
      var $318=HEAP32[((5248552)>>2)];
      var $319=(($318+($317<<2))|0);
      var $320=HEAP32[(($319)>>2)];
      var $321=(($320+4)|0);
      var $322=HEAP32[(($321)>>2)];
      var $323=(($322)|(0))!=0;
      if ($323) { label = 61; break; } else { label = 60; break; }
    case 60: 
      _yy_fatal_error(((5267840)|0));
      label = 61; break;
    case 61: 
      label = 62; break;
    case 62: 
      var $327=$number_to_move;
      var $328=HEAP32[((5245612)>>2)];
      var $329=((($328)+($327))|0);
      HEAP32[((5245612)>>2)]=$329;
      var $330=HEAP32[((5245612)>>2)];
      var $331=HEAP32[((5248544)>>2)];
      var $332=HEAP32[((5248552)>>2)];
      var $333=(($332+($331<<2))|0);
      var $334=HEAP32[(($333)>>2)];
      var $335=(($334+4)|0);
      var $336=HEAP32[(($335)>>2)];
      var $337=(($336+$330)|0);
      HEAP8[($337)]=0;
      var $338=HEAP32[((5245612)>>2)];
      var $339=((($338)+(1))|0);
      var $340=HEAP32[((5248544)>>2)];
      var $341=HEAP32[((5248552)>>2)];
      var $342=(($341+($340<<2))|0);
      var $343=HEAP32[(($342)>>2)];
      var $344=(($343+4)|0);
      var $345=HEAP32[(($344)>>2)];
      var $346=(($345+$339)|0);
      HEAP8[($346)]=0;
      var $347=HEAP32[((5248544)>>2)];
      var $348=HEAP32[((5248552)>>2)];
      var $349=(($348+($347<<2))|0);
      var $350=HEAP32[(($349)>>2)];
      var $351=(($350+4)|0);
      var $352=HEAP32[(($351)>>2)];
      var $353=(($352)|0);
      HEAP32[((5243496)>>2)]=$353;
      var $354=$ret_val;
      $1=$354;
      label = 63; break;
    case 63: 
      var $356=$1;
      return $356;
    default: assert(0, "bad label: " + label);
  }
}
function _yyrestart($input_file) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$input_file;
      var $2=HEAP32[((5248552)>>2)];
      var $3=(($2)|(0))!=0;
      if ($3) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $5=HEAP32[((5248544)>>2)];
      var $6=HEAP32[((5248552)>>2)];
      var $7=(($6+($5<<2))|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(($8)|(0))!=0;
      if ($9) { label = 5; break; } else { label = 4; break; }
    case 3: 
      if (0) { label = 5; break; } else { label = 4; break; }
    case 4: 
      _yyensure_buffer_stack();
      var $12=HEAP32[((5244020)>>2)];
      var $13=_yy_create_buffer($12, 16384);
      var $14=HEAP32[((5248544)>>2)];
      var $15=HEAP32[((5248552)>>2)];
      var $16=(($15+($14<<2))|0);
      HEAP32[(($16)>>2)]=$13;
      label = 5; break;
    case 5: 
      var $18=HEAP32[((5248552)>>2)];
      var $19=(($18)|(0))!=0;
      if ($19) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $21=HEAP32[((5248544)>>2)];
      var $22=HEAP32[((5248552)>>2)];
      var $23=(($22+($21<<2))|0);
      var $24=HEAP32[(($23)>>2)];
      var $27 = $24;label = 8; break;
    case 7: 
      var $27 = 0;label = 8; break;
    case 8: 
      var $27;
      var $28=$1;
      _yy_init_buffer($27, $28);
      _yy_load_buffer_state();
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_init_buffer($b, $file) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $oerrno;
      $1=$b;
      $2=$file;
      var $3=___errno_location();
      var $4=HEAP32[(($3)>>2)];
      $oerrno=$4;
      var $5=$1;
      _yy_flush_buffer($5);
      var $6=$2;
      var $7=$1;
      var $8=(($7)|0);
      HEAP32[(($8)>>2)]=$6;
      var $9=$1;
      var $10=(($9+40)|0);
      HEAP32[(($10)>>2)]=1;
      var $11=$1;
      var $12=HEAP32[((5248552)>>2)];
      var $13=(($12)|(0))!=0;
      if ($13) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $15=HEAP32[((5248544)>>2)];
      var $16=HEAP32[((5248552)>>2)];
      var $17=(($16+($15<<2))|0);
      var $18=HEAP32[(($17)>>2)];
      var $21 = $18;label = 4; break;
    case 3: 
      var $21 = 0;label = 4; break;
    case 4: 
      var $21;
      var $22=(($11)|(0))!=(($21)|(0));
      if ($22) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $24=$1;
      var $25=(($24+32)|0);
      HEAP32[(($25)>>2)]=1;
      var $26=$1;
      var $27=(($26+36)|0);
      HEAP32[(($27)>>2)]=0;
      label = 6; break;
    case 6: 
      var $29=$2;
      var $30=(($29)|(0))!=0;
      if ($30) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $32=$2;
      var $33=_fileno($32);
      var $34=_isatty($33);
      var $35=(($34)|(0)) > 0;
      var $36=(($35)&(1));
      var $39 = $36;label = 9; break;
    case 8: 
      var $39 = 0;label = 9; break;
    case 9: 
      var $39;
      var $40=$1;
      var $41=(($40+24)|0);
      HEAP32[(($41)>>2)]=$39;
      var $42=$oerrno;
      var $43=___errno_location();
      HEAP32[(($43)>>2)]=$42;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yyalloc($size) {
  var label = 0;
  var $1;
  $1=$size;
  var $2=$1;
  var $3=_malloc($2);
  return $3;
}
function _yy_delete_buffer($b) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$b;
      var $2=$1;
      var $3=(($2)|(0))!=0;
      if ($3) { label = 3; break; } else { label = 2; break; }
    case 2: 
      label = 11; break;
    case 3: 
      var $6=$1;
      var $7=HEAP32[((5248552)>>2)];
      var $8=(($7)|(0))!=0;
      if ($8) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $10=HEAP32[((5248544)>>2)];
      var $11=HEAP32[((5248552)>>2)];
      var $12=(($11+($10<<2))|0);
      var $13=HEAP32[(($12)>>2)];
      var $16 = $13;label = 6; break;
    case 5: 
      var $16 = 0;label = 6; break;
    case 6: 
      var $16;
      var $17=(($6)|(0))==(($16)|(0));
      if ($17) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $19=HEAP32[((5248544)>>2)];
      var $20=HEAP32[((5248552)>>2)];
      var $21=(($20+($19<<2))|0);
      HEAP32[(($21)>>2)]=0;
      label = 8; break;
    case 8: 
      var $23=$1;
      var $24=(($23+20)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25)|(0))!=0;
      if ($26) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $28=$1;
      var $29=(($28+4)|0);
      var $30=HEAP32[(($29)>>2)];
      _yyfree($30);
      label = 10; break;
    case 10: 
      var $32=$1;
      var $33=$32;
      _yyfree($33);
      label = 11; break;
    case 11: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yyfree($ptr) {
  var label = 0;
  var $1;
  $1=$ptr;
  var $2=$1;
  _free($2);
  return;
}
function _yy_flush_buffer($b) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      $1=$b;
      var $2=$1;
      var $3=(($2)|(0))!=0;
      if ($3) { label = 3; break; } else { label = 2; break; }
    case 2: 
      label = 8; break;
    case 3: 
      var $6=$1;
      var $7=(($6+16)|0);
      HEAP32[(($7)>>2)]=0;
      var $8=$1;
      var $9=(($8+4)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($10)|0);
      HEAP8[($11)]=0;
      var $12=$1;
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=(($14+1)|0);
      HEAP8[($15)]=0;
      var $16=$1;
      var $17=(($16+4)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=(($18)|0);
      var $20=$1;
      var $21=(($20+8)|0);
      HEAP32[(($21)>>2)]=$19;
      var $22=$1;
      var $23=(($22+28)|0);
      HEAP32[(($23)>>2)]=1;
      var $24=$1;
      var $25=(($24+44)|0);
      HEAP32[(($25)>>2)]=0;
      var $26=$1;
      var $27=HEAP32[((5248552)>>2)];
      var $28=(($27)|(0))!=0;
      if ($28) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $30=HEAP32[((5248544)>>2)];
      var $31=HEAP32[((5248552)>>2)];
      var $32=(($31+($30<<2))|0);
      var $33=HEAP32[(($32)>>2)];
      var $36 = $33;label = 6; break;
    case 5: 
      var $36 = 0;label = 6; break;
    case 6: 
      var $36;
      var $37=(($26)|(0))==(($36)|(0));
      if ($37) { label = 7; break; } else { label = 8; break; }
    case 7: 
      _yy_load_buffer_state();
      label = 8; break;
    case 8: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yypop_buffer_state() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1=HEAP32[((5248552)>>2)];
      var $2=(($1)|(0))!=0;
      if ($2) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $4=HEAP32[((5248544)>>2)];
      var $5=HEAP32[((5248552)>>2)];
      var $6=(($5+($4<<2))|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|(0))!=0;
      if ($8) { label = 5; break; } else { label = 4; break; }
    case 3: 
      if (0) { label = 5; break; } else { label = 4; break; }
    case 4: 
      label = 14; break;
    case 5: 
      var $12=HEAP32[((5248552)>>2)];
      var $13=(($12)|(0))!=0;
      if ($13) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $15=HEAP32[((5248544)>>2)];
      var $16=HEAP32[((5248552)>>2)];
      var $17=(($16+($15<<2))|0);
      var $18=HEAP32[(($17)>>2)];
      var $21 = $18;label = 8; break;
    case 7: 
      var $21 = 0;label = 8; break;
    case 8: 
      var $21;
      _yy_delete_buffer($21);
      var $22=HEAP32[((5248544)>>2)];
      var $23=HEAP32[((5248552)>>2)];
      var $24=(($23+($22<<2))|0);
      HEAP32[(($24)>>2)]=0;
      var $25=HEAP32[((5248544)>>2)];
      var $26=(($25)>>>(0)) > 0;
      if ($26) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $28=HEAP32[((5248544)>>2)];
      var $29=((($28)-(1))|0);
      HEAP32[((5248544)>>2)]=$29;
      label = 10; break;
    case 10: 
      var $31=HEAP32[((5248552)>>2)];
      var $32=(($31)|(0))!=0;
      if ($32) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $34=HEAP32[((5248544)>>2)];
      var $35=HEAP32[((5248552)>>2)];
      var $36=(($35+($34<<2))|0);
      var $37=HEAP32[(($36)>>2)];
      var $38=(($37)|(0))!=0;
      if ($38) { label = 13; break; } else { label = 14; break; }
    case 12: 
      if (0) { label = 13; break; } else { label = 14; break; }
    case 13: 
      _yy_load_buffer_state();
      HEAP32[((5246920)>>2)]=1;
      label = 14; break;
    case 14: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yylex_destroy() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      label = 2; break;
    case 2: 
      var $2=HEAP32[((5248552)>>2)];
      var $3=(($2)|(0))!=0;
      if ($3) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $5=HEAP32[((5248544)>>2)];
      var $6=HEAP32[((5248552)>>2)];
      var $7=(($6+($5<<2))|0);
      var $8=HEAP32[(($7)>>2)];
      var $11 = $8;label = 5; break;
    case 4: 
      var $11 = 0;label = 5; break;
    case 5: 
      var $11;
      var $12=(($11)|(0))!=0;
      if ($12) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $14=HEAP32[((5248552)>>2)];
      var $15=(($14)|(0))!=0;
      if ($15) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $17=HEAP32[((5248544)>>2)];
      var $18=HEAP32[((5248552)>>2)];
      var $19=(($18+($17<<2))|0);
      var $20=HEAP32[(($19)>>2)];
      var $23 = $20;label = 9; break;
    case 8: 
      var $23 = 0;label = 9; break;
    case 9: 
      var $23;
      _yy_delete_buffer($23);
      var $24=HEAP32[((5248544)>>2)];
      var $25=HEAP32[((5248552)>>2)];
      var $26=(($25+($24<<2))|0);
      HEAP32[(($26)>>2)]=0;
      _yypop_buffer_state();
      label = 2; break;
    case 10: 
      var $28=HEAP32[((5248552)>>2)];
      var $29=$28;
      _yyfree($29);
      HEAP32[((5248552)>>2)]=0;
      var $30=_yy_init_globals();
      return 0;
    default: assert(0, "bad label: " + label);
  }
}
function _yyrealloc($ptr, $size) {
  var label = 0;
  var $1;
  var $2;
  $1=$ptr;
  $2=$size;
  var $3=$1;
  var $4=$2;
  var $5=_realloc($3, $4);
  return $5;
}
function _lex_destroy() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1=HEAP32[((5249976)>>2)];
      var $2=(($1)|(0))!=0;
      if ($2) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $4=HEAP32[((5249976)>>2)];
      _free($4);
      HEAP32[((5249976)>>2)]=0;
      label = 3; break;
    case 3: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _yy_fatal_error($msg) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1;
  $1=$msg;
  var $2=HEAP32[((_stderr)>>2)];
  var $3=$1;
  var $4=_fprintf($2, ((5260576)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=$3,tempInt));
  _exit(2);
  throw "Reached an unreachable!"
  STACKTOP = __stackBase__;
  return;
}
function _NullLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  return;
}
function _NullDottedLine($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  return;
}
function _NullTextL($ctx, $x, $y, $string) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  return;
}
function _NullTextC($ctx, $x, $y, $string) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  return;
}
function _NullTextR($ctx, $x, $y, $string) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  $1=$ctx;
  $2=$x;
  $3=$y;
  $4=$string;
  return;
}
function _NullTextWidth($ctx, $string) {
  var label = 0;
  var $1;
  var $2;
  $1=$ctx;
  $2=$string;
  return 0;
}
function _NullTextHeight($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  return 0;
}
function _NullFilledRectangle($ctx, $x1, $y1, $x2, $y2) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  return;
}
function _NullFilledTriangle($ctx, $x1, $y1, $x2, $y2, $x3, $y3) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$x1;
  $3=$y1;
  $4=$x2;
  $5=$y2;
  $6=$x3;
  $7=$y3;
  return;
}
function _NullArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  return;
}
function _NullDottedArc($ctx, $cx, $cy, $w, $h, $s, $e) {
  var label = 0;
  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $7;
  $1=$ctx;
  $2=$cx;
  $3=$cy;
  $4=$w;
  $5=$h;
  $6=$s;
  $7=$e;
  return;
}
function _NullSetPen($ctx, $col) {
  var label = 0;
  var $1;
  var $2;
  $1=$ctx;
  $2=$col;
  return;
}
function _NullSetFontSize($ctx, $size) {
  var label = 0;
  var $1;
  var $2;
  $1=$ctx;
  $2=$size;
  return;
}
function _NullClose($ctx) {
  var label = 0;
  var $1;
  $1=$ctx;
  return 1;
}
function _NullInit($outContext) {
  var label = 0;
  var $1;
  $1=$outContext;
  var $2=$1;
  var $3=(($2)|0);
  HEAP32[(($3)>>2)]=14;
  var $4=$1;
  var $5=(($4+4)|0);
  HEAP32[(($5)>>2)]=86;
  var $6=$1;
  var $7=(($6+8)|0);
  HEAP32[(($7)>>2)]=58;
  var $8=$1;
  var $9=(($8+12)|0);
  HEAP32[(($9)>>2)]=50;
  var $10=$1;
  var $11=(($10+16)|0);
  HEAP32[(($11)>>2)]=62;
  var $12=$1;
  var $13=(($12+20)|0);
  HEAP32[(($13)>>2)]=4;
  var $14=$1;
  var $15=(($14+24)|0);
  HEAP32[(($15)>>2)]=72;
  var $16=$1;
  var $17=(($16+28)|0);
  HEAP32[(($17)>>2)]=16;
  var $18=$1;
  var $19=(($18+32)|0);
  HEAP32[(($19)>>2)]=46;
  var $20=$1;
  var $21=(($20+40)|0);
  HEAP32[(($21)>>2)]=54;
  var $22=$1;
  var $23=(($22+44)|0);
  HEAP32[(($23)>>2)]=84;
  var $24=$1;
  var $25=(($24+48)|0);
  HEAP32[(($25)>>2)]=78;
  var $26=$1;
  var $27=(($26+52)|0);
  HEAP32[(($27)>>2)]=78;
  var $28=$1;
  var $29=(($28+56)|0);
  HEAP32[(($29)>>2)]=88;
  var $30=$1;
  var $31=(($30+60)|0);
  var $32=$31;
  HEAP32[(($32)>>2)]=94;
  return 1;
}
function _Usage() {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1=_printf(((5261832)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=((5267116)|0),tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _Licence() {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(!(STACKTOP&3)); assert((STACKTOP|0) < (STACK_MAX|0));
  var $1=_printf(((5264348)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert((STACKTOP|0) < (STACK_MAX|0)),HEAP32[((tempInt)>>2)]=0,tempInt));
  STACKTOP = __stackBase__;
  return;
}
function _malloc($bytes) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $mem;
      var $nb;
      var $idx;
      var $smallbits;
      var $b;
      var $p;
      var $F;
      var $b1;
      var $p2;
      var $r;
      var $rsize;
      var $i;
      var $leftbits;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $F3;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F4;
      var $rsize5;
      var $p6;
      var $r7;
      var $dvs;
      var $rsize8;
      var $p9;
      var $r10;
      $1=$bytes;
      var $2=$1;
      var $3=(($2)>>>(0)) <= 244;
      if ($3) { label = 2; break; } else { label = 41; break; }
    case 2: 
      var $5=$1;
      var $6=(($5)>>>(0)) < 11;
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $14 = 16;label = 5; break;
    case 4: 
      var $9=$1;
      var $10=((($9)+(4))|0);
      var $11=((($10)+(7))|0);
      var $12=$11 & -8;
      var $14 = $12;label = 5; break;
    case 5: 
      var $14;
      $nb=$14;
      var $15=$nb;
      var $16=$15 >>> 3;
      $idx=$16;
      var $17=HEAP32[((((5268516)|0))>>2)];
      var $18=$idx;
      var $19=$17 >>> (($18)>>>(0));
      $smallbits=$19;
      var $20=$smallbits;
      var $21=$20 & 3;
      var $22=(($21)|(0))!=0;
      if ($22) { label = 6; break; } else { label = 15; break; }
    case 6: 
      var $24=$smallbits;
      var $25=$24 ^ -1;
      var $26=$25 & 1;
      var $27=$idx;
      var $28=((($27)+($26))|0);
      $idx=$28;
      var $29=$idx;
      var $30=$29 << 1;
      var $31=((((5268556)|0)+($30<<2))|0);
      var $32=$31;
      var $33=$32;
      $b=$33;
      var $34=$b;
      var $35=(($34+8)|0);
      var $36=HEAP32[(($35)>>2)];
      $p=$36;
      var $37=$p;
      var $38=(($37+8)|0);
      var $39=HEAP32[(($38)>>2)];
      $F=$39;
      var $40=$b;
      var $41=$F;
      var $42=(($40)|(0))==(($41)|(0));
      if ($42) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $44=$idx;
      var $45=1 << $44;
      var $46=$45 ^ -1;
      var $47=HEAP32[((((5268516)|0))>>2)];
      var $48=$47 & $46;
      HEAP32[((((5268516)|0))>>2)]=$48;
      label = 14; break;
    case 8: 
      var $50=$F;
      var $51=$50;
      var $52=HEAP32[((((5268532)|0))>>2)];
      var $53=(($51)>>>(0)) >= (($52)>>>(0));
      if ($53) { label = 9; break; } else { var $61 = 0;label = 10; break; }
    case 9: 
      var $55=$F;
      var $56=(($55+12)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=$p;
      var $59=(($57)|(0))==(($58)|(0));
      var $61 = $59;label = 10; break;
    case 10: 
      var $61;
      var $62=(($61)&(1));
      var $63=($62);
      var $64=(($63)|(0))!=0;
      if ($64) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $66=$b;
      var $67=$F;
      var $68=(($67+12)|0);
      HEAP32[(($68)>>2)]=$66;
      var $69=$F;
      var $70=$b;
      var $71=(($70+8)|0);
      HEAP32[(($71)>>2)]=$69;
      label = 13; break;
    case 12: 
      _abort();
      throw "Reached an unreachable!"
    case 13: 
      label = 14; break;
    case 14: 
      var $75=$idx;
      var $76=$75 << 3;
      var $77=$76 | 1;
      var $78=$77 | 2;
      var $79=$p;
      var $80=(($79+4)|0);
      HEAP32[(($80)>>2)]=$78;
      var $81=$p;
      var $82=$81;
      var $83=$idx;
      var $84=$83 << 3;
      var $85=(($82+$84)|0);
      var $86=$85;
      var $87=(($86+4)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=$88 | 1;
      HEAP32[(($87)>>2)]=$89;
      var $90=$p;
      var $91=$90;
      var $92=(($91+8)|0);
      $mem=$92;
      label = 57; break;
    case 15: 
      var $94=$nb;
      var $95=HEAP32[((((5268524)|0))>>2)];
      var $96=(($94)>>>(0)) > (($95)>>>(0));
      if ($96) { label = 16; break; } else { label = 39; break; }
    case 16: 
      var $98=$smallbits;
      var $99=(($98)|(0))!=0;
      if ($99) { label = 17; break; } else { label = 34; break; }
    case 17: 
      var $101=$smallbits;
      var $102=$idx;
      var $103=$101 << $102;
      var $104=$idx;
      var $105=1 << $104;
      var $106=$105 << 1;
      var $107=$idx;
      var $108=1 << $107;
      var $109=$108 << 1;
      var $110=(((-$109))|0);
      var $111=$106 | $110;
      var $112=$103 & $111;
      $leftbits=$112;
      var $113=$leftbits;
      var $114=$leftbits;
      var $115=(((-$114))|0);
      var $116=$113 & $115;
      $leastbit=$116;
      var $117=$leastbit;
      var $118=((($117)-(1))|0);
      $Y=$118;
      var $119=$Y;
      var $120=$119 >>> 12;
      var $121=$120 & 16;
      $K=$121;
      var $122=$K;
      $N=$122;
      var $123=$K;
      var $124=$Y;
      var $125=$124 >>> (($123)>>>(0));
      $Y=$125;
      var $126=$Y;
      var $127=$126 >>> 5;
      var $128=$127 & 8;
      $K=$128;
      var $129=$N;
      var $130=((($129)+($128))|0);
      $N=$130;
      var $131=$K;
      var $132=$Y;
      var $133=$132 >>> (($131)>>>(0));
      $Y=$133;
      var $134=$Y;
      var $135=$134 >>> 2;
      var $136=$135 & 4;
      $K=$136;
      var $137=$N;
      var $138=((($137)+($136))|0);
      $N=$138;
      var $139=$K;
      var $140=$Y;
      var $141=$140 >>> (($139)>>>(0));
      $Y=$141;
      var $142=$Y;
      var $143=$142 >>> 1;
      var $144=$143 & 2;
      $K=$144;
      var $145=$N;
      var $146=((($145)+($144))|0);
      $N=$146;
      var $147=$K;
      var $148=$Y;
      var $149=$148 >>> (($147)>>>(0));
      $Y=$149;
      var $150=$Y;
      var $151=$150 >>> 1;
      var $152=$151 & 1;
      $K=$152;
      var $153=$N;
      var $154=((($153)+($152))|0);
      $N=$154;
      var $155=$K;
      var $156=$Y;
      var $157=$156 >>> (($155)>>>(0));
      $Y=$157;
      var $158=$N;
      var $159=$Y;
      var $160=((($158)+($159))|0);
      $i=$160;
      var $161=$i;
      var $162=$161 << 1;
      var $163=((((5268556)|0)+($162<<2))|0);
      var $164=$163;
      var $165=$164;
      $b1=$165;
      var $166=$b1;
      var $167=(($166+8)|0);
      var $168=HEAP32[(($167)>>2)];
      $p2=$168;
      var $169=$p2;
      var $170=(($169+8)|0);
      var $171=HEAP32[(($170)>>2)];
      $F3=$171;
      var $172=$b1;
      var $173=$F3;
      var $174=(($172)|(0))==(($173)|(0));
      if ($174) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $176=$i;
      var $177=1 << $176;
      var $178=$177 ^ -1;
      var $179=HEAP32[((((5268516)|0))>>2)];
      var $180=$179 & $178;
      HEAP32[((((5268516)|0))>>2)]=$180;
      label = 25; break;
    case 19: 
      var $182=$F3;
      var $183=$182;
      var $184=HEAP32[((((5268532)|0))>>2)];
      var $185=(($183)>>>(0)) >= (($184)>>>(0));
      if ($185) { label = 20; break; } else { var $193 = 0;label = 21; break; }
    case 20: 
      var $187=$F3;
      var $188=(($187+12)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=$p2;
      var $191=(($189)|(0))==(($190)|(0));
      var $193 = $191;label = 21; break;
    case 21: 
      var $193;
      var $194=(($193)&(1));
      var $195=($194);
      var $196=(($195)|(0))!=0;
      if ($196) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $198=$b1;
      var $199=$F3;
      var $200=(($199+12)|0);
      HEAP32[(($200)>>2)]=$198;
      var $201=$F3;
      var $202=$b1;
      var $203=(($202+8)|0);
      HEAP32[(($203)>>2)]=$201;
      label = 24; break;
    case 23: 
      _abort();
      throw "Reached an unreachable!"
    case 24: 
      label = 25; break;
    case 25: 
      var $207=$i;
      var $208=$207 << 3;
      var $209=$nb;
      var $210=((($208)-($209))|0);
      $rsize=$210;
      var $211=$nb;
      var $212=$211 | 1;
      var $213=$212 | 2;
      var $214=$p2;
      var $215=(($214+4)|0);
      HEAP32[(($215)>>2)]=$213;
      var $216=$p2;
      var $217=$216;
      var $218=$nb;
      var $219=(($217+$218)|0);
      var $220=$219;
      $r=$220;
      var $221=$rsize;
      var $222=$221 | 1;
      var $223=$r;
      var $224=(($223+4)|0);
      HEAP32[(($224)>>2)]=$222;
      var $225=$rsize;
      var $226=$r;
      var $227=$226;
      var $228=$rsize;
      var $229=(($227+$228)|0);
      var $230=$229;
      var $231=(($230)|0);
      HEAP32[(($231)>>2)]=$225;
      var $232=HEAP32[((((5268524)|0))>>2)];
      $DVS=$232;
      var $233=$DVS;
      var $234=(($233)|(0))!=0;
      if ($234) { label = 26; break; } else { label = 33; break; }
    case 26: 
      var $236=HEAP32[((((5268536)|0))>>2)];
      $DV=$236;
      var $237=$DVS;
      var $238=$237 >>> 3;
      $I=$238;
      var $239=$I;
      var $240=$239 << 1;
      var $241=((((5268556)|0)+($240<<2))|0);
      var $242=$241;
      var $243=$242;
      $B=$243;
      var $244=$B;
      $F4=$244;
      var $245=HEAP32[((((5268516)|0))>>2)];
      var $246=$I;
      var $247=1 << $246;
      var $248=$245 & $247;
      var $249=(($248)|(0))!=0;
      if ($249) { label = 28; break; } else { label = 27; break; }
    case 27: 
      var $251=$I;
      var $252=1 << $251;
      var $253=HEAP32[((((5268516)|0))>>2)];
      var $254=$253 | $252;
      HEAP32[((((5268516)|0))>>2)]=$254;
      label = 32; break;
    case 28: 
      var $256=$B;
      var $257=(($256+8)|0);
      var $258=HEAP32[(($257)>>2)];
      var $259=$258;
      var $260=HEAP32[((((5268532)|0))>>2)];
      var $261=(($259)>>>(0)) >= (($260)>>>(0));
      var $262=(($261)&(1));
      var $263=($262);
      var $264=(($263)|(0))!=0;
      if ($264) { label = 29; break; } else { label = 30; break; }
    case 29: 
      var $266=$B;
      var $267=(($266+8)|0);
      var $268=HEAP32[(($267)>>2)];
      $F4=$268;
      label = 31; break;
    case 30: 
      _abort();
      throw "Reached an unreachable!"
    case 31: 
      label = 32; break;
    case 32: 
      var $272=$DV;
      var $273=$B;
      var $274=(($273+8)|0);
      HEAP32[(($274)>>2)]=$272;
      var $275=$DV;
      var $276=$F4;
      var $277=(($276+12)|0);
      HEAP32[(($277)>>2)]=$275;
      var $278=$F4;
      var $279=$DV;
      var $280=(($279+8)|0);
      HEAP32[(($280)>>2)]=$278;
      var $281=$B;
      var $282=$DV;
      var $283=(($282+12)|0);
      HEAP32[(($283)>>2)]=$281;
      label = 33; break;
    case 33: 
      var $285=$rsize;
      HEAP32[((((5268524)|0))>>2)]=$285;
      var $286=$r;
      HEAP32[((((5268536)|0))>>2)]=$286;
      var $287=$p2;
      var $288=$287;
      var $289=(($288+8)|0);
      $mem=$289;
      label = 57; break;
    case 34: 
      var $291=HEAP32[((((5268520)|0))>>2)];
      var $292=(($291)|(0))!=0;
      if ($292) { label = 35; break; } else { label = 37; break; }
    case 35: 
      var $294=$nb;
      var $295=_tmalloc_small(5268516, $294);
      $mem=$295;
      var $296=(($295)|(0))!=0;
      if ($296) { label = 36; break; } else { label = 37; break; }
    case 36: 
      label = 57; break;
    case 37: 
      label = 38; break;
    case 38: 
      label = 39; break;
    case 39: 
      label = 40; break;
    case 40: 
      label = 48; break;
    case 41: 
      var $303=$1;
      var $304=(($303)>>>(0)) >= 4294967232;
      if ($304) { label = 42; break; } else { label = 43; break; }
    case 42: 
      $nb=-1;
      label = 47; break;
    case 43: 
      var $307=$1;
      var $308=((($307)+(4))|0);
      var $309=((($308)+(7))|0);
      var $310=$309 & -8;
      $nb=$310;
      var $311=HEAP32[((((5268520)|0))>>2)];
      var $312=(($311)|(0))!=0;
      if ($312) { label = 44; break; } else { label = 46; break; }
    case 44: 
      var $314=$nb;
      var $315=_tmalloc_large(5268516, $314);
      $mem=$315;
      var $316=(($315)|(0))!=0;
      if ($316) { label = 45; break; } else { label = 46; break; }
    case 45: 
      label = 57; break;
    case 46: 
      label = 47; break;
    case 47: 
      label = 48; break;
    case 48: 
      var $321=$nb;
      var $322=HEAP32[((((5268524)|0))>>2)];
      var $323=(($321)>>>(0)) <= (($322)>>>(0));
      if ($323) { label = 49; break; } else { label = 53; break; }
    case 49: 
      var $325=HEAP32[((((5268524)|0))>>2)];
      var $326=$nb;
      var $327=((($325)-($326))|0);
      $rsize5=$327;
      var $328=HEAP32[((((5268536)|0))>>2)];
      $p6=$328;
      var $329=$rsize5;
      var $330=(($329)>>>(0)) >= 16;
      if ($330) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $332=$p6;
      var $333=$332;
      var $334=$nb;
      var $335=(($333+$334)|0);
      var $336=$335;
      HEAP32[((((5268536)|0))>>2)]=$336;
      $r7=$336;
      var $337=$rsize5;
      HEAP32[((((5268524)|0))>>2)]=$337;
      var $338=$rsize5;
      var $339=$338 | 1;
      var $340=$r7;
      var $341=(($340+4)|0);
      HEAP32[(($341)>>2)]=$339;
      var $342=$rsize5;
      var $343=$r7;
      var $344=$343;
      var $345=$rsize5;
      var $346=(($344+$345)|0);
      var $347=$346;
      var $348=(($347)|0);
      HEAP32[(($348)>>2)]=$342;
      var $349=$nb;
      var $350=$349 | 1;
      var $351=$350 | 2;
      var $352=$p6;
      var $353=(($352+4)|0);
      HEAP32[(($353)>>2)]=$351;
      label = 52; break;
    case 51: 
      var $355=HEAP32[((((5268524)|0))>>2)];
      $dvs=$355;
      HEAP32[((((5268524)|0))>>2)]=0;
      HEAP32[((((5268536)|0))>>2)]=0;
      var $356=$dvs;
      var $357=$356 | 1;
      var $358=$357 | 2;
      var $359=$p6;
      var $360=(($359+4)|0);
      HEAP32[(($360)>>2)]=$358;
      var $361=$p6;
      var $362=$361;
      var $363=$dvs;
      var $364=(($362+$363)|0);
      var $365=$364;
      var $366=(($365+4)|0);
      var $367=HEAP32[(($366)>>2)];
      var $368=$367 | 1;
      HEAP32[(($366)>>2)]=$368;
      label = 52; break;
    case 52: 
      var $370=$p6;
      var $371=$370;
      var $372=(($371+8)|0);
      $mem=$372;
      label = 57; break;
    case 53: 
      var $374=$nb;
      var $375=HEAP32[((((5268528)|0))>>2)];
      var $376=(($374)>>>(0)) < (($375)>>>(0));
      if ($376) { label = 54; break; } else { label = 55; break; }
    case 54: 
      var $378=$nb;
      var $379=HEAP32[((((5268528)|0))>>2)];
      var $380=((($379)-($378))|0);
      HEAP32[((((5268528)|0))>>2)]=$380;
      $rsize8=$380;
      var $381=HEAP32[((((5268540)|0))>>2)];
      $p9=$381;
      var $382=$p9;
      var $383=$382;
      var $384=$nb;
      var $385=(($383+$384)|0);
      var $386=$385;
      HEAP32[((((5268540)|0))>>2)]=$386;
      $r10=$386;
      var $387=$rsize8;
      var $388=$387 | 1;
      var $389=$r10;
      var $390=(($389+4)|0);
      HEAP32[(($390)>>2)]=$388;
      var $391=$nb;
      var $392=$391 | 1;
      var $393=$392 | 2;
      var $394=$p9;
      var $395=(($394+4)|0);
      HEAP32[(($395)>>2)]=$393;
      var $396=$p9;
      var $397=$396;
      var $398=(($397+8)|0);
      $mem=$398;
      label = 57; break;
    case 55: 
      label = 56; break;
    case 56: 
      var $401=$nb;
      var $402=_sys_alloc(5268516, $401);
      $mem=$402;
      label = 57; break;
    case 57: 
      var $404=$mem;
      return $404;
    default: assert(0, "bad label: " + label);
  }
}
function _tmalloc_small($m, $nb) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $t;
      var $v;
      var $rsize;
      var $i;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $trem;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F1;
      $1=$m;
      $2=$nb;
      var $3=$1;
      var $4=(($3+4)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=$1;
      var $7=(($6+4)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(((-$8))|0);
      var $10=$5 & $9;
      $leastbit=$10;
      var $11=$leastbit;
      var $12=((($11)-(1))|0);
      $Y=$12;
      var $13=$Y;
      var $14=$13 >>> 12;
      var $15=$14 & 16;
      $K=$15;
      var $16=$K;
      $N=$16;
      var $17=$K;
      var $18=$Y;
      var $19=$18 >>> (($17)>>>(0));
      $Y=$19;
      var $20=$Y;
      var $21=$20 >>> 5;
      var $22=$21 & 8;
      $K=$22;
      var $23=$N;
      var $24=((($23)+($22))|0);
      $N=$24;
      var $25=$K;
      var $26=$Y;
      var $27=$26 >>> (($25)>>>(0));
      $Y=$27;
      var $28=$Y;
      var $29=$28 >>> 2;
      var $30=$29 & 4;
      $K=$30;
      var $31=$N;
      var $32=((($31)+($30))|0);
      $N=$32;
      var $33=$K;
      var $34=$Y;
      var $35=$34 >>> (($33)>>>(0));
      $Y=$35;
      var $36=$Y;
      var $37=$36 >>> 1;
      var $38=$37 & 2;
      $K=$38;
      var $39=$N;
      var $40=((($39)+($38))|0);
      $N=$40;
      var $41=$K;
      var $42=$Y;
      var $43=$42 >>> (($41)>>>(0));
      $Y=$43;
      var $44=$Y;
      var $45=$44 >>> 1;
      var $46=$45 & 1;
      $K=$46;
      var $47=$N;
      var $48=((($47)+($46))|0);
      $N=$48;
      var $49=$K;
      var $50=$Y;
      var $51=$50 >>> (($49)>>>(0));
      $Y=$51;
      var $52=$N;
      var $53=$Y;
      var $54=((($52)+($53))|0);
      $i=$54;
      var $55=$i;
      var $56=$1;
      var $57=(($56+304)|0);
      var $58=(($57+($55<<2))|0);
      var $59=HEAP32[(($58)>>2)];
      $t=$59;
      $v=$59;
      var $60=$t;
      var $61=(($60+4)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=$62 & -8;
      var $64=$2;
      var $65=((($63)-($64))|0);
      $rsize=$65;
      label = 2; break;
    case 2: 
      var $67=$t;
      var $68=(($67+16)|0);
      var $69=(($68)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=(($70)|(0))!=0;
      if ($71) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $73=$t;
      var $74=(($73+16)|0);
      var $75=(($74)|0);
      var $76=HEAP32[(($75)>>2)];
      var $83 = $76;label = 5; break;
    case 4: 
      var $78=$t;
      var $79=(($78+16)|0);
      var $80=(($79+4)|0);
      var $81=HEAP32[(($80)>>2)];
      var $83 = $81;label = 5; break;
    case 5: 
      var $83;
      $t=$83;
      var $84=(($83)|(0))!=0;
      if ($84) { label = 6; break; } else { label = 9; break; }
    case 6: 
      var $86=$t;
      var $87=(($86+4)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=$88 & -8;
      var $90=$2;
      var $91=((($89)-($90))|0);
      $trem=$91;
      var $92=$trem;
      var $93=$rsize;
      var $94=(($92)>>>(0)) < (($93)>>>(0));
      if ($94) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $96=$trem;
      $rsize=$96;
      var $97=$t;
      $v=$97;
      label = 8; break;
    case 8: 
      label = 2; break;
    case 9: 
      var $100=$v;
      var $101=$100;
      var $102=$1;
      var $103=(($102+16)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=(($101)>>>(0)) >= (($104)>>>(0));
      var $106=(($105)&(1));
      var $107=($106);
      var $108=(($107)|(0))!=0;
      if ($108) { label = 10; break; } else { label = 72; break; }
    case 10: 
      var $110=$v;
      var $111=$110;
      var $112=$2;
      var $113=(($111+$112)|0);
      var $114=$113;
      $r=$114;
      var $115=$v;
      var $116=$115;
      var $117=$r;
      var $118=$117;
      var $119=(($116)>>>(0)) < (($118)>>>(0));
      var $120=(($119)&(1));
      var $121=($120);
      var $122=(($121)|(0))!=0;
      if ($122) { label = 11; break; } else { label = 71; break; }
    case 11: 
      var $124=$v;
      var $125=(($124+24)|0);
      var $126=HEAP32[(($125)>>2)];
      $XP=$126;
      var $127=$v;
      var $128=(($127+12)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=$v;
      var $131=(($129)|(0))!=(($130)|(0));
      if ($131) { label = 12; break; } else { label = 19; break; }
    case 12: 
      var $133=$v;
      var $134=(($133+8)|0);
      var $135=HEAP32[(($134)>>2)];
      $F=$135;
      var $136=$v;
      var $137=(($136+12)|0);
      var $138=HEAP32[(($137)>>2)];
      $R=$138;
      var $139=$F;
      var $140=$139;
      var $141=$1;
      var $142=(($141+16)|0);
      var $143=HEAP32[(($142)>>2)];
      var $144=(($140)>>>(0)) >= (($143)>>>(0));
      if ($144) { label = 13; break; } else { var $158 = 0;label = 15; break; }
    case 13: 
      var $146=$F;
      var $147=(($146+12)|0);
      var $148=HEAP32[(($147)>>2)];
      var $149=$v;
      var $150=(($148)|(0))==(($149)|(0));
      if ($150) { label = 14; break; } else { var $158 = 0;label = 15; break; }
    case 14: 
      var $152=$R;
      var $153=(($152+8)|0);
      var $154=HEAP32[(($153)>>2)];
      var $155=$v;
      var $156=(($154)|(0))==(($155)|(0));
      var $158 = $156;label = 15; break;
    case 15: 
      var $158;
      var $159=(($158)&(1));
      var $160=($159);
      var $161=(($160)|(0))!=0;
      if ($161) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $163=$R;
      var $164=$F;
      var $165=(($164+12)|0);
      HEAP32[(($165)>>2)]=$163;
      var $166=$F;
      var $167=$R;
      var $168=(($167+8)|0);
      HEAP32[(($168)>>2)]=$166;
      label = 18; break;
    case 17: 
      _abort();
      throw "Reached an unreachable!"
    case 18: 
      label = 31; break;
    case 19: 
      var $172=$v;
      var $173=(($172+16)|0);
      var $174=(($173+4)|0);
      $RP=$174;
      var $175=HEAP32[(($174)>>2)];
      $R=$175;
      var $176=(($175)|(0))!=0;
      if ($176) { label = 21; break; } else { label = 20; break; }
    case 20: 
      var $178=$v;
      var $179=(($178+16)|0);
      var $180=(($179)|0);
      $RP=$180;
      var $181=HEAP32[(($180)>>2)];
      $R=$181;
      var $182=(($181)|(0))!=0;
      if ($182) { label = 21; break; } else { label = 30; break; }
    case 21: 
      label = 22; break;
    case 22: 
      var $185=$R;
      var $186=(($185+16)|0);
      var $187=(($186+4)|0);
      $CP=$187;
      var $188=HEAP32[(($187)>>2)];
      var $189=(($188)|(0))!=0;
      if ($189) { var $197 = 1;label = 24; break; } else { label = 23; break; }
    case 23: 
      var $191=$R;
      var $192=(($191+16)|0);
      var $193=(($192)|0);
      $CP=$193;
      var $194=HEAP32[(($193)>>2)];
      var $195=(($194)|(0))!=0;
      var $197 = $195;label = 24; break;
    case 24: 
      var $197;
      if ($197) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $199=$CP;
      $RP=$199;
      var $200=HEAP32[(($199)>>2)];
      $R=$200;
      label = 22; break;
    case 26: 
      var $202=$RP;
      var $203=$202;
      var $204=$1;
      var $205=(($204+16)|0);
      var $206=HEAP32[(($205)>>2)];
      var $207=(($203)>>>(0)) >= (($206)>>>(0));
      var $208=(($207)&(1));
      var $209=($208);
      var $210=(($209)|(0))!=0;
      if ($210) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $212=$RP;
      HEAP32[(($212)>>2)]=0;
      label = 29; break;
    case 28: 
      _abort();
      throw "Reached an unreachable!"
    case 29: 
      label = 30; break;
    case 30: 
      label = 31; break;
    case 31: 
      var $217=$XP;
      var $218=(($217)|(0))!=0;
      if ($218) { label = 32; break; } else { label = 59; break; }
    case 32: 
      var $220=$v;
      var $221=(($220+28)|0);
      var $222=HEAP32[(($221)>>2)];
      var $223=$1;
      var $224=(($223+304)|0);
      var $225=(($224+($222<<2))|0);
      $H=$225;
      var $226=$v;
      var $227=$H;
      var $228=HEAP32[(($227)>>2)];
      var $229=(($226)|(0))==(($228)|(0));
      if ($229) { label = 33; break; } else { label = 36; break; }
    case 33: 
      var $231=$R;
      var $232=$H;
      HEAP32[(($232)>>2)]=$231;
      var $233=(($231)|(0))==0;
      if ($233) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $235=$v;
      var $236=(($235+28)|0);
      var $237=HEAP32[(($236)>>2)];
      var $238=1 << $237;
      var $239=$238 ^ -1;
      var $240=$1;
      var $241=(($240+4)|0);
      var $242=HEAP32[(($241)>>2)];
      var $243=$242 & $239;
      HEAP32[(($241)>>2)]=$243;
      label = 35; break;
    case 35: 
      label = 43; break;
    case 36: 
      var $246=$XP;
      var $247=$246;
      var $248=$1;
      var $249=(($248+16)|0);
      var $250=HEAP32[(($249)>>2)];
      var $251=(($247)>>>(0)) >= (($250)>>>(0));
      var $252=(($251)&(1));
      var $253=($252);
      var $254=(($253)|(0))!=0;
      if ($254) { label = 37; break; } else { label = 41; break; }
    case 37: 
      var $256=$XP;
      var $257=(($256+16)|0);
      var $258=(($257)|0);
      var $259=HEAP32[(($258)>>2)];
      var $260=$v;
      var $261=(($259)|(0))==(($260)|(0));
      if ($261) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $263=$R;
      var $264=$XP;
      var $265=(($264+16)|0);
      var $266=(($265)|0);
      HEAP32[(($266)>>2)]=$263;
      label = 40; break;
    case 39: 
      var $268=$R;
      var $269=$XP;
      var $270=(($269+16)|0);
      var $271=(($270+4)|0);
      HEAP32[(($271)>>2)]=$268;
      label = 40; break;
    case 40: 
      label = 42; break;
    case 41: 
      _abort();
      throw "Reached an unreachable!"
    case 42: 
      label = 43; break;
    case 43: 
      var $276=$R;
      var $277=(($276)|(0))!=0;
      if ($277) { label = 44; break; } else { label = 58; break; }
    case 44: 
      var $279=$R;
      var $280=$279;
      var $281=$1;
      var $282=(($281+16)|0);
      var $283=HEAP32[(($282)>>2)];
      var $284=(($280)>>>(0)) >= (($283)>>>(0));
      var $285=(($284)&(1));
      var $286=($285);
      var $287=(($286)|(0))!=0;
      if ($287) { label = 45; break; } else { label = 56; break; }
    case 45: 
      var $289=$XP;
      var $290=$R;
      var $291=(($290+24)|0);
      HEAP32[(($291)>>2)]=$289;
      var $292=$v;
      var $293=(($292+16)|0);
      var $294=(($293)|0);
      var $295=HEAP32[(($294)>>2)];
      $C0=$295;
      var $296=(($295)|(0))!=0;
      if ($296) { label = 46; break; } else { label = 50; break; }
    case 46: 
      var $298=$C0;
      var $299=$298;
      var $300=$1;
      var $301=(($300+16)|0);
      var $302=HEAP32[(($301)>>2)];
      var $303=(($299)>>>(0)) >= (($302)>>>(0));
      var $304=(($303)&(1));
      var $305=($304);
      var $306=(($305)|(0))!=0;
      if ($306) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $308=$C0;
      var $309=$R;
      var $310=(($309+16)|0);
      var $311=(($310)|0);
      HEAP32[(($311)>>2)]=$308;
      var $312=$R;
      var $313=$C0;
      var $314=(($313+24)|0);
      HEAP32[(($314)>>2)]=$312;
      label = 49; break;
    case 48: 
      _abort();
      throw "Reached an unreachable!"
    case 49: 
      label = 50; break;
    case 50: 
      var $318=$v;
      var $319=(($318+16)|0);
      var $320=(($319+4)|0);
      var $321=HEAP32[(($320)>>2)];
      $C1=$321;
      var $322=(($321)|(0))!=0;
      if ($322) { label = 51; break; } else { label = 55; break; }
    case 51: 
      var $324=$C1;
      var $325=$324;
      var $326=$1;
      var $327=(($326+16)|0);
      var $328=HEAP32[(($327)>>2)];
      var $329=(($325)>>>(0)) >= (($328)>>>(0));
      var $330=(($329)&(1));
      var $331=($330);
      var $332=(($331)|(0))!=0;
      if ($332) { label = 52; break; } else { label = 53; break; }
    case 52: 
      var $334=$C1;
      var $335=$R;
      var $336=(($335+16)|0);
      var $337=(($336+4)|0);
      HEAP32[(($337)>>2)]=$334;
      var $338=$R;
      var $339=$C1;
      var $340=(($339+24)|0);
      HEAP32[(($340)>>2)]=$338;
      label = 54; break;
    case 53: 
      _abort();
      throw "Reached an unreachable!"
    case 54: 
      label = 55; break;
    case 55: 
      label = 57; break;
    case 56: 
      _abort();
      throw "Reached an unreachable!"
    case 57: 
      label = 58; break;
    case 58: 
      label = 59; break;
    case 59: 
      var $348=$rsize;
      var $349=(($348)>>>(0)) < 16;
      if ($349) { label = 60; break; } else { label = 61; break; }
    case 60: 
      var $351=$rsize;
      var $352=$2;
      var $353=((($351)+($352))|0);
      var $354=$353 | 1;
      var $355=$354 | 2;
      var $356=$v;
      var $357=(($356+4)|0);
      HEAP32[(($357)>>2)]=$355;
      var $358=$v;
      var $359=$358;
      var $360=$rsize;
      var $361=$2;
      var $362=((($360)+($361))|0);
      var $363=(($359+$362)|0);
      var $364=$363;
      var $365=(($364+4)|0);
      var $366=HEAP32[(($365)>>2)];
      var $367=$366 | 1;
      HEAP32[(($365)>>2)]=$367;
      label = 70; break;
    case 61: 
      var $369=$2;
      var $370=$369 | 1;
      var $371=$370 | 2;
      var $372=$v;
      var $373=(($372+4)|0);
      HEAP32[(($373)>>2)]=$371;
      var $374=$rsize;
      var $375=$374 | 1;
      var $376=$r;
      var $377=(($376+4)|0);
      HEAP32[(($377)>>2)]=$375;
      var $378=$rsize;
      var $379=$r;
      var $380=$379;
      var $381=$rsize;
      var $382=(($380+$381)|0);
      var $383=$382;
      var $384=(($383)|0);
      HEAP32[(($384)>>2)]=$378;
      var $385=$1;
      var $386=(($385+8)|0);
      var $387=HEAP32[(($386)>>2)];
      $DVS=$387;
      var $388=$DVS;
      var $389=(($388)|(0))!=0;
      if ($389) { label = 62; break; } else { label = 69; break; }
    case 62: 
      var $391=$1;
      var $392=(($391+20)|0);
      var $393=HEAP32[(($392)>>2)];
      $DV=$393;
      var $394=$DVS;
      var $395=$394 >>> 3;
      $I=$395;
      var $396=$I;
      var $397=$396 << 1;
      var $398=$1;
      var $399=(($398+40)|0);
      var $400=(($399+($397<<2))|0);
      var $401=$400;
      var $402=$401;
      $B=$402;
      var $403=$B;
      $F1=$403;
      var $404=$1;
      var $405=(($404)|0);
      var $406=HEAP32[(($405)>>2)];
      var $407=$I;
      var $408=1 << $407;
      var $409=$406 & $408;
      var $410=(($409)|(0))!=0;
      if ($410) { label = 64; break; } else { label = 63; break; }
    case 63: 
      var $412=$I;
      var $413=1 << $412;
      var $414=$1;
      var $415=(($414)|0);
      var $416=HEAP32[(($415)>>2)];
      var $417=$416 | $413;
      HEAP32[(($415)>>2)]=$417;
      label = 68; break;
    case 64: 
      var $419=$B;
      var $420=(($419+8)|0);
      var $421=HEAP32[(($420)>>2)];
      var $422=$421;
      var $423=$1;
      var $424=(($423+16)|0);
      var $425=HEAP32[(($424)>>2)];
      var $426=(($422)>>>(0)) >= (($425)>>>(0));
      var $427=(($426)&(1));
      var $428=($427);
      var $429=(($428)|(0))!=0;
      if ($429) { label = 65; break; } else { label = 66; break; }
    case 65: 
      var $431=$B;
      var $432=(($431+8)|0);
      var $433=HEAP32[(($432)>>2)];
      $F1=$433;
      label = 67; break;
    case 66: 
      _abort();
      throw "Reached an unreachable!"
    case 67: 
      label = 68; break;
    case 68: 
      var $437=$DV;
      var $438=$B;
      var $439=(($438+8)|0);
      HEAP32[(($439)>>2)]=$437;
      var $440=$DV;
      var $441=$F1;
      var $442=(($441+12)|0);
      HEAP32[(($442)>>2)]=$440;
      var $443=$F1;
      var $444=$DV;
      var $445=(($444+8)|0);
      HEAP32[(($445)>>2)]=$443;
      var $446=$B;
      var $447=$DV;
      var $448=(($447+12)|0);
      HEAP32[(($448)>>2)]=$446;
      label = 69; break;
    case 69: 
      var $450=$rsize;
      var $451=$1;
      var $452=(($451+8)|0);
      HEAP32[(($452)>>2)]=$450;
      var $453=$r;
      var $454=$1;
      var $455=(($454+20)|0);
      HEAP32[(($455)>>2)]=$453;
      label = 70; break;
    case 70: 
      var $457=$v;
      var $458=$457;
      var $459=(($458+8)|0);
      return $459;
    case 71: 
      label = 72; break;
    case 72: 
      _abort();
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + label);
  }
}
function _tmalloc_large($m, $nb) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $v;
      var $rsize;
      var $t;
      var $idx;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $sizebits;
      var $rst;
      var $rt;
      var $trem;
      var $leftbits;
      var $i;
      var $leastbit;
      var $Y1;
      var $K2;
      var $N3;
      var $trem4;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I;
      var $B;
      var $F5;
      var $TP;
      var $H6;
      var $I7;
      var $X8;
      var $Y9;
      var $N10;
      var $K11;
      var $T;
      var $K12;
      var $C;
      var $F13;
      $2=$m;
      $3=$nb;
      $v=0;
      var $4=$3;
      var $5=(((-$4))|0);
      $rsize=$5;
      var $6=$3;
      var $7=$6 >>> 8;
      $X=$7;
      var $8=$X;
      var $9=(($8)|(0))==0;
      if ($9) { label = 2; break; } else { label = 3; break; }
    case 2: 
      $idx=0;
      label = 7; break;
    case 3: 
      var $12=$X;
      var $13=(($12)>>>(0)) > 65535;
      if ($13) { label = 4; break; } else { label = 5; break; }
    case 4: 
      $idx=31;
      label = 6; break;
    case 5: 
      var $16=$X;
      $Y=$16;
      var $17=$Y;
      var $18=((($17)-(256))|0);
      var $19=$18 >>> 16;
      var $20=$19 & 8;
      $N=$20;
      var $21=$N;
      var $22=$Y;
      var $23=$22 << $21;
      $Y=$23;
      var $24=((($23)-(4096))|0);
      var $25=$24 >>> 16;
      var $26=$25 & 4;
      $K=$26;
      var $27=$K;
      var $28=$N;
      var $29=((($28)+($27))|0);
      $N=$29;
      var $30=$K;
      var $31=$Y;
      var $32=$31 << $30;
      $Y=$32;
      var $33=((($32)-(16384))|0);
      var $34=$33 >>> 16;
      var $35=$34 & 2;
      $K=$35;
      var $36=$N;
      var $37=((($36)+($35))|0);
      $N=$37;
      var $38=$N;
      var $39=(((14)-($38))|0);
      var $40=$K;
      var $41=$Y;
      var $42=$41 << $40;
      $Y=$42;
      var $43=$42 >>> 15;
      var $44=((($39)+($43))|0);
      $K=$44;
      var $45=$K;
      var $46=$45 << 1;
      var $47=$3;
      var $48=$K;
      var $49=((($48)+(7))|0);
      var $50=$47 >>> (($49)>>>(0));
      var $51=$50 & 1;
      var $52=((($46)+($51))|0);
      $idx=$52;
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $55=$idx;
      var $56=$2;
      var $57=(($56+304)|0);
      var $58=(($57+($55<<2))|0);
      var $59=HEAP32[(($58)>>2)];
      $t=$59;
      var $60=(($59)|(0))!=0;
      if ($60) { label = 8; break; } else { label = 23; break; }
    case 8: 
      var $62=$3;
      var $63=$idx;
      var $64=(($63)|(0))==31;
      if ($64) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $73 = 0;label = 11; break;
    case 10: 
      var $67=$idx;
      var $68=$67 >>> 1;
      var $69=((($68)+(8))|0);
      var $70=((($69)-(2))|0);
      var $71=(((31)-($70))|0);
      var $73 = $71;label = 11; break;
    case 11: 
      var $73;
      var $74=$62 << $73;
      $sizebits=$74;
      $rst=0;
      label = 12; break;
    case 12: 
      var $76=$t;
      var $77=(($76+4)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=$78 & -8;
      var $80=$3;
      var $81=((($79)-($80))|0);
      $trem=$81;
      var $82=$trem;
      var $83=$rsize;
      var $84=(($82)>>>(0)) < (($83)>>>(0));
      if ($84) { label = 13; break; } else { label = 16; break; }
    case 13: 
      var $86=$t;
      $v=$86;
      var $87=$trem;
      $rsize=$87;
      var $88=(($87)|(0))==0;
      if ($88) { label = 14; break; } else { label = 15; break; }
    case 14: 
      label = 22; break;
    case 15: 
      label = 16; break;
    case 16: 
      var $92=$t;
      var $93=(($92+16)|0);
      var $94=(($93+4)|0);
      var $95=HEAP32[(($94)>>2)];
      $rt=$95;
      var $96=$sizebits;
      var $97=$96 >>> 31;
      var $98=$97 & 1;
      var $99=$t;
      var $100=(($99+16)|0);
      var $101=(($100+($98<<2))|0);
      var $102=HEAP32[(($101)>>2)];
      $t=$102;
      var $103=$rt;
      var $104=(($103)|(0))!=0;
      if ($104) { label = 17; break; } else { label = 19; break; }
    case 17: 
      var $106=$rt;
      var $107=$t;
      var $108=(($106)|(0))!=(($107)|(0));
      if ($108) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $110=$rt;
      $rst=$110;
      label = 19; break;
    case 19: 
      var $112=$t;
      var $113=(($112)|(0))==0;
      if ($113) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $115=$rst;
      $t=$115;
      label = 22; break;
    case 21: 
      var $117=$sizebits;
      var $118=$117 << 1;
      $sizebits=$118;
      label = 12; break;
    case 22: 
      label = 23; break;
    case 23: 
      var $121=$t;
      var $122=(($121)|(0))==0;
      if ($122) { label = 24; break; } else { label = 28; break; }
    case 24: 
      var $124=$v;
      var $125=(($124)|(0))==0;
      if ($125) { label = 25; break; } else { label = 28; break; }
    case 25: 
      var $127=$idx;
      var $128=1 << $127;
      var $129=$128 << 1;
      var $130=$idx;
      var $131=1 << $130;
      var $132=$131 << 1;
      var $133=(((-$132))|0);
      var $134=$129 | $133;
      var $135=$2;
      var $136=(($135+4)|0);
      var $137=HEAP32[(($136)>>2)];
      var $138=$134 & $137;
      $leftbits=$138;
      var $139=$leftbits;
      var $140=(($139)|(0))!=0;
      if ($140) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $142=$leftbits;
      var $143=$leftbits;
      var $144=(((-$143))|0);
      var $145=$142 & $144;
      $leastbit=$145;
      var $146=$leastbit;
      var $147=((($146)-(1))|0);
      $Y1=$147;
      var $148=$Y1;
      var $149=$148 >>> 12;
      var $150=$149 & 16;
      $K2=$150;
      var $151=$K2;
      $N3=$151;
      var $152=$K2;
      var $153=$Y1;
      var $154=$153 >>> (($152)>>>(0));
      $Y1=$154;
      var $155=$Y1;
      var $156=$155 >>> 5;
      var $157=$156 & 8;
      $K2=$157;
      var $158=$N3;
      var $159=((($158)+($157))|0);
      $N3=$159;
      var $160=$K2;
      var $161=$Y1;
      var $162=$161 >>> (($160)>>>(0));
      $Y1=$162;
      var $163=$Y1;
      var $164=$163 >>> 2;
      var $165=$164 & 4;
      $K2=$165;
      var $166=$N3;
      var $167=((($166)+($165))|0);
      $N3=$167;
      var $168=$K2;
      var $169=$Y1;
      var $170=$169 >>> (($168)>>>(0));
      $Y1=$170;
      var $171=$Y1;
      var $172=$171 >>> 1;
      var $173=$172 & 2;
      $K2=$173;
      var $174=$N3;
      var $175=((($174)+($173))|0);
      $N3=$175;
      var $176=$K2;
      var $177=$Y1;
      var $178=$177 >>> (($176)>>>(0));
      $Y1=$178;
      var $179=$Y1;
      var $180=$179 >>> 1;
      var $181=$180 & 1;
      $K2=$181;
      var $182=$N3;
      var $183=((($182)+($181))|0);
      $N3=$183;
      var $184=$K2;
      var $185=$Y1;
      var $186=$185 >>> (($184)>>>(0));
      $Y1=$186;
      var $187=$N3;
      var $188=$Y1;
      var $189=((($187)+($188))|0);
      $i=$189;
      var $190=$i;
      var $191=$2;
      var $192=(($191+304)|0);
      var $193=(($192+($190<<2))|0);
      var $194=HEAP32[(($193)>>2)];
      $t=$194;
      label = 27; break;
    case 27: 
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      var $198=$t;
      var $199=(($198)|(0))!=0;
      if ($199) { label = 30; break; } else { label = 36; break; }
    case 30: 
      var $201=$t;
      var $202=(($201+4)|0);
      var $203=HEAP32[(($202)>>2)];
      var $204=$203 & -8;
      var $205=$3;
      var $206=((($204)-($205))|0);
      $trem4=$206;
      var $207=$trem4;
      var $208=$rsize;
      var $209=(($207)>>>(0)) < (($208)>>>(0));
      if ($209) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $211=$trem4;
      $rsize=$211;
      var $212=$t;
      $v=$212;
      label = 32; break;
    case 32: 
      var $214=$t;
      var $215=(($214+16)|0);
      var $216=(($215)|0);
      var $217=HEAP32[(($216)>>2)];
      var $218=(($217)|(0))!=0;
      if ($218) { label = 33; break; } else { label = 34; break; }
    case 33: 
      var $220=$t;
      var $221=(($220+16)|0);
      var $222=(($221)|0);
      var $223=HEAP32[(($222)>>2)];
      var $230 = $223;label = 35; break;
    case 34: 
      var $225=$t;
      var $226=(($225+16)|0);
      var $227=(($226+4)|0);
      var $228=HEAP32[(($227)>>2)];
      var $230 = $228;label = 35; break;
    case 35: 
      var $230;
      $t=$230;
      label = 29; break;
    case 36: 
      var $232=$v;
      var $233=(($232)|(0))!=0;
      if ($233) { label = 37; break; } else { label = 129; break; }
    case 37: 
      var $235=$rsize;
      var $236=$2;
      var $237=(($236+8)|0);
      var $238=HEAP32[(($237)>>2)];
      var $239=$3;
      var $240=((($238)-($239))|0);
      var $241=(($235)>>>(0)) < (($240)>>>(0));
      if ($241) { label = 38; break; } else { label = 129; break; }
    case 38: 
      var $243=$v;
      var $244=$243;
      var $245=$2;
      var $246=(($245+16)|0);
      var $247=HEAP32[(($246)>>2)];
      var $248=(($244)>>>(0)) >= (($247)>>>(0));
      var $249=(($248)&(1));
      var $250=($249);
      var $251=(($250)|(0))!=0;
      if ($251) { label = 39; break; } else { label = 128; break; }
    case 39: 
      var $253=$v;
      var $254=$253;
      var $255=$3;
      var $256=(($254+$255)|0);
      var $257=$256;
      $r=$257;
      var $258=$v;
      var $259=$258;
      var $260=$r;
      var $261=$260;
      var $262=(($259)>>>(0)) < (($261)>>>(0));
      var $263=(($262)&(1));
      var $264=($263);
      var $265=(($264)|(0))!=0;
      if ($265) { label = 40; break; } else { label = 127; break; }
    case 40: 
      var $267=$v;
      var $268=(($267+24)|0);
      var $269=HEAP32[(($268)>>2)];
      $XP=$269;
      var $270=$v;
      var $271=(($270+12)|0);
      var $272=HEAP32[(($271)>>2)];
      var $273=$v;
      var $274=(($272)|(0))!=(($273)|(0));
      if ($274) { label = 41; break; } else { label = 48; break; }
    case 41: 
      var $276=$v;
      var $277=(($276+8)|0);
      var $278=HEAP32[(($277)>>2)];
      $F=$278;
      var $279=$v;
      var $280=(($279+12)|0);
      var $281=HEAP32[(($280)>>2)];
      $R=$281;
      var $282=$F;
      var $283=$282;
      var $284=$2;
      var $285=(($284+16)|0);
      var $286=HEAP32[(($285)>>2)];
      var $287=(($283)>>>(0)) >= (($286)>>>(0));
      if ($287) { label = 42; break; } else { var $301 = 0;label = 44; break; }
    case 42: 
      var $289=$F;
      var $290=(($289+12)|0);
      var $291=HEAP32[(($290)>>2)];
      var $292=$v;
      var $293=(($291)|(0))==(($292)|(0));
      if ($293) { label = 43; break; } else { var $301 = 0;label = 44; break; }
    case 43: 
      var $295=$R;
      var $296=(($295+8)|0);
      var $297=HEAP32[(($296)>>2)];
      var $298=$v;
      var $299=(($297)|(0))==(($298)|(0));
      var $301 = $299;label = 44; break;
    case 44: 
      var $301;
      var $302=(($301)&(1));
      var $303=($302);
      var $304=(($303)|(0))!=0;
      if ($304) { label = 45; break; } else { label = 46; break; }
    case 45: 
      var $306=$R;
      var $307=$F;
      var $308=(($307+12)|0);
      HEAP32[(($308)>>2)]=$306;
      var $309=$F;
      var $310=$R;
      var $311=(($310+8)|0);
      HEAP32[(($311)>>2)]=$309;
      label = 47; break;
    case 46: 
      _abort();
      throw "Reached an unreachable!"
    case 47: 
      label = 60; break;
    case 48: 
      var $315=$v;
      var $316=(($315+16)|0);
      var $317=(($316+4)|0);
      $RP=$317;
      var $318=HEAP32[(($317)>>2)];
      $R=$318;
      var $319=(($318)|(0))!=0;
      if ($319) { label = 50; break; } else { label = 49; break; }
    case 49: 
      var $321=$v;
      var $322=(($321+16)|0);
      var $323=(($322)|0);
      $RP=$323;
      var $324=HEAP32[(($323)>>2)];
      $R=$324;
      var $325=(($324)|(0))!=0;
      if ($325) { label = 50; break; } else { label = 59; break; }
    case 50: 
      label = 51; break;
    case 51: 
      var $328=$R;
      var $329=(($328+16)|0);
      var $330=(($329+4)|0);
      $CP=$330;
      var $331=HEAP32[(($330)>>2)];
      var $332=(($331)|(0))!=0;
      if ($332) { var $340 = 1;label = 53; break; } else { label = 52; break; }
    case 52: 
      var $334=$R;
      var $335=(($334+16)|0);
      var $336=(($335)|0);
      $CP=$336;
      var $337=HEAP32[(($336)>>2)];
      var $338=(($337)|(0))!=0;
      var $340 = $338;label = 53; break;
    case 53: 
      var $340;
      if ($340) { label = 54; break; } else { label = 55; break; }
    case 54: 
      var $342=$CP;
      $RP=$342;
      var $343=HEAP32[(($342)>>2)];
      $R=$343;
      label = 51; break;
    case 55: 
      var $345=$RP;
      var $346=$345;
      var $347=$2;
      var $348=(($347+16)|0);
      var $349=HEAP32[(($348)>>2)];
      var $350=(($346)>>>(0)) >= (($349)>>>(0));
      var $351=(($350)&(1));
      var $352=($351);
      var $353=(($352)|(0))!=0;
      if ($353) { label = 56; break; } else { label = 57; break; }
    case 56: 
      var $355=$RP;
      HEAP32[(($355)>>2)]=0;
      label = 58; break;
    case 57: 
      _abort();
      throw "Reached an unreachable!"
    case 58: 
      label = 59; break;
    case 59: 
      label = 60; break;
    case 60: 
      var $360=$XP;
      var $361=(($360)|(0))!=0;
      if ($361) { label = 61; break; } else { label = 88; break; }
    case 61: 
      var $363=$v;
      var $364=(($363+28)|0);
      var $365=HEAP32[(($364)>>2)];
      var $366=$2;
      var $367=(($366+304)|0);
      var $368=(($367+($365<<2))|0);
      $H=$368;
      var $369=$v;
      var $370=$H;
      var $371=HEAP32[(($370)>>2)];
      var $372=(($369)|(0))==(($371)|(0));
      if ($372) { label = 62; break; } else { label = 65; break; }
    case 62: 
      var $374=$R;
      var $375=$H;
      HEAP32[(($375)>>2)]=$374;
      var $376=(($374)|(0))==0;
      if ($376) { label = 63; break; } else { label = 64; break; }
    case 63: 
      var $378=$v;
      var $379=(($378+28)|0);
      var $380=HEAP32[(($379)>>2)];
      var $381=1 << $380;
      var $382=$381 ^ -1;
      var $383=$2;
      var $384=(($383+4)|0);
      var $385=HEAP32[(($384)>>2)];
      var $386=$385 & $382;
      HEAP32[(($384)>>2)]=$386;
      label = 64; break;
    case 64: 
      label = 72; break;
    case 65: 
      var $389=$XP;
      var $390=$389;
      var $391=$2;
      var $392=(($391+16)|0);
      var $393=HEAP32[(($392)>>2)];
      var $394=(($390)>>>(0)) >= (($393)>>>(0));
      var $395=(($394)&(1));
      var $396=($395);
      var $397=(($396)|(0))!=0;
      if ($397) { label = 66; break; } else { label = 70; break; }
    case 66: 
      var $399=$XP;
      var $400=(($399+16)|0);
      var $401=(($400)|0);
      var $402=HEAP32[(($401)>>2)];
      var $403=$v;
      var $404=(($402)|(0))==(($403)|(0));
      if ($404) { label = 67; break; } else { label = 68; break; }
    case 67: 
      var $406=$R;
      var $407=$XP;
      var $408=(($407+16)|0);
      var $409=(($408)|0);
      HEAP32[(($409)>>2)]=$406;
      label = 69; break;
    case 68: 
      var $411=$R;
      var $412=$XP;
      var $413=(($412+16)|0);
      var $414=(($413+4)|0);
      HEAP32[(($414)>>2)]=$411;
      label = 69; break;
    case 69: 
      label = 71; break;
    case 70: 
      _abort();
      throw "Reached an unreachable!"
    case 71: 
      label = 72; break;
    case 72: 
      var $419=$R;
      var $420=(($419)|(0))!=0;
      if ($420) { label = 73; break; } else { label = 87; break; }
    case 73: 
      var $422=$R;
      var $423=$422;
      var $424=$2;
      var $425=(($424+16)|0);
      var $426=HEAP32[(($425)>>2)];
      var $427=(($423)>>>(0)) >= (($426)>>>(0));
      var $428=(($427)&(1));
      var $429=($428);
      var $430=(($429)|(0))!=0;
      if ($430) { label = 74; break; } else { label = 85; break; }
    case 74: 
      var $432=$XP;
      var $433=$R;
      var $434=(($433+24)|0);
      HEAP32[(($434)>>2)]=$432;
      var $435=$v;
      var $436=(($435+16)|0);
      var $437=(($436)|0);
      var $438=HEAP32[(($437)>>2)];
      $C0=$438;
      var $439=(($438)|(0))!=0;
      if ($439) { label = 75; break; } else { label = 79; break; }
    case 75: 
      var $441=$C0;
      var $442=$441;
      var $443=$2;
      var $444=(($443+16)|0);
      var $445=HEAP32[(($444)>>2)];
      var $446=(($442)>>>(0)) >= (($445)>>>(0));
      var $447=(($446)&(1));
      var $448=($447);
      var $449=(($448)|(0))!=0;
      if ($449) { label = 76; break; } else { label = 77; break; }
    case 76: 
      var $451=$C0;
      var $452=$R;
      var $453=(($452+16)|0);
      var $454=(($453)|0);
      HEAP32[(($454)>>2)]=$451;
      var $455=$R;
      var $456=$C0;
      var $457=(($456+24)|0);
      HEAP32[(($457)>>2)]=$455;
      label = 78; break;
    case 77: 
      _abort();
      throw "Reached an unreachable!"
    case 78: 
      label = 79; break;
    case 79: 
      var $461=$v;
      var $462=(($461+16)|0);
      var $463=(($462+4)|0);
      var $464=HEAP32[(($463)>>2)];
      $C1=$464;
      var $465=(($464)|(0))!=0;
      if ($465) { label = 80; break; } else { label = 84; break; }
    case 80: 
      var $467=$C1;
      var $468=$467;
      var $469=$2;
      var $470=(($469+16)|0);
      var $471=HEAP32[(($470)>>2)];
      var $472=(($468)>>>(0)) >= (($471)>>>(0));
      var $473=(($472)&(1));
      var $474=($473);
      var $475=(($474)|(0))!=0;
      if ($475) { label = 81; break; } else { label = 82; break; }
    case 81: 
      var $477=$C1;
      var $478=$R;
      var $479=(($478+16)|0);
      var $480=(($479+4)|0);
      HEAP32[(($480)>>2)]=$477;
      var $481=$R;
      var $482=$C1;
      var $483=(($482+24)|0);
      HEAP32[(($483)>>2)]=$481;
      label = 83; break;
    case 82: 
      _abort();
      throw "Reached an unreachable!"
    case 83: 
      label = 84; break;
    case 84: 
      label = 86; break;
    case 85: 
      _abort();
      throw "Reached an unreachable!"
    case 86: 
      label = 87; break;
    case 87: 
      label = 88; break;
    case 88: 
      var $491=$rsize;
      var $492=(($491)>>>(0)) < 16;
      if ($492) { label = 89; break; } else { label = 90; break; }
    case 89: 
      var $494=$rsize;
      var $495=$3;
      var $496=((($494)+($495))|0);
      var $497=$496 | 1;
      var $498=$497 | 2;
      var $499=$v;
      var $500=(($499+4)|0);
      HEAP32[(($500)>>2)]=$498;
      var $501=$v;
      var $502=$501;
      var $503=$rsize;
      var $504=$3;
      var $505=((($503)+($504))|0);
      var $506=(($502+$505)|0);
      var $507=$506;
      var $508=(($507+4)|0);
      var $509=HEAP32[(($508)>>2)];
      var $510=$509 | 1;
      HEAP32[(($508)>>2)]=$510;
      label = 126; break;
    case 90: 
      var $512=$3;
      var $513=$512 | 1;
      var $514=$513 | 2;
      var $515=$v;
      var $516=(($515+4)|0);
      HEAP32[(($516)>>2)]=$514;
      var $517=$rsize;
      var $518=$517 | 1;
      var $519=$r;
      var $520=(($519+4)|0);
      HEAP32[(($520)>>2)]=$518;
      var $521=$rsize;
      var $522=$r;
      var $523=$522;
      var $524=$rsize;
      var $525=(($523+$524)|0);
      var $526=$525;
      var $527=(($526)|0);
      HEAP32[(($527)>>2)]=$521;
      var $528=$rsize;
      var $529=$528 >>> 3;
      var $530=(($529)>>>(0)) < 32;
      if ($530) { label = 91; break; } else { label = 98; break; }
    case 91: 
      var $532=$rsize;
      var $533=$532 >>> 3;
      $I=$533;
      var $534=$I;
      var $535=$534 << 1;
      var $536=$2;
      var $537=(($536+40)|0);
      var $538=(($537+($535<<2))|0);
      var $539=$538;
      var $540=$539;
      $B=$540;
      var $541=$B;
      $F5=$541;
      var $542=$2;
      var $543=(($542)|0);
      var $544=HEAP32[(($543)>>2)];
      var $545=$I;
      var $546=1 << $545;
      var $547=$544 & $546;
      var $548=(($547)|(0))!=0;
      if ($548) { label = 93; break; } else { label = 92; break; }
    case 92: 
      var $550=$I;
      var $551=1 << $550;
      var $552=$2;
      var $553=(($552)|0);
      var $554=HEAP32[(($553)>>2)];
      var $555=$554 | $551;
      HEAP32[(($553)>>2)]=$555;
      label = 97; break;
    case 93: 
      var $557=$B;
      var $558=(($557+8)|0);
      var $559=HEAP32[(($558)>>2)];
      var $560=$559;
      var $561=$2;
      var $562=(($561+16)|0);
      var $563=HEAP32[(($562)>>2)];
      var $564=(($560)>>>(0)) >= (($563)>>>(0));
      var $565=(($564)&(1));
      var $566=($565);
      var $567=(($566)|(0))!=0;
      if ($567) { label = 94; break; } else { label = 95; break; }
    case 94: 
      var $569=$B;
      var $570=(($569+8)|0);
      var $571=HEAP32[(($570)>>2)];
      $F5=$571;
      label = 96; break;
    case 95: 
      _abort();
      throw "Reached an unreachable!"
    case 96: 
      label = 97; break;
    case 97: 
      var $575=$r;
      var $576=$B;
      var $577=(($576+8)|0);
      HEAP32[(($577)>>2)]=$575;
      var $578=$r;
      var $579=$F5;
      var $580=(($579+12)|0);
      HEAP32[(($580)>>2)]=$578;
      var $581=$F5;
      var $582=$r;
      var $583=(($582+8)|0);
      HEAP32[(($583)>>2)]=$581;
      var $584=$B;
      var $585=$r;
      var $586=(($585+12)|0);
      HEAP32[(($586)>>2)]=$584;
      label = 125; break;
    case 98: 
      var $588=$r;
      var $589=$588;
      $TP=$589;
      var $590=$rsize;
      var $591=$590 >>> 8;
      $X8=$591;
      var $592=$X8;
      var $593=(($592)|(0))==0;
      if ($593) { label = 99; break; } else { label = 100; break; }
    case 99: 
      $I7=0;
      label = 104; break;
    case 100: 
      var $596=$X8;
      var $597=(($596)>>>(0)) > 65535;
      if ($597) { label = 101; break; } else { label = 102; break; }
    case 101: 
      $I7=31;
      label = 103; break;
    case 102: 
      var $600=$X8;
      $Y9=$600;
      var $601=$Y9;
      var $602=((($601)-(256))|0);
      var $603=$602 >>> 16;
      var $604=$603 & 8;
      $N10=$604;
      var $605=$N10;
      var $606=$Y9;
      var $607=$606 << $605;
      $Y9=$607;
      var $608=((($607)-(4096))|0);
      var $609=$608 >>> 16;
      var $610=$609 & 4;
      $K11=$610;
      var $611=$K11;
      var $612=$N10;
      var $613=((($612)+($611))|0);
      $N10=$613;
      var $614=$K11;
      var $615=$Y9;
      var $616=$615 << $614;
      $Y9=$616;
      var $617=((($616)-(16384))|0);
      var $618=$617 >>> 16;
      var $619=$618 & 2;
      $K11=$619;
      var $620=$N10;
      var $621=((($620)+($619))|0);
      $N10=$621;
      var $622=$N10;
      var $623=(((14)-($622))|0);
      var $624=$K11;
      var $625=$Y9;
      var $626=$625 << $624;
      $Y9=$626;
      var $627=$626 >>> 15;
      var $628=((($623)+($627))|0);
      $K11=$628;
      var $629=$K11;
      var $630=$629 << 1;
      var $631=$rsize;
      var $632=$K11;
      var $633=((($632)+(7))|0);
      var $634=$631 >>> (($633)>>>(0));
      var $635=$634 & 1;
      var $636=((($630)+($635))|0);
      $I7=$636;
      label = 103; break;
    case 103: 
      label = 104; break;
    case 104: 
      var $639=$I7;
      var $640=$2;
      var $641=(($640+304)|0);
      var $642=(($641+($639<<2))|0);
      $H6=$642;
      var $643=$I7;
      var $644=$TP;
      var $645=(($644+28)|0);
      HEAP32[(($645)>>2)]=$643;
      var $646=$TP;
      var $647=(($646+16)|0);
      var $648=(($647+4)|0);
      HEAP32[(($648)>>2)]=0;
      var $649=$TP;
      var $650=(($649+16)|0);
      var $651=(($650)|0);
      HEAP32[(($651)>>2)]=0;
      var $652=$2;
      var $653=(($652+4)|0);
      var $654=HEAP32[(($653)>>2)];
      var $655=$I7;
      var $656=1 << $655;
      var $657=$654 & $656;
      var $658=(($657)|(0))!=0;
      if ($658) { label = 106; break; } else { label = 105; break; }
    case 105: 
      var $660=$I7;
      var $661=1 << $660;
      var $662=$2;
      var $663=(($662+4)|0);
      var $664=HEAP32[(($663)>>2)];
      var $665=$664 | $661;
      HEAP32[(($663)>>2)]=$665;
      var $666=$TP;
      var $667=$H6;
      HEAP32[(($667)>>2)]=$666;
      var $668=$H6;
      var $669=$668;
      var $670=$TP;
      var $671=(($670+24)|0);
      HEAP32[(($671)>>2)]=$669;
      var $672=$TP;
      var $673=$TP;
      var $674=(($673+12)|0);
      HEAP32[(($674)>>2)]=$672;
      var $675=$TP;
      var $676=(($675+8)|0);
      HEAP32[(($676)>>2)]=$672;
      label = 124; break;
    case 106: 
      var $678=$H6;
      var $679=HEAP32[(($678)>>2)];
      $T=$679;
      var $680=$rsize;
      var $681=$I7;
      var $682=(($681)|(0))==31;
      if ($682) { label = 107; break; } else { label = 108; break; }
    case 107: 
      var $691 = 0;label = 109; break;
    case 108: 
      var $685=$I7;
      var $686=$685 >>> 1;
      var $687=((($686)+(8))|0);
      var $688=((($687)-(2))|0);
      var $689=(((31)-($688))|0);
      var $691 = $689;label = 109; break;
    case 109: 
      var $691;
      var $692=$680 << $691;
      $K12=$692;
      label = 110; break;
    case 110: 
      var $694=$T;
      var $695=(($694+4)|0);
      var $696=HEAP32[(($695)>>2)];
      var $697=$696 & -8;
      var $698=$rsize;
      var $699=(($697)|(0))!=(($698)|(0));
      if ($699) { label = 111; break; } else { label = 117; break; }
    case 111: 
      var $701=$K12;
      var $702=$701 >>> 31;
      var $703=$702 & 1;
      var $704=$T;
      var $705=(($704+16)|0);
      var $706=(($705+($703<<2))|0);
      $C=$706;
      var $707=$K12;
      var $708=$707 << 1;
      $K12=$708;
      var $709=$C;
      var $710=HEAP32[(($709)>>2)];
      var $711=(($710)|(0))!=0;
      if ($711) { label = 112; break; } else { label = 113; break; }
    case 112: 
      var $713=$C;
      var $714=HEAP32[(($713)>>2)];
      $T=$714;
      label = 116; break;
    case 113: 
      var $716=$C;
      var $717=$716;
      var $718=$2;
      var $719=(($718+16)|0);
      var $720=HEAP32[(($719)>>2)];
      var $721=(($717)>>>(0)) >= (($720)>>>(0));
      var $722=(($721)&(1));
      var $723=($722);
      var $724=(($723)|(0))!=0;
      if ($724) { label = 114; break; } else { label = 115; break; }
    case 114: 
      var $726=$TP;
      var $727=$C;
      HEAP32[(($727)>>2)]=$726;
      var $728=$T;
      var $729=$TP;
      var $730=(($729+24)|0);
      HEAP32[(($730)>>2)]=$728;
      var $731=$TP;
      var $732=$TP;
      var $733=(($732+12)|0);
      HEAP32[(($733)>>2)]=$731;
      var $734=$TP;
      var $735=(($734+8)|0);
      HEAP32[(($735)>>2)]=$731;
      label = 123; break;
    case 115: 
      _abort();
      throw "Reached an unreachable!"
    case 116: 
      label = 122; break;
    case 117: 
      var $739=$T;
      var $740=(($739+8)|0);
      var $741=HEAP32[(($740)>>2)];
      $F13=$741;
      var $742=$T;
      var $743=$742;
      var $744=$2;
      var $745=(($744+16)|0);
      var $746=HEAP32[(($745)>>2)];
      var $747=(($743)>>>(0)) >= (($746)>>>(0));
      if ($747) { label = 118; break; } else { var $756 = 0;label = 119; break; }
    case 118: 
      var $749=$F13;
      var $750=$749;
      var $751=$2;
      var $752=(($751+16)|0);
      var $753=HEAP32[(($752)>>2)];
      var $754=(($750)>>>(0)) >= (($753)>>>(0));
      var $756 = $754;label = 119; break;
    case 119: 
      var $756;
      var $757=(($756)&(1));
      var $758=($757);
      var $759=(($758)|(0))!=0;
      if ($759) { label = 120; break; } else { label = 121; break; }
    case 120: 
      var $761=$TP;
      var $762=$F13;
      var $763=(($762+12)|0);
      HEAP32[(($763)>>2)]=$761;
      var $764=$T;
      var $765=(($764+8)|0);
      HEAP32[(($765)>>2)]=$761;
      var $766=$F13;
      var $767=$TP;
      var $768=(($767+8)|0);
      HEAP32[(($768)>>2)]=$766;
      var $769=$T;
      var $770=$TP;
      var $771=(($770+12)|0);
      HEAP32[(($771)>>2)]=$769;
      var $772=$TP;
      var $773=(($772+24)|0);
      HEAP32[(($773)>>2)]=0;
      label = 123; break;
    case 121: 
      _abort();
      throw "Reached an unreachable!"
    case 122: 
      label = 110; break;
    case 123: 
      label = 124; break;
    case 124: 
      label = 125; break;
    case 125: 
      label = 126; break;
    case 126: 
      var $780=$v;
      var $781=$780;
      var $782=(($781+8)|0);
      $1=$782;
      label = 130; break;
    case 127: 
      label = 128; break;
    case 128: 
      _abort();
      throw "Reached an unreachable!"
    case 129: 
      $1=0;
      label = 130; break;
    case 130: 
      var $787=$1;
      return $787;
    default: assert(0, "bad label: " + label);
  }
}
function _sys_alloc($m, $nb) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tbase;
      var $tsize;
      var $mmap_flag;
      var $asize;
      var $mem;
      var $fp;
      var $br;
      var $ssize;
      var $ss;
      var $base;
      var $fp1;
      var $esize;
      var $end;
      var $br2;
      var $end3;
      var $ssize4;
      var $mn;
      var $sp;
      var $oldbase;
      var $rsize;
      var $p;
      var $r;
      $2=$m;
      $3=$nb;
      $tbase=-1;
      $tsize=0;
      $mmap_flag=0;
      var $4=HEAP32[((((5249920)|0))>>2)];
      var $5=(($4)|(0))!=0;
      if ($5) { var $10 = 1;label = 3; break; } else { label = 2; break; }
    case 2: 
      var $7=_init_mparams();
      var $8=(($7)|(0))!=0;
      var $10 = $8;label = 3; break;
    case 3: 
      var $10;
      var $11=(($10)&(1));
      var $12=$2;
      var $13=(($12+444)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$14 & 0;
      var $16=(($15)|(0))!=0;
      if ($16) { label = 4; break; } else { label = 9; break; }
    case 4: 
      var $18=$3;
      var $19=HEAP32[((((5249932)|0))>>2)];
      var $20=(($18)>>>(0)) >= (($19)>>>(0));
      if ($20) { label = 5; break; } else { label = 9; break; }
    case 5: 
      var $22=$2;
      var $23=(($22+12)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($24)|(0))!=0;
      if ($25) { label = 6; break; } else { label = 9; break; }
    case 6: 
      var $27=$2;
      var $28=$3;
      var $29=_mmap_alloc($27, $28);
      $mem=$29;
      var $30=$mem;
      var $31=(($30)|(0))!=0;
      if ($31) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $33=$mem;
      $1=$33;
      label = 103; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $36=$3;
      var $37=((($36)+(48))|0);
      var $38=HEAP32[((((5249928)|0))>>2)];
      var $39=((($38)-(1))|0);
      var $40=((($37)+($39))|0);
      var $41=HEAP32[((((5249928)|0))>>2)];
      var $42=((($41)-(1))|0);
      var $43=$42 ^ -1;
      var $44=$40 & $43;
      $asize=$44;
      var $45=$asize;
      var $46=$3;
      var $47=(($45)>>>(0)) <= (($46)>>>(0));
      if ($47) { label = 10; break; } else { label = 11; break; }
    case 10: 
      $1=0;
      label = 103; break;
    case 11: 
      var $50=$2;
      var $51=(($50+440)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=(($52)|(0))!=0;
      if ($53) { label = 12; break; } else { label = 16; break; }
    case 12: 
      var $55=$2;
      var $56=(($55+432)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=$asize;
      var $59=((($57)+($58))|0);
      $fp=$59;
      var $60=$fp;
      var $61=$2;
      var $62=(($61+432)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=(($60)>>>(0)) <= (($63)>>>(0));
      if ($64) { label = 14; break; } else { label = 13; break; }
    case 13: 
      var $66=$fp;
      var $67=$2;
      var $68=(($67+440)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=(($66)>>>(0)) > (($69)>>>(0));
      if ($70) { label = 14; break; } else { label = 15; break; }
    case 14: 
      $1=0;
      label = 103; break;
    case 15: 
      label = 16; break;
    case 16: 
      var $74=$2;
      var $75=(($74+444)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=$76 & 4;
      var $78=(($77)|(0))!=0;
      if ($78) { label = 53; break; } else { label = 17; break; }
    case 17: 
      $br=-1;
      var $80=$asize;
      $ssize=$80;
      var $81=$2;
      var $82=(($81+24)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=(($83)|(0))==0;
      if ($84) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $94 = 0;label = 20; break;
    case 19: 
      var $87=$2;
      var $88=$2;
      var $89=(($88+24)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$90;
      var $92=_segment_holding($87, $91);
      var $94 = $92;label = 20; break;
    case 20: 
      var $94;
      $ss=$94;
      var $95=$ss;
      var $96=(($95)|(0))==0;
      if ($96) { label = 21; break; } else { label = 33; break; }
    case 21: 
      var $98=_sbrk(0);
      $base=$98;
      var $99=$base;
      var $100=(($99)|(0))!=-1;
      if ($100) { label = 22; break; } else { label = 32; break; }
    case 22: 
      var $102=$base;
      var $103=$102;
      var $104=HEAP32[((((5249924)|0))>>2)];
      var $105=((($104)-(1))|0);
      var $106=$103 & $105;
      var $107=(($106)|(0))==0;
      if ($107) { label = 24; break; } else { label = 23; break; }
    case 23: 
      var $109=$base;
      var $110=$109;
      var $111=HEAP32[((((5249924)|0))>>2)];
      var $112=((($111)-(1))|0);
      var $113=((($110)+($112))|0);
      var $114=HEAP32[((((5249924)|0))>>2)];
      var $115=((($114)-(1))|0);
      var $116=$115 ^ -1;
      var $117=$113 & $116;
      var $118=$base;
      var $119=$118;
      var $120=((($117)-($119))|0);
      var $121=$ssize;
      var $122=((($121)+($120))|0);
      $ssize=$122;
      label = 24; break;
    case 24: 
      var $124=$2;
      var $125=(($124+432)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=$ssize;
      var $128=((($126)+($127))|0);
      $fp1=$128;
      var $129=$ssize;
      var $130=$3;
      var $131=(($129)>>>(0)) > (($130)>>>(0));
      if ($131) { label = 25; break; } else { label = 31; break; }
    case 25: 
      var $133=$ssize;
      var $134=(($133)>>>(0)) < 2147483647;
      if ($134) { label = 26; break; } else { label = 31; break; }
    case 26: 
      var $136=$2;
      var $137=(($136+440)|0);
      var $138=HEAP32[(($137)>>2)];
      var $139=(($138)|(0))==0;
      if ($139) { label = 29; break; } else { label = 27; break; }
    case 27: 
      var $141=$fp1;
      var $142=$2;
      var $143=(($142+432)|0);
      var $144=HEAP32[(($143)>>2)];
      var $145=(($141)>>>(0)) > (($144)>>>(0));
      if ($145) { label = 28; break; } else { label = 31; break; }
    case 28: 
      var $147=$fp1;
      var $148=$2;
      var $149=(($148+440)|0);
      var $150=HEAP32[(($149)>>2)];
      var $151=(($147)>>>(0)) <= (($150)>>>(0));
      if ($151) { label = 29; break; } else { label = 31; break; }
    case 29: 
      var $153=$ssize;
      var $154=_sbrk($153);
      $br=$154;
      var $155=$base;
      var $156=(($154)|(0))==(($155)|(0));
      if ($156) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $158=$base;
      $tbase=$158;
      var $159=$ssize;
      $tsize=$159;
      label = 31; break;
    case 31: 
      label = 32; break;
    case 32: 
      label = 37; break;
    case 33: 
      var $163=$3;
      var $164=$2;
      var $165=(($164+12)|0);
      var $166=HEAP32[(($165)>>2)];
      var $167=((($163)-($166))|0);
      var $168=((($167)+(48))|0);
      var $169=HEAP32[((((5249928)|0))>>2)];
      var $170=((($169)-(1))|0);
      var $171=((($168)+($170))|0);
      var $172=HEAP32[((((5249928)|0))>>2)];
      var $173=((($172)-(1))|0);
      var $174=$173 ^ -1;
      var $175=$171 & $174;
      $ssize=$175;
      var $176=$ssize;
      var $177=(($176)>>>(0)) < 2147483647;
      if ($177) { label = 34; break; } else { label = 36; break; }
    case 34: 
      var $179=$ssize;
      var $180=_sbrk($179);
      $br=$180;
      var $181=$ss;
      var $182=(($181)|0);
      var $183=HEAP32[(($182)>>2)];
      var $184=$ss;
      var $185=(($184+4)|0);
      var $186=HEAP32[(($185)>>2)];
      var $187=(($183+$186)|0);
      var $188=(($180)|(0))==(($187)|(0));
      if ($188) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $190=$br;
      $tbase=$190;
      var $191=$ssize;
      $tsize=$191;
      label = 36; break;
    case 36: 
      label = 37; break;
    case 37: 
      var $194=$tbase;
      var $195=(($194)|(0))==-1;
      if ($195) { label = 38; break; } else { label = 52; break; }
    case 38: 
      var $197=$br;
      var $198=(($197)|(0))!=-1;
      if ($198) { label = 39; break; } else { label = 48; break; }
    case 39: 
      var $200=$ssize;
      var $201=(($200)>>>(0)) < 2147483647;
      if ($201) { label = 40; break; } else { label = 47; break; }
    case 40: 
      var $203=$ssize;
      var $204=$3;
      var $205=((($204)+(48))|0);
      var $206=(($203)>>>(0)) < (($205)>>>(0));
      if ($206) { label = 41; break; } else { label = 47; break; }
    case 41: 
      var $208=$3;
      var $209=((($208)+(48))|0);
      var $210=$ssize;
      var $211=((($209)-($210))|0);
      var $212=HEAP32[((((5249928)|0))>>2)];
      var $213=((($212)-(1))|0);
      var $214=((($211)+($213))|0);
      var $215=HEAP32[((((5249928)|0))>>2)];
      var $216=((($215)-(1))|0);
      var $217=$216 ^ -1;
      var $218=$214 & $217;
      $esize=$218;
      var $219=$esize;
      var $220=(($219)>>>(0)) < 2147483647;
      if ($220) { label = 42; break; } else { label = 46; break; }
    case 42: 
      var $222=$esize;
      var $223=_sbrk($222);
      $end=$223;
      var $224=$end;
      var $225=(($224)|(0))!=-1;
      if ($225) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $227=$esize;
      var $228=$ssize;
      var $229=((($228)+($227))|0);
      $ssize=$229;
      label = 45; break;
    case 44: 
      var $231=$ssize;
      var $232=(((-$231))|0);
      var $233=_sbrk($232);
      $br=-1;
      label = 45; break;
    case 45: 
      label = 46; break;
    case 46: 
      label = 47; break;
    case 47: 
      label = 48; break;
    case 48: 
      var $238=$br;
      var $239=(($238)|(0))!=-1;
      if ($239) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $241=$br;
      $tbase=$241;
      var $242=$ssize;
      $tsize=$242;
      label = 51; break;
    case 50: 
      var $244=$2;
      var $245=(($244+444)|0);
      var $246=HEAP32[(($245)>>2)];
      var $247=$246 | 4;
      HEAP32[(($245)>>2)]=$247;
      label = 51; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      var $251=$tbase;
      var $252=(($251)|(0))==-1;
      if ($252) { label = 54; break; } else { label = 63; break; }
    case 54: 
      var $254=$asize;
      var $255=(($254)>>>(0)) < 2147483647;
      if ($255) { label = 55; break; } else { label = 62; break; }
    case 55: 
      $br2=-1;
      $end3=-1;
      var $257=$asize;
      var $258=_sbrk($257);
      $br2=$258;
      var $259=_sbrk(0);
      $end3=$259;
      var $260=$br2;
      var $261=(($260)|(0))!=-1;
      if ($261) { label = 56; break; } else { label = 61; break; }
    case 56: 
      var $263=$end3;
      var $264=(($263)|(0))!=-1;
      if ($264) { label = 57; break; } else { label = 61; break; }
    case 57: 
      var $266=$br2;
      var $267=$end3;
      var $268=(($266)>>>(0)) < (($267)>>>(0));
      if ($268) { label = 58; break; } else { label = 61; break; }
    case 58: 
      var $270=$end3;
      var $271=$br2;
      var $272=$270;
      var $273=$271;
      var $274=((($272)-($273))|0);
      $ssize4=$274;
      var $275=$ssize4;
      var $276=$3;
      var $277=((($276)+(40))|0);
      var $278=(($275)>>>(0)) > (($277)>>>(0));
      if ($278) { label = 59; break; } else { label = 60; break; }
    case 59: 
      var $280=$br2;
      $tbase=$280;
      var $281=$ssize4;
      $tsize=$281;
      label = 60; break;
    case 60: 
      label = 61; break;
    case 61: 
      label = 62; break;
    case 62: 
      label = 63; break;
    case 63: 
      var $286=$tbase;
      var $287=(($286)|(0))!=-1;
      if ($287) { label = 64; break; } else { label = 102; break; }
    case 64: 
      var $289=$tsize;
      var $290=$2;
      var $291=(($290+432)|0);
      var $292=HEAP32[(($291)>>2)];
      var $293=((($292)+($289))|0);
      HEAP32[(($291)>>2)]=$293;
      var $294=$2;
      var $295=(($294+436)|0);
      var $296=HEAP32[(($295)>>2)];
      var $297=(($293)>>>(0)) > (($296)>>>(0));
      if ($297) { label = 65; break; } else { label = 66; break; }
    case 65: 
      var $299=$2;
      var $300=(($299+432)|0);
      var $301=HEAP32[(($300)>>2)];
      var $302=$2;
      var $303=(($302+436)|0);
      HEAP32[(($303)>>2)]=$301;
      label = 66; break;
    case 66: 
      var $305=$2;
      var $306=(($305+24)|0);
      var $307=HEAP32[(($306)>>2)];
      var $308=(($307)|(0))!=0;
      if ($308) { label = 74; break; } else { label = 67; break; }
    case 67: 
      var $310=$2;
      var $311=(($310+16)|0);
      var $312=HEAP32[(($311)>>2)];
      var $313=(($312)|(0))==0;
      if ($313) { label = 69; break; } else { label = 68; break; }
    case 68: 
      var $315=$tbase;
      var $316=$2;
      var $317=(($316+16)|0);
      var $318=HEAP32[(($317)>>2)];
      var $319=(($315)>>>(0)) < (($318)>>>(0));
      if ($319) { label = 69; break; } else { label = 70; break; }
    case 69: 
      var $321=$tbase;
      var $322=$2;
      var $323=(($322+16)|0);
      HEAP32[(($323)>>2)]=$321;
      label = 70; break;
    case 70: 
      var $325=$tbase;
      var $326=$2;
      var $327=(($326+448)|0);
      var $328=(($327)|0);
      HEAP32[(($328)>>2)]=$325;
      var $329=$tsize;
      var $330=$2;
      var $331=(($330+448)|0);
      var $332=(($331+4)|0);
      HEAP32[(($332)>>2)]=$329;
      var $333=$mmap_flag;
      var $334=$2;
      var $335=(($334+448)|0);
      var $336=(($335+12)|0);
      HEAP32[(($336)>>2)]=$333;
      var $337=HEAP32[((((5249920)|0))>>2)];
      var $338=$2;
      var $339=(($338+36)|0);
      HEAP32[(($339)>>2)]=$337;
      var $340=$2;
      var $341=(($340+32)|0);
      HEAP32[(($341)>>2)]=-1;
      var $342=$2;
      _init_bins($342);
      var $343=$2;
      var $344=(($343)|(0))==5268516;
      if ($344) { label = 71; break; } else { label = 72; break; }
    case 71: 
      var $346=$2;
      var $347=$tbase;
      var $348=$347;
      var $349=$tsize;
      var $350=((($349)-(40))|0);
      _init_top($346, $348, $350);
      label = 73; break;
    case 72: 
      var $352=$2;
      var $353=$352;
      var $354=((($353)-(8))|0);
      var $355=$354;
      var $356=$355;
      var $357=$2;
      var $358=$357;
      var $359=((($358)-(8))|0);
      var $360=$359;
      var $361=(($360+4)|0);
      var $362=HEAP32[(($361)>>2)];
      var $363=$362 & -8;
      var $364=(($356+$363)|0);
      var $365=$364;
      $mn=$365;
      var $366=$2;
      var $367=$mn;
      var $368=$tbase;
      var $369=$tsize;
      var $370=(($368+$369)|0);
      var $371=$mn;
      var $372=$371;
      var $373=$370;
      var $374=$372;
      var $375=((($373)-($374))|0);
      var $376=((($375)-(40))|0);
      _init_top($366, $367, $376);
      label = 73; break;
    case 73: 
      label = 99; break;
    case 74: 
      var $379=$2;
      var $380=(($379+448)|0);
      $sp=$380;
      label = 75; break;
    case 75: 
      var $382=$sp;
      var $383=(($382)|(0))!=0;
      if ($383) { label = 76; break; } else { var $395 = 0;label = 77; break; }
    case 76: 
      var $385=$tbase;
      var $386=$sp;
      var $387=(($386)|0);
      var $388=HEAP32[(($387)>>2)];
      var $389=$sp;
      var $390=(($389+4)|0);
      var $391=HEAP32[(($390)>>2)];
      var $392=(($388+$391)|0);
      var $393=(($385)|(0))!=(($392)|(0));
      var $395 = $393;label = 77; break;
    case 77: 
      var $395;
      if ($395) { label = 78; break; } else { label = 79; break; }
    case 78: 
      var $397=$sp;
      var $398=(($397+8)|0);
      var $399=HEAP32[(($398)>>2)];
      $sp=$399;
      label = 75; break;
    case 79: 
      var $401=$sp;
      var $402=(($401)|(0))!=0;
      if ($402) { label = 80; break; } else { label = 85; break; }
    case 80: 
      var $404=$sp;
      var $405=(($404+12)|0);
      var $406=HEAP32[(($405)>>2)];
      var $407=$406 & 8;
      var $408=(($407)|(0))!=0;
      if ($408) { label = 85; break; } else { label = 81; break; }
    case 81: 
      var $410=$sp;
      var $411=(($410+12)|0);
      var $412=HEAP32[(($411)>>2)];
      var $413=$412 & 0;
      var $414=$mmap_flag;
      var $415=(($413)|(0))==(($414)|(0));
      if ($415) { label = 82; break; } else { label = 85; break; }
    case 82: 
      var $417=$2;
      var $418=(($417+24)|0);
      var $419=HEAP32[(($418)>>2)];
      var $420=$419;
      var $421=$sp;
      var $422=(($421)|0);
      var $423=HEAP32[(($422)>>2)];
      var $424=(($420)>>>(0)) >= (($423)>>>(0));
      if ($424) { label = 83; break; } else { label = 85; break; }
    case 83: 
      var $426=$2;
      var $427=(($426+24)|0);
      var $428=HEAP32[(($427)>>2)];
      var $429=$428;
      var $430=$sp;
      var $431=(($430)|0);
      var $432=HEAP32[(($431)>>2)];
      var $433=$sp;
      var $434=(($433+4)|0);
      var $435=HEAP32[(($434)>>2)];
      var $436=(($432+$435)|0);
      var $437=(($429)>>>(0)) < (($436)>>>(0));
      if ($437) { label = 84; break; } else { label = 85; break; }
    case 84: 
      var $439=$tsize;
      var $440=$sp;
      var $441=(($440+4)|0);
      var $442=HEAP32[(($441)>>2)];
      var $443=((($442)+($439))|0);
      HEAP32[(($441)>>2)]=$443;
      var $444=$2;
      var $445=$2;
      var $446=(($445+24)|0);
      var $447=HEAP32[(($446)>>2)];
      var $448=$2;
      var $449=(($448+12)|0);
      var $450=HEAP32[(($449)>>2)];
      var $451=$tsize;
      var $452=((($450)+($451))|0);
      _init_top($444, $447, $452);
      label = 98; break;
    case 85: 
      var $454=$tbase;
      var $455=$2;
      var $456=(($455+16)|0);
      var $457=HEAP32[(($456)>>2)];
      var $458=(($454)>>>(0)) < (($457)>>>(0));
      if ($458) { label = 86; break; } else { label = 87; break; }
    case 86: 
      var $460=$tbase;
      var $461=$2;
      var $462=(($461+16)|0);
      HEAP32[(($462)>>2)]=$460;
      label = 87; break;
    case 87: 
      var $464=$2;
      var $465=(($464+448)|0);
      $sp=$465;
      label = 88; break;
    case 88: 
      var $467=$sp;
      var $468=(($467)|(0))!=0;
      if ($468) { label = 89; break; } else { var $478 = 0;label = 90; break; }
    case 89: 
      var $470=$sp;
      var $471=(($470)|0);
      var $472=HEAP32[(($471)>>2)];
      var $473=$tbase;
      var $474=$tsize;
      var $475=(($473+$474)|0);
      var $476=(($472)|(0))!=(($475)|(0));
      var $478 = $476;label = 90; break;
    case 90: 
      var $478;
      if ($478) { label = 91; break; } else { label = 92; break; }
    case 91: 
      var $480=$sp;
      var $481=(($480+8)|0);
      var $482=HEAP32[(($481)>>2)];
      $sp=$482;
      label = 88; break;
    case 92: 
      var $484=$sp;
      var $485=(($484)|(0))!=0;
      if ($485) { label = 93; break; } else { label = 96; break; }
    case 93: 
      var $487=$sp;
      var $488=(($487+12)|0);
      var $489=HEAP32[(($488)>>2)];
      var $490=$489 & 8;
      var $491=(($490)|(0))!=0;
      if ($491) { label = 96; break; } else { label = 94; break; }
    case 94: 
      var $493=$sp;
      var $494=(($493+12)|0);
      var $495=HEAP32[(($494)>>2)];
      var $496=$495 & 0;
      var $497=$mmap_flag;
      var $498=(($496)|(0))==(($497)|(0));
      if ($498) { label = 95; break; } else { label = 96; break; }
    case 95: 
      var $500=$sp;
      var $501=(($500)|0);
      var $502=HEAP32[(($501)>>2)];
      $oldbase=$502;
      var $503=$tbase;
      var $504=$sp;
      var $505=(($504)|0);
      HEAP32[(($505)>>2)]=$503;
      var $506=$tsize;
      var $507=$sp;
      var $508=(($507+4)|0);
      var $509=HEAP32[(($508)>>2)];
      var $510=((($509)+($506))|0);
      HEAP32[(($508)>>2)]=$510;
      var $511=$2;
      var $512=$tbase;
      var $513=$oldbase;
      var $514=$3;
      var $515=_prepend_alloc($511, $512, $513, $514);
      $1=$515;
      label = 103; break;
    case 96: 
      var $517=$2;
      var $518=$tbase;
      var $519=$tsize;
      var $520=$mmap_flag;
      _add_segment($517, $518, $519, $520);
      label = 97; break;
    case 97: 
      label = 98; break;
    case 98: 
      label = 99; break;
    case 99: 
      var $524=$3;
      var $525=$2;
      var $526=(($525+12)|0);
      var $527=HEAP32[(($526)>>2)];
      var $528=(($524)>>>(0)) < (($527)>>>(0));
      if ($528) { label = 100; break; } else { label = 101; break; }
    case 100: 
      var $530=$3;
      var $531=$2;
      var $532=(($531+12)|0);
      var $533=HEAP32[(($532)>>2)];
      var $534=((($533)-($530))|0);
      HEAP32[(($532)>>2)]=$534;
      $rsize=$534;
      var $535=$2;
      var $536=(($535+24)|0);
      var $537=HEAP32[(($536)>>2)];
      $p=$537;
      var $538=$p;
      var $539=$538;
      var $540=$3;
      var $541=(($539+$540)|0);
      var $542=$541;
      var $543=$2;
      var $544=(($543+24)|0);
      HEAP32[(($544)>>2)]=$542;
      $r=$542;
      var $545=$rsize;
      var $546=$545 | 1;
      var $547=$r;
      var $548=(($547+4)|0);
      HEAP32[(($548)>>2)]=$546;
      var $549=$3;
      var $550=$549 | 1;
      var $551=$550 | 2;
      var $552=$p;
      var $553=(($552+4)|0);
      HEAP32[(($553)>>2)]=$551;
      var $554=$p;
      var $555=$554;
      var $556=(($555+8)|0);
      $1=$556;
      label = 103; break;
    case 101: 
      label = 102; break;
    case 102: 
      var $559=___errno_location();
      HEAP32[(($559)>>2)]=12;
      $1=0;
      label = 103; break;
    case 103: 
      var $561=$1;
      return $561;
    default: assert(0, "bad label: " + label);
  }
}
function _free($mem) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $p;
      var $psize;
      var $next;
      var $prevsize;
      var $prev;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F1;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F2;
      var $B3;
      var $I4;
      var $TP5;
      var $XP6;
      var $R7;
      var $F8;
      var $RP9;
      var $CP10;
      var $H11;
      var $C012;
      var $C113;
      var $I14;
      var $B15;
      var $F16;
      var $tp;
      var $H17;
      var $I18;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K19;
      var $C;
      var $F20;
      $1=$mem;
      var $2=$1;
      var $3=(($2)|(0))!=0;
      if ($3) { label = 2; break; } else { label = 214; break; }
    case 2: 
      var $5=$1;
      var $6=((($5)-(8))|0);
      var $7=$6;
      $p=$7;
      var $8=$p;
      var $9=$8;
      var $10=HEAP32[((((5268532)|0))>>2)];
      var $11=(($9)>>>(0)) >= (($10)>>>(0));
      if ($11) { label = 3; break; } else { var $19 = 0;label = 4; break; }
    case 3: 
      var $13=$p;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=$15 & 3;
      var $17=(($16)|(0))!=1;
      var $19 = $17;label = 4; break;
    case 4: 
      var $19;
      var $20=(($19)&(1));
      var $21=($20);
      var $22=(($21)|(0))!=0;
      if ($22) { label = 5; break; } else { label = 211; break; }
    case 5: 
      var $24=$p;
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=$26 & -8;
      $psize=$27;
      var $28=$p;
      var $29=$28;
      var $30=$psize;
      var $31=(($29+$30)|0);
      var $32=$31;
      $next=$32;
      var $33=$p;
      var $34=(($33+4)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=$35 & 1;
      var $37=(($36)|(0))!=0;
      if ($37) { label = 86; break; } else { label = 6; break; }
    case 6: 
      var $39=$p;
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      $prevsize=$41;
      var $42=$p;
      var $43=(($42+4)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$44 & 3;
      var $46=(($45)|(0))==0;
      if ($46) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $48=$prevsize;
      var $49=((($48)+(16))|0);
      var $50=$psize;
      var $51=((($50)+($49))|0);
      $psize=$51;
      label = 213; break;
    case 8: 
      var $53=$p;
      var $54=$53;
      var $55=$prevsize;
      var $56=(((-$55))|0);
      var $57=(($54+$56)|0);
      var $58=$57;
      $prev=$58;
      var $59=$prevsize;
      var $60=$psize;
      var $61=((($60)+($59))|0);
      $psize=$61;
      var $62=$prev;
      $p=$62;
      var $63=$prev;
      var $64=$63;
      var $65=HEAP32[((((5268532)|0))>>2)];
      var $66=(($64)>>>(0)) >= (($65)>>>(0));
      var $67=(($66)&(1));
      var $68=($67);
      var $69=(($68)|(0))!=0;
      if ($69) { label = 9; break; } else { label = 83; break; }
    case 9: 
      var $71=$p;
      var $72=HEAP32[((((5268536)|0))>>2)];
      var $73=(($71)|(0))!=(($72)|(0));
      if ($73) { label = 10; break; } else { label = 79; break; }
    case 10: 
      var $75=$prevsize;
      var $76=$75 >>> 3;
      var $77=(($76)>>>(0)) < 32;
      if ($77) { label = 11; break; } else { label = 29; break; }
    case 11: 
      var $79=$p;
      var $80=(($79+8)|0);
      var $81=HEAP32[(($80)>>2)];
      $F=$81;
      var $82=$p;
      var $83=(($82+12)|0);
      var $84=HEAP32[(($83)>>2)];
      $B=$84;
      var $85=$prevsize;
      var $86=$85 >>> 3;
      $I=$86;
      var $87=$F;
      var $88=$I;
      var $89=$88 << 1;
      var $90=((((5268556)|0)+($89<<2))|0);
      var $91=$90;
      var $92=$91;
      var $93=(($87)|(0))==(($92)|(0));
      if ($93) { var $108 = 1;label = 15; break; } else { label = 12; break; }
    case 12: 
      var $95=$F;
      var $96=$95;
      var $97=HEAP32[((((5268532)|0))>>2)];
      var $98=(($96)>>>(0)) >= (($97)>>>(0));
      if ($98) { label = 13; break; } else { var $106 = 0;label = 14; break; }
    case 13: 
      var $100=$F;
      var $101=(($100+12)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=$p;
      var $104=(($102)|(0))==(($103)|(0));
      var $106 = $104;label = 14; break;
    case 14: 
      var $106;
      var $108 = $106;label = 15; break;
    case 15: 
      var $108;
      var $109=(($108)&(1));
      var $110=($109);
      var $111=(($110)|(0))!=0;
      if ($111) { label = 16; break; } else { label = 27; break; }
    case 16: 
      var $113=$B;
      var $114=$F;
      var $115=(($113)|(0))==(($114)|(0));
      if ($115) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $117=$I;
      var $118=1 << $117;
      var $119=$118 ^ -1;
      var $120=HEAP32[((((5268516)|0))>>2)];
      var $121=$120 & $119;
      HEAP32[((((5268516)|0))>>2)]=$121;
      label = 26; break;
    case 18: 
      var $123=$B;
      var $124=$I;
      var $125=$124 << 1;
      var $126=((((5268556)|0)+($125<<2))|0);
      var $127=$126;
      var $128=$127;
      var $129=(($123)|(0))==(($128)|(0));
      if ($129) { var $144 = 1;label = 22; break; } else { label = 19; break; }
    case 19: 
      var $131=$B;
      var $132=$131;
      var $133=HEAP32[((((5268532)|0))>>2)];
      var $134=(($132)>>>(0)) >= (($133)>>>(0));
      if ($134) { label = 20; break; } else { var $142 = 0;label = 21; break; }
    case 20: 
      var $136=$B;
      var $137=(($136+8)|0);
      var $138=HEAP32[(($137)>>2)];
      var $139=$p;
      var $140=(($138)|(0))==(($139)|(0));
      var $142 = $140;label = 21; break;
    case 21: 
      var $142;
      var $144 = $142;label = 22; break;
    case 22: 
      var $144;
      var $145=(($144)&(1));
      var $146=($145);
      var $147=(($146)|(0))!=0;
      if ($147) { label = 23; break; } else { label = 24; break; }
    case 23: 
      var $149=$B;
      var $150=$F;
      var $151=(($150+12)|0);
      HEAP32[(($151)>>2)]=$149;
      var $152=$F;
      var $153=$B;
      var $154=(($153+8)|0);
      HEAP32[(($154)>>2)]=$152;
      label = 25; break;
    case 24: 
      _abort();
      throw "Reached an unreachable!"
    case 25: 
      label = 26; break;
    case 26: 
      label = 28; break;
    case 27: 
      _abort();
      throw "Reached an unreachable!"
    case 28: 
      label = 78; break;
    case 29: 
      var $161=$p;
      var $162=$161;
      $TP=$162;
      var $163=$TP;
      var $164=(($163+24)|0);
      var $165=HEAP32[(($164)>>2)];
      $XP=$165;
      var $166=$TP;
      var $167=(($166+12)|0);
      var $168=HEAP32[(($167)>>2)];
      var $169=$TP;
      var $170=(($168)|(0))!=(($169)|(0));
      if ($170) { label = 30; break; } else { label = 37; break; }
    case 30: 
      var $172=$TP;
      var $173=(($172+8)|0);
      var $174=HEAP32[(($173)>>2)];
      $F1=$174;
      var $175=$TP;
      var $176=(($175+12)|0);
      var $177=HEAP32[(($176)>>2)];
      $R=$177;
      var $178=$F1;
      var $179=$178;
      var $180=HEAP32[((((5268532)|0))>>2)];
      var $181=(($179)>>>(0)) >= (($180)>>>(0));
      if ($181) { label = 31; break; } else { var $195 = 0;label = 33; break; }
    case 31: 
      var $183=$F1;
      var $184=(($183+12)|0);
      var $185=HEAP32[(($184)>>2)];
      var $186=$TP;
      var $187=(($185)|(0))==(($186)|(0));
      if ($187) { label = 32; break; } else { var $195 = 0;label = 33; break; }
    case 32: 
      var $189=$R;
      var $190=(($189+8)|0);
      var $191=HEAP32[(($190)>>2)];
      var $192=$TP;
      var $193=(($191)|(0))==(($192)|(0));
      var $195 = $193;label = 33; break;
    case 33: 
      var $195;
      var $196=(($195)&(1));
      var $197=($196);
      var $198=(($197)|(0))!=0;
      if ($198) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $200=$R;
      var $201=$F1;
      var $202=(($201+12)|0);
      HEAP32[(($202)>>2)]=$200;
      var $203=$F1;
      var $204=$R;
      var $205=(($204+8)|0);
      HEAP32[(($205)>>2)]=$203;
      label = 36; break;
    case 35: 
      _abort();
      throw "Reached an unreachable!"
    case 36: 
      label = 49; break;
    case 37: 
      var $209=$TP;
      var $210=(($209+16)|0);
      var $211=(($210+4)|0);
      $RP=$211;
      var $212=HEAP32[(($211)>>2)];
      $R=$212;
      var $213=(($212)|(0))!=0;
      if ($213) { label = 39; break; } else { label = 38; break; }
    case 38: 
      var $215=$TP;
      var $216=(($215+16)|0);
      var $217=(($216)|0);
      $RP=$217;
      var $218=HEAP32[(($217)>>2)];
      $R=$218;
      var $219=(($218)|(0))!=0;
      if ($219) { label = 39; break; } else { label = 48; break; }
    case 39: 
      label = 40; break;
    case 40: 
      var $222=$R;
      var $223=(($222+16)|0);
      var $224=(($223+4)|0);
      $CP=$224;
      var $225=HEAP32[(($224)>>2)];
      var $226=(($225)|(0))!=0;
      if ($226) { var $234 = 1;label = 42; break; } else { label = 41; break; }
    case 41: 
      var $228=$R;
      var $229=(($228+16)|0);
      var $230=(($229)|0);
      $CP=$230;
      var $231=HEAP32[(($230)>>2)];
      var $232=(($231)|(0))!=0;
      var $234 = $232;label = 42; break;
    case 42: 
      var $234;
      if ($234) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $236=$CP;
      $RP=$236;
      var $237=HEAP32[(($236)>>2)];
      $R=$237;
      label = 40; break;
    case 44: 
      var $239=$RP;
      var $240=$239;
      var $241=HEAP32[((((5268532)|0))>>2)];
      var $242=(($240)>>>(0)) >= (($241)>>>(0));
      var $243=(($242)&(1));
      var $244=($243);
      var $245=(($244)|(0))!=0;
      if ($245) { label = 45; break; } else { label = 46; break; }
    case 45: 
      var $247=$RP;
      HEAP32[(($247)>>2)]=0;
      label = 47; break;
    case 46: 
      _abort();
      throw "Reached an unreachable!"
    case 47: 
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      var $252=$XP;
      var $253=(($252)|(0))!=0;
      if ($253) { label = 50; break; } else { label = 77; break; }
    case 50: 
      var $255=$TP;
      var $256=(($255+28)|0);
      var $257=HEAP32[(($256)>>2)];
      var $258=((((5268820)|0)+($257<<2))|0);
      $H=$258;
      var $259=$TP;
      var $260=$H;
      var $261=HEAP32[(($260)>>2)];
      var $262=(($259)|(0))==(($261)|(0));
      if ($262) { label = 51; break; } else { label = 54; break; }
    case 51: 
      var $264=$R;
      var $265=$H;
      HEAP32[(($265)>>2)]=$264;
      var $266=(($264)|(0))==0;
      if ($266) { label = 52; break; } else { label = 53; break; }
    case 52: 
      var $268=$TP;
      var $269=(($268+28)|0);
      var $270=HEAP32[(($269)>>2)];
      var $271=1 << $270;
      var $272=$271 ^ -1;
      var $273=HEAP32[((((5268520)|0))>>2)];
      var $274=$273 & $272;
      HEAP32[((((5268520)|0))>>2)]=$274;
      label = 53; break;
    case 53: 
      label = 61; break;
    case 54: 
      var $277=$XP;
      var $278=$277;
      var $279=HEAP32[((((5268532)|0))>>2)];
      var $280=(($278)>>>(0)) >= (($279)>>>(0));
      var $281=(($280)&(1));
      var $282=($281);
      var $283=(($282)|(0))!=0;
      if ($283) { label = 55; break; } else { label = 59; break; }
    case 55: 
      var $285=$XP;
      var $286=(($285+16)|0);
      var $287=(($286)|0);
      var $288=HEAP32[(($287)>>2)];
      var $289=$TP;
      var $290=(($288)|(0))==(($289)|(0));
      if ($290) { label = 56; break; } else { label = 57; break; }
    case 56: 
      var $292=$R;
      var $293=$XP;
      var $294=(($293+16)|0);
      var $295=(($294)|0);
      HEAP32[(($295)>>2)]=$292;
      label = 58; break;
    case 57: 
      var $297=$R;
      var $298=$XP;
      var $299=(($298+16)|0);
      var $300=(($299+4)|0);
      HEAP32[(($300)>>2)]=$297;
      label = 58; break;
    case 58: 
      label = 60; break;
    case 59: 
      _abort();
      throw "Reached an unreachable!"
    case 60: 
      label = 61; break;
    case 61: 
      var $305=$R;
      var $306=(($305)|(0))!=0;
      if ($306) { label = 62; break; } else { label = 76; break; }
    case 62: 
      var $308=$R;
      var $309=$308;
      var $310=HEAP32[((((5268532)|0))>>2)];
      var $311=(($309)>>>(0)) >= (($310)>>>(0));
      var $312=(($311)&(1));
      var $313=($312);
      var $314=(($313)|(0))!=0;
      if ($314) { label = 63; break; } else { label = 74; break; }
    case 63: 
      var $316=$XP;
      var $317=$R;
      var $318=(($317+24)|0);
      HEAP32[(($318)>>2)]=$316;
      var $319=$TP;
      var $320=(($319+16)|0);
      var $321=(($320)|0);
      var $322=HEAP32[(($321)>>2)];
      $C0=$322;
      var $323=(($322)|(0))!=0;
      if ($323) { label = 64; break; } else { label = 68; break; }
    case 64: 
      var $325=$C0;
      var $326=$325;
      var $327=HEAP32[((((5268532)|0))>>2)];
      var $328=(($326)>>>(0)) >= (($327)>>>(0));
      var $329=(($328)&(1));
      var $330=($329);
      var $331=(($330)|(0))!=0;
      if ($331) { label = 65; break; } else { label = 66; break; }
    case 65: 
      var $333=$C0;
      var $334=$R;
      var $335=(($334+16)|0);
      var $336=(($335)|0);
      HEAP32[(($336)>>2)]=$333;
      var $337=$R;
      var $338=$C0;
      var $339=(($338+24)|0);
      HEAP32[(($339)>>2)]=$337;
      label = 67; break;
    case 66: 
      _abort();
      throw "Reached an unreachable!"
    case 67: 
      label = 68; break;
    case 68: 
      var $343=$TP;
      var $344=(($343+16)|0);
      var $345=(($344+4)|0);
      var $346=HEAP32[(($345)>>2)];
      $C1=$346;
      var $347=(($346)|(0))!=0;
      if ($347) { label = 69; break; } else { label = 73; break; }
    case 69: 
      var $349=$C1;
      var $350=$349;
      var $351=HEAP32[((((5268532)|0))>>2)];
      var $352=(($350)>>>(0)) >= (($351)>>>(0));
      var $353=(($352)&(1));
      var $354=($353);
      var $355=(($354)|(0))!=0;
      if ($355) { label = 70; break; } else { label = 71; break; }
    case 70: 
      var $357=$C1;
      var $358=$R;
      var $359=(($358+16)|0);
      var $360=(($359+4)|0);
      HEAP32[(($360)>>2)]=$357;
      var $361=$R;
      var $362=$C1;
      var $363=(($362+24)|0);
      HEAP32[(($363)>>2)]=$361;
      label = 72; break;
    case 71: 
      _abort();
      throw "Reached an unreachable!"
    case 72: 
      label = 73; break;
    case 73: 
      label = 75; break;
    case 74: 
      _abort();
      throw "Reached an unreachable!"
    case 75: 
      label = 76; break;
    case 76: 
      label = 77; break;
    case 77: 
      label = 78; break;
    case 78: 
      label = 82; break;
    case 79: 
      var $373=$next;
      var $374=(($373+4)|0);
      var $375=HEAP32[(($374)>>2)];
      var $376=$375 & 3;
      var $377=(($376)|(0))==3;
      if ($377) { label = 80; break; } else { label = 81; break; }
    case 80: 
      var $379=$psize;
      HEAP32[((((5268524)|0))>>2)]=$379;
      var $380=$next;
      var $381=(($380+4)|0);
      var $382=HEAP32[(($381)>>2)];
      var $383=$382 & -2;
      HEAP32[(($381)>>2)]=$383;
      var $384=$psize;
      var $385=$384 | 1;
      var $386=$p;
      var $387=(($386+4)|0);
      HEAP32[(($387)>>2)]=$385;
      var $388=$psize;
      var $389=$p;
      var $390=$389;
      var $391=$psize;
      var $392=(($390+$391)|0);
      var $393=$392;
      var $394=(($393)|0);
      HEAP32[(($394)>>2)]=$388;
      label = 213; break;
    case 81: 
      label = 82; break;
    case 82: 
      label = 84; break;
    case 83: 
      label = 212; break;
    case 84: 
      label = 85; break;
    case 85: 
      label = 86; break;
    case 86: 
      var $401=$p;
      var $402=$401;
      var $403=$next;
      var $404=$403;
      var $405=(($402)>>>(0)) < (($404)>>>(0));
      if ($405) { label = 87; break; } else { var $413 = 0;label = 88; break; }
    case 87: 
      var $407=$next;
      var $408=(($407+4)|0);
      var $409=HEAP32[(($408)>>2)];
      var $410=$409 & 1;
      var $411=(($410)|(0))!=0;
      var $413 = $411;label = 88; break;
    case 88: 
      var $413;
      var $414=(($413)&(1));
      var $415=($414);
      var $416=(($415)|(0))!=0;
      if ($416) { label = 89; break; } else { label = 210; break; }
    case 89: 
      var $418=$next;
      var $419=(($418+4)|0);
      var $420=HEAP32[(($419)>>2)];
      var $421=$420 & 2;
      var $422=(($421)|(0))!=0;
      if ($422) { label = 171; break; } else { label = 90; break; }
    case 90: 
      var $424=$next;
      var $425=HEAP32[((((5268540)|0))>>2)];
      var $426=(($424)|(0))==(($425)|(0));
      if ($426) { label = 91; break; } else { label = 96; break; }
    case 91: 
      var $428=$psize;
      var $429=HEAP32[((((5268528)|0))>>2)];
      var $430=((($429)+($428))|0);
      HEAP32[((((5268528)|0))>>2)]=$430;
      $tsize=$430;
      var $431=$p;
      HEAP32[((((5268540)|0))>>2)]=$431;
      var $432=$tsize;
      var $433=$432 | 1;
      var $434=$p;
      var $435=(($434+4)|0);
      HEAP32[(($435)>>2)]=$433;
      var $436=$p;
      var $437=HEAP32[((((5268536)|0))>>2)];
      var $438=(($436)|(0))==(($437)|(0));
      if ($438) { label = 92; break; } else { label = 93; break; }
    case 92: 
      HEAP32[((((5268536)|0))>>2)]=0;
      HEAP32[((((5268524)|0))>>2)]=0;
      label = 93; break;
    case 93: 
      var $441=$tsize;
      var $442=HEAP32[((((5268544)|0))>>2)];
      var $443=(($441)>>>(0)) > (($442)>>>(0));
      if ($443) { label = 94; break; } else { label = 95; break; }
    case 94: 
      var $445=_sys_trim(5268516, 0);
      label = 95; break;
    case 95: 
      label = 213; break;
    case 96: 
      var $448=$next;
      var $449=HEAP32[((((5268536)|0))>>2)];
      var $450=(($448)|(0))==(($449)|(0));
      if ($450) { label = 97; break; } else { label = 98; break; }
    case 97: 
      var $452=$psize;
      var $453=HEAP32[((((5268524)|0))>>2)];
      var $454=((($453)+($452))|0);
      HEAP32[((((5268524)|0))>>2)]=$454;
      $dsize=$454;
      var $455=$p;
      HEAP32[((((5268536)|0))>>2)]=$455;
      var $456=$dsize;
      var $457=$456 | 1;
      var $458=$p;
      var $459=(($458+4)|0);
      HEAP32[(($459)>>2)]=$457;
      var $460=$dsize;
      var $461=$p;
      var $462=$461;
      var $463=$dsize;
      var $464=(($462+$463)|0);
      var $465=$464;
      var $466=(($465)|0);
      HEAP32[(($466)>>2)]=$460;
      label = 213; break;
    case 98: 
      var $468=$next;
      var $469=(($468+4)|0);
      var $470=HEAP32[(($469)>>2)];
      var $471=$470 & -8;
      $nsize=$471;
      var $472=$nsize;
      var $473=$psize;
      var $474=((($473)+($472))|0);
      $psize=$474;
      var $475=$nsize;
      var $476=$475 >>> 3;
      var $477=(($476)>>>(0)) < 32;
      if ($477) { label = 99; break; } else { label = 117; break; }
    case 99: 
      var $479=$next;
      var $480=(($479+8)|0);
      var $481=HEAP32[(($480)>>2)];
      $F2=$481;
      var $482=$next;
      var $483=(($482+12)|0);
      var $484=HEAP32[(($483)>>2)];
      $B3=$484;
      var $485=$nsize;
      var $486=$485 >>> 3;
      $I4=$486;
      var $487=$F2;
      var $488=$I4;
      var $489=$488 << 1;
      var $490=((((5268556)|0)+($489<<2))|0);
      var $491=$490;
      var $492=$491;
      var $493=(($487)|(0))==(($492)|(0));
      if ($493) { var $508 = 1;label = 103; break; } else { label = 100; break; }
    case 100: 
      var $495=$F2;
      var $496=$495;
      var $497=HEAP32[((((5268532)|0))>>2)];
      var $498=(($496)>>>(0)) >= (($497)>>>(0));
      if ($498) { label = 101; break; } else { var $506 = 0;label = 102; break; }
    case 101: 
      var $500=$F2;
      var $501=(($500+12)|0);
      var $502=HEAP32[(($501)>>2)];
      var $503=$next;
      var $504=(($502)|(0))==(($503)|(0));
      var $506 = $504;label = 102; break;
    case 102: 
      var $506;
      var $508 = $506;label = 103; break;
    case 103: 
      var $508;
      var $509=(($508)&(1));
      var $510=($509);
      var $511=(($510)|(0))!=0;
      if ($511) { label = 104; break; } else { label = 115; break; }
    case 104: 
      var $513=$B3;
      var $514=$F2;
      var $515=(($513)|(0))==(($514)|(0));
      if ($515) { label = 105; break; } else { label = 106; break; }
    case 105: 
      var $517=$I4;
      var $518=1 << $517;
      var $519=$518 ^ -1;
      var $520=HEAP32[((((5268516)|0))>>2)];
      var $521=$520 & $519;
      HEAP32[((((5268516)|0))>>2)]=$521;
      label = 114; break;
    case 106: 
      var $523=$B3;
      var $524=$I4;
      var $525=$524 << 1;
      var $526=((((5268556)|0)+($525<<2))|0);
      var $527=$526;
      var $528=$527;
      var $529=(($523)|(0))==(($528)|(0));
      if ($529) { var $544 = 1;label = 110; break; } else { label = 107; break; }
    case 107: 
      var $531=$B3;
      var $532=$531;
      var $533=HEAP32[((((5268532)|0))>>2)];
      var $534=(($532)>>>(0)) >= (($533)>>>(0));
      if ($534) { label = 108; break; } else { var $542 = 0;label = 109; break; }
    case 108: 
      var $536=$B3;
      var $537=(($536+8)|0);
      var $538=HEAP32[(($537)>>2)];
      var $539=$next;
      var $540=(($538)|(0))==(($539)|(0));
      var $542 = $540;label = 109; break;
    case 109: 
      var $542;
      var $544 = $542;label = 110; break;
    case 110: 
      var $544;
      var $545=(($544)&(1));
      var $546=($545);
      var $547=(($546)|(0))!=0;
      if ($547) { label = 111; break; } else { label = 112; break; }
    case 111: 
      var $549=$B3;
      var $550=$F2;
      var $551=(($550+12)|0);
      HEAP32[(($551)>>2)]=$549;
      var $552=$F2;
      var $553=$B3;
      var $554=(($553+8)|0);
      HEAP32[(($554)>>2)]=$552;
      label = 113; break;
    case 112: 
      _abort();
      throw "Reached an unreachable!"
    case 113: 
      label = 114; break;
    case 114: 
      label = 116; break;
    case 115: 
      _abort();
      throw "Reached an unreachable!"
    case 116: 
      label = 166; break;
    case 117: 
      var $561=$next;
      var $562=$561;
      $TP5=$562;
      var $563=$TP5;
      var $564=(($563+24)|0);
      var $565=HEAP32[(($564)>>2)];
      $XP6=$565;
      var $566=$TP5;
      var $567=(($566+12)|0);
      var $568=HEAP32[(($567)>>2)];
      var $569=$TP5;
      var $570=(($568)|(0))!=(($569)|(0));
      if ($570) { label = 118; break; } else { label = 125; break; }
    case 118: 
      var $572=$TP5;
      var $573=(($572+8)|0);
      var $574=HEAP32[(($573)>>2)];
      $F8=$574;
      var $575=$TP5;
      var $576=(($575+12)|0);
      var $577=HEAP32[(($576)>>2)];
      $R7=$577;
      var $578=$F8;
      var $579=$578;
      var $580=HEAP32[((((5268532)|0))>>2)];
      var $581=(($579)>>>(0)) >= (($580)>>>(0));
      if ($581) { label = 119; break; } else { var $595 = 0;label = 121; break; }
    case 119: 
      var $583=$F8;
      var $584=(($583+12)|0);
      var $585=HEAP32[(($584)>>2)];
      var $586=$TP5;
      var $587=(($585)|(0))==(($586)|(0));
      if ($587) { label = 120; break; } else { var $595 = 0;label = 121; break; }
    case 120: 
      var $589=$R7;
      var $590=(($589+8)|0);
      var $591=HEAP32[(($590)>>2)];
      var $592=$TP5;
      var $593=(($591)|(0))==(($592)|(0));
      var $595 = $593;label = 121; break;
    case 121: 
      var $595;
      var $596=(($595)&(1));
      var $597=($596);
      var $598=(($597)|(0))!=0;
      if ($598) { label = 122; break; } else { label = 123; break; }
    case 122: 
      var $600=$R7;
      var $601=$F8;
      var $602=(($601+12)|0);
      HEAP32[(($602)>>2)]=$600;
      var $603=$F8;
      var $604=$R7;
      var $605=(($604+8)|0);
      HEAP32[(($605)>>2)]=$603;
      label = 124; break;
    case 123: 
      _abort();
      throw "Reached an unreachable!"
    case 124: 
      label = 137; break;
    case 125: 
      var $609=$TP5;
      var $610=(($609+16)|0);
      var $611=(($610+4)|0);
      $RP9=$611;
      var $612=HEAP32[(($611)>>2)];
      $R7=$612;
      var $613=(($612)|(0))!=0;
      if ($613) { label = 127; break; } else { label = 126; break; }
    case 126: 
      var $615=$TP5;
      var $616=(($615+16)|0);
      var $617=(($616)|0);
      $RP9=$617;
      var $618=HEAP32[(($617)>>2)];
      $R7=$618;
      var $619=(($618)|(0))!=0;
      if ($619) { label = 127; break; } else { label = 136; break; }
    case 127: 
      label = 128; break;
    case 128: 
      var $622=$R7;
      var $623=(($622+16)|0);
      var $624=(($623+4)|0);
      $CP10=$624;
      var $625=HEAP32[(($624)>>2)];
      var $626=(($625)|(0))!=0;
      if ($626) { var $634 = 1;label = 130; break; } else { label = 129; break; }
    case 129: 
      var $628=$R7;
      var $629=(($628+16)|0);
      var $630=(($629)|0);
      $CP10=$630;
      var $631=HEAP32[(($630)>>2)];
      var $632=(($631)|(0))!=0;
      var $634 = $632;label = 130; break;
    case 130: 
      var $634;
      if ($634) { label = 131; break; } else { label = 132; break; }
    case 131: 
      var $636=$CP10;
      $RP9=$636;
      var $637=HEAP32[(($636)>>2)];
      $R7=$637;
      label = 128; break;
    case 132: 
      var $639=$RP9;
      var $640=$639;
      var $641=HEAP32[((((5268532)|0))>>2)];
      var $642=(($640)>>>(0)) >= (($641)>>>(0));
      var $643=(($642)&(1));
      var $644=($643);
      var $645=(($644)|(0))!=0;
      if ($645) { label = 133; break; } else { label = 134; break; }
    case 133: 
      var $647=$RP9;
      HEAP32[(($647)>>2)]=0;
      label = 135; break;
    case 134: 
      _abort();
      throw "Reached an unreachable!"
    case 135: 
      label = 136; break;
    case 136: 
      label = 137; break;
    case 137: 
      var $652=$XP6;
      var $653=(($652)|(0))!=0;
      if ($653) { label = 138; break; } else { label = 165; break; }
    case 138: 
      var $655=$TP5;
      var $656=(($655+28)|0);
      var $657=HEAP32[(($656)>>2)];
      var $658=((((5268820)|0)+($657<<2))|0);
      $H11=$658;
      var $659=$TP5;
      var $660=$H11;
      var $661=HEAP32[(($660)>>2)];
      var $662=(($659)|(0))==(($661)|(0));
      if ($662) { label = 139; break; } else { label = 142; break; }
    case 139: 
      var $664=$R7;
      var $665=$H11;
      HEAP32[(($665)>>2)]=$664;
      var $666=(($664)|(0))==0;
      if ($666) { label = 140; break; } else { label = 141; break; }
    case 140: 
      var $668=$TP5;
      var $669=(($668+28)|0);
      var $670=HEAP32[(($669)>>2)];
      var $671=1 << $670;
      var $672=$671 ^ -1;
      var $673=HEAP32[((((5268520)|0))>>2)];
      var $674=$673 & $672;
      HEAP32[((((5268520)|0))>>2)]=$674;
      label = 141; break;
    case 141: 
      label = 149; break;
    case 142: 
      var $677=$XP6;
      var $678=$677;
      var $679=HEAP32[((((5268532)|0))>>2)];
      var $680=(($678)>>>(0)) >= (($679)>>>(0));
      var $681=(($680)&(1));
      var $682=($681);
      var $683=(($682)|(0))!=0;
      if ($683) { label = 143; break; } else { label = 147; break; }
    case 143: 
      var $685=$XP6;
      var $686=(($685+16)|0);
      var $687=(($686)|0);
      var $688=HEAP32[(($687)>>2)];
      var $689=$TP5;
      var $690=(($688)|(0))==(($689)|(0));
      if ($690) { label = 144; break; } else { label = 145; break; }
    case 144: 
      var $692=$R7;
      var $693=$XP6;
      var $694=(($693+16)|0);
      var $695=(($694)|0);
      HEAP32[(($695)>>2)]=$692;
      label = 146; break;
    case 145: 
      var $697=$R7;
      var $698=$XP6;
      var $699=(($698+16)|0);
      var $700=(($699+4)|0);
      HEAP32[(($700)>>2)]=$697;
      label = 146; break;
    case 146: 
      label = 148; break;
    case 147: 
      _abort();
      throw "Reached an unreachable!"
    case 148: 
      label = 149; break;
    case 149: 
      var $705=$R7;
      var $706=(($705)|(0))!=0;
      if ($706) { label = 150; break; } else { label = 164; break; }
    case 150: 
      var $708=$R7;
      var $709=$708;
      var $710=HEAP32[((((5268532)|0))>>2)];
      var $711=(($709)>>>(0)) >= (($710)>>>(0));
      var $712=(($711)&(1));
      var $713=($712);
      var $714=(($713)|(0))!=0;
      if ($714) { label = 151; break; } else { label = 162; break; }
    case 151: 
      var $716=$XP6;
      var $717=$R7;
      var $718=(($717+24)|0);
      HEAP32[(($718)>>2)]=$716;
      var $719=$TP5;
      var $720=(($719+16)|0);
      var $721=(($720)|0);
      var $722=HEAP32[(($721)>>2)];
      $C012=$722;
      var $723=(($722)|(0))!=0;
      if ($723) { label = 152; break; } else { label = 156; break; }
    case 152: 
      var $725=$C012;
      var $726=$725;
      var $727=HEAP32[((((5268532)|0))>>2)];
      var $728=(($726)>>>(0)) >= (($727)>>>(0));
      var $729=(($728)&(1));
      var $730=($729);
      var $731=(($730)|(0))!=0;
      if ($731) { label = 153; break; } else { label = 154; break; }
    case 153: 
      var $733=$C012;
      var $734=$R7;
      var $735=(($734+16)|0);
      var $736=(($735)|0);
      HEAP32[(($736)>>2)]=$733;
      var $737=$R7;
      var $738=$C012;
      var $739=(($738+24)|0);
      HEAP32[(($739)>>2)]=$737;
      label = 155; break;
    case 154: 
      _abort();
      throw "Reached an unreachable!"
    case 155: 
      label = 156; break;
    case 156: 
      var $743=$TP5;
      var $744=(($743+16)|0);
      var $745=(($744+4)|0);
      var $746=HEAP32[(($745)>>2)];
      $C113=$746;
      var $747=(($746)|(0))!=0;
      if ($747) { label = 157; break; } else { label = 161; break; }
    case 157: 
      var $749=$C113;
      var $750=$749;
      var $751=HEAP32[((((5268532)|0))>>2)];
      var $752=(($750)>>>(0)) >= (($751)>>>(0));
      var $753=(($752)&(1));
      var $754=($753);
      var $755=(($754)|(0))!=0;
      if ($755) { label = 158; break; } else { label = 159; break; }
    case 158: 
      var $757=$C113;
      var $758=$R7;
      var $759=(($758+16)|0);
      var $760=(($759+4)|0);
      HEAP32[(($760)>>2)]=$757;
      var $761=$R7;
      var $762=$C113;
      var $763=(($762+24)|0);
      HEAP32[(($763)>>2)]=$761;
      label = 160; break;
    case 159: 
      _abort();
      throw "Reached an unreachable!"
    case 160: 
      label = 161; break;
    case 161: 
      label = 163; break;
    case 162: 
      _abort();
      throw "Reached an unreachable!"
    case 163: 
      label = 164; break;
    case 164: 
      label = 165; break;
    case 165: 
      label = 166; break;
    case 166: 
      var $772=$psize;
      var $773=$772 | 1;
      var $774=$p;
      var $775=(($774+4)|0);
      HEAP32[(($775)>>2)]=$773;
      var $776=$psize;
      var $777=$p;
      var $778=$777;
      var $779=$psize;
      var $780=(($778+$779)|0);
      var $781=$780;
      var $782=(($781)|0);
      HEAP32[(($782)>>2)]=$776;
      var $783=$p;
      var $784=HEAP32[((((5268536)|0))>>2)];
      var $785=(($783)|(0))==(($784)|(0));
      if ($785) { label = 167; break; } else { label = 168; break; }
    case 167: 
      var $787=$psize;
      HEAP32[((((5268524)|0))>>2)]=$787;
      label = 213; break;
    case 168: 
      label = 169; break;
    case 169: 
      label = 170; break;
    case 170: 
      label = 172; break;
    case 171: 
      var $792=$next;
      var $793=(($792+4)|0);
      var $794=HEAP32[(($793)>>2)];
      var $795=$794 & -2;
      HEAP32[(($793)>>2)]=$795;
      var $796=$psize;
      var $797=$796 | 1;
      var $798=$p;
      var $799=(($798+4)|0);
      HEAP32[(($799)>>2)]=$797;
      var $800=$psize;
      var $801=$p;
      var $802=$801;
      var $803=$psize;
      var $804=(($802+$803)|0);
      var $805=$804;
      var $806=(($805)|0);
      HEAP32[(($806)>>2)]=$800;
      label = 172; break;
    case 172: 
      var $808=$psize;
      var $809=$808 >>> 3;
      var $810=(($809)>>>(0)) < 32;
      if ($810) { label = 173; break; } else { label = 180; break; }
    case 173: 
      var $812=$psize;
      var $813=$812 >>> 3;
      $I14=$813;
      var $814=$I14;
      var $815=$814 << 1;
      var $816=((((5268556)|0)+($815<<2))|0);
      var $817=$816;
      var $818=$817;
      $B15=$818;
      var $819=$B15;
      $F16=$819;
      var $820=HEAP32[((((5268516)|0))>>2)];
      var $821=$I14;
      var $822=1 << $821;
      var $823=$820 & $822;
      var $824=(($823)|(0))!=0;
      if ($824) { label = 175; break; } else { label = 174; break; }
    case 174: 
      var $826=$I14;
      var $827=1 << $826;
      var $828=HEAP32[((((5268516)|0))>>2)];
      var $829=$828 | $827;
      HEAP32[((((5268516)|0))>>2)]=$829;
      label = 179; break;
    case 175: 
      var $831=$B15;
      var $832=(($831+8)|0);
      var $833=HEAP32[(($832)>>2)];
      var $834=$833;
      var $835=HEAP32[((((5268532)|0))>>2)];
      var $836=(($834)>>>(0)) >= (($835)>>>(0));
      var $837=(($836)&(1));
      var $838=($837);
      var $839=(($838)|(0))!=0;
      if ($839) { label = 176; break; } else { label = 177; break; }
    case 176: 
      var $841=$B15;
      var $842=(($841+8)|0);
      var $843=HEAP32[(($842)>>2)];
      $F16=$843;
      label = 178; break;
    case 177: 
      _abort();
      throw "Reached an unreachable!"
    case 178: 
      label = 179; break;
    case 179: 
      var $847=$p;
      var $848=$B15;
      var $849=(($848+8)|0);
      HEAP32[(($849)>>2)]=$847;
      var $850=$p;
      var $851=$F16;
      var $852=(($851+12)|0);
      HEAP32[(($852)>>2)]=$850;
      var $853=$F16;
      var $854=$p;
      var $855=(($854+8)|0);
      HEAP32[(($855)>>2)]=$853;
      var $856=$B15;
      var $857=$p;
      var $858=(($857+12)|0);
      HEAP32[(($858)>>2)]=$856;
      label = 209; break;
    case 180: 
      var $860=$p;
      var $861=$860;
      $tp=$861;
      var $862=$psize;
      var $863=$862 >>> 8;
      $X=$863;
      var $864=$X;
      var $865=(($864)|(0))==0;
      if ($865) { label = 181; break; } else { label = 182; break; }
    case 181: 
      $I18=0;
      label = 186; break;
    case 182: 
      var $868=$X;
      var $869=(($868)>>>(0)) > 65535;
      if ($869) { label = 183; break; } else { label = 184; break; }
    case 183: 
      $I18=31;
      label = 185; break;
    case 184: 
      var $872=$X;
      $Y=$872;
      var $873=$Y;
      var $874=((($873)-(256))|0);
      var $875=$874 >>> 16;
      var $876=$875 & 8;
      $N=$876;
      var $877=$N;
      var $878=$Y;
      var $879=$878 << $877;
      $Y=$879;
      var $880=((($879)-(4096))|0);
      var $881=$880 >>> 16;
      var $882=$881 & 4;
      $K=$882;
      var $883=$K;
      var $884=$N;
      var $885=((($884)+($883))|0);
      $N=$885;
      var $886=$K;
      var $887=$Y;
      var $888=$887 << $886;
      $Y=$888;
      var $889=((($888)-(16384))|0);
      var $890=$889 >>> 16;
      var $891=$890 & 2;
      $K=$891;
      var $892=$N;
      var $893=((($892)+($891))|0);
      $N=$893;
      var $894=$N;
      var $895=(((14)-($894))|0);
      var $896=$K;
      var $897=$Y;
      var $898=$897 << $896;
      $Y=$898;
      var $899=$898 >>> 15;
      var $900=((($895)+($899))|0);
      $K=$900;
      var $901=$K;
      var $902=$901 << 1;
      var $903=$psize;
      var $904=$K;
      var $905=((($904)+(7))|0);
      var $906=$903 >>> (($905)>>>(0));
      var $907=$906 & 1;
      var $908=((($902)+($907))|0);
      $I18=$908;
      label = 185; break;
    case 185: 
      label = 186; break;
    case 186: 
      var $911=$I18;
      var $912=((((5268820)|0)+($911<<2))|0);
      $H17=$912;
      var $913=$I18;
      var $914=$tp;
      var $915=(($914+28)|0);
      HEAP32[(($915)>>2)]=$913;
      var $916=$tp;
      var $917=(($916+16)|0);
      var $918=(($917+4)|0);
      HEAP32[(($918)>>2)]=0;
      var $919=$tp;
      var $920=(($919+16)|0);
      var $921=(($920)|0);
      HEAP32[(($921)>>2)]=0;
      var $922=HEAP32[((((5268520)|0))>>2)];
      var $923=$I18;
      var $924=1 << $923;
      var $925=$922 & $924;
      var $926=(($925)|(0))!=0;
      if ($926) { label = 188; break; } else { label = 187; break; }
    case 187: 
      var $928=$I18;
      var $929=1 << $928;
      var $930=HEAP32[((((5268520)|0))>>2)];
      var $931=$930 | $929;
      HEAP32[((((5268520)|0))>>2)]=$931;
      var $932=$tp;
      var $933=$H17;
      HEAP32[(($933)>>2)]=$932;
      var $934=$H17;
      var $935=$934;
      var $936=$tp;
      var $937=(($936+24)|0);
      HEAP32[(($937)>>2)]=$935;
      var $938=$tp;
      var $939=$tp;
      var $940=(($939+12)|0);
      HEAP32[(($940)>>2)]=$938;
      var $941=$tp;
      var $942=(($941+8)|0);
      HEAP32[(($942)>>2)]=$938;
      label = 206; break;
    case 188: 
      var $944=$H17;
      var $945=HEAP32[(($944)>>2)];
      $T=$945;
      var $946=$psize;
      var $947=$I18;
      var $948=(($947)|(0))==31;
      if ($948) { label = 189; break; } else { label = 190; break; }
    case 189: 
      var $957 = 0;label = 191; break;
    case 190: 
      var $951=$I18;
      var $952=$951 >>> 1;
      var $953=((($952)+(8))|0);
      var $954=((($953)-(2))|0);
      var $955=(((31)-($954))|0);
      var $957 = $955;label = 191; break;
    case 191: 
      var $957;
      var $958=$946 << $957;
      $K19=$958;
      label = 192; break;
    case 192: 
      var $960=$T;
      var $961=(($960+4)|0);
      var $962=HEAP32[(($961)>>2)];
      var $963=$962 & -8;
      var $964=$psize;
      var $965=(($963)|(0))!=(($964)|(0));
      if ($965) { label = 193; break; } else { label = 199; break; }
    case 193: 
      var $967=$K19;
      var $968=$967 >>> 31;
      var $969=$968 & 1;
      var $970=$T;
      var $971=(($970+16)|0);
      var $972=(($971+($969<<2))|0);
      $C=$972;
      var $973=$K19;
      var $974=$973 << 1;
      $K19=$974;
      var $975=$C;
      var $976=HEAP32[(($975)>>2)];
      var $977=(($976)|(0))!=0;
      if ($977) { label = 194; break; } else { label = 195; break; }
    case 194: 
      var $979=$C;
      var $980=HEAP32[(($979)>>2)];
      $T=$980;
      label = 198; break;
    case 195: 
      var $982=$C;
      var $983=$982;
      var $984=HEAP32[((((5268532)|0))>>2)];
      var $985=(($983)>>>(0)) >= (($984)>>>(0));
      var $986=(($985)&(1));
      var $987=($986);
      var $988=(($987)|(0))!=0;
      if ($988) { label = 196; break; } else { label = 197; break; }
    case 196: 
      var $990=$tp;
      var $991=$C;
      HEAP32[(($991)>>2)]=$990;
      var $992=$T;
      var $993=$tp;
      var $994=(($993+24)|0);
      HEAP32[(($994)>>2)]=$992;
      var $995=$tp;
      var $996=$tp;
      var $997=(($996+12)|0);
      HEAP32[(($997)>>2)]=$995;
      var $998=$tp;
      var $999=(($998+8)|0);
      HEAP32[(($999)>>2)]=$995;
      label = 205; break;
    case 197: 
      _abort();
      throw "Reached an unreachable!"
    case 198: 
      label = 204; break;
    case 199: 
      var $1003=$T;
      var $1004=(($1003+8)|0);
      var $1005=HEAP32[(($1004)>>2)];
      $F20=$1005;
      var $1006=$T;
      var $1007=$1006;
      var $1008=HEAP32[((((5268532)|0))>>2)];
      var $1009=(($1007)>>>(0)) >= (($1008)>>>(0));
      if ($1009) { label = 200; break; } else { var $1016 = 0;label = 201; break; }
    case 200: 
      var $1011=$F20;
      var $1012=$1011;
      var $1013=HEAP32[((((5268532)|0))>>2)];
      var $1014=(($1012)>>>(0)) >= (($1013)>>>(0));
      var $1016 = $1014;label = 201; break;
    case 201: 
      var $1016;
      var $1017=(($1016)&(1));
      var $1018=($1017);
      var $1019=(($1018)|(0))!=0;
      if ($1019) { label = 202; break; } else { label = 203; break; }
    case 202: 
      var $1021=$tp;
      var $1022=$F20;
      var $1023=(($1022+12)|0);
      HEAP32[(($1023)>>2)]=$1021;
      var $1024=$T;
      var $1025=(($1024+8)|0);
      HEAP32[(($1025)>>2)]=$1021;
      var $1026=$F20;
      var $1027=$tp;
      var $1028=(($1027+8)|0);
      HEAP32[(($1028)>>2)]=$1026;
      var $1029=$T;
      var $1030=$tp;
      var $1031=(($1030+12)|0);
      HEAP32[(($1031)>>2)]=$1029;
      var $1032=$tp;
      var $1033=(($1032+24)|0);
      HEAP32[(($1033)>>2)]=0;
      label = 205; break;
    case 203: 
      _abort();
      throw "Reached an unreachable!"
    case 204: 
      label = 192; break;
    case 205: 
      label = 206; break;
    case 206: 
      var $1038=HEAP32[((((5268548)|0))>>2)];
      var $1039=((($1038)-(1))|0);
      HEAP32[((((5268548)|0))>>2)]=$1039;
      var $1040=(($1039)|(0))==0;
      if ($1040) { label = 207; break; } else { label = 208; break; }
    case 207: 
      var $1042=_release_unused_segments(5268516);
      label = 208; break;
    case 208: 
      label = 209; break;
    case 209: 
      label = 213; break;
    case 210: 
      label = 211; break;
    case 211: 
      label = 212; break;
    case 212: 
      _abort();
      throw "Reached an unreachable!"
    case 213: 
      label = 214; break;
    case 214: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _sys_trim($m, $pad) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $released;
      var $unit;
      var $extra;
      var $sp;
      var $old_br;
      var $rel_br;
      var $new_br;
      $1=$m;
      $2=$pad;
      $released=0;
      var $3=HEAP32[((((5249920)|0))>>2)];
      var $4=(($3)|(0))!=0;
      if ($4) { var $9 = 1;label = 3; break; } else { label = 2; break; }
    case 2: 
      var $6=_init_mparams();
      var $7=(($6)|(0))!=0;
      var $9 = $7;label = 3; break;
    case 3: 
      var $9;
      var $10=(($9)&(1));
      var $11=$2;
      var $12=(($11)>>>(0)) < 4294967232;
      if ($12) { label = 4; break; } else { label = 25; break; }
    case 4: 
      var $14=$1;
      var $15=(($14+24)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=(($16)|(0))!=0;
      if ($17) { label = 5; break; } else { label = 25; break; }
    case 5: 
      var $19=$2;
      var $20=((($19)+(40))|0);
      $2=$20;
      var $21=$1;
      var $22=(($21+12)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=$2;
      var $25=(($23)>>>(0)) > (($24)>>>(0));
      if ($25) { label = 6; break; } else { label = 21; break; }
    case 6: 
      var $27=HEAP32[((((5249928)|0))>>2)];
      $unit=$27;
      var $28=$1;
      var $29=(($28+12)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$2;
      var $32=((($30)-($31))|0);
      var $33=$unit;
      var $34=((($33)-(1))|0);
      var $35=((($32)+($34))|0);
      var $36=$unit;
      var $37=Math.floor(((($35)>>>(0)))/((($36)>>>(0))));
      var $38=((($37)-(1))|0);
      var $39=$unit;
      var $40=Math.imul($38,$39);
      $extra=$40;
      var $41=$1;
      var $42=$1;
      var $43=(($42+24)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$44;
      var $46=_segment_holding($41, $45);
      $sp=$46;
      var $47=$sp;
      var $48=(($47+12)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$49 & 8;
      var $51=(($50)|(0))!=0;
      if ($51) { label = 18; break; } else { label = 7; break; }
    case 7: 
      var $53=$sp;
      var $54=(($53+12)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=$55 & 0;
      var $57=(($56)|(0))!=0;
      if ($57) { label = 8; break; } else { label = 9; break; }
    case 8: 
      label = 17; break;
    case 9: 
      var $60=$extra;
      var $61=(($60)>>>(0)) >= 2147483647;
      if ($61) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $63=$unit;
      var $64=(((-2147483648)-($63))|0);
      $extra=$64;
      label = 11; break;
    case 11: 
      var $66=_sbrk(0);
      $old_br=$66;
      var $67=$old_br;
      var $68=$sp;
      var $69=(($68)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=$sp;
      var $72=(($71+4)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=(($70+$73)|0);
      var $75=(($67)|(0))==(($74)|(0));
      if ($75) { label = 12; break; } else { label = 16; break; }
    case 12: 
      var $77=$extra;
      var $78=(((-$77))|0);
      var $79=_sbrk($78);
      $rel_br=$79;
      var $80=_sbrk(0);
      $new_br=$80;
      var $81=$rel_br;
      var $82=(($81)|(0))!=-1;
      if ($82) { label = 13; break; } else { label = 15; break; }
    case 13: 
      var $84=$new_br;
      var $85=$old_br;
      var $86=(($84)>>>(0)) < (($85)>>>(0));
      if ($86) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $88=$old_br;
      var $89=$new_br;
      var $90=$88;
      var $91=$89;
      var $92=((($90)-($91))|0);
      $released=$92;
      label = 15; break;
    case 15: 
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      label = 18; break;
    case 18: 
      var $97=$released;
      var $98=(($97)|(0))!=0;
      if ($98) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $100=$released;
      var $101=$sp;
      var $102=(($101+4)|0);
      var $103=HEAP32[(($102)>>2)];
      var $104=((($103)-($100))|0);
      HEAP32[(($102)>>2)]=$104;
      var $105=$released;
      var $106=$1;
      var $107=(($106+432)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=((($108)-($105))|0);
      HEAP32[(($107)>>2)]=$109;
      var $110=$1;
      var $111=$1;
      var $112=(($111+24)|0);
      var $113=HEAP32[(($112)>>2)];
      var $114=$1;
      var $115=(($114+12)|0);
      var $116=HEAP32[(($115)>>2)];
      var $117=$released;
      var $118=((($116)-($117))|0);
      _init_top($110, $113, $118);
      label = 20; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $121=$released;
      var $122=(($121)|(0))==0;
      if ($122) { label = 22; break; } else { label = 24; break; }
    case 22: 
      var $124=$1;
      var $125=(($124+12)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=$1;
      var $128=(($127+28)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=(($126)>>>(0)) > (($129)>>>(0));
      if ($130) { label = 23; break; } else { label = 24; break; }
    case 23: 
      var $132=$1;
      var $133=(($132+28)|0);
      HEAP32[(($133)>>2)]=-1;
      label = 24; break;
    case 24: 
      label = 25; break;
    case 25: 
      var $136=$released;
      var $137=(($136)|(0))!=0;
      var $138=$137 ? 1 : 0;
      return $138;
    default: assert(0, "bad label: " + label);
  }
}
function _realloc($oldmem, $bytes) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $mem;
      var $nb;
      var $oldp;
      var $m;
      var $newp;
      var $oc;
      $1=$oldmem;
      $2=$bytes;
      $mem=0;
      var $3=$1;
      var $4=(($3)|(0))==0;
      if ($4) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $6=$2;
      var $7=_malloc($6);
      $mem=$7;
      label = 18; break;
    case 3: 
      var $9=$2;
      var $10=(($9)>>>(0)) >= 4294967232;
      if ($10) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $12=___errno_location();
      HEAP32[(($12)>>2)]=12;
      label = 17; break;
    case 5: 
      var $14=$2;
      var $15=(($14)>>>(0)) < 11;
      if ($15) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $23 = 16;label = 8; break;
    case 7: 
      var $18=$2;
      var $19=((($18)+(4))|0);
      var $20=((($19)+(7))|0);
      var $21=$20 & -8;
      var $23 = $21;label = 8; break;
    case 8: 
      var $23;
      $nb=$23;
      var $24=$1;
      var $25=((($24)-(8))|0);
      var $26=$25;
      $oldp=$26;
      $m=5268516;
      var $27=$m;
      var $28=$oldp;
      var $29=$nb;
      var $30=_try_realloc_chunk($27, $28, $29, 1);
      $newp=$30;
      var $31=$newp;
      var $32=(($31)|(0))!=0;
      if ($32) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $34=$newp;
      var $35=$34;
      var $36=(($35+8)|0);
      $mem=$36;
      label = 16; break;
    case 10: 
      var $38=$2;
      var $39=_malloc($38);
      $mem=$39;
      var $40=$mem;
      var $41=(($40)|(0))!=0;
      if ($41) { label = 11; break; } else { label = 15; break; }
    case 11: 
      var $43=$oldp;
      var $44=(($43+4)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=$45 & -8;
      var $47=$oldp;
      var $48=(($47+4)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$49 & 3;
      var $51=(($50)|(0))==0;
      var $52=$51 ? 8 : 4;
      var $53=((($46)-($52))|0);
      $oc=$53;
      var $54=$mem;
      var $55=$1;
      var $56=$oc;
      var $57=$2;
      var $58=(($56)>>>(0)) < (($57)>>>(0));
      if ($58) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $60=$oc;
      var $64 = $60;label = 14; break;
    case 13: 
      var $62=$2;
      var $64 = $62;label = 14; break;
    case 14: 
      var $64;
      assert($64 % 1 === 0);_memcpy($54, $55, $64);
      var $65=$1;
      _free($65);
      label = 15; break;
    case 15: 
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      label = 18; break;
    case 18: 
      var $70=$mem;
      return $70;
    default: assert(0, "bad label: " + label);
  }
}
Module["_realloc"] = _realloc;
function _release_unused_segments($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $released;
      var $nsegs;
      var $pred;
      var $sp;
      var $base;
      var $size;
      var $next;
      var $p;
      var $psize;
      var $tp;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $H1;
      var $I;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K2;
      var $C;
      var $F3;
      $1=$m;
      $released=0;
      $nsegs=0;
      var $2=$1;
      var $3=(($2+448)|0);
      $pred=$3;
      var $4=$pred;
      var $5=(($4+8)|0);
      var $6=HEAP32[(($5)>>2)];
      $sp=$6;
      label = 2; break;
    case 2: 
      var $8=$sp;
      var $9=(($8)|(0))!=0;
      if ($9) { label = 3; break; } else { label = 90; break; }
    case 3: 
      var $11=$sp;
      var $12=(($11)|0);
      var $13=HEAP32[(($12)>>2)];
      $base=$13;
      var $14=$sp;
      var $15=(($14+4)|0);
      var $16=HEAP32[(($15)>>2)];
      $size=$16;
      var $17=$sp;
      var $18=(($17+8)|0);
      var $19=HEAP32[(($18)>>2)];
      $next=$19;
      var $20=$nsegs;
      var $21=((($20)+(1))|0);
      $nsegs=$21;
      var $22=$sp;
      var $23=(($22+12)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=$24 & 0;
      var $26=(($25)|(0))!=0;
      if ($26) { label = 4; break; } else { label = 89; break; }
    case 4: 
      var $28=$sp;
      var $29=(($28+12)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$30 & 8;
      var $32=(($31)|(0))!=0;
      if ($32) { label = 89; break; } else { label = 5; break; }
    case 5: 
      var $34=$base;
      var $35=$base;
      var $36=(($35+8)|0);
      var $37=$36;
      var $38=$37 & 7;
      var $39=(($38)|(0))==0;
      if ($39) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $49 = 0;label = 8; break;
    case 7: 
      var $42=$base;
      var $43=(($42+8)|0);
      var $44=$43;
      var $45=$44 & 7;
      var $46=(((8)-($45))|0);
      var $47=$46 & 7;
      var $49 = $47;label = 8; break;
    case 8: 
      var $49;
      var $50=(($34+$49)|0);
      var $51=$50;
      $p=$51;
      var $52=$p;
      var $53=(($52+4)|0);
      var $54=HEAP32[(($53)>>2)];
      var $55=$54 & -8;
      $psize=$55;
      var $56=$p;
      var $57=(($56+4)|0);
      var $58=HEAP32[(($57)>>2)];
      var $59=$58 & 3;
      var $60=(($59)|(0))!=1;
      if ($60) { label = 88; break; } else { label = 9; break; }
    case 9: 
      var $62=$p;
      var $63=$62;
      var $64=$psize;
      var $65=(($63+$64)|0);
      var $66=$base;
      var $67=$size;
      var $68=(($66+$67)|0);
      var $69=((($68)-(40))|0);
      var $70=(($65)>>>(0)) >= (($69)>>>(0));
      if ($70) { label = 10; break; } else { label = 88; break; }
    case 10: 
      var $72=$p;
      var $73=$72;
      $tp=$73;
      var $74=$p;
      var $75=$1;
      var $76=(($75+20)|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=(($74)|(0))==(($77)|(0));
      if ($78) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $80=$1;
      var $81=(($80+20)|0);
      HEAP32[(($81)>>2)]=0;
      var $82=$1;
      var $83=(($82+8)|0);
      HEAP32[(($83)>>2)]=0;
      label = 61; break;
    case 12: 
      var $85=$tp;
      var $86=(($85+24)|0);
      var $87=HEAP32[(($86)>>2)];
      $XP=$87;
      var $88=$tp;
      var $89=(($88+12)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$tp;
      var $92=(($90)|(0))!=(($91)|(0));
      if ($92) { label = 13; break; } else { label = 20; break; }
    case 13: 
      var $94=$tp;
      var $95=(($94+8)|0);
      var $96=HEAP32[(($95)>>2)];
      $F=$96;
      var $97=$tp;
      var $98=(($97+12)|0);
      var $99=HEAP32[(($98)>>2)];
      $R=$99;
      var $100=$F;
      var $101=$100;
      var $102=$1;
      var $103=(($102+16)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=(($101)>>>(0)) >= (($104)>>>(0));
      if ($105) { label = 14; break; } else { var $119 = 0;label = 16; break; }
    case 14: 
      var $107=$F;
      var $108=(($107+12)|0);
      var $109=HEAP32[(($108)>>2)];
      var $110=$tp;
      var $111=(($109)|(0))==(($110)|(0));
      if ($111) { label = 15; break; } else { var $119 = 0;label = 16; break; }
    case 15: 
      var $113=$R;
      var $114=(($113+8)|0);
      var $115=HEAP32[(($114)>>2)];
      var $116=$tp;
      var $117=(($115)|(0))==(($116)|(0));
      var $119 = $117;label = 16; break;
    case 16: 
      var $119;
      var $120=(($119)&(1));
      var $121=($120);
      var $122=(($121)|(0))!=0;
      if ($122) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $124=$R;
      var $125=$F;
      var $126=(($125+12)|0);
      HEAP32[(($126)>>2)]=$124;
      var $127=$F;
      var $128=$R;
      var $129=(($128+8)|0);
      HEAP32[(($129)>>2)]=$127;
      label = 19; break;
    case 18: 
      _abort();
      throw "Reached an unreachable!"
    case 19: 
      label = 32; break;
    case 20: 
      var $133=$tp;
      var $134=(($133+16)|0);
      var $135=(($134+4)|0);
      $RP=$135;
      var $136=HEAP32[(($135)>>2)];
      $R=$136;
      var $137=(($136)|(0))!=0;
      if ($137) { label = 22; break; } else { label = 21; break; }
    case 21: 
      var $139=$tp;
      var $140=(($139+16)|0);
      var $141=(($140)|0);
      $RP=$141;
      var $142=HEAP32[(($141)>>2)];
      $R=$142;
      var $143=(($142)|(0))!=0;
      if ($143) { label = 22; break; } else { label = 31; break; }
    case 22: 
      label = 23; break;
    case 23: 
      var $146=$R;
      var $147=(($146+16)|0);
      var $148=(($147+4)|0);
      $CP=$148;
      var $149=HEAP32[(($148)>>2)];
      var $150=(($149)|(0))!=0;
      if ($150) { var $158 = 1;label = 25; break; } else { label = 24; break; }
    case 24: 
      var $152=$R;
      var $153=(($152+16)|0);
      var $154=(($153)|0);
      $CP=$154;
      var $155=HEAP32[(($154)>>2)];
      var $156=(($155)|(0))!=0;
      var $158 = $156;label = 25; break;
    case 25: 
      var $158;
      if ($158) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $160=$CP;
      $RP=$160;
      var $161=HEAP32[(($160)>>2)];
      $R=$161;
      label = 23; break;
    case 27: 
      var $163=$RP;
      var $164=$163;
      var $165=$1;
      var $166=(($165+16)|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=(($164)>>>(0)) >= (($167)>>>(0));
      var $169=(($168)&(1));
      var $170=($169);
      var $171=(($170)|(0))!=0;
      if ($171) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $173=$RP;
      HEAP32[(($173)>>2)]=0;
      label = 30; break;
    case 29: 
      _abort();
      throw "Reached an unreachable!"
    case 30: 
      label = 31; break;
    case 31: 
      label = 32; break;
    case 32: 
      var $178=$XP;
      var $179=(($178)|(0))!=0;
      if ($179) { label = 33; break; } else { label = 60; break; }
    case 33: 
      var $181=$tp;
      var $182=(($181+28)|0);
      var $183=HEAP32[(($182)>>2)];
      var $184=$1;
      var $185=(($184+304)|0);
      var $186=(($185+($183<<2))|0);
      $H=$186;
      var $187=$tp;
      var $188=$H;
      var $189=HEAP32[(($188)>>2)];
      var $190=(($187)|(0))==(($189)|(0));
      if ($190) { label = 34; break; } else { label = 37; break; }
    case 34: 
      var $192=$R;
      var $193=$H;
      HEAP32[(($193)>>2)]=$192;
      var $194=(($192)|(0))==0;
      if ($194) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $196=$tp;
      var $197=(($196+28)|0);
      var $198=HEAP32[(($197)>>2)];
      var $199=1 << $198;
      var $200=$199 ^ -1;
      var $201=$1;
      var $202=(($201+4)|0);
      var $203=HEAP32[(($202)>>2)];
      var $204=$203 & $200;
      HEAP32[(($202)>>2)]=$204;
      label = 36; break;
    case 36: 
      label = 44; break;
    case 37: 
      var $207=$XP;
      var $208=$207;
      var $209=$1;
      var $210=(($209+16)|0);
      var $211=HEAP32[(($210)>>2)];
      var $212=(($208)>>>(0)) >= (($211)>>>(0));
      var $213=(($212)&(1));
      var $214=($213);
      var $215=(($214)|(0))!=0;
      if ($215) { label = 38; break; } else { label = 42; break; }
    case 38: 
      var $217=$XP;
      var $218=(($217+16)|0);
      var $219=(($218)|0);
      var $220=HEAP32[(($219)>>2)];
      var $221=$tp;
      var $222=(($220)|(0))==(($221)|(0));
      if ($222) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $224=$R;
      var $225=$XP;
      var $226=(($225+16)|0);
      var $227=(($226)|0);
      HEAP32[(($227)>>2)]=$224;
      label = 41; break;
    case 40: 
      var $229=$R;
      var $230=$XP;
      var $231=(($230+16)|0);
      var $232=(($231+4)|0);
      HEAP32[(($232)>>2)]=$229;
      label = 41; break;
    case 41: 
      label = 43; break;
    case 42: 
      _abort();
      throw "Reached an unreachable!"
    case 43: 
      label = 44; break;
    case 44: 
      var $237=$R;
      var $238=(($237)|(0))!=0;
      if ($238) { label = 45; break; } else { label = 59; break; }
    case 45: 
      var $240=$R;
      var $241=$240;
      var $242=$1;
      var $243=(($242+16)|0);
      var $244=HEAP32[(($243)>>2)];
      var $245=(($241)>>>(0)) >= (($244)>>>(0));
      var $246=(($245)&(1));
      var $247=($246);
      var $248=(($247)|(0))!=0;
      if ($248) { label = 46; break; } else { label = 57; break; }
    case 46: 
      var $250=$XP;
      var $251=$R;
      var $252=(($251+24)|0);
      HEAP32[(($252)>>2)]=$250;
      var $253=$tp;
      var $254=(($253+16)|0);
      var $255=(($254)|0);
      var $256=HEAP32[(($255)>>2)];
      $C0=$256;
      var $257=(($256)|(0))!=0;
      if ($257) { label = 47; break; } else { label = 51; break; }
    case 47: 
      var $259=$C0;
      var $260=$259;
      var $261=$1;
      var $262=(($261+16)|0);
      var $263=HEAP32[(($262)>>2)];
      var $264=(($260)>>>(0)) >= (($263)>>>(0));
      var $265=(($264)&(1));
      var $266=($265);
      var $267=(($266)|(0))!=0;
      if ($267) { label = 48; break; } else { label = 49; break; }
    case 48: 
      var $269=$C0;
      var $270=$R;
      var $271=(($270+16)|0);
      var $272=(($271)|0);
      HEAP32[(($272)>>2)]=$269;
      var $273=$R;
      var $274=$C0;
      var $275=(($274+24)|0);
      HEAP32[(($275)>>2)]=$273;
      label = 50; break;
    case 49: 
      _abort();
      throw "Reached an unreachable!"
    case 50: 
      label = 51; break;
    case 51: 
      var $279=$tp;
      var $280=(($279+16)|0);
      var $281=(($280+4)|0);
      var $282=HEAP32[(($281)>>2)];
      $C1=$282;
      var $283=(($282)|(0))!=0;
      if ($283) { label = 52; break; } else { label = 56; break; }
    case 52: 
      var $285=$C1;
      var $286=$285;
      var $287=$1;
      var $288=(($287+16)|0);
      var $289=HEAP32[(($288)>>2)];
      var $290=(($286)>>>(0)) >= (($289)>>>(0));
      var $291=(($290)&(1));
      var $292=($291);
      var $293=(($292)|(0))!=0;
      if ($293) { label = 53; break; } else { label = 54; break; }
    case 53: 
      var $295=$C1;
      var $296=$R;
      var $297=(($296+16)|0);
      var $298=(($297+4)|0);
      HEAP32[(($298)>>2)]=$295;
      var $299=$R;
      var $300=$C1;
      var $301=(($300+24)|0);
      HEAP32[(($301)>>2)]=$299;
      label = 55; break;
    case 54: 
      _abort();
      throw "Reached an unreachable!"
    case 55: 
      label = 56; break;
    case 56: 
      label = 58; break;
    case 57: 
      _abort();
      throw "Reached an unreachable!"
    case 58: 
      label = 59; break;
    case 59: 
      label = 60; break;
    case 60: 
      label = 61; break;
    case 61: 
      var $310=$psize;
      var $311=$310 >>> 8;
      $X=$311;
      var $312=$X;
      var $313=(($312)|(0))==0;
      if ($313) { label = 62; break; } else { label = 63; break; }
    case 62: 
      $I=0;
      label = 67; break;
    case 63: 
      var $316=$X;
      var $317=(($316)>>>(0)) > 65535;
      if ($317) { label = 64; break; } else { label = 65; break; }
    case 64: 
      $I=31;
      label = 66; break;
    case 65: 
      var $320=$X;
      $Y=$320;
      var $321=$Y;
      var $322=((($321)-(256))|0);
      var $323=$322 >>> 16;
      var $324=$323 & 8;
      $N=$324;
      var $325=$N;
      var $326=$Y;
      var $327=$326 << $325;
      $Y=$327;
      var $328=((($327)-(4096))|0);
      var $329=$328 >>> 16;
      var $330=$329 & 4;
      $K=$330;
      var $331=$K;
      var $332=$N;
      var $333=((($332)+($331))|0);
      $N=$333;
      var $334=$K;
      var $335=$Y;
      var $336=$335 << $334;
      $Y=$336;
      var $337=((($336)-(16384))|0);
      var $338=$337 >>> 16;
      var $339=$338 & 2;
      $K=$339;
      var $340=$N;
      var $341=((($340)+($339))|0);
      $N=$341;
      var $342=$N;
      var $343=(((14)-($342))|0);
      var $344=$K;
      var $345=$Y;
      var $346=$345 << $344;
      $Y=$346;
      var $347=$346 >>> 15;
      var $348=((($343)+($347))|0);
      $K=$348;
      var $349=$K;
      var $350=$349 << 1;
      var $351=$psize;
      var $352=$K;
      var $353=((($352)+(7))|0);
      var $354=$351 >>> (($353)>>>(0));
      var $355=$354 & 1;
      var $356=((($350)+($355))|0);
      $I=$356;
      label = 66; break;
    case 66: 
      label = 67; break;
    case 67: 
      var $359=$I;
      var $360=$1;
      var $361=(($360+304)|0);
      var $362=(($361+($359<<2))|0);
      $H1=$362;
      var $363=$I;
      var $364=$tp;
      var $365=(($364+28)|0);
      HEAP32[(($365)>>2)]=$363;
      var $366=$tp;
      var $367=(($366+16)|0);
      var $368=(($367+4)|0);
      HEAP32[(($368)>>2)]=0;
      var $369=$tp;
      var $370=(($369+16)|0);
      var $371=(($370)|0);
      HEAP32[(($371)>>2)]=0;
      var $372=$1;
      var $373=(($372+4)|0);
      var $374=HEAP32[(($373)>>2)];
      var $375=$I;
      var $376=1 << $375;
      var $377=$374 & $376;
      var $378=(($377)|(0))!=0;
      if ($378) { label = 69; break; } else { label = 68; break; }
    case 68: 
      var $380=$I;
      var $381=1 << $380;
      var $382=$1;
      var $383=(($382+4)|0);
      var $384=HEAP32[(($383)>>2)];
      var $385=$384 | $381;
      HEAP32[(($383)>>2)]=$385;
      var $386=$tp;
      var $387=$H1;
      HEAP32[(($387)>>2)]=$386;
      var $388=$H1;
      var $389=$388;
      var $390=$tp;
      var $391=(($390+24)|0);
      HEAP32[(($391)>>2)]=$389;
      var $392=$tp;
      var $393=$tp;
      var $394=(($393+12)|0);
      HEAP32[(($394)>>2)]=$392;
      var $395=$tp;
      var $396=(($395+8)|0);
      HEAP32[(($396)>>2)]=$392;
      label = 87; break;
    case 69: 
      var $398=$H1;
      var $399=HEAP32[(($398)>>2)];
      $T=$399;
      var $400=$psize;
      var $401=$I;
      var $402=(($401)|(0))==31;
      if ($402) { label = 70; break; } else { label = 71; break; }
    case 70: 
      var $411 = 0;label = 72; break;
    case 71: 
      var $405=$I;
      var $406=$405 >>> 1;
      var $407=((($406)+(8))|0);
      var $408=((($407)-(2))|0);
      var $409=(((31)-($408))|0);
      var $411 = $409;label = 72; break;
    case 72: 
      var $411;
      var $412=$400 << $411;
      $K2=$412;
      label = 73; break;
    case 73: 
      var $414=$T;
      var $415=(($414+4)|0);
      var $416=HEAP32[(($415)>>2)];
      var $417=$416 & -8;
      var $418=$psize;
      var $419=(($417)|(0))!=(($418)|(0));
      if ($419) { label = 74; break; } else { label = 80; break; }
    case 74: 
      var $421=$K2;
      var $422=$421 >>> 31;
      var $423=$422 & 1;
      var $424=$T;
      var $425=(($424+16)|0);
      var $426=(($425+($423<<2))|0);
      $C=$426;
      var $427=$K2;
      var $428=$427 << 1;
      $K2=$428;
      var $429=$C;
      var $430=HEAP32[(($429)>>2)];
      var $431=(($430)|(0))!=0;
      if ($431) { label = 75; break; } else { label = 76; break; }
    case 75: 
      var $433=$C;
      var $434=HEAP32[(($433)>>2)];
      $T=$434;
      label = 79; break;
    case 76: 
      var $436=$C;
      var $437=$436;
      var $438=$1;
      var $439=(($438+16)|0);
      var $440=HEAP32[(($439)>>2)];
      var $441=(($437)>>>(0)) >= (($440)>>>(0));
      var $442=(($441)&(1));
      var $443=($442);
      var $444=(($443)|(0))!=0;
      if ($444) { label = 77; break; } else { label = 78; break; }
    case 77: 
      var $446=$tp;
      var $447=$C;
      HEAP32[(($447)>>2)]=$446;
      var $448=$T;
      var $449=$tp;
      var $450=(($449+24)|0);
      HEAP32[(($450)>>2)]=$448;
      var $451=$tp;
      var $452=$tp;
      var $453=(($452+12)|0);
      HEAP32[(($453)>>2)]=$451;
      var $454=$tp;
      var $455=(($454+8)|0);
      HEAP32[(($455)>>2)]=$451;
      label = 86; break;
    case 78: 
      _abort();
      throw "Reached an unreachable!"
    case 79: 
      label = 85; break;
    case 80: 
      var $459=$T;
      var $460=(($459+8)|0);
      var $461=HEAP32[(($460)>>2)];
      $F3=$461;
      var $462=$T;
      var $463=$462;
      var $464=$1;
      var $465=(($464+16)|0);
      var $466=HEAP32[(($465)>>2)];
      var $467=(($463)>>>(0)) >= (($466)>>>(0));
      if ($467) { label = 81; break; } else { var $476 = 0;label = 82; break; }
    case 81: 
      var $469=$F3;
      var $470=$469;
      var $471=$1;
      var $472=(($471+16)|0);
      var $473=HEAP32[(($472)>>2)];
      var $474=(($470)>>>(0)) >= (($473)>>>(0));
      var $476 = $474;label = 82; break;
    case 82: 
      var $476;
      var $477=(($476)&(1));
      var $478=($477);
      var $479=(($478)|(0))!=0;
      if ($479) { label = 83; break; } else { label = 84; break; }
    case 83: 
      var $481=$tp;
      var $482=$F3;
      var $483=(($482+12)|0);
      HEAP32[(($483)>>2)]=$481;
      var $484=$T;
      var $485=(($484+8)|0);
      HEAP32[(($485)>>2)]=$481;
      var $486=$F3;
      var $487=$tp;
      var $488=(($487+8)|0);
      HEAP32[(($488)>>2)]=$486;
      var $489=$T;
      var $490=$tp;
      var $491=(($490+12)|0);
      HEAP32[(($491)>>2)]=$489;
      var $492=$tp;
      var $493=(($492+24)|0);
      HEAP32[(($493)>>2)]=0;
      label = 86; break;
    case 84: 
      _abort();
      throw "Reached an unreachable!"
    case 85: 
      label = 73; break;
    case 86: 
      label = 87; break;
    case 87: 
      label = 88; break;
    case 88: 
      label = 89; break;
    case 89: 
      var $500=$sp;
      $pred=$500;
      var $501=$next;
      $sp=$501;
      label = 2; break;
    case 90: 
      var $503=$nsegs;
      var $504=(($503)>>>(0)) > 4294967295;
      if ($504) { label = 91; break; } else { label = 92; break; }
    case 91: 
      var $506=$nsegs;
      var $509 = $506;label = 93; break;
    case 92: 
      var $509 = -1;label = 93; break;
    case 93: 
      var $509;
      var $510=$1;
      var $511=(($510+32)|0);
      HEAP32[(($511)>>2)]=$509;
      var $512=$released;
      return $512;
    default: assert(0, "bad label: " + label);
  }
}
function _try_realloc_chunk($m, $p, $nb, $can_move) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $newp;
      var $oldsize;
      var $next;
      var $rsize;
      var $r;
      var $newsize;
      var $newtopsize;
      var $newtop;
      var $dvs;
      var $dsize;
      var $r1;
      var $n;
      var $newsize2;
      var $nextsize;
      var $rsize3;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F4;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $newsize5;
      var $r6;
      $1=$m;
      $2=$p;
      $3=$nb;
      $4=$can_move;
      $newp=0;
      var $5=$2;
      var $6=(($5+4)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$7 & -8;
      $oldsize=$8;
      var $9=$2;
      var $10=$9;
      var $11=$oldsize;
      var $12=(($10+$11)|0);
      var $13=$12;
      $next=$13;
      var $14=$2;
      var $15=$14;
      var $16=$1;
      var $17=(($16+16)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=(($15)>>>(0)) >= (($18)>>>(0));
      if ($19) { label = 2; break; } else { var $39 = 0;label = 5; break; }
    case 2: 
      var $21=$2;
      var $22=(($21+4)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=$23 & 3;
      var $25=(($24)|(0))!=1;
      if ($25) { label = 3; break; } else { var $39 = 0;label = 5; break; }
    case 3: 
      var $27=$2;
      var $28=$27;
      var $29=$next;
      var $30=$29;
      var $31=(($28)>>>(0)) < (($30)>>>(0));
      if ($31) { label = 4; break; } else { var $39 = 0;label = 5; break; }
    case 4: 
      var $33=$next;
      var $34=(($33+4)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=$35 & 1;
      var $37=(($36)|(0))!=0;
      var $39 = $37;label = 5; break;
    case 5: 
      var $39;
      var $40=(($39)&(1));
      var $41=($40);
      var $42=(($41)|(0))!=0;
      if ($42) { label = 6; break; } else { label = 103; break; }
    case 6: 
      var $44=$2;
      var $45=(($44+4)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=$46 & 3;
      var $48=(($47)|(0))==0;
      if ($48) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $50=$1;
      var $51=$2;
      var $52=$3;
      var $53=$4;
      var $54=_mmap_resize($50, $51, $52, $53);
      $newp=$54;
      label = 102; break;
    case 8: 
      var $56=$oldsize;
      var $57=$3;
      var $58=(($56)>>>(0)) >= (($57)>>>(0));
      if ($58) { label = 9; break; } else { label = 12; break; }
    case 9: 
      var $60=$oldsize;
      var $61=$3;
      var $62=((($60)-($61))|0);
      $rsize=$62;
      var $63=$rsize;
      var $64=(($63)>>>(0)) >= 16;
      if ($64) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $66=$2;
      var $67=$66;
      var $68=$3;
      var $69=(($67+$68)|0);
      var $70=$69;
      $r=$70;
      var $71=$2;
      var $72=(($71+4)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=$73 & 1;
      var $75=$3;
      var $76=$74 | $75;
      var $77=$76 | 2;
      var $78=$2;
      var $79=(($78+4)|0);
      HEAP32[(($79)>>2)]=$77;
      var $80=$2;
      var $81=$80;
      var $82=$3;
      var $83=(($81+$82)|0);
      var $84=$83;
      var $85=(($84+4)|0);
      var $86=HEAP32[(($85)>>2)];
      var $87=$86 | 1;
      HEAP32[(($85)>>2)]=$87;
      var $88=$r;
      var $89=(($88+4)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$90 & 1;
      var $92=$rsize;
      var $93=$91 | $92;
      var $94=$93 | 2;
      var $95=$r;
      var $96=(($95+4)|0);
      HEAP32[(($96)>>2)]=$94;
      var $97=$r;
      var $98=$97;
      var $99=$rsize;
      var $100=(($98+$99)|0);
      var $101=$100;
      var $102=(($101+4)|0);
      var $103=HEAP32[(($102)>>2)];
      var $104=$103 | 1;
      HEAP32[(($102)>>2)]=$104;
      var $105=$1;
      var $106=$r;
      var $107=$rsize;
      _dispose_chunk($105, $106, $107);
      label = 11; break;
    case 11: 
      var $109=$2;
      $newp=$109;
      label = 101; break;
    case 12: 
      var $111=$next;
      var $112=$1;
      var $113=(($112+24)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=(($111)|(0))==(($114)|(0));
      if ($115) { label = 13; break; } else { label = 16; break; }
    case 13: 
      var $117=$oldsize;
      var $118=$1;
      var $119=(($118+12)|0);
      var $120=HEAP32[(($119)>>2)];
      var $121=((($117)+($120))|0);
      var $122=$3;
      var $123=(($121)>>>(0)) > (($122)>>>(0));
      if ($123) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $125=$oldsize;
      var $126=$1;
      var $127=(($126+12)|0);
      var $128=HEAP32[(($127)>>2)];
      var $129=((($125)+($128))|0);
      $newsize=$129;
      var $130=$newsize;
      var $131=$3;
      var $132=((($130)-($131))|0);
      $newtopsize=$132;
      var $133=$2;
      var $134=$133;
      var $135=$3;
      var $136=(($134+$135)|0);
      var $137=$136;
      $newtop=$137;
      var $138=$2;
      var $139=(($138+4)|0);
      var $140=HEAP32[(($139)>>2)];
      var $141=$140 & 1;
      var $142=$3;
      var $143=$141 | $142;
      var $144=$143 | 2;
      var $145=$2;
      var $146=(($145+4)|0);
      HEAP32[(($146)>>2)]=$144;
      var $147=$2;
      var $148=$147;
      var $149=$3;
      var $150=(($148+$149)|0);
      var $151=$150;
      var $152=(($151+4)|0);
      var $153=HEAP32[(($152)>>2)];
      var $154=$153 | 1;
      HEAP32[(($152)>>2)]=$154;
      var $155=$newtopsize;
      var $156=$155 | 1;
      var $157=$newtop;
      var $158=(($157+4)|0);
      HEAP32[(($158)>>2)]=$156;
      var $159=$newtop;
      var $160=$1;
      var $161=(($160+24)|0);
      HEAP32[(($161)>>2)]=$159;
      var $162=$newtopsize;
      var $163=$1;
      var $164=(($163+12)|0);
      HEAP32[(($164)>>2)]=$162;
      var $165=$2;
      $newp=$165;
      label = 15; break;
    case 15: 
      label = 100; break;
    case 16: 
      var $168=$next;
      var $169=$1;
      var $170=(($169+20)|0);
      var $171=HEAP32[(($170)>>2)];
      var $172=(($168)|(0))==(($171)|(0));
      if ($172) { label = 17; break; } else { label = 23; break; }
    case 17: 
      var $174=$1;
      var $175=(($174+8)|0);
      var $176=HEAP32[(($175)>>2)];
      $dvs=$176;
      var $177=$oldsize;
      var $178=$dvs;
      var $179=((($177)+($178))|0);
      var $180=$3;
      var $181=(($179)>>>(0)) >= (($180)>>>(0));
      if ($181) { label = 18; break; } else { label = 22; break; }
    case 18: 
      var $183=$oldsize;
      var $184=$dvs;
      var $185=((($183)+($184))|0);
      var $186=$3;
      var $187=((($185)-($186))|0);
      $dsize=$187;
      var $188=$dsize;
      var $189=(($188)>>>(0)) >= 16;
      if ($189) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $191=$2;
      var $192=$191;
      var $193=$3;
      var $194=(($192+$193)|0);
      var $195=$194;
      $r1=$195;
      var $196=$r1;
      var $197=$196;
      var $198=$dsize;
      var $199=(($197+$198)|0);
      var $200=$199;
      $n=$200;
      var $201=$2;
      var $202=(($201+4)|0);
      var $203=HEAP32[(($202)>>2)];
      var $204=$203 & 1;
      var $205=$3;
      var $206=$204 | $205;
      var $207=$206 | 2;
      var $208=$2;
      var $209=(($208+4)|0);
      HEAP32[(($209)>>2)]=$207;
      var $210=$2;
      var $211=$210;
      var $212=$3;
      var $213=(($211+$212)|0);
      var $214=$213;
      var $215=(($214+4)|0);
      var $216=HEAP32[(($215)>>2)];
      var $217=$216 | 1;
      HEAP32[(($215)>>2)]=$217;
      var $218=$dsize;
      var $219=$218 | 1;
      var $220=$r1;
      var $221=(($220+4)|0);
      HEAP32[(($221)>>2)]=$219;
      var $222=$dsize;
      var $223=$r1;
      var $224=$223;
      var $225=$dsize;
      var $226=(($224+$225)|0);
      var $227=$226;
      var $228=(($227)|0);
      HEAP32[(($228)>>2)]=$222;
      var $229=$n;
      var $230=(($229+4)|0);
      var $231=HEAP32[(($230)>>2)];
      var $232=$231 & -2;
      HEAP32[(($230)>>2)]=$232;
      var $233=$dsize;
      var $234=$1;
      var $235=(($234+8)|0);
      HEAP32[(($235)>>2)]=$233;
      var $236=$r1;
      var $237=$1;
      var $238=(($237+20)|0);
      HEAP32[(($238)>>2)]=$236;
      label = 21; break;
    case 20: 
      var $240=$oldsize;
      var $241=$dvs;
      var $242=((($240)+($241))|0);
      $newsize2=$242;
      var $243=$2;
      var $244=(($243+4)|0);
      var $245=HEAP32[(($244)>>2)];
      var $246=$245 & 1;
      var $247=$newsize2;
      var $248=$246 | $247;
      var $249=$248 | 2;
      var $250=$2;
      var $251=(($250+4)|0);
      HEAP32[(($251)>>2)]=$249;
      var $252=$2;
      var $253=$252;
      var $254=$newsize2;
      var $255=(($253+$254)|0);
      var $256=$255;
      var $257=(($256+4)|0);
      var $258=HEAP32[(($257)>>2)];
      var $259=$258 | 1;
      HEAP32[(($257)>>2)]=$259;
      var $260=$1;
      var $261=(($260+8)|0);
      HEAP32[(($261)>>2)]=0;
      var $262=$1;
      var $263=(($262+20)|0);
      HEAP32[(($263)>>2)]=0;
      label = 21; break;
    case 21: 
      var $265=$2;
      $newp=$265;
      label = 22; break;
    case 22: 
      label = 99; break;
    case 23: 
      var $268=$next;
      var $269=(($268+4)|0);
      var $270=HEAP32[(($269)>>2)];
      var $271=$270 & 2;
      var $272=(($271)|(0))!=0;
      if ($272) { label = 98; break; } else { label = 24; break; }
    case 24: 
      var $274=$next;
      var $275=(($274+4)|0);
      var $276=HEAP32[(($275)>>2)];
      var $277=$276 & -8;
      $nextsize=$277;
      var $278=$oldsize;
      var $279=$nextsize;
      var $280=((($278)+($279))|0);
      var $281=$3;
      var $282=(($280)>>>(0)) >= (($281)>>>(0));
      if ($282) { label = 25; break; } else { label = 97; break; }
    case 25: 
      var $284=$oldsize;
      var $285=$nextsize;
      var $286=((($284)+($285))|0);
      var $287=$3;
      var $288=((($286)-($287))|0);
      $rsize3=$288;
      var $289=$nextsize;
      var $290=$289 >>> 3;
      var $291=(($290)>>>(0)) < 32;
      if ($291) { label = 26; break; } else { label = 44; break; }
    case 26: 
      var $293=$next;
      var $294=(($293+8)|0);
      var $295=HEAP32[(($294)>>2)];
      $F=$295;
      var $296=$next;
      var $297=(($296+12)|0);
      var $298=HEAP32[(($297)>>2)];
      $B=$298;
      var $299=$nextsize;
      var $300=$299 >>> 3;
      $I=$300;
      var $301=$F;
      var $302=$I;
      var $303=$302 << 1;
      var $304=$1;
      var $305=(($304+40)|0);
      var $306=(($305+($303<<2))|0);
      var $307=$306;
      var $308=$307;
      var $309=(($301)|(0))==(($308)|(0));
      if ($309) { var $326 = 1;label = 30; break; } else { label = 27; break; }
    case 27: 
      var $311=$F;
      var $312=$311;
      var $313=$1;
      var $314=(($313+16)|0);
      var $315=HEAP32[(($314)>>2)];
      var $316=(($312)>>>(0)) >= (($315)>>>(0));
      if ($316) { label = 28; break; } else { var $324 = 0;label = 29; break; }
    case 28: 
      var $318=$F;
      var $319=(($318+12)|0);
      var $320=HEAP32[(($319)>>2)];
      var $321=$next;
      var $322=(($320)|(0))==(($321)|(0));
      var $324 = $322;label = 29; break;
    case 29: 
      var $324;
      var $326 = $324;label = 30; break;
    case 30: 
      var $326;
      var $327=(($326)&(1));
      var $328=($327);
      var $329=(($328)|(0))!=0;
      if ($329) { label = 31; break; } else { label = 42; break; }
    case 31: 
      var $331=$B;
      var $332=$F;
      var $333=(($331)|(0))==(($332)|(0));
      if ($333) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $335=$I;
      var $336=1 << $335;
      var $337=$336 ^ -1;
      var $338=$1;
      var $339=(($338)|0);
      var $340=HEAP32[(($339)>>2)];
      var $341=$340 & $337;
      HEAP32[(($339)>>2)]=$341;
      label = 41; break;
    case 33: 
      var $343=$B;
      var $344=$I;
      var $345=$344 << 1;
      var $346=$1;
      var $347=(($346+40)|0);
      var $348=(($347+($345<<2))|0);
      var $349=$348;
      var $350=$349;
      var $351=(($343)|(0))==(($350)|(0));
      if ($351) { var $368 = 1;label = 37; break; } else { label = 34; break; }
    case 34: 
      var $353=$B;
      var $354=$353;
      var $355=$1;
      var $356=(($355+16)|0);
      var $357=HEAP32[(($356)>>2)];
      var $358=(($354)>>>(0)) >= (($357)>>>(0));
      if ($358) { label = 35; break; } else { var $366 = 0;label = 36; break; }
    case 35: 
      var $360=$B;
      var $361=(($360+8)|0);
      var $362=HEAP32[(($361)>>2)];
      var $363=$next;
      var $364=(($362)|(0))==(($363)|(0));
      var $366 = $364;label = 36; break;
    case 36: 
      var $366;
      var $368 = $366;label = 37; break;
    case 37: 
      var $368;
      var $369=(($368)&(1));
      var $370=($369);
      var $371=(($370)|(0))!=0;
      if ($371) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $373=$B;
      var $374=$F;
      var $375=(($374+12)|0);
      HEAP32[(($375)>>2)]=$373;
      var $376=$F;
      var $377=$B;
      var $378=(($377+8)|0);
      HEAP32[(($378)>>2)]=$376;
      label = 40; break;
    case 39: 
      _abort();
      throw "Reached an unreachable!"
    case 40: 
      label = 41; break;
    case 41: 
      label = 43; break;
    case 42: 
      _abort();
      throw "Reached an unreachable!"
    case 43: 
      label = 93; break;
    case 44: 
      var $385=$next;
      var $386=$385;
      $TP=$386;
      var $387=$TP;
      var $388=(($387+24)|0);
      var $389=HEAP32[(($388)>>2)];
      $XP=$389;
      var $390=$TP;
      var $391=(($390+12)|0);
      var $392=HEAP32[(($391)>>2)];
      var $393=$TP;
      var $394=(($392)|(0))!=(($393)|(0));
      if ($394) { label = 45; break; } else { label = 52; break; }
    case 45: 
      var $396=$TP;
      var $397=(($396+8)|0);
      var $398=HEAP32[(($397)>>2)];
      $F4=$398;
      var $399=$TP;
      var $400=(($399+12)|0);
      var $401=HEAP32[(($400)>>2)];
      $R=$401;
      var $402=$F4;
      var $403=$402;
      var $404=$1;
      var $405=(($404+16)|0);
      var $406=HEAP32[(($405)>>2)];
      var $407=(($403)>>>(0)) >= (($406)>>>(0));
      if ($407) { label = 46; break; } else { var $421 = 0;label = 48; break; }
    case 46: 
      var $409=$F4;
      var $410=(($409+12)|0);
      var $411=HEAP32[(($410)>>2)];
      var $412=$TP;
      var $413=(($411)|(0))==(($412)|(0));
      if ($413) { label = 47; break; } else { var $421 = 0;label = 48; break; }
    case 47: 
      var $415=$R;
      var $416=(($415+8)|0);
      var $417=HEAP32[(($416)>>2)];
      var $418=$TP;
      var $419=(($417)|(0))==(($418)|(0));
      var $421 = $419;label = 48; break;
    case 48: 
      var $421;
      var $422=(($421)&(1));
      var $423=($422);
      var $424=(($423)|(0))!=0;
      if ($424) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $426=$R;
      var $427=$F4;
      var $428=(($427+12)|0);
      HEAP32[(($428)>>2)]=$426;
      var $429=$F4;
      var $430=$R;
      var $431=(($430+8)|0);
      HEAP32[(($431)>>2)]=$429;
      label = 51; break;
    case 50: 
      _abort();
      throw "Reached an unreachable!"
    case 51: 
      label = 64; break;
    case 52: 
      var $435=$TP;
      var $436=(($435+16)|0);
      var $437=(($436+4)|0);
      $RP=$437;
      var $438=HEAP32[(($437)>>2)];
      $R=$438;
      var $439=(($438)|(0))!=0;
      if ($439) { label = 54; break; } else { label = 53; break; }
    case 53: 
      var $441=$TP;
      var $442=(($441+16)|0);
      var $443=(($442)|0);
      $RP=$443;
      var $444=HEAP32[(($443)>>2)];
      $R=$444;
      var $445=(($444)|(0))!=0;
      if ($445) { label = 54; break; } else { label = 63; break; }
    case 54: 
      label = 55; break;
    case 55: 
      var $448=$R;
      var $449=(($448+16)|0);
      var $450=(($449+4)|0);
      $CP=$450;
      var $451=HEAP32[(($450)>>2)];
      var $452=(($451)|(0))!=0;
      if ($452) { var $460 = 1;label = 57; break; } else { label = 56; break; }
    case 56: 
      var $454=$R;
      var $455=(($454+16)|0);
      var $456=(($455)|0);
      $CP=$456;
      var $457=HEAP32[(($456)>>2)];
      var $458=(($457)|(0))!=0;
      var $460 = $458;label = 57; break;
    case 57: 
      var $460;
      if ($460) { label = 58; break; } else { label = 59; break; }
    case 58: 
      var $462=$CP;
      $RP=$462;
      var $463=HEAP32[(($462)>>2)];
      $R=$463;
      label = 55; break;
    case 59: 
      var $465=$RP;
      var $466=$465;
      var $467=$1;
      var $468=(($467+16)|0);
      var $469=HEAP32[(($468)>>2)];
      var $470=(($466)>>>(0)) >= (($469)>>>(0));
      var $471=(($470)&(1));
      var $472=($471);
      var $473=(($472)|(0))!=0;
      if ($473) { label = 60; break; } else { label = 61; break; }
    case 60: 
      var $475=$RP;
      HEAP32[(($475)>>2)]=0;
      label = 62; break;
    case 61: 
      _abort();
      throw "Reached an unreachable!"
    case 62: 
      label = 63; break;
    case 63: 
      label = 64; break;
    case 64: 
      var $480=$XP;
      var $481=(($480)|(0))!=0;
      if ($481) { label = 65; break; } else { label = 92; break; }
    case 65: 
      var $483=$TP;
      var $484=(($483+28)|0);
      var $485=HEAP32[(($484)>>2)];
      var $486=$1;
      var $487=(($486+304)|0);
      var $488=(($487+($485<<2))|0);
      $H=$488;
      var $489=$TP;
      var $490=$H;
      var $491=HEAP32[(($490)>>2)];
      var $492=(($489)|(0))==(($491)|(0));
      if ($492) { label = 66; break; } else { label = 69; break; }
    case 66: 
      var $494=$R;
      var $495=$H;
      HEAP32[(($495)>>2)]=$494;
      var $496=(($494)|(0))==0;
      if ($496) { label = 67; break; } else { label = 68; break; }
    case 67: 
      var $498=$TP;
      var $499=(($498+28)|0);
      var $500=HEAP32[(($499)>>2)];
      var $501=1 << $500;
      var $502=$501 ^ -1;
      var $503=$1;
      var $504=(($503+4)|0);
      var $505=HEAP32[(($504)>>2)];
      var $506=$505 & $502;
      HEAP32[(($504)>>2)]=$506;
      label = 68; break;
    case 68: 
      label = 76; break;
    case 69: 
      var $509=$XP;
      var $510=$509;
      var $511=$1;
      var $512=(($511+16)|0);
      var $513=HEAP32[(($512)>>2)];
      var $514=(($510)>>>(0)) >= (($513)>>>(0));
      var $515=(($514)&(1));
      var $516=($515);
      var $517=(($516)|(0))!=0;
      if ($517) { label = 70; break; } else { label = 74; break; }
    case 70: 
      var $519=$XP;
      var $520=(($519+16)|0);
      var $521=(($520)|0);
      var $522=HEAP32[(($521)>>2)];
      var $523=$TP;
      var $524=(($522)|(0))==(($523)|(0));
      if ($524) { label = 71; break; } else { label = 72; break; }
    case 71: 
      var $526=$R;
      var $527=$XP;
      var $528=(($527+16)|0);
      var $529=(($528)|0);
      HEAP32[(($529)>>2)]=$526;
      label = 73; break;
    case 72: 
      var $531=$R;
      var $532=$XP;
      var $533=(($532+16)|0);
      var $534=(($533+4)|0);
      HEAP32[(($534)>>2)]=$531;
      label = 73; break;
    case 73: 
      label = 75; break;
    case 74: 
      _abort();
      throw "Reached an unreachable!"
    case 75: 
      label = 76; break;
    case 76: 
      var $539=$R;
      var $540=(($539)|(0))!=0;
      if ($540) { label = 77; break; } else { label = 91; break; }
    case 77: 
      var $542=$R;
      var $543=$542;
      var $544=$1;
      var $545=(($544+16)|0);
      var $546=HEAP32[(($545)>>2)];
      var $547=(($543)>>>(0)) >= (($546)>>>(0));
      var $548=(($547)&(1));
      var $549=($548);
      var $550=(($549)|(0))!=0;
      if ($550) { label = 78; break; } else { label = 89; break; }
    case 78: 
      var $552=$XP;
      var $553=$R;
      var $554=(($553+24)|0);
      HEAP32[(($554)>>2)]=$552;
      var $555=$TP;
      var $556=(($555+16)|0);
      var $557=(($556)|0);
      var $558=HEAP32[(($557)>>2)];
      $C0=$558;
      var $559=(($558)|(0))!=0;
      if ($559) { label = 79; break; } else { label = 83; break; }
    case 79: 
      var $561=$C0;
      var $562=$561;
      var $563=$1;
      var $564=(($563+16)|0);
      var $565=HEAP32[(($564)>>2)];
      var $566=(($562)>>>(0)) >= (($565)>>>(0));
      var $567=(($566)&(1));
      var $568=($567);
      var $569=(($568)|(0))!=0;
      if ($569) { label = 80; break; } else { label = 81; break; }
    case 80: 
      var $571=$C0;
      var $572=$R;
      var $573=(($572+16)|0);
      var $574=(($573)|0);
      HEAP32[(($574)>>2)]=$571;
      var $575=$R;
      var $576=$C0;
      var $577=(($576+24)|0);
      HEAP32[(($577)>>2)]=$575;
      label = 82; break;
    case 81: 
      _abort();
      throw "Reached an unreachable!"
    case 82: 
      label = 83; break;
    case 83: 
      var $581=$TP;
      var $582=(($581+16)|0);
      var $583=(($582+4)|0);
      var $584=HEAP32[(($583)>>2)];
      $C1=$584;
      var $585=(($584)|(0))!=0;
      if ($585) { label = 84; break; } else { label = 88; break; }
    case 84: 
      var $587=$C1;
      var $588=$587;
      var $589=$1;
      var $590=(($589+16)|0);
      var $591=HEAP32[(($590)>>2)];
      var $592=(($588)>>>(0)) >= (($591)>>>(0));
      var $593=(($592)&(1));
      var $594=($593);
      var $595=(($594)|(0))!=0;
      if ($595) { label = 85; break; } else { label = 86; break; }
    case 85: 
      var $597=$C1;
      var $598=$R;
      var $599=(($598+16)|0);
      var $600=(($599+4)|0);
      HEAP32[(($600)>>2)]=$597;
      var $601=$R;
      var $602=$C1;
      var $603=(($602+24)|0);
      HEAP32[(($603)>>2)]=$601;
      label = 87; break;
    case 86: 
      _abort();
      throw "Reached an unreachable!"
    case 87: 
      label = 88; break;
    case 88: 
      label = 90; break;
    case 89: 
      _abort();
      throw "Reached an unreachable!"
    case 90: 
      label = 91; break;
    case 91: 
      label = 92; break;
    case 92: 
      label = 93; break;
    case 93: 
      var $612=$rsize3;
      var $613=(($612)>>>(0)) < 16;
      if ($613) { label = 94; break; } else { label = 95; break; }
    case 94: 
      var $615=$oldsize;
      var $616=$nextsize;
      var $617=((($615)+($616))|0);
      $newsize5=$617;
      var $618=$2;
      var $619=(($618+4)|0);
      var $620=HEAP32[(($619)>>2)];
      var $621=$620 & 1;
      var $622=$newsize5;
      var $623=$621 | $622;
      var $624=$623 | 2;
      var $625=$2;
      var $626=(($625+4)|0);
      HEAP32[(($626)>>2)]=$624;
      var $627=$2;
      var $628=$627;
      var $629=$newsize5;
      var $630=(($628+$629)|0);
      var $631=$630;
      var $632=(($631+4)|0);
      var $633=HEAP32[(($632)>>2)];
      var $634=$633 | 1;
      HEAP32[(($632)>>2)]=$634;
      label = 96; break;
    case 95: 
      var $636=$2;
      var $637=$636;
      var $638=$3;
      var $639=(($637+$638)|0);
      var $640=$639;
      $r6=$640;
      var $641=$2;
      var $642=(($641+4)|0);
      var $643=HEAP32[(($642)>>2)];
      var $644=$643 & 1;
      var $645=$3;
      var $646=$644 | $645;
      var $647=$646 | 2;
      var $648=$2;
      var $649=(($648+4)|0);
      HEAP32[(($649)>>2)]=$647;
      var $650=$2;
      var $651=$650;
      var $652=$3;
      var $653=(($651+$652)|0);
      var $654=$653;
      var $655=(($654+4)|0);
      var $656=HEAP32[(($655)>>2)];
      var $657=$656 | 1;
      HEAP32[(($655)>>2)]=$657;
      var $658=$r6;
      var $659=(($658+4)|0);
      var $660=HEAP32[(($659)>>2)];
      var $661=$660 & 1;
      var $662=$rsize3;
      var $663=$661 | $662;
      var $664=$663 | 2;
      var $665=$r6;
      var $666=(($665+4)|0);
      HEAP32[(($666)>>2)]=$664;
      var $667=$r6;
      var $668=$667;
      var $669=$rsize3;
      var $670=(($668+$669)|0);
      var $671=$670;
      var $672=(($671+4)|0);
      var $673=HEAP32[(($672)>>2)];
      var $674=$673 | 1;
      HEAP32[(($672)>>2)]=$674;
      var $675=$1;
      var $676=$r6;
      var $677=$rsize3;
      _dispose_chunk($675, $676, $677);
      label = 96; break;
    case 96: 
      var $679=$2;
      $newp=$679;
      label = 97; break;
    case 97: 
      label = 98; break;
    case 98: 
      label = 99; break;
    case 99: 
      label = 100; break;
    case 100: 
      label = 101; break;
    case 101: 
      label = 102; break;
    case 102: 
      label = 104; break;
    case 103: 
      _abort();
      throw "Reached an unreachable!"
    case 104: 
      var $688=$newp;
      return $688;
    default: assert(0, "bad label: " + label);
  }
}
function _init_mparams() {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $magic;
      var $psize;
      var $gsize;
      var $1=HEAP32[((((5249920)|0))>>2)];
      var $2=(($1)|(0))==0;
      if ($2) { label = 2; break; } else { label = 6; break; }
    case 2: 
      var $4=_sysconf(8);
      $psize=$4;
      var $5=$psize;
      $gsize=$5;
      var $6=$gsize;
      var $7=$gsize;
      var $8=((($7)-(1))|0);
      var $9=$6 & $8;
      var $10=(($9)|(0))!=0;
      if ($10) { label = 4; break; } else { label = 3; break; }
    case 3: 
      var $12=$psize;
      var $13=$psize;
      var $14=((($13)-(1))|0);
      var $15=$12 & $14;
      var $16=(($15)|(0))!=0;
      if ($16) { label = 4; break; } else { label = 5; break; }
    case 4: 
      _abort();
      throw "Reached an unreachable!"
    case 5: 
      var $19=$gsize;
      HEAP32[((((5249928)|0))>>2)]=$19;
      var $20=$psize;
      HEAP32[((((5249924)|0))>>2)]=$20;
      HEAP32[((((5249932)|0))>>2)]=-1;
      HEAP32[((((5249936)|0))>>2)]=2097152;
      HEAP32[((((5249940)|0))>>2)]=0;
      var $21=HEAP32[((((5249940)|0))>>2)];
      HEAP32[((((5268960)|0))>>2)]=$21;
      var $22=_time(0);
      var $23=$22 ^ 1431655765;
      $magic=$23;
      var $24=$magic;
      var $25=$24 | 8;
      $magic=$25;
      var $26=$magic;
      var $27=$26 & -8;
      $magic=$27;
      var $28=$magic;
      HEAP32[((((5249920)|0))>>2)]=$28;
      label = 6; break;
    case 6: 
      return 1;
    default: assert(0, "bad label: " + label);
  }
}
function _dispose_chunk($m, $p, $psize) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $next;
      var $prev;
      var $prevsize;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F1;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F2;
      var $B3;
      var $I4;
      var $TP5;
      var $XP6;
      var $R7;
      var $F8;
      var $RP9;
      var $CP10;
      var $H11;
      var $C012;
      var $C113;
      var $I14;
      var $B15;
      var $F16;
      var $TP17;
      var $H18;
      var $I19;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K20;
      var $C;
      var $F21;
      $1=$m;
      $2=$p;
      $3=$psize;
      var $4=$2;
      var $5=$4;
      var $6=$3;
      var $7=(($5+$6)|0);
      var $8=$7;
      $next=$8;
      var $9=$2;
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=$11 & 1;
      var $13=(($12)|(0))!=0;
      if ($13) { label = 81; break; } else { label = 2; break; }
    case 2: 
      var $15=$2;
      var $16=(($15)|0);
      var $17=HEAP32[(($16)>>2)];
      $prevsize=$17;
      var $18=$2;
      var $19=(($18+4)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=$20 & 3;
      var $22=(($21)|(0))==0;
      if ($22) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $24=$prevsize;
      var $25=((($24)+(16))|0);
      var $26=$3;
      var $27=((($26)+($25))|0);
      $3=$27;
      label = 200; break;
    case 4: 
      var $29=$2;
      var $30=$29;
      var $31=$prevsize;
      var $32=(((-$31))|0);
      var $33=(($30+$32)|0);
      var $34=$33;
      $prev=$34;
      var $35=$prevsize;
      var $36=$3;
      var $37=((($36)+($35))|0);
      $3=$37;
      var $38=$prev;
      $2=$38;
      var $39=$prev;
      var $40=$39;
      var $41=$1;
      var $42=(($41+16)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=(($40)>>>(0)) >= (($43)>>>(0));
      var $45=(($44)&(1));
      var $46=($45);
      var $47=(($46)|(0))!=0;
      if ($47) { label = 5; break; } else { label = 79; break; }
    case 5: 
      var $49=$2;
      var $50=$1;
      var $51=(($50+20)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=(($49)|(0))!=(($52)|(0));
      if ($53) { label = 6; break; } else { label = 75; break; }
    case 6: 
      var $55=$prevsize;
      var $56=$55 >>> 3;
      var $57=(($56)>>>(0)) < 32;
      if ($57) { label = 7; break; } else { label = 25; break; }
    case 7: 
      var $59=$2;
      var $60=(($59+8)|0);
      var $61=HEAP32[(($60)>>2)];
      $F=$61;
      var $62=$2;
      var $63=(($62+12)|0);
      var $64=HEAP32[(($63)>>2)];
      $B=$64;
      var $65=$prevsize;
      var $66=$65 >>> 3;
      $I=$66;
      var $67=$F;
      var $68=$I;
      var $69=$68 << 1;
      var $70=$1;
      var $71=(($70+40)|0);
      var $72=(($71+($69<<2))|0);
      var $73=$72;
      var $74=$73;
      var $75=(($67)|(0))==(($74)|(0));
      if ($75) { var $92 = 1;label = 11; break; } else { label = 8; break; }
    case 8: 
      var $77=$F;
      var $78=$77;
      var $79=$1;
      var $80=(($79+16)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=(($78)>>>(0)) >= (($81)>>>(0));
      if ($82) { label = 9; break; } else { var $90 = 0;label = 10; break; }
    case 9: 
      var $84=$F;
      var $85=(($84+12)|0);
      var $86=HEAP32[(($85)>>2)];
      var $87=$2;
      var $88=(($86)|(0))==(($87)|(0));
      var $90 = $88;label = 10; break;
    case 10: 
      var $90;
      var $92 = $90;label = 11; break;
    case 11: 
      var $92;
      var $93=(($92)&(1));
      var $94=($93);
      var $95=(($94)|(0))!=0;
      if ($95) { label = 12; break; } else { label = 23; break; }
    case 12: 
      var $97=$B;
      var $98=$F;
      var $99=(($97)|(0))==(($98)|(0));
      if ($99) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $101=$I;
      var $102=1 << $101;
      var $103=$102 ^ -1;
      var $104=$1;
      var $105=(($104)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=$106 & $103;
      HEAP32[(($105)>>2)]=$107;
      label = 22; break;
    case 14: 
      var $109=$B;
      var $110=$I;
      var $111=$110 << 1;
      var $112=$1;
      var $113=(($112+40)|0);
      var $114=(($113+($111<<2))|0);
      var $115=$114;
      var $116=$115;
      var $117=(($109)|(0))==(($116)|(0));
      if ($117) { var $134 = 1;label = 18; break; } else { label = 15; break; }
    case 15: 
      var $119=$B;
      var $120=$119;
      var $121=$1;
      var $122=(($121+16)|0);
      var $123=HEAP32[(($122)>>2)];
      var $124=(($120)>>>(0)) >= (($123)>>>(0));
      if ($124) { label = 16; break; } else { var $132 = 0;label = 17; break; }
    case 16: 
      var $126=$B;
      var $127=(($126+8)|0);
      var $128=HEAP32[(($127)>>2)];
      var $129=$2;
      var $130=(($128)|(0))==(($129)|(0));
      var $132 = $130;label = 17; break;
    case 17: 
      var $132;
      var $134 = $132;label = 18; break;
    case 18: 
      var $134;
      var $135=(($134)&(1));
      var $136=($135);
      var $137=(($136)|(0))!=0;
      if ($137) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $139=$B;
      var $140=$F;
      var $141=(($140+12)|0);
      HEAP32[(($141)>>2)]=$139;
      var $142=$F;
      var $143=$B;
      var $144=(($143+8)|0);
      HEAP32[(($144)>>2)]=$142;
      label = 21; break;
    case 20: 
      _abort();
      throw "Reached an unreachable!"
    case 21: 
      label = 22; break;
    case 22: 
      label = 24; break;
    case 23: 
      _abort();
      throw "Reached an unreachable!"
    case 24: 
      label = 74; break;
    case 25: 
      var $151=$2;
      var $152=$151;
      $TP=$152;
      var $153=$TP;
      var $154=(($153+24)|0);
      var $155=HEAP32[(($154)>>2)];
      $XP=$155;
      var $156=$TP;
      var $157=(($156+12)|0);
      var $158=HEAP32[(($157)>>2)];
      var $159=$TP;
      var $160=(($158)|(0))!=(($159)|(0));
      if ($160) { label = 26; break; } else { label = 33; break; }
    case 26: 
      var $162=$TP;
      var $163=(($162+8)|0);
      var $164=HEAP32[(($163)>>2)];
      $F1=$164;
      var $165=$TP;
      var $166=(($165+12)|0);
      var $167=HEAP32[(($166)>>2)];
      $R=$167;
      var $168=$F1;
      var $169=$168;
      var $170=$1;
      var $171=(($170+16)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=(($169)>>>(0)) >= (($172)>>>(0));
      if ($173) { label = 27; break; } else { var $187 = 0;label = 29; break; }
    case 27: 
      var $175=$F1;
      var $176=(($175+12)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=$TP;
      var $179=(($177)|(0))==(($178)|(0));
      if ($179) { label = 28; break; } else { var $187 = 0;label = 29; break; }
    case 28: 
      var $181=$R;
      var $182=(($181+8)|0);
      var $183=HEAP32[(($182)>>2)];
      var $184=$TP;
      var $185=(($183)|(0))==(($184)|(0));
      var $187 = $185;label = 29; break;
    case 29: 
      var $187;
      var $188=(($187)&(1));
      var $189=($188);
      var $190=(($189)|(0))!=0;
      if ($190) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $192=$R;
      var $193=$F1;
      var $194=(($193+12)|0);
      HEAP32[(($194)>>2)]=$192;
      var $195=$F1;
      var $196=$R;
      var $197=(($196+8)|0);
      HEAP32[(($197)>>2)]=$195;
      label = 32; break;
    case 31: 
      _abort();
      throw "Reached an unreachable!"
    case 32: 
      label = 45; break;
    case 33: 
      var $201=$TP;
      var $202=(($201+16)|0);
      var $203=(($202+4)|0);
      $RP=$203;
      var $204=HEAP32[(($203)>>2)];
      $R=$204;
      var $205=(($204)|(0))!=0;
      if ($205) { label = 35; break; } else { label = 34; break; }
    case 34: 
      var $207=$TP;
      var $208=(($207+16)|0);
      var $209=(($208)|0);
      $RP=$209;
      var $210=HEAP32[(($209)>>2)];
      $R=$210;
      var $211=(($210)|(0))!=0;
      if ($211) { label = 35; break; } else { label = 44; break; }
    case 35: 
      label = 36; break;
    case 36: 
      var $214=$R;
      var $215=(($214+16)|0);
      var $216=(($215+4)|0);
      $CP=$216;
      var $217=HEAP32[(($216)>>2)];
      var $218=(($217)|(0))!=0;
      if ($218) { var $226 = 1;label = 38; break; } else { label = 37; break; }
    case 37: 
      var $220=$R;
      var $221=(($220+16)|0);
      var $222=(($221)|0);
      $CP=$222;
      var $223=HEAP32[(($222)>>2)];
      var $224=(($223)|(0))!=0;
      var $226 = $224;label = 38; break;
    case 38: 
      var $226;
      if ($226) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $228=$CP;
      $RP=$228;
      var $229=HEAP32[(($228)>>2)];
      $R=$229;
      label = 36; break;
    case 40: 
      var $231=$RP;
      var $232=$231;
      var $233=$1;
      var $234=(($233+16)|0);
      var $235=HEAP32[(($234)>>2)];
      var $236=(($232)>>>(0)) >= (($235)>>>(0));
      var $237=(($236)&(1));
      var $238=($237);
      var $239=(($238)|(0))!=0;
      if ($239) { label = 41; break; } else { label = 42; break; }
    case 41: 
      var $241=$RP;
      HEAP32[(($241)>>2)]=0;
      label = 43; break;
    case 42: 
      _abort();
      throw "Reached an unreachable!"
    case 43: 
      label = 44; break;
    case 44: 
      label = 45; break;
    case 45: 
      var $246=$XP;
      var $247=(($246)|(0))!=0;
      if ($247) { label = 46; break; } else { label = 73; break; }
    case 46: 
      var $249=$TP;
      var $250=(($249+28)|0);
      var $251=HEAP32[(($250)>>2)];
      var $252=$1;
      var $253=(($252+304)|0);
      var $254=(($253+($251<<2))|0);
      $H=$254;
      var $255=$TP;
      var $256=$H;
      var $257=HEAP32[(($256)>>2)];
      var $258=(($255)|(0))==(($257)|(0));
      if ($258) { label = 47; break; } else { label = 50; break; }
    case 47: 
      var $260=$R;
      var $261=$H;
      HEAP32[(($261)>>2)]=$260;
      var $262=(($260)|(0))==0;
      if ($262) { label = 48; break; } else { label = 49; break; }
    case 48: 
      var $264=$TP;
      var $265=(($264+28)|0);
      var $266=HEAP32[(($265)>>2)];
      var $267=1 << $266;
      var $268=$267 ^ -1;
      var $269=$1;
      var $270=(($269+4)|0);
      var $271=HEAP32[(($270)>>2)];
      var $272=$271 & $268;
      HEAP32[(($270)>>2)]=$272;
      label = 49; break;
    case 49: 
      label = 57; break;
    case 50: 
      var $275=$XP;
      var $276=$275;
      var $277=$1;
      var $278=(($277+16)|0);
      var $279=HEAP32[(($278)>>2)];
      var $280=(($276)>>>(0)) >= (($279)>>>(0));
      var $281=(($280)&(1));
      var $282=($281);
      var $283=(($282)|(0))!=0;
      if ($283) { label = 51; break; } else { label = 55; break; }
    case 51: 
      var $285=$XP;
      var $286=(($285+16)|0);
      var $287=(($286)|0);
      var $288=HEAP32[(($287)>>2)];
      var $289=$TP;
      var $290=(($288)|(0))==(($289)|(0));
      if ($290) { label = 52; break; } else { label = 53; break; }
    case 52: 
      var $292=$R;
      var $293=$XP;
      var $294=(($293+16)|0);
      var $295=(($294)|0);
      HEAP32[(($295)>>2)]=$292;
      label = 54; break;
    case 53: 
      var $297=$R;
      var $298=$XP;
      var $299=(($298+16)|0);
      var $300=(($299+4)|0);
      HEAP32[(($300)>>2)]=$297;
      label = 54; break;
    case 54: 
      label = 56; break;
    case 55: 
      _abort();
      throw "Reached an unreachable!"
    case 56: 
      label = 57; break;
    case 57: 
      var $305=$R;
      var $306=(($305)|(0))!=0;
      if ($306) { label = 58; break; } else { label = 72; break; }
    case 58: 
      var $308=$R;
      var $309=$308;
      var $310=$1;
      var $311=(($310+16)|0);
      var $312=HEAP32[(($311)>>2)];
      var $313=(($309)>>>(0)) >= (($312)>>>(0));
      var $314=(($313)&(1));
      var $315=($314);
      var $316=(($315)|(0))!=0;
      if ($316) { label = 59; break; } else { label = 70; break; }
    case 59: 
      var $318=$XP;
      var $319=$R;
      var $320=(($319+24)|0);
      HEAP32[(($320)>>2)]=$318;
      var $321=$TP;
      var $322=(($321+16)|0);
      var $323=(($322)|0);
      var $324=HEAP32[(($323)>>2)];
      $C0=$324;
      var $325=(($324)|(0))!=0;
      if ($325) { label = 60; break; } else { label = 64; break; }
    case 60: 
      var $327=$C0;
      var $328=$327;
      var $329=$1;
      var $330=(($329+16)|0);
      var $331=HEAP32[(($330)>>2)];
      var $332=(($328)>>>(0)) >= (($331)>>>(0));
      var $333=(($332)&(1));
      var $334=($333);
      var $335=(($334)|(0))!=0;
      if ($335) { label = 61; break; } else { label = 62; break; }
    case 61: 
      var $337=$C0;
      var $338=$R;
      var $339=(($338+16)|0);
      var $340=(($339)|0);
      HEAP32[(($340)>>2)]=$337;
      var $341=$R;
      var $342=$C0;
      var $343=(($342+24)|0);
      HEAP32[(($343)>>2)]=$341;
      label = 63; break;
    case 62: 
      _abort();
      throw "Reached an unreachable!"
    case 63: 
      label = 64; break;
    case 64: 
      var $347=$TP;
      var $348=(($347+16)|0);
      var $349=(($348+4)|0);
      var $350=HEAP32[(($349)>>2)];
      $C1=$350;
      var $351=(($350)|(0))!=0;
      if ($351) { label = 65; break; } else { label = 69; break; }
    case 65: 
      var $353=$C1;
      var $354=$353;
      var $355=$1;
      var $356=(($355+16)|0);
      var $357=HEAP32[(($356)>>2)];
      var $358=(($354)>>>(0)) >= (($357)>>>(0));
      var $359=(($358)&(1));
      var $360=($359);
      var $361=(($360)|(0))!=0;
      if ($361) { label = 66; break; } else { label = 67; break; }
    case 66: 
      var $363=$C1;
      var $364=$R;
      var $365=(($364+16)|0);
      var $366=(($365+4)|0);
      HEAP32[(($366)>>2)]=$363;
      var $367=$R;
      var $368=$C1;
      var $369=(($368+24)|0);
      HEAP32[(($369)>>2)]=$367;
      label = 68; break;
    case 67: 
      _abort();
      throw "Reached an unreachable!"
    case 68: 
      label = 69; break;
    case 69: 
      label = 71; break;
    case 70: 
      _abort();
      throw "Reached an unreachable!"
    case 71: 
      label = 72; break;
    case 72: 
      label = 73; break;
    case 73: 
      label = 74; break;
    case 74: 
      label = 78; break;
    case 75: 
      var $379=$next;
      var $380=(($379+4)|0);
      var $381=HEAP32[(($380)>>2)];
      var $382=$381 & 3;
      var $383=(($382)|(0))==3;
      if ($383) { label = 76; break; } else { label = 77; break; }
    case 76: 
      var $385=$3;
      var $386=$1;
      var $387=(($386+8)|0);
      HEAP32[(($387)>>2)]=$385;
      var $388=$next;
      var $389=(($388+4)|0);
      var $390=HEAP32[(($389)>>2)];
      var $391=$390 & -2;
      HEAP32[(($389)>>2)]=$391;
      var $392=$3;
      var $393=$392 | 1;
      var $394=$2;
      var $395=(($394+4)|0);
      HEAP32[(($395)>>2)]=$393;
      var $396=$3;
      var $397=$2;
      var $398=$397;
      var $399=$3;
      var $400=(($398+$399)|0);
      var $401=$400;
      var $402=(($401)|0);
      HEAP32[(($402)>>2)]=$396;
      label = 200; break;
    case 77: 
      label = 78; break;
    case 78: 
      label = 80; break;
    case 79: 
      _abort();
      throw "Reached an unreachable!"
    case 80: 
      label = 81; break;
    case 81: 
      var $408=$next;
      var $409=$408;
      var $410=$1;
      var $411=(($410+16)|0);
      var $412=HEAP32[(($411)>>2)];
      var $413=(($409)>>>(0)) >= (($412)>>>(0));
      var $414=(($413)&(1));
      var $415=($414);
      var $416=(($415)|(0))!=0;
      if ($416) { label = 82; break; } else { label = 199; break; }
    case 82: 
      var $418=$next;
      var $419=(($418+4)|0);
      var $420=HEAP32[(($419)>>2)];
      var $421=$420 & 2;
      var $422=(($421)|(0))!=0;
      if ($422) { label = 162; break; } else { label = 83; break; }
    case 83: 
      var $424=$next;
      var $425=$1;
      var $426=(($425+24)|0);
      var $427=HEAP32[(($426)>>2)];
      var $428=(($424)|(0))==(($427)|(0));
      if ($428) { label = 84; break; } else { label = 87; break; }
    case 84: 
      var $430=$3;
      var $431=$1;
      var $432=(($431+12)|0);
      var $433=HEAP32[(($432)>>2)];
      var $434=((($433)+($430))|0);
      HEAP32[(($432)>>2)]=$434;
      $tsize=$434;
      var $435=$2;
      var $436=$1;
      var $437=(($436+24)|0);
      HEAP32[(($437)>>2)]=$435;
      var $438=$tsize;
      var $439=$438 | 1;
      var $440=$2;
      var $441=(($440+4)|0);
      HEAP32[(($441)>>2)]=$439;
      var $442=$2;
      var $443=$1;
      var $444=(($443+20)|0);
      var $445=HEAP32[(($444)>>2)];
      var $446=(($442)|(0))==(($445)|(0));
      if ($446) { label = 85; break; } else { label = 86; break; }
    case 85: 
      var $448=$1;
      var $449=(($448+20)|0);
      HEAP32[(($449)>>2)]=0;
      var $450=$1;
      var $451=(($450+8)|0);
      HEAP32[(($451)>>2)]=0;
      label = 86; break;
    case 86: 
      label = 200; break;
    case 87: 
      var $454=$next;
      var $455=$1;
      var $456=(($455+20)|0);
      var $457=HEAP32[(($456)>>2)];
      var $458=(($454)|(0))==(($457)|(0));
      if ($458) { label = 88; break; } else { label = 89; break; }
    case 88: 
      var $460=$3;
      var $461=$1;
      var $462=(($461+8)|0);
      var $463=HEAP32[(($462)>>2)];
      var $464=((($463)+($460))|0);
      HEAP32[(($462)>>2)]=$464;
      $dsize=$464;
      var $465=$2;
      var $466=$1;
      var $467=(($466+20)|0);
      HEAP32[(($467)>>2)]=$465;
      var $468=$dsize;
      var $469=$468 | 1;
      var $470=$2;
      var $471=(($470+4)|0);
      HEAP32[(($471)>>2)]=$469;
      var $472=$dsize;
      var $473=$2;
      var $474=$473;
      var $475=$dsize;
      var $476=(($474+$475)|0);
      var $477=$476;
      var $478=(($477)|0);
      HEAP32[(($478)>>2)]=$472;
      label = 200; break;
    case 89: 
      var $480=$next;
      var $481=(($480+4)|0);
      var $482=HEAP32[(($481)>>2)];
      var $483=$482 & -8;
      $nsize=$483;
      var $484=$nsize;
      var $485=$3;
      var $486=((($485)+($484))|0);
      $3=$486;
      var $487=$nsize;
      var $488=$487 >>> 3;
      var $489=(($488)>>>(0)) < 32;
      if ($489) { label = 90; break; } else { label = 108; break; }
    case 90: 
      var $491=$next;
      var $492=(($491+8)|0);
      var $493=HEAP32[(($492)>>2)];
      $F2=$493;
      var $494=$next;
      var $495=(($494+12)|0);
      var $496=HEAP32[(($495)>>2)];
      $B3=$496;
      var $497=$nsize;
      var $498=$497 >>> 3;
      $I4=$498;
      var $499=$F2;
      var $500=$I4;
      var $501=$500 << 1;
      var $502=$1;
      var $503=(($502+40)|0);
      var $504=(($503+($501<<2))|0);
      var $505=$504;
      var $506=$505;
      var $507=(($499)|(0))==(($506)|(0));
      if ($507) { var $524 = 1;label = 94; break; } else { label = 91; break; }
    case 91: 
      var $509=$F2;
      var $510=$509;
      var $511=$1;
      var $512=(($511+16)|0);
      var $513=HEAP32[(($512)>>2)];
      var $514=(($510)>>>(0)) >= (($513)>>>(0));
      if ($514) { label = 92; break; } else { var $522 = 0;label = 93; break; }
    case 92: 
      var $516=$F2;
      var $517=(($516+12)|0);
      var $518=HEAP32[(($517)>>2)];
      var $519=$next;
      var $520=(($518)|(0))==(($519)|(0));
      var $522 = $520;label = 93; break;
    case 93: 
      var $522;
      var $524 = $522;label = 94; break;
    case 94: 
      var $524;
      var $525=(($524)&(1));
      var $526=($525);
      var $527=(($526)|(0))!=0;
      if ($527) { label = 95; break; } else { label = 106; break; }
    case 95: 
      var $529=$B3;
      var $530=$F2;
      var $531=(($529)|(0))==(($530)|(0));
      if ($531) { label = 96; break; } else { label = 97; break; }
    case 96: 
      var $533=$I4;
      var $534=1 << $533;
      var $535=$534 ^ -1;
      var $536=$1;
      var $537=(($536)|0);
      var $538=HEAP32[(($537)>>2)];
      var $539=$538 & $535;
      HEAP32[(($537)>>2)]=$539;
      label = 105; break;
    case 97: 
      var $541=$B3;
      var $542=$I4;
      var $543=$542 << 1;
      var $544=$1;
      var $545=(($544+40)|0);
      var $546=(($545+($543<<2))|0);
      var $547=$546;
      var $548=$547;
      var $549=(($541)|(0))==(($548)|(0));
      if ($549) { var $566 = 1;label = 101; break; } else { label = 98; break; }
    case 98: 
      var $551=$B3;
      var $552=$551;
      var $553=$1;
      var $554=(($553+16)|0);
      var $555=HEAP32[(($554)>>2)];
      var $556=(($552)>>>(0)) >= (($555)>>>(0));
      if ($556) { label = 99; break; } else { var $564 = 0;label = 100; break; }
    case 99: 
      var $558=$B3;
      var $559=(($558+8)|0);
      var $560=HEAP32[(($559)>>2)];
      var $561=$next;
      var $562=(($560)|(0))==(($561)|(0));
      var $564 = $562;label = 100; break;
    case 100: 
      var $564;
      var $566 = $564;label = 101; break;
    case 101: 
      var $566;
      var $567=(($566)&(1));
      var $568=($567);
      var $569=(($568)|(0))!=0;
      if ($569) { label = 102; break; } else { label = 103; break; }
    case 102: 
      var $571=$B3;
      var $572=$F2;
      var $573=(($572+12)|0);
      HEAP32[(($573)>>2)]=$571;
      var $574=$F2;
      var $575=$B3;
      var $576=(($575+8)|0);
      HEAP32[(($576)>>2)]=$574;
      label = 104; break;
    case 103: 
      _abort();
      throw "Reached an unreachable!"
    case 104: 
      label = 105; break;
    case 105: 
      label = 107; break;
    case 106: 
      _abort();
      throw "Reached an unreachable!"
    case 107: 
      label = 157; break;
    case 108: 
      var $583=$next;
      var $584=$583;
      $TP5=$584;
      var $585=$TP5;
      var $586=(($585+24)|0);
      var $587=HEAP32[(($586)>>2)];
      $XP6=$587;
      var $588=$TP5;
      var $589=(($588+12)|0);
      var $590=HEAP32[(($589)>>2)];
      var $591=$TP5;
      var $592=(($590)|(0))!=(($591)|(0));
      if ($592) { label = 109; break; } else { label = 116; break; }
    case 109: 
      var $594=$TP5;
      var $595=(($594+8)|0);
      var $596=HEAP32[(($595)>>2)];
      $F8=$596;
      var $597=$TP5;
      var $598=(($597+12)|0);
      var $599=HEAP32[(($598)>>2)];
      $R7=$599;
      var $600=$F8;
      var $601=$600;
      var $602=$1;
      var $603=(($602+16)|0);
      var $604=HEAP32[(($603)>>2)];
      var $605=(($601)>>>(0)) >= (($604)>>>(0));
      if ($605) { label = 110; break; } else { var $619 = 0;label = 112; break; }
    case 110: 
      var $607=$F8;
      var $608=(($607+12)|0);
      var $609=HEAP32[(($608)>>2)];
      var $610=$TP5;
      var $611=(($609)|(0))==(($610)|(0));
      if ($611) { label = 111; break; } else { var $619 = 0;label = 112; break; }
    case 111: 
      var $613=$R7;
      var $614=(($613+8)|0);
      var $615=HEAP32[(($614)>>2)];
      var $616=$TP5;
      var $617=(($615)|(0))==(($616)|(0));
      var $619 = $617;label = 112; break;
    case 112: 
      var $619;
      var $620=(($619)&(1));
      var $621=($620);
      var $622=(($621)|(0))!=0;
      if ($622) { label = 113; break; } else { label = 114; break; }
    case 113: 
      var $624=$R7;
      var $625=$F8;
      var $626=(($625+12)|0);
      HEAP32[(($626)>>2)]=$624;
      var $627=$F8;
      var $628=$R7;
      var $629=(($628+8)|0);
      HEAP32[(($629)>>2)]=$627;
      label = 115; break;
    case 114: 
      _abort();
      throw "Reached an unreachable!"
    case 115: 
      label = 128; break;
    case 116: 
      var $633=$TP5;
      var $634=(($633+16)|0);
      var $635=(($634+4)|0);
      $RP9=$635;
      var $636=HEAP32[(($635)>>2)];
      $R7=$636;
      var $637=(($636)|(0))!=0;
      if ($637) { label = 118; break; } else { label = 117; break; }
    case 117: 
      var $639=$TP5;
      var $640=(($639+16)|0);
      var $641=(($640)|0);
      $RP9=$641;
      var $642=HEAP32[(($641)>>2)];
      $R7=$642;
      var $643=(($642)|(0))!=0;
      if ($643) { label = 118; break; } else { label = 127; break; }
    case 118: 
      label = 119; break;
    case 119: 
      var $646=$R7;
      var $647=(($646+16)|0);
      var $648=(($647+4)|0);
      $CP10=$648;
      var $649=HEAP32[(($648)>>2)];
      var $650=(($649)|(0))!=0;
      if ($650) { var $658 = 1;label = 121; break; } else { label = 120; break; }
    case 120: 
      var $652=$R7;
      var $653=(($652+16)|0);
      var $654=(($653)|0);
      $CP10=$654;
      var $655=HEAP32[(($654)>>2)];
      var $656=(($655)|(0))!=0;
      var $658 = $656;label = 121; break;
    case 121: 
      var $658;
      if ($658) { label = 122; break; } else { label = 123; break; }
    case 122: 
      var $660=$CP10;
      $RP9=$660;
      var $661=HEAP32[(($660)>>2)];
      $R7=$661;
      label = 119; break;
    case 123: 
      var $663=$RP9;
      var $664=$663;
      var $665=$1;
      var $666=(($665+16)|0);
      var $667=HEAP32[(($666)>>2)];
      var $668=(($664)>>>(0)) >= (($667)>>>(0));
      var $669=(($668)&(1));
      var $670=($669);
      var $671=(($670)|(0))!=0;
      if ($671) { label = 124; break; } else { label = 125; break; }
    case 124: 
      var $673=$RP9;
      HEAP32[(($673)>>2)]=0;
      label = 126; break;
    case 125: 
      _abort();
      throw "Reached an unreachable!"
    case 126: 
      label = 127; break;
    case 127: 
      label = 128; break;
    case 128: 
      var $678=$XP6;
      var $679=(($678)|(0))!=0;
      if ($679) { label = 129; break; } else { label = 156; break; }
    case 129: 
      var $681=$TP5;
      var $682=(($681+28)|0);
      var $683=HEAP32[(($682)>>2)];
      var $684=$1;
      var $685=(($684+304)|0);
      var $686=(($685+($683<<2))|0);
      $H11=$686;
      var $687=$TP5;
      var $688=$H11;
      var $689=HEAP32[(($688)>>2)];
      var $690=(($687)|(0))==(($689)|(0));
      if ($690) { label = 130; break; } else { label = 133; break; }
    case 130: 
      var $692=$R7;
      var $693=$H11;
      HEAP32[(($693)>>2)]=$692;
      var $694=(($692)|(0))==0;
      if ($694) { label = 131; break; } else { label = 132; break; }
    case 131: 
      var $696=$TP5;
      var $697=(($696+28)|0);
      var $698=HEAP32[(($697)>>2)];
      var $699=1 << $698;
      var $700=$699 ^ -1;
      var $701=$1;
      var $702=(($701+4)|0);
      var $703=HEAP32[(($702)>>2)];
      var $704=$703 & $700;
      HEAP32[(($702)>>2)]=$704;
      label = 132; break;
    case 132: 
      label = 140; break;
    case 133: 
      var $707=$XP6;
      var $708=$707;
      var $709=$1;
      var $710=(($709+16)|0);
      var $711=HEAP32[(($710)>>2)];
      var $712=(($708)>>>(0)) >= (($711)>>>(0));
      var $713=(($712)&(1));
      var $714=($713);
      var $715=(($714)|(0))!=0;
      if ($715) { label = 134; break; } else { label = 138; break; }
    case 134: 
      var $717=$XP6;
      var $718=(($717+16)|0);
      var $719=(($718)|0);
      var $720=HEAP32[(($719)>>2)];
      var $721=$TP5;
      var $722=(($720)|(0))==(($721)|(0));
      if ($722) { label = 135; break; } else { label = 136; break; }
    case 135: 
      var $724=$R7;
      var $725=$XP6;
      var $726=(($725+16)|0);
      var $727=(($726)|0);
      HEAP32[(($727)>>2)]=$724;
      label = 137; break;
    case 136: 
      var $729=$R7;
      var $730=$XP6;
      var $731=(($730+16)|0);
      var $732=(($731+4)|0);
      HEAP32[(($732)>>2)]=$729;
      label = 137; break;
    case 137: 
      label = 139; break;
    case 138: 
      _abort();
      throw "Reached an unreachable!"
    case 139: 
      label = 140; break;
    case 140: 
      var $737=$R7;
      var $738=(($737)|(0))!=0;
      if ($738) { label = 141; break; } else { label = 155; break; }
    case 141: 
      var $740=$R7;
      var $741=$740;
      var $742=$1;
      var $743=(($742+16)|0);
      var $744=HEAP32[(($743)>>2)];
      var $745=(($741)>>>(0)) >= (($744)>>>(0));
      var $746=(($745)&(1));
      var $747=($746);
      var $748=(($747)|(0))!=0;
      if ($748) { label = 142; break; } else { label = 153; break; }
    case 142: 
      var $750=$XP6;
      var $751=$R7;
      var $752=(($751+24)|0);
      HEAP32[(($752)>>2)]=$750;
      var $753=$TP5;
      var $754=(($753+16)|0);
      var $755=(($754)|0);
      var $756=HEAP32[(($755)>>2)];
      $C012=$756;
      var $757=(($756)|(0))!=0;
      if ($757) { label = 143; break; } else { label = 147; break; }
    case 143: 
      var $759=$C012;
      var $760=$759;
      var $761=$1;
      var $762=(($761+16)|0);
      var $763=HEAP32[(($762)>>2)];
      var $764=(($760)>>>(0)) >= (($763)>>>(0));
      var $765=(($764)&(1));
      var $766=($765);
      var $767=(($766)|(0))!=0;
      if ($767) { label = 144; break; } else { label = 145; break; }
    case 144: 
      var $769=$C012;
      var $770=$R7;
      var $771=(($770+16)|0);
      var $772=(($771)|0);
      HEAP32[(($772)>>2)]=$769;
      var $773=$R7;
      var $774=$C012;
      var $775=(($774+24)|0);
      HEAP32[(($775)>>2)]=$773;
      label = 146; break;
    case 145: 
      _abort();
      throw "Reached an unreachable!"
    case 146: 
      label = 147; break;
    case 147: 
      var $779=$TP5;
      var $780=(($779+16)|0);
      var $781=(($780+4)|0);
      var $782=HEAP32[(($781)>>2)];
      $C113=$782;
      var $783=(($782)|(0))!=0;
      if ($783) { label = 148; break; } else { label = 152; break; }
    case 148: 
      var $785=$C113;
      var $786=$785;
      var $787=$1;
      var $788=(($787+16)|0);
      var $789=HEAP32[(($788)>>2)];
      var $790=(($786)>>>(0)) >= (($789)>>>(0));
      var $791=(($790)&(1));
      var $792=($791);
      var $793=(($792)|(0))!=0;
      if ($793) { label = 149; break; } else { label = 150; break; }
    case 149: 
      var $795=$C113;
      var $796=$R7;
      var $797=(($796+16)|0);
      var $798=(($797+4)|0);
      HEAP32[(($798)>>2)]=$795;
      var $799=$R7;
      var $800=$C113;
      var $801=(($800+24)|0);
      HEAP32[(($801)>>2)]=$799;
      label = 151; break;
    case 150: 
      _abort();
      throw "Reached an unreachable!"
    case 151: 
      label = 152; break;
    case 152: 
      label = 154; break;
    case 153: 
      _abort();
      throw "Reached an unreachable!"
    case 154: 
      label = 155; break;
    case 155: 
      label = 156; break;
    case 156: 
      label = 157; break;
    case 157: 
      var $810=$3;
      var $811=$810 | 1;
      var $812=$2;
      var $813=(($812+4)|0);
      HEAP32[(($813)>>2)]=$811;
      var $814=$3;
      var $815=$2;
      var $816=$815;
      var $817=$3;
      var $818=(($816+$817)|0);
      var $819=$818;
      var $820=(($819)|0);
      HEAP32[(($820)>>2)]=$814;
      var $821=$2;
      var $822=$1;
      var $823=(($822+20)|0);
      var $824=HEAP32[(($823)>>2)];
      var $825=(($821)|(0))==(($824)|(0));
      if ($825) { label = 158; break; } else { label = 159; break; }
    case 158: 
      var $827=$3;
      var $828=$1;
      var $829=(($828+8)|0);
      HEAP32[(($829)>>2)]=$827;
      label = 200; break;
    case 159: 
      label = 160; break;
    case 160: 
      label = 161; break;
    case 161: 
      label = 163; break;
    case 162: 
      var $834=$next;
      var $835=(($834+4)|0);
      var $836=HEAP32[(($835)>>2)];
      var $837=$836 & -2;
      HEAP32[(($835)>>2)]=$837;
      var $838=$3;
      var $839=$838 | 1;
      var $840=$2;
      var $841=(($840+4)|0);
      HEAP32[(($841)>>2)]=$839;
      var $842=$3;
      var $843=$2;
      var $844=$843;
      var $845=$3;
      var $846=(($844+$845)|0);
      var $847=$846;
      var $848=(($847)|0);
      HEAP32[(($848)>>2)]=$842;
      label = 163; break;
    case 163: 
      var $850=$3;
      var $851=$850 >>> 3;
      var $852=(($851)>>>(0)) < 32;
      if ($852) { label = 164; break; } else { label = 171; break; }
    case 164: 
      var $854=$3;
      var $855=$854 >>> 3;
      $I14=$855;
      var $856=$I14;
      var $857=$856 << 1;
      var $858=$1;
      var $859=(($858+40)|0);
      var $860=(($859+($857<<2))|0);
      var $861=$860;
      var $862=$861;
      $B15=$862;
      var $863=$B15;
      $F16=$863;
      var $864=$1;
      var $865=(($864)|0);
      var $866=HEAP32[(($865)>>2)];
      var $867=$I14;
      var $868=1 << $867;
      var $869=$866 & $868;
      var $870=(($869)|(0))!=0;
      if ($870) { label = 166; break; } else { label = 165; break; }
    case 165: 
      var $872=$I14;
      var $873=1 << $872;
      var $874=$1;
      var $875=(($874)|0);
      var $876=HEAP32[(($875)>>2)];
      var $877=$876 | $873;
      HEAP32[(($875)>>2)]=$877;
      label = 170; break;
    case 166: 
      var $879=$B15;
      var $880=(($879+8)|0);
      var $881=HEAP32[(($880)>>2)];
      var $882=$881;
      var $883=$1;
      var $884=(($883+16)|0);
      var $885=HEAP32[(($884)>>2)];
      var $886=(($882)>>>(0)) >= (($885)>>>(0));
      var $887=(($886)&(1));
      var $888=($887);
      var $889=(($888)|(0))!=0;
      if ($889) { label = 167; break; } else { label = 168; break; }
    case 167: 
      var $891=$B15;
      var $892=(($891+8)|0);
      var $893=HEAP32[(($892)>>2)];
      $F16=$893;
      label = 169; break;
    case 168: 
      _abort();
      throw "Reached an unreachable!"
    case 169: 
      label = 170; break;
    case 170: 
      var $897=$2;
      var $898=$B15;
      var $899=(($898+8)|0);
      HEAP32[(($899)>>2)]=$897;
      var $900=$2;
      var $901=$F16;
      var $902=(($901+12)|0);
      HEAP32[(($902)>>2)]=$900;
      var $903=$F16;
      var $904=$2;
      var $905=(($904+8)|0);
      HEAP32[(($905)>>2)]=$903;
      var $906=$B15;
      var $907=$2;
      var $908=(($907+12)|0);
      HEAP32[(($908)>>2)]=$906;
      label = 198; break;
    case 171: 
      var $910=$2;
      var $911=$910;
      $TP17=$911;
      var $912=$3;
      var $913=$912 >>> 8;
      $X=$913;
      var $914=$X;
      var $915=(($914)|(0))==0;
      if ($915) { label = 172; break; } else { label = 173; break; }
    case 172: 
      $I19=0;
      label = 177; break;
    case 173: 
      var $918=$X;
      var $919=(($918)>>>(0)) > 65535;
      if ($919) { label = 174; break; } else { label = 175; break; }
    case 174: 
      $I19=31;
      label = 176; break;
    case 175: 
      var $922=$X;
      $Y=$922;
      var $923=$Y;
      var $924=((($923)-(256))|0);
      var $925=$924 >>> 16;
      var $926=$925 & 8;
      $N=$926;
      var $927=$N;
      var $928=$Y;
      var $929=$928 << $927;
      $Y=$929;
      var $930=((($929)-(4096))|0);
      var $931=$930 >>> 16;
      var $932=$931 & 4;
      $K=$932;
      var $933=$K;
      var $934=$N;
      var $935=((($934)+($933))|0);
      $N=$935;
      var $936=$K;
      var $937=$Y;
      var $938=$937 << $936;
      $Y=$938;
      var $939=((($938)-(16384))|0);
      var $940=$939 >>> 16;
      var $941=$940 & 2;
      $K=$941;
      var $942=$N;
      var $943=((($942)+($941))|0);
      $N=$943;
      var $944=$N;
      var $945=(((14)-($944))|0);
      var $946=$K;
      var $947=$Y;
      var $948=$947 << $946;
      $Y=$948;
      var $949=$948 >>> 15;
      var $950=((($945)+($949))|0);
      $K=$950;
      var $951=$K;
      var $952=$951 << 1;
      var $953=$3;
      var $954=$K;
      var $955=((($954)+(7))|0);
      var $956=$953 >>> (($955)>>>(0));
      var $957=$956 & 1;
      var $958=((($952)+($957))|0);
      $I19=$958;
      label = 176; break;
    case 176: 
      label = 177; break;
    case 177: 
      var $961=$I19;
      var $962=$1;
      var $963=(($962+304)|0);
      var $964=(($963+($961<<2))|0);
      $H18=$964;
      var $965=$I19;
      var $966=$TP17;
      var $967=(($966+28)|0);
      HEAP32[(($967)>>2)]=$965;
      var $968=$TP17;
      var $969=(($968+16)|0);
      var $970=(($969+4)|0);
      HEAP32[(($970)>>2)]=0;
      var $971=$TP17;
      var $972=(($971+16)|0);
      var $973=(($972)|0);
      HEAP32[(($973)>>2)]=0;
      var $974=$1;
      var $975=(($974+4)|0);
      var $976=HEAP32[(($975)>>2)];
      var $977=$I19;
      var $978=1 << $977;
      var $979=$976 & $978;
      var $980=(($979)|(0))!=0;
      if ($980) { label = 179; break; } else { label = 178; break; }
    case 178: 
      var $982=$I19;
      var $983=1 << $982;
      var $984=$1;
      var $985=(($984+4)|0);
      var $986=HEAP32[(($985)>>2)];
      var $987=$986 | $983;
      HEAP32[(($985)>>2)]=$987;
      var $988=$TP17;
      var $989=$H18;
      HEAP32[(($989)>>2)]=$988;
      var $990=$H18;
      var $991=$990;
      var $992=$TP17;
      var $993=(($992+24)|0);
      HEAP32[(($993)>>2)]=$991;
      var $994=$TP17;
      var $995=$TP17;
      var $996=(($995+12)|0);
      HEAP32[(($996)>>2)]=$994;
      var $997=$TP17;
      var $998=(($997+8)|0);
      HEAP32[(($998)>>2)]=$994;
      label = 197; break;
    case 179: 
      var $1000=$H18;
      var $1001=HEAP32[(($1000)>>2)];
      $T=$1001;
      var $1002=$3;
      var $1003=$I19;
      var $1004=(($1003)|(0))==31;
      if ($1004) { label = 180; break; } else { label = 181; break; }
    case 180: 
      var $1013 = 0;label = 182; break;
    case 181: 
      var $1007=$I19;
      var $1008=$1007 >>> 1;
      var $1009=((($1008)+(8))|0);
      var $1010=((($1009)-(2))|0);
      var $1011=(((31)-($1010))|0);
      var $1013 = $1011;label = 182; break;
    case 182: 
      var $1013;
      var $1014=$1002 << $1013;
      $K20=$1014;
      label = 183; break;
    case 183: 
      var $1016=$T;
      var $1017=(($1016+4)|0);
      var $1018=HEAP32[(($1017)>>2)];
      var $1019=$1018 & -8;
      var $1020=$3;
      var $1021=(($1019)|(0))!=(($1020)|(0));
      if ($1021) { label = 184; break; } else { label = 190; break; }
    case 184: 
      var $1023=$K20;
      var $1024=$1023 >>> 31;
      var $1025=$1024 & 1;
      var $1026=$T;
      var $1027=(($1026+16)|0);
      var $1028=(($1027+($1025<<2))|0);
      $C=$1028;
      var $1029=$K20;
      var $1030=$1029 << 1;
      $K20=$1030;
      var $1031=$C;
      var $1032=HEAP32[(($1031)>>2)];
      var $1033=(($1032)|(0))!=0;
      if ($1033) { label = 185; break; } else { label = 186; break; }
    case 185: 
      var $1035=$C;
      var $1036=HEAP32[(($1035)>>2)];
      $T=$1036;
      label = 189; break;
    case 186: 
      var $1038=$C;
      var $1039=$1038;
      var $1040=$1;
      var $1041=(($1040+16)|0);
      var $1042=HEAP32[(($1041)>>2)];
      var $1043=(($1039)>>>(0)) >= (($1042)>>>(0));
      var $1044=(($1043)&(1));
      var $1045=($1044);
      var $1046=(($1045)|(0))!=0;
      if ($1046) { label = 187; break; } else { label = 188; break; }
    case 187: 
      var $1048=$TP17;
      var $1049=$C;
      HEAP32[(($1049)>>2)]=$1048;
      var $1050=$T;
      var $1051=$TP17;
      var $1052=(($1051+24)|0);
      HEAP32[(($1052)>>2)]=$1050;
      var $1053=$TP17;
      var $1054=$TP17;
      var $1055=(($1054+12)|0);
      HEAP32[(($1055)>>2)]=$1053;
      var $1056=$TP17;
      var $1057=(($1056+8)|0);
      HEAP32[(($1057)>>2)]=$1053;
      label = 196; break;
    case 188: 
      _abort();
      throw "Reached an unreachable!"
    case 189: 
      label = 195; break;
    case 190: 
      var $1061=$T;
      var $1062=(($1061+8)|0);
      var $1063=HEAP32[(($1062)>>2)];
      $F21=$1063;
      var $1064=$T;
      var $1065=$1064;
      var $1066=$1;
      var $1067=(($1066+16)|0);
      var $1068=HEAP32[(($1067)>>2)];
      var $1069=(($1065)>>>(0)) >= (($1068)>>>(0));
      if ($1069) { label = 191; break; } else { var $1078 = 0;label = 192; break; }
    case 191: 
      var $1071=$F21;
      var $1072=$1071;
      var $1073=$1;
      var $1074=(($1073+16)|0);
      var $1075=HEAP32[(($1074)>>2)];
      var $1076=(($1072)>>>(0)) >= (($1075)>>>(0));
      var $1078 = $1076;label = 192; break;
    case 192: 
      var $1078;
      var $1079=(($1078)&(1));
      var $1080=($1079);
      var $1081=(($1080)|(0))!=0;
      if ($1081) { label = 193; break; } else { label = 194; break; }
    case 193: 
      var $1083=$TP17;
      var $1084=$F21;
      var $1085=(($1084+12)|0);
      HEAP32[(($1085)>>2)]=$1083;
      var $1086=$T;
      var $1087=(($1086+8)|0);
      HEAP32[(($1087)>>2)]=$1083;
      var $1088=$F21;
      var $1089=$TP17;
      var $1090=(($1089+8)|0);
      HEAP32[(($1090)>>2)]=$1088;
      var $1091=$T;
      var $1092=$TP17;
      var $1093=(($1092+12)|0);
      HEAP32[(($1093)>>2)]=$1091;
      var $1094=$TP17;
      var $1095=(($1094+24)|0);
      HEAP32[(($1095)>>2)]=0;
      label = 196; break;
    case 194: 
      _abort();
      throw "Reached an unreachable!"
    case 195: 
      label = 183; break;
    case 196: 
      label = 197; break;
    case 197: 
      label = 198; break;
    case 198: 
      label = 200; break;
    case 199: 
      _abort();
      throw "Reached an unreachable!"
    case 200: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _mmap_resize($m, $oldp, $nb, $flags) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $oldsize;
      var $offset;
      var $oldmmsize;
      var $newmmsize;
      var $cp;
      var $newp;
      var $psize;
      $2=$m;
      $3=$oldp;
      $4=$nb;
      $5=$flags;
      var $6=$3;
      var $7=(($6+4)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=$8 & -8;
      $oldsize=$9;
      var $10=$5;
      var $11=$4;
      var $12=$11 >>> 3;
      var $13=(($12)>>>(0)) < 32;
      if ($13) { label = 2; break; } else { label = 3; break; }
    case 2: 
      $1=0;
      label = 14; break;
    case 3: 
      var $16=$oldsize;
      var $17=$4;
      var $18=((($17)+(4))|0);
      var $19=(($16)>>>(0)) >= (($18)>>>(0));
      if ($19) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $21=$oldsize;
      var $22=$4;
      var $23=((($21)-($22))|0);
      var $24=HEAP32[((((5249928)|0))>>2)];
      var $25=$24 << 1;
      var $26=(($23)>>>(0)) <= (($25)>>>(0));
      if ($26) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $28=$3;
      $1=$28;
      label = 14; break;
    case 6: 
      var $30=$3;
      var $31=(($30)|0);
      var $32=HEAP32[(($31)>>2)];
      $offset=$32;
      var $33=$oldsize;
      var $34=$offset;
      var $35=((($33)+($34))|0);
      var $36=((($35)+(16))|0);
      $oldmmsize=$36;
      var $37=$4;
      var $38=((($37)+(24))|0);
      var $39=((($38)+(7))|0);
      var $40=HEAP32[((((5249924)|0))>>2)];
      var $41=((($40)-(1))|0);
      var $42=((($39)+($41))|0);
      var $43=HEAP32[((((5249924)|0))>>2)];
      var $44=((($43)-(1))|0);
      var $45=$44 ^ -1;
      var $46=$42 & $45;
      $newmmsize=$46;
      $cp=-1;
      var $47=$cp;
      var $48=(($47)|(0))!=-1;
      if ($48) { label = 7; break; } else { label = 12; break; }
    case 7: 
      var $50=$cp;
      var $51=$offset;
      var $52=(($50+$51)|0);
      var $53=$52;
      $newp=$53;
      var $54=$newmmsize;
      var $55=$offset;
      var $56=((($54)-($55))|0);
      var $57=((($56)-(16))|0);
      $psize=$57;
      var $58=$psize;
      var $59=$newp;
      var $60=(($59+4)|0);
      HEAP32[(($60)>>2)]=$58;
      var $61=$newp;
      var $62=$61;
      var $63=$psize;
      var $64=(($62+$63)|0);
      var $65=$64;
      var $66=(($65+4)|0);
      HEAP32[(($66)>>2)]=7;
      var $67=$newp;
      var $68=$67;
      var $69=$psize;
      var $70=((($69)+(4))|0);
      var $71=(($68+$70)|0);
      var $72=$71;
      var $73=(($72+4)|0);
      HEAP32[(($73)>>2)]=0;
      var $74=$cp;
      var $75=$2;
      var $76=(($75+16)|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=(($74)>>>(0)) < (($77)>>>(0));
      if ($78) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $80=$cp;
      var $81=$2;
      var $82=(($81+16)|0);
      HEAP32[(($82)>>2)]=$80;
      label = 9; break;
    case 9: 
      var $84=$newmmsize;
      var $85=$oldmmsize;
      var $86=((($84)-($85))|0);
      var $87=$2;
      var $88=(($87+432)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=((($89)+($86))|0);
      HEAP32[(($88)>>2)]=$90;
      var $91=$2;
      var $92=(($91+436)|0);
      var $93=HEAP32[(($92)>>2)];
      var $94=(($90)>>>(0)) > (($93)>>>(0));
      if ($94) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $96=$2;
      var $97=(($96+432)|0);
      var $98=HEAP32[(($97)>>2)];
      var $99=$2;
      var $100=(($99+436)|0);
      HEAP32[(($100)>>2)]=$98;
      label = 11; break;
    case 11: 
      var $102=$newp;
      $1=$102;
      label = 14; break;
    case 12: 
      label = 13; break;
    case 13: 
      $1=0;
      label = 14; break;
    case 14: 
      var $106=$1;
      return $106;
    default: assert(0, "bad label: " + label);
  }
}
function _segment_holding($m, $addr) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $sp;
      $2=$m;
      $3=$addr;
      var $4=$2;
      var $5=(($4+448)|0);
      $sp=$5;
      label = 2; break;
    case 2: 
      var $7=$3;
      var $8=$sp;
      var $9=(($8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($7)>>>(0)) >= (($10)>>>(0));
      if ($11) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $13=$3;
      var $14=$sp;
      var $15=(($14)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$sp;
      var $18=(($17+4)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=(($16+$19)|0);
      var $21=(($13)>>>(0)) < (($20)>>>(0));
      if ($21) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $23=$sp;
      $1=$23;
      label = 8; break;
    case 5: 
      var $25=$sp;
      var $26=(($25+8)|0);
      var $27=HEAP32[(($26)>>2)];
      $sp=$27;
      var $28=(($27)|(0))==0;
      if ($28) { label = 6; break; } else { label = 7; break; }
    case 6: 
      $1=0;
      label = 8; break;
    case 7: 
      label = 2; break;
    case 8: 
      var $32=$1;
      return $32;
    default: assert(0, "bad label: " + label);
  }
}
function _init_top($m, $p, $psize) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $offset;
      $1=$m;
      $2=$p;
      $3=$psize;
      var $4=$2;
      var $5=$4;
      var $6=(($5+8)|0);
      var $7=$6;
      var $8=$7 & 7;
      var $9=(($8)|(0))==0;
      if ($9) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $20 = 0;label = 4; break;
    case 3: 
      var $12=$2;
      var $13=$12;
      var $14=(($13+8)|0);
      var $15=$14;
      var $16=$15 & 7;
      var $17=(((8)-($16))|0);
      var $18=$17 & 7;
      var $20 = $18;label = 4; break;
    case 4: 
      var $20;
      $offset=$20;
      var $21=$2;
      var $22=$21;
      var $23=$offset;
      var $24=(($22+$23)|0);
      var $25=$24;
      $2=$25;
      var $26=$offset;
      var $27=$3;
      var $28=((($27)-($26))|0);
      $3=$28;
      var $29=$2;
      var $30=$1;
      var $31=(($30+24)|0);
      HEAP32[(($31)>>2)]=$29;
      var $32=$3;
      var $33=$1;
      var $34=(($33+12)|0);
      HEAP32[(($34)>>2)]=$32;
      var $35=$3;
      var $36=$35 | 1;
      var $37=$2;
      var $38=(($37+4)|0);
      HEAP32[(($38)>>2)]=$36;
      var $39=$2;
      var $40=$39;
      var $41=$3;
      var $42=(($40+$41)|0);
      var $43=$42;
      var $44=(($43+4)|0);
      HEAP32[(($44)>>2)]=40;
      var $45=HEAP32[((((5249936)|0))>>2)];
      var $46=$1;
      var $47=(($46+28)|0);
      HEAP32[(($47)>>2)]=$45;
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _mmap_alloc($m, $nb) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $mmsize;
      var $fp;
      var $mm;
      var $offset;
      var $psize;
      var $p;
      $2=$m;
      $3=$nb;
      var $4=$3;
      var $5=((($4)+(24))|0);
      var $6=((($5)+(7))|0);
      var $7=HEAP32[((((5249924)|0))>>2)];
      var $8=((($7)-(1))|0);
      var $9=((($6)+($8))|0);
      var $10=HEAP32[((((5249924)|0))>>2)];
      var $11=((($10)-(1))|0);
      var $12=$11 ^ -1;
      var $13=$9 & $12;
      $mmsize=$13;
      var $14=$2;
      var $15=(($14+440)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=(($16)|(0))!=0;
      if ($17) { label = 2; break; } else { label = 6; break; }
    case 2: 
      var $19=$2;
      var $20=(($19+432)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$mmsize;
      var $23=((($21)+($22))|0);
      $fp=$23;
      var $24=$fp;
      var $25=$2;
      var $26=(($25+432)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=(($24)>>>(0)) <= (($27)>>>(0));
      if ($28) { label = 4; break; } else { label = 3; break; }
    case 3: 
      var $30=$fp;
      var $31=$2;
      var $32=(($31+440)|0);
      var $33=HEAP32[(($32)>>2)];
      var $34=(($30)>>>(0)) > (($33)>>>(0));
      if ($34) { label = 4; break; } else { label = 5; break; }
    case 4: 
      $1=0;
      label = 19; break;
    case 5: 
      label = 6; break;
    case 6: 
      var $38=$mmsize;
      var $39=$3;
      var $40=(($38)>>>(0)) > (($39)>>>(0));
      if ($40) { label = 7; break; } else { label = 18; break; }
    case 7: 
      $mm=-1;
      var $42=$mm;
      var $43=(($42)|(0))!=-1;
      if ($43) { label = 8; break; } else { label = 17; break; }
    case 8: 
      var $45=$mm;
      var $46=(($45+8)|0);
      var $47=$46;
      var $48=$47 & 7;
      var $49=(($48)|(0))==0;
      if ($49) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $59 = 0;label = 11; break;
    case 10: 
      var $52=$mm;
      var $53=(($52+8)|0);
      var $54=$53;
      var $55=$54 & 7;
      var $56=(((8)-($55))|0);
      var $57=$56 & 7;
      var $59 = $57;label = 11; break;
    case 11: 
      var $59;
      $offset=$59;
      var $60=$mmsize;
      var $61=$offset;
      var $62=((($60)-($61))|0);
      var $63=((($62)-(16))|0);
      $psize=$63;
      var $64=$mm;
      var $65=$offset;
      var $66=(($64+$65)|0);
      var $67=$66;
      $p=$67;
      var $68=$offset;
      var $69=$p;
      var $70=(($69)|0);
      HEAP32[(($70)>>2)]=$68;
      var $71=$psize;
      var $72=$p;
      var $73=(($72+4)|0);
      HEAP32[(($73)>>2)]=$71;
      var $74=$p;
      var $75=$74;
      var $76=$psize;
      var $77=(($75+$76)|0);
      var $78=$77;
      var $79=(($78+4)|0);
      HEAP32[(($79)>>2)]=7;
      var $80=$p;
      var $81=$80;
      var $82=$psize;
      var $83=((($82)+(4))|0);
      var $84=(($81+$83)|0);
      var $85=$84;
      var $86=(($85+4)|0);
      HEAP32[(($86)>>2)]=0;
      var $87=$2;
      var $88=(($87+16)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=(($89)|(0))==0;
      if ($90) { label = 13; break; } else { label = 12; break; }
    case 12: 
      var $92=$mm;
      var $93=$2;
      var $94=(($93+16)|0);
      var $95=HEAP32[(($94)>>2)];
      var $96=(($92)>>>(0)) < (($95)>>>(0));
      if ($96) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $98=$mm;
      var $99=$2;
      var $100=(($99+16)|0);
      HEAP32[(($100)>>2)]=$98;
      label = 14; break;
    case 14: 
      var $102=$mmsize;
      var $103=$2;
      var $104=(($103+432)|0);
      var $105=HEAP32[(($104)>>2)];
      var $106=((($105)+($102))|0);
      HEAP32[(($104)>>2)]=$106;
      var $107=$2;
      var $108=(($107+436)|0);
      var $109=HEAP32[(($108)>>2)];
      var $110=(($106)>>>(0)) > (($109)>>>(0));
      if ($110) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $112=$2;
      var $113=(($112+432)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$2;
      var $116=(($115+436)|0);
      HEAP32[(($116)>>2)]=$114;
      label = 16; break;
    case 16: 
      var $118=$p;
      var $119=$118;
      var $120=(($119+8)|0);
      $1=$120;
      label = 19; break;
    case 17: 
      label = 18; break;
    case 18: 
      $1=0;
      label = 19; break;
    case 19: 
      var $124=$1;
      return $124;
    default: assert(0, "bad label: " + label);
  }
}
function _init_bins($m) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $i;
      var $bin;
      $1=$m;
      $i=0;
      label = 2; break;
    case 2: 
      var $3=$i;
      var $4=(($3)>>>(0)) < 32;
      if ($4) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $6=$i;
      var $7=$6 << 1;
      var $8=$1;
      var $9=(($8+40)|0);
      var $10=(($9+($7<<2))|0);
      var $11=$10;
      var $12=$11;
      $bin=$12;
      var $13=$bin;
      var $14=$bin;
      var $15=(($14+12)|0);
      HEAP32[(($15)>>2)]=$13;
      var $16=$bin;
      var $17=(($16+8)|0);
      HEAP32[(($17)>>2)]=$13;
      label = 4; break;
    case 4: 
      var $19=$i;
      var $20=((($19)+(1))|0);
      $i=$20;
      label = 2; break;
    case 5: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _prepend_alloc($m, $newbase, $oldbase, $nb) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $p;
      var $oldfirst;
      var $psize;
      var $q;
      var $qsize;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F1;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I2;
      var $B3;
      var $F4;
      var $TP5;
      var $H6;
      var $I7;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K8;
      var $C;
      var $F9;
      $1=$m;
      $2=$newbase;
      $3=$oldbase;
      $4=$nb;
      var $5=$2;
      var $6=$2;
      var $7=(($6+8)|0);
      var $8=$7;
      var $9=$8 & 7;
      var $10=(($9)|(0))==0;
      if ($10) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $20 = 0;label = 4; break;
    case 3: 
      var $13=$2;
      var $14=(($13+8)|0);
      var $15=$14;
      var $16=$15 & 7;
      var $17=(((8)-($16))|0);
      var $18=$17 & 7;
      var $20 = $18;label = 4; break;
    case 4: 
      var $20;
      var $21=(($5+$20)|0);
      var $22=$21;
      $p=$22;
      var $23=$3;
      var $24=$3;
      var $25=(($24+8)|0);
      var $26=$25;
      var $27=$26 & 7;
      var $28=(($27)|(0))==0;
      if ($28) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $38 = 0;label = 7; break;
    case 6: 
      var $31=$3;
      var $32=(($31+8)|0);
      var $33=$32;
      var $34=$33 & 7;
      var $35=(((8)-($34))|0);
      var $36=$35 & 7;
      var $38 = $36;label = 7; break;
    case 7: 
      var $38;
      var $39=(($23+$38)|0);
      var $40=$39;
      $oldfirst=$40;
      var $41=$oldfirst;
      var $42=$41;
      var $43=$p;
      var $44=$43;
      var $45=$42;
      var $46=$44;
      var $47=((($45)-($46))|0);
      $psize=$47;
      var $48=$p;
      var $49=$48;
      var $50=$4;
      var $51=(($49+$50)|0);
      var $52=$51;
      $q=$52;
      var $53=$psize;
      var $54=$4;
      var $55=((($53)-($54))|0);
      $qsize=$55;
      var $56=$4;
      var $57=$56 | 1;
      var $58=$57 | 2;
      var $59=$p;
      var $60=(($59+4)|0);
      HEAP32[(($60)>>2)]=$58;
      var $61=$oldfirst;
      var $62=$1;
      var $63=(($62+24)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=(($61)|(0))==(($64)|(0));
      if ($65) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $67=$qsize;
      var $68=$1;
      var $69=(($68+12)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=((($70)+($67))|0);
      HEAP32[(($69)>>2)]=$71;
      $tsize=$71;
      var $72=$q;
      var $73=$1;
      var $74=(($73+24)|0);
      HEAP32[(($74)>>2)]=$72;
      var $75=$tsize;
      var $76=$75 | 1;
      var $77=$q;
      var $78=(($77+4)|0);
      HEAP32[(($78)>>2)]=$76;
      label = 118; break;
    case 9: 
      var $80=$oldfirst;
      var $81=$1;
      var $82=(($81+20)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=(($80)|(0))==(($83)|(0));
      if ($84) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $86=$qsize;
      var $87=$1;
      var $88=(($87+8)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=((($89)+($86))|0);
      HEAP32[(($88)>>2)]=$90;
      $dsize=$90;
      var $91=$q;
      var $92=$1;
      var $93=(($92+20)|0);
      HEAP32[(($93)>>2)]=$91;
      var $94=$dsize;
      var $95=$94 | 1;
      var $96=$q;
      var $97=(($96+4)|0);
      HEAP32[(($97)>>2)]=$95;
      var $98=$dsize;
      var $99=$q;
      var $100=$99;
      var $101=$dsize;
      var $102=(($100+$101)|0);
      var $103=$102;
      var $104=(($103)|0);
      HEAP32[(($104)>>2)]=$98;
      label = 117; break;
    case 11: 
      var $106=$oldfirst;
      var $107=(($106+4)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=$108 & 3;
      var $110=(($109)|(0))!=1;
      if ($110) { label = 81; break; } else { label = 12; break; }
    case 12: 
      var $112=$oldfirst;
      var $113=(($112+4)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$114 & -8;
      $nsize=$115;
      var $116=$nsize;
      var $117=$116 >>> 3;
      var $118=(($117)>>>(0)) < 32;
      if ($118) { label = 13; break; } else { label = 31; break; }
    case 13: 
      var $120=$oldfirst;
      var $121=(($120+8)|0);
      var $122=HEAP32[(($121)>>2)];
      $F=$122;
      var $123=$oldfirst;
      var $124=(($123+12)|0);
      var $125=HEAP32[(($124)>>2)];
      $B=$125;
      var $126=$nsize;
      var $127=$126 >>> 3;
      $I=$127;
      var $128=$F;
      var $129=$I;
      var $130=$129 << 1;
      var $131=$1;
      var $132=(($131+40)|0);
      var $133=(($132+($130<<2))|0);
      var $134=$133;
      var $135=$134;
      var $136=(($128)|(0))==(($135)|(0));
      if ($136) { var $153 = 1;label = 17; break; } else { label = 14; break; }
    case 14: 
      var $138=$F;
      var $139=$138;
      var $140=$1;
      var $141=(($140+16)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=(($139)>>>(0)) >= (($142)>>>(0));
      if ($143) { label = 15; break; } else { var $151 = 0;label = 16; break; }
    case 15: 
      var $145=$F;
      var $146=(($145+12)|0);
      var $147=HEAP32[(($146)>>2)];
      var $148=$oldfirst;
      var $149=(($147)|(0))==(($148)|(0));
      var $151 = $149;label = 16; break;
    case 16: 
      var $151;
      var $153 = $151;label = 17; break;
    case 17: 
      var $153;
      var $154=(($153)&(1));
      var $155=($154);
      var $156=(($155)|(0))!=0;
      if ($156) { label = 18; break; } else { label = 29; break; }
    case 18: 
      var $158=$B;
      var $159=$F;
      var $160=(($158)|(0))==(($159)|(0));
      if ($160) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $162=$I;
      var $163=1 << $162;
      var $164=$163 ^ -1;
      var $165=$1;
      var $166=(($165)|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=$167 & $164;
      HEAP32[(($166)>>2)]=$168;
      label = 28; break;
    case 20: 
      var $170=$B;
      var $171=$I;
      var $172=$171 << 1;
      var $173=$1;
      var $174=(($173+40)|0);
      var $175=(($174+($172<<2))|0);
      var $176=$175;
      var $177=$176;
      var $178=(($170)|(0))==(($177)|(0));
      if ($178) { var $195 = 1;label = 24; break; } else { label = 21; break; }
    case 21: 
      var $180=$B;
      var $181=$180;
      var $182=$1;
      var $183=(($182+16)|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=(($181)>>>(0)) >= (($184)>>>(0));
      if ($185) { label = 22; break; } else { var $193 = 0;label = 23; break; }
    case 22: 
      var $187=$B;
      var $188=(($187+8)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=$oldfirst;
      var $191=(($189)|(0))==(($190)|(0));
      var $193 = $191;label = 23; break;
    case 23: 
      var $193;
      var $195 = $193;label = 24; break;
    case 24: 
      var $195;
      var $196=(($195)&(1));
      var $197=($196);
      var $198=(($197)|(0))!=0;
      if ($198) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $200=$B;
      var $201=$F;
      var $202=(($201+12)|0);
      HEAP32[(($202)>>2)]=$200;
      var $203=$F;
      var $204=$B;
      var $205=(($204+8)|0);
      HEAP32[(($205)>>2)]=$203;
      label = 27; break;
    case 26: 
      _abort();
      throw "Reached an unreachable!"
    case 27: 
      label = 28; break;
    case 28: 
      label = 30; break;
    case 29: 
      _abort();
      throw "Reached an unreachable!"
    case 30: 
      label = 80; break;
    case 31: 
      var $212=$oldfirst;
      var $213=$212;
      $TP=$213;
      var $214=$TP;
      var $215=(($214+24)|0);
      var $216=HEAP32[(($215)>>2)];
      $XP=$216;
      var $217=$TP;
      var $218=(($217+12)|0);
      var $219=HEAP32[(($218)>>2)];
      var $220=$TP;
      var $221=(($219)|(0))!=(($220)|(0));
      if ($221) { label = 32; break; } else { label = 39; break; }
    case 32: 
      var $223=$TP;
      var $224=(($223+8)|0);
      var $225=HEAP32[(($224)>>2)];
      $F1=$225;
      var $226=$TP;
      var $227=(($226+12)|0);
      var $228=HEAP32[(($227)>>2)];
      $R=$228;
      var $229=$F1;
      var $230=$229;
      var $231=$1;
      var $232=(($231+16)|0);
      var $233=HEAP32[(($232)>>2)];
      var $234=(($230)>>>(0)) >= (($233)>>>(0));
      if ($234) { label = 33; break; } else { var $248 = 0;label = 35; break; }
    case 33: 
      var $236=$F1;
      var $237=(($236+12)|0);
      var $238=HEAP32[(($237)>>2)];
      var $239=$TP;
      var $240=(($238)|(0))==(($239)|(0));
      if ($240) { label = 34; break; } else { var $248 = 0;label = 35; break; }
    case 34: 
      var $242=$R;
      var $243=(($242+8)|0);
      var $244=HEAP32[(($243)>>2)];
      var $245=$TP;
      var $246=(($244)|(0))==(($245)|(0));
      var $248 = $246;label = 35; break;
    case 35: 
      var $248;
      var $249=(($248)&(1));
      var $250=($249);
      var $251=(($250)|(0))!=0;
      if ($251) { label = 36; break; } else { label = 37; break; }
    case 36: 
      var $253=$R;
      var $254=$F1;
      var $255=(($254+12)|0);
      HEAP32[(($255)>>2)]=$253;
      var $256=$F1;
      var $257=$R;
      var $258=(($257+8)|0);
      HEAP32[(($258)>>2)]=$256;
      label = 38; break;
    case 37: 
      _abort();
      throw "Reached an unreachable!"
    case 38: 
      label = 51; break;
    case 39: 
      var $262=$TP;
      var $263=(($262+16)|0);
      var $264=(($263+4)|0);
      $RP=$264;
      var $265=HEAP32[(($264)>>2)];
      $R=$265;
      var $266=(($265)|(0))!=0;
      if ($266) { label = 41; break; } else { label = 40; break; }
    case 40: 
      var $268=$TP;
      var $269=(($268+16)|0);
      var $270=(($269)|0);
      $RP=$270;
      var $271=HEAP32[(($270)>>2)];
      $R=$271;
      var $272=(($271)|(0))!=0;
      if ($272) { label = 41; break; } else { label = 50; break; }
    case 41: 
      label = 42; break;
    case 42: 
      var $275=$R;
      var $276=(($275+16)|0);
      var $277=(($276+4)|0);
      $CP=$277;
      var $278=HEAP32[(($277)>>2)];
      var $279=(($278)|(0))!=0;
      if ($279) { var $287 = 1;label = 44; break; } else { label = 43; break; }
    case 43: 
      var $281=$R;
      var $282=(($281+16)|0);
      var $283=(($282)|0);
      $CP=$283;
      var $284=HEAP32[(($283)>>2)];
      var $285=(($284)|(0))!=0;
      var $287 = $285;label = 44; break;
    case 44: 
      var $287;
      if ($287) { label = 45; break; } else { label = 46; break; }
    case 45: 
      var $289=$CP;
      $RP=$289;
      var $290=HEAP32[(($289)>>2)];
      $R=$290;
      label = 42; break;
    case 46: 
      var $292=$RP;
      var $293=$292;
      var $294=$1;
      var $295=(($294+16)|0);
      var $296=HEAP32[(($295)>>2)];
      var $297=(($293)>>>(0)) >= (($296)>>>(0));
      var $298=(($297)&(1));
      var $299=($298);
      var $300=(($299)|(0))!=0;
      if ($300) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $302=$RP;
      HEAP32[(($302)>>2)]=0;
      label = 49; break;
    case 48: 
      _abort();
      throw "Reached an unreachable!"
    case 49: 
      label = 50; break;
    case 50: 
      label = 51; break;
    case 51: 
      var $307=$XP;
      var $308=(($307)|(0))!=0;
      if ($308) { label = 52; break; } else { label = 79; break; }
    case 52: 
      var $310=$TP;
      var $311=(($310+28)|0);
      var $312=HEAP32[(($311)>>2)];
      var $313=$1;
      var $314=(($313+304)|0);
      var $315=(($314+($312<<2))|0);
      $H=$315;
      var $316=$TP;
      var $317=$H;
      var $318=HEAP32[(($317)>>2)];
      var $319=(($316)|(0))==(($318)|(0));
      if ($319) { label = 53; break; } else { label = 56; break; }
    case 53: 
      var $321=$R;
      var $322=$H;
      HEAP32[(($322)>>2)]=$321;
      var $323=(($321)|(0))==0;
      if ($323) { label = 54; break; } else { label = 55; break; }
    case 54: 
      var $325=$TP;
      var $326=(($325+28)|0);
      var $327=HEAP32[(($326)>>2)];
      var $328=1 << $327;
      var $329=$328 ^ -1;
      var $330=$1;
      var $331=(($330+4)|0);
      var $332=HEAP32[(($331)>>2)];
      var $333=$332 & $329;
      HEAP32[(($331)>>2)]=$333;
      label = 55; break;
    case 55: 
      label = 63; break;
    case 56: 
      var $336=$XP;
      var $337=$336;
      var $338=$1;
      var $339=(($338+16)|0);
      var $340=HEAP32[(($339)>>2)];
      var $341=(($337)>>>(0)) >= (($340)>>>(0));
      var $342=(($341)&(1));
      var $343=($342);
      var $344=(($343)|(0))!=0;
      if ($344) { label = 57; break; } else { label = 61; break; }
    case 57: 
      var $346=$XP;
      var $347=(($346+16)|0);
      var $348=(($347)|0);
      var $349=HEAP32[(($348)>>2)];
      var $350=$TP;
      var $351=(($349)|(0))==(($350)|(0));
      if ($351) { label = 58; break; } else { label = 59; break; }
    case 58: 
      var $353=$R;
      var $354=$XP;
      var $355=(($354+16)|0);
      var $356=(($355)|0);
      HEAP32[(($356)>>2)]=$353;
      label = 60; break;
    case 59: 
      var $358=$R;
      var $359=$XP;
      var $360=(($359+16)|0);
      var $361=(($360+4)|0);
      HEAP32[(($361)>>2)]=$358;
      label = 60; break;
    case 60: 
      label = 62; break;
    case 61: 
      _abort();
      throw "Reached an unreachable!"
    case 62: 
      label = 63; break;
    case 63: 
      var $366=$R;
      var $367=(($366)|(0))!=0;
      if ($367) { label = 64; break; } else { label = 78; break; }
    case 64: 
      var $369=$R;
      var $370=$369;
      var $371=$1;
      var $372=(($371+16)|0);
      var $373=HEAP32[(($372)>>2)];
      var $374=(($370)>>>(0)) >= (($373)>>>(0));
      var $375=(($374)&(1));
      var $376=($375);
      var $377=(($376)|(0))!=0;
      if ($377) { label = 65; break; } else { label = 76; break; }
    case 65: 
      var $379=$XP;
      var $380=$R;
      var $381=(($380+24)|0);
      HEAP32[(($381)>>2)]=$379;
      var $382=$TP;
      var $383=(($382+16)|0);
      var $384=(($383)|0);
      var $385=HEAP32[(($384)>>2)];
      $C0=$385;
      var $386=(($385)|(0))!=0;
      if ($386) { label = 66; break; } else { label = 70; break; }
    case 66: 
      var $388=$C0;
      var $389=$388;
      var $390=$1;
      var $391=(($390+16)|0);
      var $392=HEAP32[(($391)>>2)];
      var $393=(($389)>>>(0)) >= (($392)>>>(0));
      var $394=(($393)&(1));
      var $395=($394);
      var $396=(($395)|(0))!=0;
      if ($396) { label = 67; break; } else { label = 68; break; }
    case 67: 
      var $398=$C0;
      var $399=$R;
      var $400=(($399+16)|0);
      var $401=(($400)|0);
      HEAP32[(($401)>>2)]=$398;
      var $402=$R;
      var $403=$C0;
      var $404=(($403+24)|0);
      HEAP32[(($404)>>2)]=$402;
      label = 69; break;
    case 68: 
      _abort();
      throw "Reached an unreachable!"
    case 69: 
      label = 70; break;
    case 70: 
      var $408=$TP;
      var $409=(($408+16)|0);
      var $410=(($409+4)|0);
      var $411=HEAP32[(($410)>>2)];
      $C1=$411;
      var $412=(($411)|(0))!=0;
      if ($412) { label = 71; break; } else { label = 75; break; }
    case 71: 
      var $414=$C1;
      var $415=$414;
      var $416=$1;
      var $417=(($416+16)|0);
      var $418=HEAP32[(($417)>>2)];
      var $419=(($415)>>>(0)) >= (($418)>>>(0));
      var $420=(($419)&(1));
      var $421=($420);
      var $422=(($421)|(0))!=0;
      if ($422) { label = 72; break; } else { label = 73; break; }
    case 72: 
      var $424=$C1;
      var $425=$R;
      var $426=(($425+16)|0);
      var $427=(($426+4)|0);
      HEAP32[(($427)>>2)]=$424;
      var $428=$R;
      var $429=$C1;
      var $430=(($429+24)|0);
      HEAP32[(($430)>>2)]=$428;
      label = 74; break;
    case 73: 
      _abort();
      throw "Reached an unreachable!"
    case 74: 
      label = 75; break;
    case 75: 
      label = 77; break;
    case 76: 
      _abort();
      throw "Reached an unreachable!"
    case 77: 
      label = 78; break;
    case 78: 
      label = 79; break;
    case 79: 
      label = 80; break;
    case 80: 
      var $439=$oldfirst;
      var $440=$439;
      var $441=$nsize;
      var $442=(($440+$441)|0);
      var $443=$442;
      $oldfirst=$443;
      var $444=$nsize;
      var $445=$qsize;
      var $446=((($445)+($444))|0);
      $qsize=$446;
      label = 81; break;
    case 81: 
      var $448=$oldfirst;
      var $449=(($448+4)|0);
      var $450=HEAP32[(($449)>>2)];
      var $451=$450 & -2;
      HEAP32[(($449)>>2)]=$451;
      var $452=$qsize;
      var $453=$452 | 1;
      var $454=$q;
      var $455=(($454+4)|0);
      HEAP32[(($455)>>2)]=$453;
      var $456=$qsize;
      var $457=$q;
      var $458=$457;
      var $459=$qsize;
      var $460=(($458+$459)|0);
      var $461=$460;
      var $462=(($461)|0);
      HEAP32[(($462)>>2)]=$456;
      var $463=$qsize;
      var $464=$463 >>> 3;
      var $465=(($464)>>>(0)) < 32;
      if ($465) { label = 82; break; } else { label = 89; break; }
    case 82: 
      var $467=$qsize;
      var $468=$467 >>> 3;
      $I2=$468;
      var $469=$I2;
      var $470=$469 << 1;
      var $471=$1;
      var $472=(($471+40)|0);
      var $473=(($472+($470<<2))|0);
      var $474=$473;
      var $475=$474;
      $B3=$475;
      var $476=$B3;
      $F4=$476;
      var $477=$1;
      var $478=(($477)|0);
      var $479=HEAP32[(($478)>>2)];
      var $480=$I2;
      var $481=1 << $480;
      var $482=$479 & $481;
      var $483=(($482)|(0))!=0;
      if ($483) { label = 84; break; } else { label = 83; break; }
    case 83: 
      var $485=$I2;
      var $486=1 << $485;
      var $487=$1;
      var $488=(($487)|0);
      var $489=HEAP32[(($488)>>2)];
      var $490=$489 | $486;
      HEAP32[(($488)>>2)]=$490;
      label = 88; break;
    case 84: 
      var $492=$B3;
      var $493=(($492+8)|0);
      var $494=HEAP32[(($493)>>2)];
      var $495=$494;
      var $496=$1;
      var $497=(($496+16)|0);
      var $498=HEAP32[(($497)>>2)];
      var $499=(($495)>>>(0)) >= (($498)>>>(0));
      var $500=(($499)&(1));
      var $501=($500);
      var $502=(($501)|(0))!=0;
      if ($502) { label = 85; break; } else { label = 86; break; }
    case 85: 
      var $504=$B3;
      var $505=(($504+8)|0);
      var $506=HEAP32[(($505)>>2)];
      $F4=$506;
      label = 87; break;
    case 86: 
      _abort();
      throw "Reached an unreachable!"
    case 87: 
      label = 88; break;
    case 88: 
      var $510=$q;
      var $511=$B3;
      var $512=(($511+8)|0);
      HEAP32[(($512)>>2)]=$510;
      var $513=$q;
      var $514=$F4;
      var $515=(($514+12)|0);
      HEAP32[(($515)>>2)]=$513;
      var $516=$F4;
      var $517=$q;
      var $518=(($517+8)|0);
      HEAP32[(($518)>>2)]=$516;
      var $519=$B3;
      var $520=$q;
      var $521=(($520+12)|0);
      HEAP32[(($521)>>2)]=$519;
      label = 116; break;
    case 89: 
      var $523=$q;
      var $524=$523;
      $TP5=$524;
      var $525=$qsize;
      var $526=$525 >>> 8;
      $X=$526;
      var $527=$X;
      var $528=(($527)|(0))==0;
      if ($528) { label = 90; break; } else { label = 91; break; }
    case 90: 
      $I7=0;
      label = 95; break;
    case 91: 
      var $531=$X;
      var $532=(($531)>>>(0)) > 65535;
      if ($532) { label = 92; break; } else { label = 93; break; }
    case 92: 
      $I7=31;
      label = 94; break;
    case 93: 
      var $535=$X;
      $Y=$535;
      var $536=$Y;
      var $537=((($536)-(256))|0);
      var $538=$537 >>> 16;
      var $539=$538 & 8;
      $N=$539;
      var $540=$N;
      var $541=$Y;
      var $542=$541 << $540;
      $Y=$542;
      var $543=((($542)-(4096))|0);
      var $544=$543 >>> 16;
      var $545=$544 & 4;
      $K=$545;
      var $546=$K;
      var $547=$N;
      var $548=((($547)+($546))|0);
      $N=$548;
      var $549=$K;
      var $550=$Y;
      var $551=$550 << $549;
      $Y=$551;
      var $552=((($551)-(16384))|0);
      var $553=$552 >>> 16;
      var $554=$553 & 2;
      $K=$554;
      var $555=$N;
      var $556=((($555)+($554))|0);
      $N=$556;
      var $557=$N;
      var $558=(((14)-($557))|0);
      var $559=$K;
      var $560=$Y;
      var $561=$560 << $559;
      $Y=$561;
      var $562=$561 >>> 15;
      var $563=((($558)+($562))|0);
      $K=$563;
      var $564=$K;
      var $565=$564 << 1;
      var $566=$qsize;
      var $567=$K;
      var $568=((($567)+(7))|0);
      var $569=$566 >>> (($568)>>>(0));
      var $570=$569 & 1;
      var $571=((($565)+($570))|0);
      $I7=$571;
      label = 94; break;
    case 94: 
      label = 95; break;
    case 95: 
      var $574=$I7;
      var $575=$1;
      var $576=(($575+304)|0);
      var $577=(($576+($574<<2))|0);
      $H6=$577;
      var $578=$I7;
      var $579=$TP5;
      var $580=(($579+28)|0);
      HEAP32[(($580)>>2)]=$578;
      var $581=$TP5;
      var $582=(($581+16)|0);
      var $583=(($582+4)|0);
      HEAP32[(($583)>>2)]=0;
      var $584=$TP5;
      var $585=(($584+16)|0);
      var $586=(($585)|0);
      HEAP32[(($586)>>2)]=0;
      var $587=$1;
      var $588=(($587+4)|0);
      var $589=HEAP32[(($588)>>2)];
      var $590=$I7;
      var $591=1 << $590;
      var $592=$589 & $591;
      var $593=(($592)|(0))!=0;
      if ($593) { label = 97; break; } else { label = 96; break; }
    case 96: 
      var $595=$I7;
      var $596=1 << $595;
      var $597=$1;
      var $598=(($597+4)|0);
      var $599=HEAP32[(($598)>>2)];
      var $600=$599 | $596;
      HEAP32[(($598)>>2)]=$600;
      var $601=$TP5;
      var $602=$H6;
      HEAP32[(($602)>>2)]=$601;
      var $603=$H6;
      var $604=$603;
      var $605=$TP5;
      var $606=(($605+24)|0);
      HEAP32[(($606)>>2)]=$604;
      var $607=$TP5;
      var $608=$TP5;
      var $609=(($608+12)|0);
      HEAP32[(($609)>>2)]=$607;
      var $610=$TP5;
      var $611=(($610+8)|0);
      HEAP32[(($611)>>2)]=$607;
      label = 115; break;
    case 97: 
      var $613=$H6;
      var $614=HEAP32[(($613)>>2)];
      $T=$614;
      var $615=$qsize;
      var $616=$I7;
      var $617=(($616)|(0))==31;
      if ($617) { label = 98; break; } else { label = 99; break; }
    case 98: 
      var $626 = 0;label = 100; break;
    case 99: 
      var $620=$I7;
      var $621=$620 >>> 1;
      var $622=((($621)+(8))|0);
      var $623=((($622)-(2))|0);
      var $624=(((31)-($623))|0);
      var $626 = $624;label = 100; break;
    case 100: 
      var $626;
      var $627=$615 << $626;
      $K8=$627;
      label = 101; break;
    case 101: 
      var $629=$T;
      var $630=(($629+4)|0);
      var $631=HEAP32[(($630)>>2)];
      var $632=$631 & -8;
      var $633=$qsize;
      var $634=(($632)|(0))!=(($633)|(0));
      if ($634) { label = 102; break; } else { label = 108; break; }
    case 102: 
      var $636=$K8;
      var $637=$636 >>> 31;
      var $638=$637 & 1;
      var $639=$T;
      var $640=(($639+16)|0);
      var $641=(($640+($638<<2))|0);
      $C=$641;
      var $642=$K8;
      var $643=$642 << 1;
      $K8=$643;
      var $644=$C;
      var $645=HEAP32[(($644)>>2)];
      var $646=(($645)|(0))!=0;
      if ($646) { label = 103; break; } else { label = 104; break; }
    case 103: 
      var $648=$C;
      var $649=HEAP32[(($648)>>2)];
      $T=$649;
      label = 107; break;
    case 104: 
      var $651=$C;
      var $652=$651;
      var $653=$1;
      var $654=(($653+16)|0);
      var $655=HEAP32[(($654)>>2)];
      var $656=(($652)>>>(0)) >= (($655)>>>(0));
      var $657=(($656)&(1));
      var $658=($657);
      var $659=(($658)|(0))!=0;
      if ($659) { label = 105; break; } else { label = 106; break; }
    case 105: 
      var $661=$TP5;
      var $662=$C;
      HEAP32[(($662)>>2)]=$661;
      var $663=$T;
      var $664=$TP5;
      var $665=(($664+24)|0);
      HEAP32[(($665)>>2)]=$663;
      var $666=$TP5;
      var $667=$TP5;
      var $668=(($667+12)|0);
      HEAP32[(($668)>>2)]=$666;
      var $669=$TP5;
      var $670=(($669+8)|0);
      HEAP32[(($670)>>2)]=$666;
      label = 114; break;
    case 106: 
      _abort();
      throw "Reached an unreachable!"
    case 107: 
      label = 113; break;
    case 108: 
      var $674=$T;
      var $675=(($674+8)|0);
      var $676=HEAP32[(($675)>>2)];
      $F9=$676;
      var $677=$T;
      var $678=$677;
      var $679=$1;
      var $680=(($679+16)|0);
      var $681=HEAP32[(($680)>>2)];
      var $682=(($678)>>>(0)) >= (($681)>>>(0));
      if ($682) { label = 109; break; } else { var $691 = 0;label = 110; break; }
    case 109: 
      var $684=$F9;
      var $685=$684;
      var $686=$1;
      var $687=(($686+16)|0);
      var $688=HEAP32[(($687)>>2)];
      var $689=(($685)>>>(0)) >= (($688)>>>(0));
      var $691 = $689;label = 110; break;
    case 110: 
      var $691;
      var $692=(($691)&(1));
      var $693=($692);
      var $694=(($693)|(0))!=0;
      if ($694) { label = 111; break; } else { label = 112; break; }
    case 111: 
      var $696=$TP5;
      var $697=$F9;
      var $698=(($697+12)|0);
      HEAP32[(($698)>>2)]=$696;
      var $699=$T;
      var $700=(($699+8)|0);
      HEAP32[(($700)>>2)]=$696;
      var $701=$F9;
      var $702=$TP5;
      var $703=(($702+8)|0);
      HEAP32[(($703)>>2)]=$701;
      var $704=$T;
      var $705=$TP5;
      var $706=(($705+12)|0);
      HEAP32[(($706)>>2)]=$704;
      var $707=$TP5;
      var $708=(($707+24)|0);
      HEAP32[(($708)>>2)]=0;
      label = 114; break;
    case 112: 
      _abort();
      throw "Reached an unreachable!"
    case 113: 
      label = 101; break;
    case 114: 
      label = 115; break;
    case 115: 
      label = 116; break;
    case 116: 
      label = 117; break;
    case 117: 
      label = 118; break;
    case 118: 
      var $716=$p;
      var $717=$716;
      var $718=(($717+8)|0);
      return $718;
    default: assert(0, "bad label: " + label);
  }
}
function _add_segment($m, $tbase, $tsize, $mmapped) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $old_top;
      var $oldsp;
      var $old_end;
      var $ssize;
      var $rawsp;
      var $offset;
      var $asp;
      var $csp;
      var $sp;
      var $ss;
      var $tnext;
      var $p;
      var $nfences;
      var $nextp;
      var $q;
      var $psize;
      var $tn;
      var $I;
      var $B;
      var $F;
      var $TP;
      var $H;
      var $I1;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K2;
      var $C;
      var $F3;
      $1=$m;
      $2=$tbase;
      $3=$tsize;
      $4=$mmapped;
      var $5=$1;
      var $6=(($5+24)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$7;
      $old_top=$8;
      var $9=$1;
      var $10=$old_top;
      var $11=_segment_holding($9, $10);
      $oldsp=$11;
      var $12=$oldsp;
      var $13=(($12)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$oldsp;
      var $16=(($15+4)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($14+$17)|0);
      $old_end=$18;
      $ssize=24;
      var $19=$old_end;
      var $20=$ssize;
      var $21=((($20)+(16))|0);
      var $22=((($21)+(7))|0);
      var $23=(((-$22))|0);
      var $24=(($19+$23)|0);
      $rawsp=$24;
      var $25=$rawsp;
      var $26=(($25+8)|0);
      var $27=$26;
      var $28=$27 & 7;
      var $29=(($28)|(0))==0;
      if ($29) { label = 2; break; } else { label = 3; break; }
    case 2: 
      var $39 = 0;label = 4; break;
    case 3: 
      var $32=$rawsp;
      var $33=(($32+8)|0);
      var $34=$33;
      var $35=$34 & 7;
      var $36=(((8)-($35))|0);
      var $37=$36 & 7;
      var $39 = $37;label = 4; break;
    case 4: 
      var $39;
      $offset=$39;
      var $40=$rawsp;
      var $41=$offset;
      var $42=(($40+$41)|0);
      $asp=$42;
      var $43=$asp;
      var $44=$old_top;
      var $45=(($44+16)|0);
      var $46=(($43)>>>(0)) < (($45)>>>(0));
      if ($46) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $48=$old_top;
      var $52 = $48;label = 7; break;
    case 6: 
      var $50=$asp;
      var $52 = $50;label = 7; break;
    case 7: 
      var $52;
      $csp=$52;
      var $53=$csp;
      var $54=$53;
      $sp=$54;
      var $55=$sp;
      var $56=$55;
      var $57=(($56+8)|0);
      var $58=$57;
      $ss=$58;
      var $59=$sp;
      var $60=$59;
      var $61=$ssize;
      var $62=(($60+$61)|0);
      var $63=$62;
      $tnext=$63;
      var $64=$tnext;
      $p=$64;
      $nfences=0;
      var $65=$1;
      var $66=$2;
      var $67=$66;
      var $68=$3;
      var $69=((($68)-(40))|0);
      _init_top($65, $67, $69);
      var $70=$ssize;
      var $71=$70 | 1;
      var $72=$71 | 2;
      var $73=$sp;
      var $74=(($73+4)|0);
      HEAP32[(($74)>>2)]=$72;
      var $75=$ss;
      var $76=$1;
      var $77=(($76+448)|0);
      var $78=$75;
      var $79=$77;
      assert(16 % 1 === 0);HEAP32[(($78)>>2)]=HEAP32[(($79)>>2)];HEAP32[((($78)+(4))>>2)]=HEAP32[((($79)+(4))>>2)];HEAP32[((($78)+(8))>>2)]=HEAP32[((($79)+(8))>>2)];HEAP32[((($78)+(12))>>2)]=HEAP32[((($79)+(12))>>2)];
      var $80=$2;
      var $81=$1;
      var $82=(($81+448)|0);
      var $83=(($82)|0);
      HEAP32[(($83)>>2)]=$80;
      var $84=$3;
      var $85=$1;
      var $86=(($85+448)|0);
      var $87=(($86+4)|0);
      HEAP32[(($87)>>2)]=$84;
      var $88=$4;
      var $89=$1;
      var $90=(($89+448)|0);
      var $91=(($90+12)|0);
      HEAP32[(($91)>>2)]=$88;
      var $92=$ss;
      var $93=$1;
      var $94=(($93+448)|0);
      var $95=(($94+8)|0);
      HEAP32[(($95)>>2)]=$92;
      label = 8; break;
    case 8: 
      var $97=$p;
      var $98=$97;
      var $99=(($98+4)|0);
      var $100=$99;
      $nextp=$100;
      var $101=$p;
      var $102=(($101+4)|0);
      HEAP32[(($102)>>2)]=7;
      var $103=$nfences;
      var $104=((($103)+(1))|0);
      $nfences=$104;
      var $105=$nextp;
      var $106=(($105+4)|0);
      var $107=$106;
      var $108=$old_end;
      var $109=(($107)>>>(0)) < (($108)>>>(0));
      if ($109) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $111=$nextp;
      $p=$111;
      label = 11; break;
    case 10: 
      label = 12; break;
    case 11: 
      label = 8; break;
    case 12: 
      var $115=$csp;
      var $116=$old_top;
      var $117=(($115)|(0))!=(($116)|(0));
      if ($117) { label = 13; break; } else { label = 49; break; }
    case 13: 
      var $119=$old_top;
      var $120=$119;
      $q=$120;
      var $121=$csp;
      var $122=$old_top;
      var $123=$121;
      var $124=$122;
      var $125=((($123)-($124))|0);
      $psize=$125;
      var $126=$q;
      var $127=$126;
      var $128=$psize;
      var $129=(($127+$128)|0);
      var $130=$129;
      $tn=$130;
      var $131=$tn;
      var $132=(($131+4)|0);
      var $133=HEAP32[(($132)>>2)];
      var $134=$133 & -2;
      HEAP32[(($132)>>2)]=$134;
      var $135=$psize;
      var $136=$135 | 1;
      var $137=$q;
      var $138=(($137+4)|0);
      HEAP32[(($138)>>2)]=$136;
      var $139=$psize;
      var $140=$q;
      var $141=$140;
      var $142=$psize;
      var $143=(($141+$142)|0);
      var $144=$143;
      var $145=(($144)|0);
      HEAP32[(($145)>>2)]=$139;
      var $146=$psize;
      var $147=$146 >>> 3;
      var $148=(($147)>>>(0)) < 32;
      if ($148) { label = 14; break; } else { label = 21; break; }
    case 14: 
      var $150=$psize;
      var $151=$150 >>> 3;
      $I=$151;
      var $152=$I;
      var $153=$152 << 1;
      var $154=$1;
      var $155=(($154+40)|0);
      var $156=(($155+($153<<2))|0);
      var $157=$156;
      var $158=$157;
      $B=$158;
      var $159=$B;
      $F=$159;
      var $160=$1;
      var $161=(($160)|0);
      var $162=HEAP32[(($161)>>2)];
      var $163=$I;
      var $164=1 << $163;
      var $165=$162 & $164;
      var $166=(($165)|(0))!=0;
      if ($166) { label = 16; break; } else { label = 15; break; }
    case 15: 
      var $168=$I;
      var $169=1 << $168;
      var $170=$1;
      var $171=(($170)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=$172 | $169;
      HEAP32[(($171)>>2)]=$173;
      label = 20; break;
    case 16: 
      var $175=$B;
      var $176=(($175+8)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=$177;
      var $179=$1;
      var $180=(($179+16)|0);
      var $181=HEAP32[(($180)>>2)];
      var $182=(($178)>>>(0)) >= (($181)>>>(0));
      var $183=(($182)&(1));
      var $184=($183);
      var $185=(($184)|(0))!=0;
      if ($185) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $187=$B;
      var $188=(($187+8)|0);
      var $189=HEAP32[(($188)>>2)];
      $F=$189;
      label = 19; break;
    case 18: 
      _abort();
      throw "Reached an unreachable!"
    case 19: 
      label = 20; break;
    case 20: 
      var $193=$q;
      var $194=$B;
      var $195=(($194+8)|0);
      HEAP32[(($195)>>2)]=$193;
      var $196=$q;
      var $197=$F;
      var $198=(($197+12)|0);
      HEAP32[(($198)>>2)]=$196;
      var $199=$F;
      var $200=$q;
      var $201=(($200+8)|0);
      HEAP32[(($201)>>2)]=$199;
      var $202=$B;
      var $203=$q;
      var $204=(($203+12)|0);
      HEAP32[(($204)>>2)]=$202;
      label = 48; break;
    case 21: 
      var $206=$q;
      var $207=$206;
      $TP=$207;
      var $208=$psize;
      var $209=$208 >>> 8;
      $X=$209;
      var $210=$X;
      var $211=(($210)|(0))==0;
      if ($211) { label = 22; break; } else { label = 23; break; }
    case 22: 
      $I1=0;
      label = 27; break;
    case 23: 
      var $214=$X;
      var $215=(($214)>>>(0)) > 65535;
      if ($215) { label = 24; break; } else { label = 25; break; }
    case 24: 
      $I1=31;
      label = 26; break;
    case 25: 
      var $218=$X;
      $Y=$218;
      var $219=$Y;
      var $220=((($219)-(256))|0);
      var $221=$220 >>> 16;
      var $222=$221 & 8;
      $N=$222;
      var $223=$N;
      var $224=$Y;
      var $225=$224 << $223;
      $Y=$225;
      var $226=((($225)-(4096))|0);
      var $227=$226 >>> 16;
      var $228=$227 & 4;
      $K=$228;
      var $229=$K;
      var $230=$N;
      var $231=((($230)+($229))|0);
      $N=$231;
      var $232=$K;
      var $233=$Y;
      var $234=$233 << $232;
      $Y=$234;
      var $235=((($234)-(16384))|0);
      var $236=$235 >>> 16;
      var $237=$236 & 2;
      $K=$237;
      var $238=$N;
      var $239=((($238)+($237))|0);
      $N=$239;
      var $240=$N;
      var $241=(((14)-($240))|0);
      var $242=$K;
      var $243=$Y;
      var $244=$243 << $242;
      $Y=$244;
      var $245=$244 >>> 15;
      var $246=((($241)+($245))|0);
      $K=$246;
      var $247=$K;
      var $248=$247 << 1;
      var $249=$psize;
      var $250=$K;
      var $251=((($250)+(7))|0);
      var $252=$249 >>> (($251)>>>(0));
      var $253=$252 & 1;
      var $254=((($248)+($253))|0);
      $I1=$254;
      label = 26; break;
    case 26: 
      label = 27; break;
    case 27: 
      var $257=$I1;
      var $258=$1;
      var $259=(($258+304)|0);
      var $260=(($259+($257<<2))|0);
      $H=$260;
      var $261=$I1;
      var $262=$TP;
      var $263=(($262+28)|0);
      HEAP32[(($263)>>2)]=$261;
      var $264=$TP;
      var $265=(($264+16)|0);
      var $266=(($265+4)|0);
      HEAP32[(($266)>>2)]=0;
      var $267=$TP;
      var $268=(($267+16)|0);
      var $269=(($268)|0);
      HEAP32[(($269)>>2)]=0;
      var $270=$1;
      var $271=(($270+4)|0);
      var $272=HEAP32[(($271)>>2)];
      var $273=$I1;
      var $274=1 << $273;
      var $275=$272 & $274;
      var $276=(($275)|(0))!=0;
      if ($276) { label = 29; break; } else { label = 28; break; }
    case 28: 
      var $278=$I1;
      var $279=1 << $278;
      var $280=$1;
      var $281=(($280+4)|0);
      var $282=HEAP32[(($281)>>2)];
      var $283=$282 | $279;
      HEAP32[(($281)>>2)]=$283;
      var $284=$TP;
      var $285=$H;
      HEAP32[(($285)>>2)]=$284;
      var $286=$H;
      var $287=$286;
      var $288=$TP;
      var $289=(($288+24)|0);
      HEAP32[(($289)>>2)]=$287;
      var $290=$TP;
      var $291=$TP;
      var $292=(($291+12)|0);
      HEAP32[(($292)>>2)]=$290;
      var $293=$TP;
      var $294=(($293+8)|0);
      HEAP32[(($294)>>2)]=$290;
      label = 47; break;
    case 29: 
      var $296=$H;
      var $297=HEAP32[(($296)>>2)];
      $T=$297;
      var $298=$psize;
      var $299=$I1;
      var $300=(($299)|(0))==31;
      if ($300) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $309 = 0;label = 32; break;
    case 31: 
      var $303=$I1;
      var $304=$303 >>> 1;
      var $305=((($304)+(8))|0);
      var $306=((($305)-(2))|0);
      var $307=(((31)-($306))|0);
      var $309 = $307;label = 32; break;
    case 32: 
      var $309;
      var $310=$298 << $309;
      $K2=$310;
      label = 33; break;
    case 33: 
      var $312=$T;
      var $313=(($312+4)|0);
      var $314=HEAP32[(($313)>>2)];
      var $315=$314 & -8;
      var $316=$psize;
      var $317=(($315)|(0))!=(($316)|(0));
      if ($317) { label = 34; break; } else { label = 40; break; }
    case 34: 
      var $319=$K2;
      var $320=$319 >>> 31;
      var $321=$320 & 1;
      var $322=$T;
      var $323=(($322+16)|0);
      var $324=(($323+($321<<2))|0);
      $C=$324;
      var $325=$K2;
      var $326=$325 << 1;
      $K2=$326;
      var $327=$C;
      var $328=HEAP32[(($327)>>2)];
      var $329=(($328)|(0))!=0;
      if ($329) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $331=$C;
      var $332=HEAP32[(($331)>>2)];
      $T=$332;
      label = 39; break;
    case 36: 
      var $334=$C;
      var $335=$334;
      var $336=$1;
      var $337=(($336+16)|0);
      var $338=HEAP32[(($337)>>2)];
      var $339=(($335)>>>(0)) >= (($338)>>>(0));
      var $340=(($339)&(1));
      var $341=($340);
      var $342=(($341)|(0))!=0;
      if ($342) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $344=$TP;
      var $345=$C;
      HEAP32[(($345)>>2)]=$344;
      var $346=$T;
      var $347=$TP;
      var $348=(($347+24)|0);
      HEAP32[(($348)>>2)]=$346;
      var $349=$TP;
      var $350=$TP;
      var $351=(($350+12)|0);
      HEAP32[(($351)>>2)]=$349;
      var $352=$TP;
      var $353=(($352+8)|0);
      HEAP32[(($353)>>2)]=$349;
      label = 46; break;
    case 38: 
      _abort();
      throw "Reached an unreachable!"
    case 39: 
      label = 45; break;
    case 40: 
      var $357=$T;
      var $358=(($357+8)|0);
      var $359=HEAP32[(($358)>>2)];
      $F3=$359;
      var $360=$T;
      var $361=$360;
      var $362=$1;
      var $363=(($362+16)|0);
      var $364=HEAP32[(($363)>>2)];
      var $365=(($361)>>>(0)) >= (($364)>>>(0));
      if ($365) { label = 41; break; } else { var $374 = 0;label = 42; break; }
    case 41: 
      var $367=$F3;
      var $368=$367;
      var $369=$1;
      var $370=(($369+16)|0);
      var $371=HEAP32[(($370)>>2)];
      var $372=(($368)>>>(0)) >= (($371)>>>(0));
      var $374 = $372;label = 42; break;
    case 42: 
      var $374;
      var $375=(($374)&(1));
      var $376=($375);
      var $377=(($376)|(0))!=0;
      if ($377) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $379=$TP;
      var $380=$F3;
      var $381=(($380+12)|0);
      HEAP32[(($381)>>2)]=$379;
      var $382=$T;
      var $383=(($382+8)|0);
      HEAP32[(($383)>>2)]=$379;
      var $384=$F3;
      var $385=$TP;
      var $386=(($385+8)|0);
      HEAP32[(($386)>>2)]=$384;
      var $387=$T;
      var $388=$TP;
      var $389=(($388+12)|0);
      HEAP32[(($389)>>2)]=$387;
      var $390=$TP;
      var $391=(($390+24)|0);
      HEAP32[(($391)>>2)]=0;
      label = 46; break;
    case 44: 
      _abort();
      throw "Reached an unreachable!"
    case 45: 
      label = 33; break;
    case 46: 
      label = 47; break;
    case 47: 
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      return;
    default: assert(0, "bad label: " + label);
  }
}
function _strtod($string, $endPtr) {
  var label = 0;
  label = 1; 
  while(1) switch(label) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $sign;
      var $expSign;
      var $fraction;
      var $dblExp;
      var $d;
      var $p;
      var $c;
      var $exp;
      var $fracExp;
      var $mantSize;
      var $decPt;
      var $pExp;
      var $frac1;
      var $frac2;
      $2=$string;
      $3=$endPtr;
      $expSign=0;
      $exp=0;
      $fracExp=0;
      var $4=$2;
      $p=$4;
      label = 2; break;
    case 2: 
      var $6=$p;
      var $7=HEAP8[($6)];
      var $8=(($7 << 24) >> 24);
      var $9=_isspace($8);
      var $10=(($9)|(0))!=0;
      if ($10) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $12=$p;
      var $13=(($12+1)|0);
      $p=$13;
      label = 2; break;
    case 4: 
      var $15=$p;
      var $16=HEAP8[($15)];
      var $17=(($16 << 24) >> 24);
      var $18=(($17)|(0))==45;
      if ($18) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $sign=1;
      var $20=$p;
      var $21=(($20+1)|0);
      $p=$21;
      label = 9; break;
    case 6: 
      var $23=$p;
      var $24=HEAP8[($23)];
      var $25=(($24 << 24) >> 24);
      var $26=(($25)|(0))==43;
      if ($26) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $28=$p;
      var $29=(($28+1)|0);
      $p=$29;
      label = 8; break;
    case 8: 
      $sign=0;
      label = 9; break;
    case 9: 
      $decPt=-1;
      $mantSize=0;
      label = 10; break;
    case 10: 
      var $33=$p;
      var $34=HEAP8[($33)];
      var $35=(($34 << 24) >> 24);
      $c=$35;
      var $36=$c;
      var $37=_isdigit($36);
      var $38=(($37)|(0))!=0;
      if ($38) { label = 15; break; } else { label = 11; break; }
    case 11: 
      var $40=$c;
      var $41=(($40)|(0))!=46;
      if ($41) { label = 13; break; } else { label = 12; break; }
    case 12: 
      var $43=$decPt;
      var $44=(($43)|(0)) >= 0;
      if ($44) { label = 13; break; } else { label = 14; break; }
    case 13: 
      label = 17; break;
    case 14: 
      var $47=$mantSize;
      $decPt=$47;
      label = 15; break;
    case 15: 
      var $49=$p;
      var $50=(($49+1)|0);
      $p=$50;
      label = 16; break;
    case 16: 
      var $52=$mantSize;
      var $53=((($52)+(1))|0);
      $mantSize=$53;
      label = 10; break;
    case 17: 
      var $55=$p;
      $pExp=$55;
      var $56=$mantSize;
      var $57=$p;
      var $58=(((-$56))|0);
      var $59=(($57+$58)|0);
      $p=$59;
      var $60=$decPt;
      var $61=(($60)|(0)) < 0;
      if ($61) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $63=$mantSize;
      $decPt=$63;
      label = 20; break;
    case 19: 
      var $65=$mantSize;
      var $66=((($65)-(1))|0);
      $mantSize=$66;
      label = 20; break;
    case 20: 
      var $68=$mantSize;
      var $69=(($68)|(0)) > 18;
      if ($69) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $71=$decPt;
      var $72=((($71)-(18))|0);
      $fracExp=$72;
      $mantSize=18;
      label = 23; break;
    case 22: 
      var $74=$decPt;
      var $75=$mantSize;
      var $76=((($74)-($75))|0);
      $fracExp=$76;
      label = 23; break;
    case 23: 
      var $78=$mantSize;
      var $79=(($78)|(0))==0;
      if ($79) { label = 24; break; } else { label = 25; break; }
    case 24: 
      $fraction=0;
      var $81=$2;
      $p=$81;
      label = 67; break;
    case 25: 
      $frac1=0;
      label = 26; break;
    case 26: 
      var $84=$mantSize;
      var $85=(($84)|(0)) > 9;
      if ($85) { label = 27; break; } else { label = 31; break; }
    case 27: 
      var $87=$p;
      var $88=HEAP8[($87)];
      var $89=(($88 << 24) >> 24);
      $c=$89;
      var $90=$p;
      var $91=(($90+1)|0);
      $p=$91;
      var $92=$c;
      var $93=(($92)|(0))==46;
      if ($93) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $95=$p;
      var $96=HEAP8[($95)];
      var $97=(($96 << 24) >> 24);
      $c=$97;
      var $98=$p;
      var $99=(($98+1)|0);
      $p=$99;
      label = 29; break;
    case 29: 
      var $101=$frac1;
      var $102=((($101)*(10))&-1);
      var $103=$c;
      var $104=((($103)-(48))|0);
      var $105=((($102)+($104))|0);
      $frac1=$105;
      label = 30; break;
    case 30: 
      var $107=$mantSize;
      var $108=((($107)-(1))|0);
      $mantSize=$108;
      label = 26; break;
    case 31: 
      $frac2=0;
      label = 32; break;
    case 32: 
      var $111=$mantSize;
      var $112=(($111)|(0)) > 0;
      if ($112) { label = 33; break; } else { label = 37; break; }
    case 33: 
      var $114=$p;
      var $115=HEAP8[($114)];
      var $116=(($115 << 24) >> 24);
      $c=$116;
      var $117=$p;
      var $118=(($117+1)|0);
      $p=$118;
      var $119=$c;
      var $120=(($119)|(0))==46;
      if ($120) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $122=$p;
      var $123=HEAP8[($122)];
      var $124=(($123 << 24) >> 24);
      $c=$124;
      var $125=$p;
      var $126=(($125+1)|0);
      $p=$126;
      label = 35; break;
    case 35: 
      var $128=$frac2;
      var $129=((($128)*(10))&-1);
      var $130=$c;
      var $131=((($130)-(48))|0);
      var $132=((($129)+($131))|0);
      $frac2=$132;
      label = 36; break;
    case 36: 
      var $134=$mantSize;
      var $135=((($134)-(1))|0);
      $mantSize=$135;
      label = 32; break;
    case 37: 
      var $137=$frac1;
      var $138=(($137)|(0));
      var $139=($138)*(1000000000);
      var $140=$frac2;
      var $141=(($140)|(0));
      var $142=($139)+($141);
      $fraction=$142;
      label = 38; break;
    case 38: 
      var $144=$pExp;
      $p=$144;
      var $145=$p;
      var $146=HEAP8[($145)];
      var $147=(($146 << 24) >> 24);
      var $148=(($147)|(0))==69;
      if ($148) { label = 40; break; } else { label = 39; break; }
    case 39: 
      var $150=$p;
      var $151=HEAP8[($150)];
      var $152=(($151 << 24) >> 24);
      var $153=(($152)|(0))==101;
      if ($153) { label = 40; break; } else { label = 49; break; }
    case 40: 
      var $155=$p;
      var $156=(($155+1)|0);
      $p=$156;
      var $157=$p;
      var $158=HEAP8[($157)];
      var $159=(($158 << 24) >> 24);
      var $160=(($159)|(0))==45;
      if ($160) { label = 41; break; } else { label = 42; break; }
    case 41: 
      $expSign=1;
      var $162=$p;
      var $163=(($162+1)|0);
      $p=$163;
      label = 45; break;
    case 42: 
      var $165=$p;
      var $166=HEAP8[($165)];
      var $167=(($166 << 24) >> 24);
      var $168=(($167)|(0))==43;
      if ($168) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $170=$p;
      var $171=(($170+1)|0);
      $p=$171;
      label = 44; break;
    case 44: 
      $expSign=0;
      label = 45; break;
    case 45: 
      label = 46; break;
    case 46: 
      var $175=$p;
      var $176=HEAP8[($175)];
      var $177=(($176 << 24) >> 24);
      var $178=_isdigit($177);
      var $179=(($178)|(0))!=0;
      if ($179) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $181=$exp;
      var $182=((($181)*(10))&-1);
      var $183=$p;
      var $184=HEAP8[($183)];
      var $185=(($184 << 24) >> 24);
      var $186=((($185)-(48))|0);
      var $187=((($182)+($186))|0);
      $exp=$187;
      var $188=$p;
      var $189=(($188+1)|0);
      $p=$189;
      label = 46; break;
    case 48: 
      label = 49; break;
    case 49: 
      var $192=$expSign;
      var $193=(($192)|(0))!=0;
      if ($193) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $195=$fracExp;
      var $196=$exp;
      var $197=((($195)-($196))|0);
      $exp=$197;
      label = 52; break;
    case 51: 
      var $199=$fracExp;
      var $200=$exp;
      var $201=((($199)+($200))|0);
      $exp=$201;
      label = 52; break;
    case 52: 
      var $203=$exp;
      var $204=(($203)|(0)) < 0;
      if ($204) { label = 53; break; } else { label = 54; break; }
    case 53: 
      $expSign=1;
      var $206=$exp;
      var $207=(((-$206))|0);
      $exp=$207;
      label = 55; break;
    case 54: 
      $expSign=0;
      label = 55; break;
    case 55: 
      var $210=$exp;
      var $211=HEAP32[((5249944)>>2)];
      var $212=(($210)|(0)) > (($211)|(0));
      if ($212) { label = 56; break; } else { label = 57; break; }
    case 56: 
      var $214=HEAP32[((5249944)>>2)];
      $exp=$214;
      var $215=___errno_location();
      HEAP32[(($215)>>2)]=34;
      label = 57; break;
    case 57: 
      $dblExp=1;
      $d=((5249848)|0);
      label = 58; break;
    case 58: 
      var $218=$exp;
      var $219=(($218)|(0))!=0;
      if ($219) { label = 59; break; } else { label = 63; break; }
    case 59: 
      var $221=$exp;
      var $222=$221 & 1;
      var $223=(($222)|(0))!=0;
      if ($223) { label = 60; break; } else { label = 61; break; }
    case 60: 
      var $225=$d;
      var $226=(HEAP32[((tempDoublePtr)>>2)]=HEAP32[(($225)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[((($225)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      var $227=$dblExp;
      var $228=($227)*($226);
      $dblExp=$228;
      label = 61; break;
    case 61: 
      label = 62; break;
    case 62: 
      var $231=$exp;
      var $232=$231 >> 1;
      $exp=$232;
      var $233=$d;
      var $234=(($233+8)|0);
      $d=$234;
      label = 58; break;
    case 63: 
      var $236=$expSign;
      var $237=(($236)|(0))!=0;
      if ($237) { label = 64; break; } else { label = 65; break; }
    case 64: 
      var $239=$dblExp;
      var $240=$fraction;
      var $241=($240)/($239);
      $fraction=$241;
      label = 66; break;
    case 65: 
      var $243=$dblExp;
      var $244=$fraction;
      var $245=($244)*($243);
      $fraction=$245;
      label = 66; break;
    case 66: 
      label = 67; break;
    case 67: 
      var $248=$3;
      var $249=(($248)|(0))!=0;
      if ($249) { label = 68; break; } else { label = 69; break; }
    case 68: 
      var $251=$p;
      var $252=$3;
      HEAP32[(($252)>>2)]=$251;
      label = 69; break;
    case 69: 
      var $254=$sign;
      var $255=(($254)|(0))!=0;
      if ($255) { label = 70; break; } else { label = 71; break; }
    case 70: 
      var $257=$fraction;
      var $258=(-$257);
      $1=$258;
      label = 72; break;
    case 71: 
      var $260=$fraction;
      $1=$260;
      label = 72; break;
    case 72: 
      var $262=$1;
      return $262;
    default: assert(0, "bad label: " + label);
  }
}
function _atof($str) {
  var label = 0;
  var $1;
  $1=$str;
  var $2=$1;
  var $3=_strtod($2, 0);
  return $3;
}
// EMSCRIPTEN_END_FUNCS
// EMSCRIPTEN_END_FUNCS
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
(function() {
function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
Module['FS_createPath']('/', 'home', true, true);
Module['FS_createPath']('/home', 'ede', true, true);
Module['FS_createPath']('/home/ede', 'mscgen-read-only', true, true);
Module['FS_createPath']('/home/ede/mscgen-read-only', 'test', true, true);
Module['FS_createDataFile']('//home/ede/mscgen-read-only/test', 'testinput1.msc', [35, 33, 47, 117, 115, 114, 47, 98, 105, 110, 47, 109, 115, 99, 103, 101, 110, 32, 45, 84, 112, 110, 103, 10, 35, 10, 35, 32, 116, 101, 115, 116, 105, 110, 112, 117, 116, 49, 46, 109, 115, 99, 32, 58, 32, 83, 97, 109, 112, 108, 101, 32, 109, 115, 99, 32, 105, 110, 112, 117, 116, 32, 102, 105, 108, 101, 10, 35, 10, 35, 32, 84, 104, 105, 115, 32, 102, 105, 108, 101, 32, 105, 115, 32, 80, 85, 66, 76, 73, 67, 32, 68, 79, 77, 65, 73, 78, 32, 97, 110, 100, 32, 109, 97, 121, 32, 98, 101, 32, 102, 114, 101, 101, 108, 121, 32, 114, 101, 112, 114, 111, 100, 117, 99, 101, 100, 44, 32, 32, 100, 105, 115, 116, 114, 105, 98, 117, 116, 101, 100, 44, 10, 35, 32, 116, 114, 97, 110, 115, 109, 105, 116, 116, 101, 100, 44, 32, 117, 115, 101, 100, 44, 32, 109, 111, 100, 105, 102, 105, 101, 100, 44, 32, 98, 117, 105, 108, 116, 32, 117, 112, 111, 110, 44, 32, 111, 114, 32, 111, 116, 104, 101, 114, 119, 105, 115, 101, 32, 101, 120, 112, 108, 111, 105, 116, 101, 100, 32, 98, 121, 10, 35, 32, 97, 110, 121, 111, 110, 101, 32, 102, 111, 114, 32, 97, 110, 121, 32, 112, 117, 114, 112, 111, 115, 101, 44, 32, 99, 111, 109, 109, 101, 114, 99, 105, 97, 108, 32, 111, 114, 32, 110, 111, 110, 45, 99, 111, 109, 109, 101, 114, 99, 105, 97, 108, 44, 32, 97, 110, 100, 32, 105, 110, 32, 97, 110, 121, 32, 119, 97, 121, 44, 10, 35, 32, 105, 110, 99, 108, 117, 100, 105, 110, 103, 32, 98, 121, 32, 109, 101, 116, 104, 111, 100, 115, 32, 116, 104, 97, 116, 32, 104, 97, 118, 101, 32, 110, 111, 116, 32, 121, 101, 116, 32, 98, 101, 101, 110, 32, 105, 110, 118, 101, 110, 116, 101, 100, 32, 111, 114, 32, 99, 111, 110, 99, 101, 105, 118, 101, 100, 46, 10, 35, 10, 35, 32, 84, 104, 105, 115, 32, 102, 105, 108, 101, 32, 105, 115, 32, 112, 114, 111, 118, 105, 100, 101, 100, 32, 34, 65, 83, 32, 73, 83, 34, 32, 87, 73, 84, 72, 79, 85, 84, 32, 87, 65, 82, 82, 65, 78, 84, 89, 32, 79, 70, 32, 65, 78, 89, 32, 75, 73, 78, 68, 44, 32, 69, 73, 84, 72, 69, 82, 10, 35, 32, 69, 88, 80, 82, 69, 83, 83, 69, 68, 32, 79, 82, 32, 73, 77, 80, 76, 73, 69, 68, 44, 32, 73, 78, 67, 76, 85, 68, 73, 78, 71, 44, 32, 66, 85, 84, 32, 78, 79, 84, 32, 76, 73, 77, 73, 84, 69, 68, 32, 84, 79, 44, 32, 84, 72, 69, 32, 73, 77, 80, 76, 73, 69, 68, 10, 35, 32, 87, 65, 82, 82, 65, 78, 84, 73, 69, 83, 32, 79, 70, 32, 77, 69, 82, 67, 72, 65, 78, 84, 65, 66, 73, 76, 73, 84, 89, 32, 65, 78, 68, 32, 70, 73, 84, 78, 69, 83, 83, 32, 70, 79, 82, 32, 65, 32, 80, 65, 82, 84, 73, 67, 85, 76, 65, 82, 32, 80, 85, 82, 80, 79, 83, 69, 46, 10, 35, 10, 10, 35, 32, 69, 120, 97, 109, 112, 108, 101, 32, 102, 105, 99, 116, 105, 111, 110, 97, 108, 32, 77, 83, 67, 10, 109, 115, 99, 32, 123, 10, 32, 32, 97, 44, 32, 34, 98, 34, 44, 32, 99, 32, 59, 10, 10, 32, 32, 97, 45, 62, 98, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 97, 98, 40, 41, 34, 32, 93, 32, 59, 10, 32, 32, 98, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 98, 99, 40, 84, 82, 85, 69, 41, 34, 93, 59, 10, 32, 32, 99, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 112, 114, 111, 99, 101, 115, 115, 40, 49, 41, 34, 32, 93, 59, 10, 32, 32, 99, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 112, 114, 111, 99, 101, 115, 115, 40, 50, 41, 34, 32, 93, 59, 10, 32, 32, 46, 46, 46, 59, 10, 32, 32, 99, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 112, 114, 111, 99, 101, 115, 115, 40, 110, 41, 34, 32, 93, 59, 10, 32, 32, 99, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 112, 114, 111, 99, 101, 115, 115, 40, 69, 78, 68, 41, 34, 32, 93, 59, 10, 32, 32, 97, 60, 45, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 99, 97, 108, 108, 98, 97, 99, 107, 40, 41, 34, 93, 59, 10, 32, 32, 45, 45, 45, 32, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 73, 102, 32, 109, 111, 114, 101, 32, 116, 111, 32, 114, 117, 110, 34, 44, 32, 73, 68, 61, 34, 42, 34, 32, 93, 59, 10, 32, 32, 97, 45, 62, 97, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 110, 101, 120, 116, 40, 41, 34, 93, 59, 10, 32, 32, 97, 45, 62, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 97, 99, 40, 41, 34, 93, 59, 10, 32, 32, 98, 60, 45, 99, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 99, 98, 40, 84, 82, 85, 69, 41, 34, 93, 59, 10, 32, 32, 98, 45, 62, 98, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 115, 116, 97, 108, 108, 101, 100, 40, 46, 46, 46, 41, 34, 93, 59, 10, 32, 32, 97, 60, 45, 98, 32, 91, 32, 108, 97, 98, 101, 108, 32, 61, 32, 34, 97, 98, 40, 41, 32, 61, 32, 70, 65, 76, 83, 69, 34, 93, 59, 10, 125, 10, 10], true, true);
})();
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
