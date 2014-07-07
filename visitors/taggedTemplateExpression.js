var recast = require('recast');
var b = recast.types.builders;

/**
 */
var taggedTemplateExpression = function(nodePath) {
  var node = nodePath.value;
  var cookedLiteralsArray, rawLiteralsArray;
  var templateLiteral = node.original.quasi;
  if (templateLiteral.quasis) {
    cookedLiteralsArray = templateLiteral.quasis.map(function(q){
      return b.literal(q.value.cooked);
    });
    rawLiteralsArray = templateLiteral.quasis.map(function(q){
      return b.literal(q.value.raw);
    });
  } else {
    cookedLiteralsArray = [templateLiteral];
    rawLiteralsArray = [templateLiteral];
  }
  var siteObjGenBody = b.blockStatement([
    // line 1: var siteObj = [cookedLiteral1 cookedLiteral2, ...];
    b.variableDeclaration(
      "var",
      [b.variableDeclarator(
        b.identifier("siteObj"),
        b.arrayExpression(cookedLiteralsArray)
      )]
    ),
    // line 2: siteObj.raw = [rawLiteral1, rawLiteral2, ...];
    b.expressionStatement(b.assignmentExpression(
      "=",
      b.memberExpression(
        b.identifier("siteObj"),
        b.identifier("raw"),
        false
      ),
      b.arrayExpression(rawLiteralsArray)
    )),
    // line 3: Object.freeze(siteObj.raw);
    b.expressionStatement(b.callExpression(
      b.memberExpression(b.identifier("Object"), b.identifier("freeze"), false),
      [b.memberExpression(b.identifier("siteObj"), b.identifier("raw"), false)]
    )),
    // line 4: Object.freeze(siteObj)
    b.expressionStatement(b.callExpression(
      b.memberExpression(b.identifier("Object"), b.identifier("freeze"), false),
      [b.identifier("siteObj")]
    )),
    // line 5: return siteObj
    b.returnStatement(b.identifier("siteObj"))
  ]);
  var siteObjGenFunc = b.callExpression(
    b.functionExpression(null, [], siteObjGenBody, false, false),
    []
  );
  var tagFunctionCallParams = [siteObjGenFunc]
  // add all the additional params to the function call arguments
  if (templateLiteral.expressions) {
    for (var ii = 0; ii < templateLiteral.expressions.length; ii++) {
      //this.genericVisit(templateLiteral.expressions[ii]);
      tagFunctionCallParams.push(templateLiteral.expressions[ii]);
    }
  }
  // produce the tag function call expression
  var tagCallExpression = b.callExpression(
    node.tag,
    tagFunctionCallParams
  );
  nodePath.replace(tagCallExpression);
  this.traverseChildren(nodePath);
};

module.exports = taggedTemplateExpression;
