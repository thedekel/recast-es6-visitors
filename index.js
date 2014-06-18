var recast = require('recast');
var esprima= require('esprima-fb');
var types = recast.types;
var isArray = types.builtInTypes.array;
var isObject = types.builtInTypes.object;
var NodePath = types.NodePath;
var n = types.namedTypes;
var classVisitors = require('es6-class').visitors;

var visitors = {
  visitProperty: require('./visitors/property'),
  visitFunctionExpression: require('./visitors/functionExpression'),
  visitArrowFunctionExpression: require('./visitors/arrowFunctionExpression'),
  visitTemplateLiteral: require('./visitors/templateLiteral'),
  visitTaggedTemplateExpression: require('./visitors/taggedTemplateExpression'),
  visitClassDeclaration: classVisitors.visitClassDeclaration,
  visitClassExpression: classVisitors.visitClassExpression,
  visitCallExpression: classVisitors.visitCallExpression,
  visitMemberExpression: classVisitors.visitMemberExpression
};

function transform(ast) {
  var visitedAst = recast.visit(ast, visitors );
  return visitedAst;
}

module.exports = {
  transform: transform,
  parse: recast.genParse(transform),
  compile: recast.genCompile(transform),
  visitors: visitors
};
