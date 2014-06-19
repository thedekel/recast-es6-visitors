var b = require('recast').builders;

/*
 * a visitor designed to handle shorthand property definitios e.g. `{ x, y }`
 * and concise method definitions e.g. `var f = { myMethod(){ return true; } }`
 */
var propertyVisitor = function(nodePath){
  //this.genericVisit(node);
  // all that's needed to do is bulid a new property with the same parameters
  // as before, except we set node.method and node.shorthand to false
  var node = nodePath.value;
  if (node.shorthand || node.method) {
    nodePath.replace(b.property(node.kind, node.key, node.value, false, false));
    this.traverse()
  } else {
    this.traverse()
  }
}

module.exports = propertyVisitor;
