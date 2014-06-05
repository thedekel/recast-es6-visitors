var recast = require('recast');
var b = recast.types.builders;
var classVisitors = {};

classVisitors.functionExpression = function(node){
  this.genericVisit(node);
  return node;
};

classVisitors.methodParam = function(node) {
  this.genericVisit(node);
  return node;
};

classVisitors.classDeclaration = function(node) {
  this.genericVisit(node);
  var replacementStatements = b.blockStatement([
    b.variableDeclaration("var", [b.identifier("hello")]),
    b.variableDeclaration("var", [b.identifier("world")])
  ]);
  return replacementStatements;
};

classVisitors.classExpression = function(node) {
  this.genericVisit(node);
  return node;
};

classVisitors.privateIdentifier = function(node) {
  this.genericVisit(node);
  return node;
};

classVisitors.superCallExpression = function(node) {
  this.genericVisit(node);
  return node;
};

classVisitors.superMemberExpression = function(node) {
  this.genericVisit(node);
  return node;
};

module.exports = classVisitors;
