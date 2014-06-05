var recast = require('recast');
var b = recast.types.builders;

/*
 * a visitor designed to handle shorthand property definitios e.g. `{ x, y }`
 * and concise method definitions e.g. `var f = { myMethod(){ return true; } }`
 */
var propertyVisitor = function(node){
  //this.genericVisit(node);
  // all that's needed to do is bulid a new property with the same parameters
  // as before, except we set node.method and node.shorthand to false
  if (node.shorthand || node.method) {
    this.replace(b.property(node.kind, node.key, node.value, false, false));
  } else {
    return node;
  }
}

module.exports = propertyVisitor;
