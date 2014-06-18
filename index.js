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
/*
function visitNode(node, postOrderTraverse) {
  if (n.Property.check(node)) {
    require('./visitors/property').call(this, node);
  } else if (n.FunctionExpression.check(node)) {
    require('./visitors/functionExpression').call(this, node);
  } else if (n.ArrowFunctionExpression.check(node)) {
    require('./visitors/arrowFunctionExpression').call(this, node);
  } else if (n.TemplateLiteral.check(node)) {
    require('./visitors/templateLiteral').call(this, node);
  } else if (n.TaggedTemplateExpression.check(node)) {
    require('./visitors/taggedTemplateExpression').call(this, node);
  } else if (n.ClassDeclaration.check(node)) {
    classVisitors.visitClassDeclaration.call(this, node);
  } else if (n.ClassExpression.check(node)) {
    classVisitors.visitClassExpression.call(this, node);
  } else if (n.CallExpression.check(node)) {
    if (n.Identifier.check(node.callee) && node.callee.name === 'super') {
      // super()
    classVisitors.visitSuperCall.call(this, node);
    } else if (n.MemberExpression.check(node.callee) && n.Identifier.check(node.callee.object) && node.callee.object.name === 'super') {
      // super.foo()
    classVisitors.visitSuperCallMemberExpression.call(this, node);
    }
  } else if (n.MemberExpression.check(node) && n.Identifier.check(node.object) && node.object.name === 'super') {
    classVisitors.visitSuperMemberExpression.call(this, node);
  }
}
*/

/**
 * Transform an Esprima AST generated from ES6 into equivalent ES5
 *
 * NOTE: The argument may be modified by this function. To prevent modification
 * of your AST, pass a copy instead of a direct reference:
 *
 *   // instead of transform(ast), pass a copy
 *   transform(JSON.parse(JSON.stringify(ast));
 *
 * @param {Object} ast
 * @return {Object}
 */
function transform(ast) {
  var visitedAst = recast.visit(ast, visitors );
  return visitedAst;
  /*function postOrderTraverse(path) {
    var value = path.value;

    if (isArray.check(value)) {
      path.each(postOrderTraverse);
      return;
    }

    if (!isObject.check(value)) {
      return;
    }

    types.eachField(value, function(name, child) {
      var childPath = path.get(name);
      if (childPath.value !== child) {
        childPath.replace(child);
      }
      postOrderTraverse(childPath);
    });

    if (n.Node.check(value)) {
      visitNode.call(path, value, postOrderTraverse);
    }
  }

  if (node instanceof NodePath) {
    postOrderTraverse(node);
    return node.value;
  }

  var rootPath = new NodePath({ root: node });
  postOrderTraverse(rootPath.get("root"));
  return rootPath.value.root;*/
}


module.exports = {
  transform: transform,
  parse: recast.genParse(transform),
  compile: recast.genCompile(transform),
  visitors: visitors
};
