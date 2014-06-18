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
    "recast-es6-visitors": "git://github.com/thedekel/recast-es6-visitors.git",
    ...
  }
}
```

Now you just need to make sure that where you would normally just import
`recast` and use it, you instead use something similar to the following code:

```javascript
var es6transformer = require('recast-es6-visitors');

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

var outputCode = es6transformer.compile(sampleCode).code;

eval(outputCode);

// `es6func` was added to the global namespace by `eval`
var resultObj = es6func("hello", 42, true, null);

console.log(resultObj.a) // "hello"
console.log(resultObj.b) // 42
console.log(resultObj.myProp) // 5
console.log(resultObj.conciseMethod()) // true
```

In addition to the `.compile()` function featured above, the package has similar `.transform()` and `.parse()` methods.
`transform` takes a recast AST that's been produced through recast (assuming that recast has a version of esprima that supports the `harmony` features), and produces an equivalent recast AST that's limited to ES5 features. `parse` will take a string of code (just like `compile` above, and return a recast AST that only uses ES5 features.
