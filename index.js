var recast = require('recast');
var esprima= require('esprima-fb');
var types = recast.types;
var isArray = types.builtInTypes.array;
var isObject = types.builtInTypes.object;
var NodePath = types.NodePath;
var n = types.namedTypes;
var classVisitors = require('es6-class');

var ES6Visitor = recast.Visitor.extend({
  visitProperty: require('./visitors/property'),
  visitFunctionExpression: require('./visitors/functionExpression'),
  visitArrowFunctionExpression: require('./visitors/arrowFunctionExpression'),
  visitTemplateLiteral: require('./visitors/templateLiteral'),
  visitTaggedTemplateExpression: require('./visitors/taggedTemplateExpression'),
  visitClassFunctionExpression: classVisitors.transform,
  visitClassMethodParam: classVisitors.transform,
  visitClassDeclaration: classVisitors.transform,
  visitClassExpression: classVisitors.transform,
  visitPrivateIdentifier: classVisitors.transform,
  visitSuperCallExpression: classVisitors.transform,
  visitSuperMemberExpression: classVisitors.transform
});

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
    classVisitors.visitNode.call(this, node);
  } else if (n.ClassExpression.check(node)) {
    classVisitors.visitNode.call(this, node);
  } else if (n.CallExpression.check(node)) {
    if (n.Identifier.check(node.callee) && node.callee.name === 'super') {
      // super()
      classVisitors.visitNode.call(this, node);
    } else if (n.MemberExpression.check(node.callee) && n.Identifier.check(node.callee.object) && node.callee.object.name === 'super') {
      // super.foo()
      classVisitors.visitNode.call(this, node);
    }
  } else if (n.MemberExpression.check(node) && n.Identifier.check(node.object) && node.object.name === 'super') {
    classVisitors.visitNode.call(this, node);
  }
}

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
function transform(node) {
  function postOrderTraverse(path) {
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
  return rootPath.value.root;
}

/**
 * Transform JavaScript written using ES6 by replacing all classes
 * with the equivalent ES5.
 *
 * @param {string} source
 * @return {string}
 */
function compile(source, mapOptions) {
  mapOptions = mapOptions || {};

  var recastOptions = {
    // Use the harmony branch of Esprima that installs with es6-class
    // instead of the master branch that recast provides.
    esprima: esprima,

    sourceFileName: mapOptions.sourceFileName,
    sourceMapName: mapOptions.sourceMapName
  };

  var ast = recast.parse(source, recastOptions);
  return recast.print(transform(ast), recastOptions);
}

function parse(source, mapOptions) {
  mapOptions = mapOptions || {};

  var recastOptions = {
    // Use the harmony branch of Esprima that installs with es6-class
    // instead of the master branch that recast provides.
    esprima: esprima,

    sourceFileName: mapOptions.sourceFileName,
    sourceMapName: mapOptions.sourceMapName
  };

  var ast = recast.parse(source, recastOptions);
  return ast;
}

module.exports.transform = transform;
module.exports.compile = compile;
module.exports.parse = parse;

