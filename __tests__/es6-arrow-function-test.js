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
describe('es6-arrow-function', function() {

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
  it('should correctly convert a simple arrow function', function() {
    var simpleEs6Obj = [
      'var func = () => {',
      '  return "test";',
      '};'
    ].join('\n');
    // equivalent ES5 object using standard property definition syntax
    var simpleEs5Obj = [
      'var func = function() {',
      '  return "test";',
      '};'
    ].join('\n');

    expectTransform(simpleEs6Obj, simpleEs5Obj);
  });

  it('should bind to `this` when `this` is used in the function', function() {
    var simpleEs6Obj = [
      'var func = () => {',
      '  this;',
      '};'
    ].join('\n');
    // equivalent ES5 object using standard property definition syntax
    var simpleEs5Obj = [
      'var func = function() {',
      '  this;',
      '}.bind(this);'
    ].join('\n');

    expectTransform(simpleEs6Obj, simpleEs5Obj);
  });
  it('should capture correct this value at different levels', function() {

    var code = [
      'var foo = {',
      '  createFooGetter: function() {',
      '    return (x) => [x, this];', // captures foo
      '  },',
      '  getParentThis: () => this', // captures parent this
      '};'
    ].join('\n');

    eval(transform(code));

    expect(typeof foo.createFooGetter).toBe('function');
    expect(typeof foo.createFooGetter()).toBe('function');
    expect(typeof foo.getParentThis).toBe('function');

    expect(foo.getParentThis()).toEqual(this);
    expect(foo.createFooGetter()(10)).toEqual([10, foo]);
  });

  it('should map an array using arrow capturing this value', function() {
    this.factor = 10;

    var code = '[1, 2, 3].map(x => x * x * this.factor);';

    expect(eval(transform(code))).toEqual([10, 40, 90]);
  });

  it('should filter an array using arrow with two params', function() {
    this.factor = 0;

    var code = [
      '[1, 2, 3].filter((v, idx) => {',
      '  if (idx > 1 && this.factor > 0) {',
      '    return true;',
      '  }',
      '  this.factor++;',
      '  return false;',
      '});'
    ].join('\n');

    expect(eval(transform(code))).toEqual([3]);
  });
  it('should fetch this value data from nested arrow', function() {
    var code = [
      '({',
      '  bird: 22,',
      '  run: function() {',
      '    return () => () => this.bird;',
      '  }',
      '}).run()()();'
    ].join('\n');

    expect(eval(transform(code))).toEqual(22);
  });
  it('should correctly transform arrows', function() {

    // 0 params, expression.
    expectTransform(
      '() => this.value;',
      '(function() {return this.value;}).bind(this);'
    );

    // 0 params, expression wrapped in parens
    expectTransform(
      '() => (this.value);',
      '(function() {return this.value;}).bind(this);'
    );

    // 1 param, no-parens, expression, no this.
    expectTransform(
      'x => x * x;',
      '(function(x) {return x * x;});'
    );

    // 1 param, parens, expression, as argument, no this.
    expectTransform(
      'map((x) => x * x);',
      'map(function(x) {return x * x;});'
    );

    // 2 params, block, as argument, nested.
    expectTransform(
      'makeRequest((response, error) => {'.concat(
      '  return this.update(data => this.onData(data), response);',
      '});'),
      'makeRequest(function(response, error)  {'.concat(
      '  return this.update(function(data)  {return this.onData(data);}.bind(this), response);',
      '}.bind(this));')
    );

    // Assignment to a var, simple, 1 param.
    expectTransform(
      'var action = (value) => this.performAction(value);',
      'var action = function(value)  {return this.performAction(value);}.bind(this);'
    );
  });
});
