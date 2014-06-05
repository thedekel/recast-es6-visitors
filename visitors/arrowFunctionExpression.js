var recast = require('recast');
var b = recast.types.builders;
var n = recast.types.namedTypes;
var Syntax = recast.Syntax;
var utils = require('../lib/utils')

var arrowFunctionExpressionVisitor = function(node) {
  //this.genericVisit(node);
  var funcBody = node.body;
  // confirm that the function body has a return statement or add one on the
  // last expression
  // confirm that the function body is a blockstatement, otherwise, add one
  if (!n.BlockStatement.check(funcBody)) {
    if (!utils.containsChildOfType(funcBody, Syntax.returnStatement)) {
      funcBody = b.blockStatement([b.returnStatement(funcBody)]);
    }
  }
  // create a proper function expression using the arrow function's params
  // and body
  var replacementFunc = b.functionExpression(
    null,
    node.params,
    funcBody,
    false,
    false,
    false
  );
  if (node.rest) {
    replacementFunc.rest = node.rest;
  }
  debugger;
  // handle functions that make use of `this` by adding `.bind(this)` to them
  if (utils.containsChildOfType(node.body, Syntax.ThisExpression)) {
    this.replace( b.callExpression(
      b.memberExpression(
        replacementFunc,
        b.identifier('bind'),
        false
    ),
    [b.thisExpression()]
    ));
  } else {
    this.replace(replacementFunc);
  }
};

module.exports = arrowFunctionExpressionVisitor;
