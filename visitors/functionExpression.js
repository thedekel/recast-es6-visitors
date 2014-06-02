var recast = require('recast');
var b = recast.types.builders;

/**
 * the function expression visitor is primarily concerned with converting the
 * `...rest` param in function declarations to a variable instantiation based
 * on the `arguments` hidden param on the first line of a function.
 */
var functionExpressionVisitor = function(node) {
  // helper function to produce a new body for the function with an additional
  // variable declaration
  var addRestDecToBody = function(funcExp) {
    // funcExp.rest is guaranteed to be not `null` if this executes
    var restDec = b.variableDeclaration(
      "var",
      [b.variableDeclarator(
        b.identifier(funcExp.rest.name),
        b.callExpression(
          b.identifier('Array.prototype.slice.call'),
          [
            b.identifier('arguments'),
            b.literal(funcExp.params.length)
          ]
        )
      )]
    );
    funcExp.body.body.unshift(restDec);
  };
  if (node.rest != null) {
    addRestDecToBody(node),
    this.genericVisit(node);
    return b.functionExpression(
      node.id,
      node.params,
      node.body,
      false,
      node.expression,
      false
    )
  }
  this.genericVisit(node);
  return node;
}

module.exports = functionExpressionVisitor;
