# Recast ES6 Visitors

This project is a node module that's meant to be used as a recast visitor
(see [benjamn/recast](http://github.com/benjamn/recast)). The visitor uses
facebook's fork of esprima
([facebook/esprima](http://github.com/facebook/esprima)) which supports
parsing certain ES6 features to enable recast to convert code that uses
these ES6 features into valid ES5 ASTs which can then be printed correctly.

## Usage

Simply add this module to your project that uses recast, and configure recast
to use the `harmony-fb` branch of `esprima-fb` which is available through npm.
The specific branch of `esprima-fb` can be added to a project along with this
the es6 visitors in this repo by adding this to the dependencies of your
project:

```json
{
  ...
  "dependencies": {
    "recast": "*",
    "esprima-fb": "^3001.1.0-dev-harmony-fb",
    "recast-es6-visitors": "git://github.com/thedekel/recast-es6-visitors.git",
    ...
  }
}
```

Now you just need to make sure that where you would normally just import
`recast` and use it, you instead use something similar to the following code:

```javascript
var esprima = require('esprima-fb');
var recast = require('recast');
var Es6Visitor = require('recast-es6-visitors').Visitor;
var recastOptions = {esprima: esprima};


var sampleCode = [
  "var es6func = (a, b, ...rest) => {",
  "  var myProp = 5;",
  "  return {",
  "    a,",
  "    b,",
  "    myProp,",
  "    conciseMethod () { return true;}",
  "  };",
  "};"
].join('\n');


// This will produce an AST of the above code that uses ES6 definitions  from
// esprima-fb
var es6Ast = recast.parse(sampleCode, recastOptions);
// now we can visit the es6 AST with a new instance of the visitor
var equivalentEs5Ast = new Es6Visitor().visit(es6Ast);
// once we have the equivalent es5 AST, we can use recast to print the output
// using either `recast.print()` or `recast.prettyPrint()`
var outputString = recast.prettyPrint(equivalentEs5Ast).code;

// the outputString should now be valid ES5 code that behaves the same as the
// ES6 sample code we provided, we can `eval()` it, or save it to a file
eval(outputString);

// `es6func` was added to the global namespace by `eval`
var resultObj = es6func("hello", 42, true, null);

console.log(resultObj.a) // "hello"
console.log(resultObj.b) // 42
console.log(resultObj.myProp) // 5
console.log(resultObj.conciseMethod()) // true
```
