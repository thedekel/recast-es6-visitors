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
describe('es6-class', function() {

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
  it('handles an empty body', function() {
    var code = transform(
      'class Foo {}'
    );

    eval(code);

    var fooInst = new Foo();
    expect(fooInst instanceof Foo).toBe(true);
  });

  it('handles constructors without params', function() {
    var code = transform([
      'class Foo {',
      '  constructor() {',
      '    this.test = "testValue";',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    var fooInst = new Foo();
    expect(fooInst.test).toBe('testValue');
  });
  it('handles constructors with params', function() {
    var code = transform([
      'class Foo {',
      '  constructor(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    var fooInst = new Foo('a', 'b');
    expect(fooInst.p1).toBe('a');
    expect(fooInst.p2).toBe('b');
  });

  it('handles prototype methods without params', function() {
    var code = transform([
      'class Foo {',
      '  bar() {',
      '    return "stuff";',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    var fooInst = new Foo();
    expect(fooInst.bar()).toBe('stuff');
  });

  it('handles prototype methods with params', function() {
    var code = transform([
      'class Foo {',
      '  bar(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    var fooInst = new Foo();
    fooInst.bar('a', 'b');
    expect(fooInst.p1).toBe('a');
    expect(fooInst.p2).toBe('b');
  });

  it('handles static methods without params', function() {
    var code = transform([
      'class Foo {',
      '  static bar() {',
      '    return "stuff";',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    expect(Foo.bar()).toBe('stuff');
    var fooInst = new Foo();
    expect(fooInst.bar).toBe(undefined);
  });

  it('handles static methods with params', function() {
    var code = transform([
      'class Foo {',
      '  static bar(p1, p2) {',
      '    return [p1, p2];',
      '  }',
      '}'
    ].join('\n'));

    eval(code);

    expect(Foo.bar('a', 'b')).toEqual(['a', 'b']);
    var fooInst = new Foo();
    expect(fooInst.bar).toBe(undefined);
  });

  it('handles extension from an identifier', function() {
    var code = transform([
      'function Parent() {}',
      'Parent.prototype.protoProp = "protoProp";',
      'Parent.staticProp = "staticProp";',

      'class Child extends Parent {}'
    ].join('\n'));

    var exports = new Function(
      code + 'return {Child: Child, Parent: Parent};'
    )();
    var Child = exports.Child;
    var Parent = exports.Parent;

    expect(Child.protoProp).toBe(undefined);
    expect(Child.staticProp).toBe('staticProp');
    var childInst = new Child();
    expect(childInst instanceof Child).toBe(true);
    expect(childInst instanceof Parent).toBe(true);
    expect(childInst.protoProp).toBe('protoProp');
  });

  it('handles extension from an expression', function() {
    var code = transform([
      'function Parent1() {}',
      'Parent1.prototype.protoProp = "protoProp";',
      'Parent1.staticProp = "staticProp";',

      'function Parent2() {}',

      'class Child extends true ? Parent1 : Parent2 {}'
    ].join('\n'));

    var exports = new Function(
      code + 'return {Parent1: Parent1, Child: Child};'
    )();
    var Child = exports.Child;
    var Parent1 = exports.Parent1;

    expect(Child.protoProp).toBe(undefined);
    expect(Child.staticProp).toBe('staticProp');
    var childInst = new Child();
    expect(childInst instanceof Child).toBe(true);
    expect(childInst instanceof Parent1).toBe(true);
    expect(childInst.protoProp).toBe('protoProp');
    expect(childInst.staticProp).toBe(undefined);
  });

  it('runs parent constructor when child constructor absent', function() {
    var code = transform([
      'class Parent {',
      '  constructor(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}',

      'class Child extends Parent {}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child('a', 'b');
    expect(childInst.p1).toBe('a');
    expect(childInst.p2).toBe('b');
  });

  it('sets constructor property to point at constructor func', function() {
    var code = transform([
      'class Parent {}',
      'class Child extends Parent {}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.constructor).toBe(Child);
  });

  it('handles super CallExpressions within constructors', function() {
    var code = transform([
      'class Parent {',
      '  constructor(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  constructor() {',
      '    super("a", "b");',
      '    this.childRan = true;',
      '  }',
      '}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.p1).toBe('a');
    expect(childInst.p2).toBe('b');
    expect(childInst.childRan).toBe(true);
  });
/*
 * This Test fails because es6-class doesn't handle computer member expressions
 * correctly
  it('handles computed super MemberExpressions', function() {
    var code = transform([
      'class Parent {',
      '  constructor() {',
      '    this.counter = 0;',
      '  }',
      '  incrementCounter(amount) {',
      '    this.counter += amount;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  childIncrement() {',
      '    super["increment" + "Counter"](2);',
      '  }',
      '}'
    ].join('\n'));
    console.log(code);

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.counter).toBe(0);
    childInst.childIncrement();
    expect(childInst.counter).toBe(2);
  });
  */

  it('handles simple super MemberExpression access', function() {
    var code = transform([
      'class Parent {',
      '  getFoo(p) {',
      '    return "foo" + p;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  getChildFoo() {',
      '    var x = super.getFoo;',
      '    return x("bar");',
      '  }',
      '}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.getChildFoo()).toBe('foobar');
  });
  it('handles CallExpression on a super MemberExpression', function() {
    var code = transform([
      'class Parent {',
      '  getFoo(p) {',
      '    this.fooValue = "foo";',
      '    return this.fooValue + p;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  getChildFoo() {',
      '    return super.getFoo.call(this, "bar");',
      '  }',
      '}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.getChildFoo()).toBe('foobar');
    expect(childInst.fooValue).toBe('foo');
  });

  it('handles super MemberExpressions within constructors', function() {
    var code = transform([
      'class Parent {',
      '  setParams(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  constructor() {',
      '    super.setParams("a", "b");',
      '  }',
      '}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.p1).toBe('a');
    expect(childInst.p2).toBe('b');
  });

  it('handles super MemberExpressions within proto methods', function() {
    var code = transform([
      'class Parent {',
      '  setParams(p1, p2) {',
      '    this.p1 = p1;',
      '    this.p2 = p2;',
      '  }',
      '}',

      'class Child extends Parent {',
      '  bar() {',
      '    super.setParams("a", "b");',
      '    this.barRan = true;',
      '  }',
      '}'
    ].join('\n'));

    var Child = new Function(code + 'return Child;')();

    var childInst = new Child();
    expect(childInst.p1).toBe(undefined);
    expect(childInst.p2).toBe(undefined);
    expect(childInst.barRan).toBe(undefined);
    childInst.bar();
    expect(childInst.p1).toBe('a');
    expect(childInst.p2).toBe('b');
    expect(childInst.barRan).toBe(true);
  });

});

