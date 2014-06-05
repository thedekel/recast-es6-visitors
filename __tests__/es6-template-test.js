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
describe('es6-template', function() {

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

  function expectEval(code, result, setupFn) {
        var actual;

        if (setupFn) {
            eval(setupFn);
        }

        eval("actual = " + transform(code));
        expect(actual).toEqual(result);
    }

    function expectEvalTag(code, tagFn, scope) {
        if (scope) {
            Object.keys(scope).forEach(function(key) {
                return this[key] = scope[key];
            }.bind(this));
        }

        var tagCalls = 0;

        var tag = function() {
            var args = Array.prototype.slice.call(arguments, 0);
            tagCalls++;
            return tagFn.apply(this, args);
        };

        var result = transform(code);
        eval(result);
        expect(tagCalls).toBe(1);
    }

    function expectSiteObj(siteObj, cooked, raw) {
        expect(Array.isArray(siteObj)).toBe(true);
        expect(Object.isFrozen(siteObj)).toBe(true);
        expect(Array.isArray(siteObj.raw)).toBe(true);
        expect(Object.isFrozen(siteObj.raw)).toBe(true);
        expect(siteObj.length).toBe(cooked.length);
        expect(siteObj.raw.length).toBe(raw.length);

        for (var ii = 0; ii < cooked.length; ii++) {
            expect(siteObj[ii]).toEqual(cooked[ii]);
        }

        expect(siteObj.raw).toEqual(raw);
    }
    it("should transform simple literals", function() {
        expectTransform("`foo bar`", "(\"foo bar\")");
        expectEval("`foo bar`", "foo bar");
        expectEval("`$`", "$");
        expectEval("`$foo`", "$foo");
    });
    it("should properly escape templates containing quotes", function() {
        expectTransform("`foo \"bar\"`", "(\"foo \\\"bar\\\"\")");
        expectEval("`foo \"bar\"`", "foo \"bar\"");
        expectTransform("`foo 'bar'`", "(\"foo 'bar'\")");
        expectEval("`foo 'bar'`", "foo 'bar'");
        expectTransform("`foo \\\\\"bar\\\\\"`", "(\"foo \\\\\\\"bar\\\\\\\"\")");
        expectEval("`foo \\\\\\\"bar\\\\\\\"`", "foo \\\"bar\\\"");
    });

    it("should transform simple substitutions", function() {
        expectTransform("`foo ${bar}`", "(\"foo \" + bar)");
        expectTransform("`${foo} bar`", "(foo + \" bar\")");
        expectTransform("`${foo} ${bar}`", "(foo + \" \" + bar)");
        expectTransform("`${foo}${bar}`", "(foo + bar)");
    });

    it("should transform expressions", function() {
        expectTransform("`foo ${bar()}`", "(\"foo \" + bar())");
        expectTransform("`foo ${bar.baz}`", "(\"foo \" + bar.baz)");
        expectTransform("`foo ${bar + 5}`", "(\"foo \" + (bar + 5))");
        expectTransform("`${foo + 5} bar`", "((foo + 5) + \" bar\")");
        expectTransform("`${foo + 5} ${bar}`", "((foo + 5) + \" \" + bar)");
        expectTransform("`${(function(b) {alert(4);})(a)}`", "((function(b) {alert(4);})(a))");
    });
    it("should transform tags with simple templates", function() {
        var tag = function(elements) {
            expectSiteObj(elements, ["foo bar"], ["foo bar"]);
        };

        var result = transform("tag`foo bar`");
        eval(result);

        var a = {
            b: tag
        };

        eval(transform("a.b`foo bar`"));
        eval(transform("a['b']`foo bar`"));

        var getTag = function() {
            return tag;
        };

        eval(transform("getTag()`foo bar`"));
        eval(transform("(getTag())`foo bar`"));
    });


    it("should transform tags with substitutions", function() {
        expectTransform(
          "tag`foo ${bar} baz`",
          "tag(function() { var siteObj = [\"foo \", \" baz\"]; " +
            "siteObj.raw = [\"foo \", \" baz\"]; Object.freeze(siteObj.raw); "
          + "Object.freeze(siteObj); return siteObj; }(), bar)"
        );

        expectEvalTag("tag`foo ${bar + 'abc'} baz`", function(elements) {
            debugger;
            var args = Array.prototype.slice.call(arguments, 1);
            expectSiteObj(elements, ["foo ", " baz"], ["foo ", " baz"]);
            expect(args.length).toBe(1);
            expect(args[0]).toBe("barabc");
        }, {
            bar: "bar"
        });

        expectEvalTag("tag`foo ${bar + 'abc'}`", function(elements) {
            var args = Array.prototype.slice.call(arguments, 1);
            expectSiteObj(elements, ["foo ", ""], ["foo ", ""]);
            expect(args.length).toBe(1);
            expect(args[0]).toBe("barabc");
        }, {
            bar: "bar"
        });

        expectEvalTag("tag`foo\n\n\nbar`", function(elements) {
            expectSiteObj(elements, ["foo\n\n\nbar"], ["foo\n\n\nbar"]);
        });

        expectEvalTag("tag`a\nb\n${c}\nd`", function(elements) {
            var args = Array.prototype.slice.call(arguments, 1);
            expectSiteObj(elements, ["a\nb\n", "\nd"], ["a\nb\n", "\nd"]);
            expect(args.length).toBe(1);
            expect(args[0]).toBe("c");
        }, {
            c: "c"
        });
    });

    it("should handle multiple lines", function() {
        expectEval("`foo\n\nbar`", "foo\n\nbar");
        expectEval("`foo\\nbar`", "foo\nbar");
        expectEval("`foo\\\\nbar`", "foo\\nbar");
        expectEval("`foo\n${bar}\nbaz`", "foo\nabc\nbaz", "var bar = \"abc\";");
    });

});
