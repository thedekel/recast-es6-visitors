/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @emails dmitrys@fb.com javascript@lists.facebook.com
 */

/*jshint evil:true*/
require('mock-modules').autoMockOff();
var esprima;
var es6Visitor;
var recast;
var b;
var Syntax;
var Visitor;
var recastOptions;


// Some tests are taken from jstranform (github.com/facebook/jstransform)
// to ensure compatability
describe('es6-object-short-notation', function() {

  beforeEach(function() {
    esprima= require('esprima-fb');
    es6Visitor = require('../index.js');
    recast = require('recast');
    b = recast.types.builders;
    Syntax = recast.Syntax
    Visitor = es6Visitor.Visitor;
    recastOptions = {
      esprima: esprima
    };
  });

  it('should transform shorthand properties correctly', function() {
    // simple object that uses shorthand notation for property definition
    var simpleEs6Obj = [
      'var obj = {',
      '  myProperty',
      '};'
    ].join('\n');
    // equivalent ES5 object using standard property definition syntax
    var simpleEs5Obj = [
      'var obj = {',
      '  myProperty: myProperty',
      '};'
    ].join('\n');

    // use recast to parse both code snippets, visit the ES6 version with
    // our ES6->ES5 AST converter, an dcompare the printed result of both
    // ASTs
    var es6Ast = recast.parse(simpleEs6Obj, recastOptions);
    var es5Ast = recast.parse(simpleEs5Obj, recastOptions);
    var visitor = new Visitor();
    var newAst = visitor.visit(es6Ast);
    // the idea behind using prettyPrint is that equivalent output code will
    // transform into the exact same output
    expect(recast.prettyPrint(newAst).code).toEqual(recast.prettyPrint(es5Ast).code);
  });

  it('should transform and evaluate short notation correctly', function() {
    var code = [
      '(function(x, y) {',
      '  var data = {x, y};',
      '  return data.x + data.y;',
      '})(2, 3);'
    ].join('\n');

    var ast = recast.parse(code, recastOptions);
    var visitor = new Visitor();
    var es5Ast = visitor.visit(ast);
    var outputCode = recast.print(es5Ast).code;
    expect(eval(outputCode)).toEqual(5);
  });

  it('should transform intricate objects with short notation', function() {
    // more complex usage of short notation within nested objects and functions
    var inputCode = [
      'function init({name, points: [{x, y}, {z, q}]}) {',
      '  return function([{data: {value, score}}]) {',
      '    return {z, q, score, name};',
      '  };',
      '}'
    ].join('\n');
    // the same code, hand converted to es5
    var es5Equivalent = [
      'function init({name:name, points: [{x:x, y:y}, {z:z, q:q}]}) {',
      '  return function([{data: {value:value, score:score}}]) {',
      '    return {z:z, q:q, score:score, name:name};',
      '  };',
      '}'
    ].join('\n');

    // parse and convert the es6 code to an es5 ast and produce the prettyPrint
    // output string
    var ast = recast.parse(inputCode, recastOptions);
    var visitor = new Visitor();
    var outputAst = visitor.visit(ast);
    var outputCode = recast.prettyPrint(outputAst).code;
    var es5Ast = recast.parse(es5Equivalent, recastOptions);

    // compared the output string of prettyPrint code, with a prettyprint 
    // version of the given es5 equivalent code
    expect(outputCode, recast.prettyPrint(es5Ast).code);
  });
});
