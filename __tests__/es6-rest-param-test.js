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

  function transform(code) {
    return recast.prettyPrint(
      es6Visitor.transform(recast.parse(code, recastOptions))
    ).code;
  }

  function expectTransform(code, result) {
    // use recast to parse both code snippets, visit the ES6 version with
    // our ES6->ES5 AST converter, and compare the printed result of both
    // ASTs
    expect(transform(code)).
      toEqual(recast.prettyPrint(recast.parse(result, recastOptions)).code);
  }

  it('should capture 2 rest params, having 2 args', function() {
  var code = [
      '(function(x, y, ...args) {',
      '  return [x, y, args.length, args[0], args[1]];',
      '})(1, 2, 3, 4);'
    ].join('\n');

    expect(eval(transform(code))).toEqual([1, 2, 2, 3, 4]);
  });

  it('should transform rest parameters in nested functions', function() {
    var code = [
      '(function(x, ...args) {',
      '  return function(...params) {',
      '    return args.concat(params);',
      '  };',
      '})(1, 2, 3)(4, 5);'
    ].join('\n');

    expect(eval(transform(code))).toEqual([2, 3, 4, 5]);
  });

  it('should supply an array object', function() {
    var code = [
      '(function(...args) {',
      '  return Array.isArray(args);',
      '})()'
    ].join('\n');

    expect(eval(transform(code))).toBe(true);
  });
});
