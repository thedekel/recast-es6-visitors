var util = require('util');

/**
 * Helper function for analyzeAndTraverse which queues up all of the children
 * of the given node.
 *
 * Children can also be found in arrays, so we basically want to merge all of
 * those arrays together so we can sort them and then traverse the children
 * in order.
 *
 * One example is the Program node. It contains `body` and `comments`, both
 * arrays. Lexographically, comments are interspersed throughout the body
 * nodes, but esprima's AST groups them together.
 */
function enqueueNodeWithStartIndex(queue, node) {
  if (typeof node !== 'object' || node === null) {
    return;
  }
  if (node.range) {
    queue.push([node, node.range[0]]);
  } else if (Array.isArray(node)) {
    for (var ii = 0; ii < node.length; ii++) {
      enqueueNodeWithStartIndex(queue, node[ii]);
    }
  } else {
    // if it's impossible to queue with a start index, enqueue at the begining
    queue.push([node, 0])
  }
}

/**
 * It is crucial that we traverse in order, or else catchup() on a later
 * node that is processed out of order can move the buffer past a node
 * that we haven't handled yet, preventing us from modifying that node.
 *
 * This can happen when a node has multiple properties containing children.
 * For example, XJSElement nodes have `openingElement`, `closingElement` and
 * `children`. If we traverse `openingElement`, then `closingElement`, then
 * when we get to `children`, the buffer has already caught up to the end of
 * the closing element, after the children.
 *
 * This is basically a Schwartzian transform. Collects an array of children,
 * each one represented as [child, startIndex]; sorts the array by start
 * index; then traverses the children in that order.
 */
function getOrderedChildren(node) {
  var queue = [];
  for (var key in node) {
    if (node.hasOwnProperty(key)) {
      enqueueNodeWithStartIndex(queue, node[key]);
    }
  }
  queue.sort(function(a, b) { return a[1] - b[1]; });
  return queue.map(function(pair) { return pair[0]; });
}

/**
 * Apply the given analyzer function to the current node. If the analyzer
 * doesn't return false, traverse each child of the current node using the given
 * traverser function.
 *
 * @param {function} analyzer
 * @param {function} traverser
 * @param {object} node
 * @param {function} visitor
 * @param {array} path
 * @param {object} state
 */
function analyzeAndTraverse(analyzer, traverser, node, path, state) {
  if (node.type) {
    if (analyzer(node, path, state) === false) {
      return;
    }
    path.unshift(node);
  }

  getOrderedChildren(node).forEach(function(child) {
    traverser(child, path, state);
  });

  node.type && path.shift();
}

/**
 * Checks whether a node or any of its sub-nodes contains
 * a syntactic construct of the passed type.
 * @param {object} node - AST node to test.
 * @param {string} type - node type to lookup.
 */
function containsChildOfType(node, type) {
  var foundMatchingChild = false;
  function nodeTypeAnalyzer(node) {
    if (node.type === type) {
      foundMatchingChild = true;
      return false;
    }
  }
  function nodeTypeTraverser(child, path, state) {
    if (!foundMatchingChild) {
      foundMatchingChild = containsChildOfType(child, type);
    }
  }
  analyzeAndTraverse(
    nodeTypeAnalyzer,
    nodeTypeTraverser,
    node,
    []
  );
  return foundMatchingChild;
}

module.exports.containsChildOfType = containsChildOfType;
