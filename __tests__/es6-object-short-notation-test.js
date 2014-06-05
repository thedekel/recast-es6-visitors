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


// Some tests are taken from jstransform (github.com/facebook/jstransform)
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

    expectTransform(simpleEs6Obj, simpleEs5Obj);
  });

  it('should transform and evaluate short notation correctly', function() {
    var code = [
      '(function(x, y) {',
      '  var data = {x, y};',
      '  return data.x + data.y;',
      '})(2, 3);'
    ].join('\n');

    expect(eval(transform(code))).toEqual(5);
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

    expectTransform(inputCode, es5Equivalent);
  });
});
