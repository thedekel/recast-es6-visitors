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

  it('should capture 2 rest params, having 2 args', function() {
  var code = [
      '(function(x, y, ...args) {',
      '  return [x, y, args.length, args[0], args[1]];',
      '})(1, 2, 3, 4);'
    ].join('\n');

    var ast = recast.parse(code, recastOptions);
    var visitor = new Visitor();
    var es5Ast = visitor.visit(ast);
    var outputCode = recast.print(es5Ast).code;
    expect(eval(outputCode)).toEqual([1, 2, 2, 3, 4]);
  });

  it('should transform rest parameters in nested functions', function() {
    var code = [
      '(function(x, ...args) {',
      '  return function(...params) {',
      '    return args.concat(params);',
      '  };',
      '})(1, 2, 3)(4, 5);'
    ].join('\n');

    var ast = recast.parse(code, recastOptions);
    var visitor = new Visitor();
    var es5Ast = visitor.visit(ast);
    var outputCode = recast.print(es5Ast).code;
    expect(eval(outputCode)).toEqual([2, 3, 4, 5]);
  });

  it('should supply an array object', function() {
    var code = [
      '(function(...args) {',
      '  return Array.isArray(args);',
      '})()'
    ].join('\n');

    var ast = recast.parse(code, recastOptions);
    var visitor = new Visitor();
    var es5Ast = visitor.visit(ast);
    var outputCode = recast.print(es5Ast).code;
    expect(eval(outputCode)).toBe(true);
  });
});
