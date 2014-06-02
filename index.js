var recast = require('recast');
var classVisitors = require('./visitors/class');

var ES6Visitor = recast.Visitor.extend({
  visitProperty: require('./visitors/property'),
  visitFunctionExpression: require('./visitors/functionExpression'),
  visitArrowFunctionExpression: require('./visitors/arrowFunctionExpression'),
  visitTemplateLiteral: require('./visitors/templateLiteral'),
  visitTaggedTemplateExpression: require('./visitors/taggedTemplateExpression'),
  visitClassFunctionExpression: classVisitors.functionExpression,
  visitClassMethodParam: classVisitors.methodParam,
  visitClassDeclaration: classVisitors.classDeclaration,
  visitClassExpression: classVisitors.classExpression,
  visitPrivateIdentifier: classVisitors.privateIdentifier,
  visitSuperCallExpression: classVisitors.superCallExpression,
  visitSuperMemberExpression: classVisitors.superMemberExpression
});

module.exports.Visitor = ES6Visitor;
