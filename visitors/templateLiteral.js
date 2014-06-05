var recast = require('recast');
var b = recast.types.builders;

/**
 */
var templateLiteralVisitor = function(node) {
  //this.genericVisit(node);
  var templateElement, jj, ii;
  var templateElements = node.quasis;
  var returnVal = b.literal('');

  for (ii = 0, jj = 0; ii < templateElements.length; ii++) {
    templateElement = templateElements[ii];
    if (templateElement.value.raw !== '') {
      if (ii === 0) {
        returnVal = b.literal(templateElement.value.cooked);
      } else {
        returnVal = b.binaryExpression(
          "+",
          returnVal,
          b.literal(templateElement.value.cooked)
        );
      }
    }
    if (jj < node.expressions.length) {
      if (jj === 0 && templateElement.value.raw === '') {
        returnVal = node.expressions[jj];
      } else {
        returnVal = b.binaryExpression(
          "+",
          returnVal,
          node.expressions[jj]
        );
      }
      jj++;
    }
  }
  returnVal.original = node;
  this.replace(returnVal);
}

module.exports = templateLiteralVisitor;
