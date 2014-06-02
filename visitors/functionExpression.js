var recast = require('recast');
var b = recast.types.builders;

/**
 * the function expression visitor is primarily concerned with converting the
 * `...rest` param in function declarations to a variable instantiation based
 * on the `arguments` hidden param on the first line of a function.
 */
var functionExpressionVisitor = function(node) {
  this.genericVisit(node);
  // helper function to produce a new body for the function with an additional
  // variable declaration
  var genBodyWithRestVar = function() {
    // node.rest is guaranteed to be not `null` if this executes
    var restDec = b.variableDeclaration(
      "var",
      [b.variableDeclarator(
        b.identifier(node.rest.name),
        b.callExpression(
          b.identifier('Array.prototype.slice.call'),
          [
            b.identifier('arguments'),
            b.literal(node.params.length)
          ]
        )
      )]
    );
    node.body.body.unshift(restDec);
    return node.body;
  };
  if (node.rest != null) {
    return b.functionExpression(
      node.id,
      node.params,
      genBodyWithRestVar(node),
      node.generator,
      node.expression,
      false
    )
  }
  return node;
}

module.exports = functionExpressionVisitor;
