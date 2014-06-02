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
  return node;
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

classVisitors.superMemberExpressio = function(node) {
  this.genericVisit(node);
  return node;
};

module.exports = classVisitors;
