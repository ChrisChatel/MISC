import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";

const semanticChecks = [
  ["variable declarations", 'letsgo x = 1; const y = "hello";'],
  [
    "function declaration",
    "youngMetro add(x: Num, y: Num): Num { sendit x + y; }",
  ],
  [
    "nested if and loop",
    `
    letsgo i = 0;
    4x4 (i = 0; i < 5; i++) {
      ifLit (i == 2) {
        shout i;
      } elseLit {
        swampizzo;
      }
    }`,
  ],
  [
    "array and object literal",
    'letsgo a = [1, 2, 3]; letsgo b = { name: "Travis" };',
  ],
  [
    "boolean and null literals",
    "letsgo x = onGod; letsgo y = carti; letsgo z = ghost;",
  ],
  [
    "member and subscript",
    'letsgo obj = { name: "Travis" }; shout obj.name; letsgo arr = [1]; shout arr[0];',
  ],
  ["return in function", "youngMetro id(x: Num): Num { sendit x; }"],
  ["short return", "youngMetro nope(): Void { seeyuh; }"],
  ["binary and unary", "shout -1 + 2 * 3 / 4 - 5 % 6;"],
  [
    "call expression",
    "youngMetro add(x: Num, y: Num): Num { sendit x + y; } shout add(1, 2);",
  ],
  ["swampizzo as a statement", "swampizzo;"],
  [
    "function expression assignment",
    "letsgo f = (x: Num): Num { sendit x + 1; };",
  ],
  ["unary plus", "shout +5;"],
  ["untyped function parameter", "youngMetro f(x) { seeyuh; }"],
  ["FunctionDef without return type", "youngMetro f(x: Num) { seeyuh; }"],
  [
    "function call within array literal",
    "youngMetro f(): Num { sendit 1; } shout [f(), 2];",
  ],
  [
    "function call as object property value",
    "youngMetro f(): Num { sendit 1; } shout { x: f() };",
  ],
  [
    "unary operation on function call",
    "youngMetro f(): Num { sendit 1; } shout -f();",
  ],
  [
    "member access on function call",
    `
    youngMetro getObj(): Num { sendit 1; }
    shout getObj();
  `,
  ],
  [
    "function call as array element and index",
    `
    youngMetro one(): Num { sendit 1; }
    shout [one(), 2][one()];
  `,
  ],
  [
    "explicit parenthesized call",
    `
    youngMetro one(): Num { sendit 1; }
    shout (one());
  `,
  ],
  [
    "if with else clause",
    `
    ifLit (onGod) {
      shout 1;
    } elseLit {
      shout 2;
    }
  `,
  ],
  [
    "loop with decrement",
    `
    letsgo i = 5;
    4x4 (i = 5; i > 0; i--) {
      swampizzo;
    }
  `,
  ],
  ["object literal with multiple pairs", "letsgo x = { a: 1, b: 2 };"],
  [
    "if without else clause",
    `
    ifLit (onGod) {
      shout 1;
    }
  `,
  ],
  ["empty object literal", "letsgo x = {};"],
  [
    "valid function call with no parameters",
    `youngMetro hi(): Void { seeyuh; } shout hi();`,
  ],
  [
    "valid function call with 1 param",
    `youngMetro greet(name: Str): Void { seeyuh; } shout greet("hi");`,
  ],
  [
    "function call with correctly typed arguments",
    `
    youngMetro greet(name: Str, age: Num): Void {
      seeyuh;
    }
    shout greet("hi", 21);
    `,
  ],
  [
    "call with multiple typed arguments",
    `
    youngMetro sum(a: Num, b: Num): Num {
      sendit a + b;
    }
    shout sum(3, 4);
    `,
  ],
  [
    "call to function with untyped parameter (to hit line 193)",
    `
    youngMetro hello(x) {
      seeyuh;
    }
    shout hello(42);
    `,
  ],
];

const semanticErrors = [
  ["redeclared variable", "letsgo x = 1; const x = 2;", /already declared/],
  ["undeclared variable use", "shout y;", /not declared/],
  ["break outside loop", "skrrt;", /only appear in a loop/],
  ["return outside function", "sendit 5;", /only appear in a function/],
  ["assign to const", "const x = 1; x = 2;", /Cannot assign to constant/],
  [
    "type mismatch in array",
    'letsgo a = [1, "two"];',
    /Not all elements have the same type/,
  ],
  [
    "parameter type mismatch in call",
    'youngMetro add(x: Num): Num { sendit x; } shout add("hi");',
    /Cannot assign a string to a Num/,
  ],
  [
    "wrong number of args in call",
    "youngMetro add(x: Num): Num { sendit x; } shout add();",
    /1 argument\(s\) required but 0 passed/,
  ],
  [
    "bad return type",
    'youngMetro f(): Num { sendit "nope"; }',
    /Cannot return a string to a Num/,
  ],
  [
    "type mismatch in assignment",
    'letsgo x = 1; x = "oops";',
    /Cannot assign a string to a Num/,
  ],
  [
    "undeclared variable use with CST node",
    "shout notDeclared;",
    /not declared/,
  ],
  [
    "redeclared variable with CST node",
    "letsgo x = 1; letsgo x = 2;",
    /already declared/,
  ],
  ["non-function call", "letsgo x = 1; shout x();", /is not callable/],
  [
    "call to undeclared function",
    "shout fakeFunc();",
    /Function fakeFunc not declared/,
  ],
  [
    "parameter type mismatch in call",
    `
    youngMetro greet(name: Str, age: Num): Void {
      seeyuh;
    }
    shout greet(123, 456); // 123 is Num, expected Str
    `,
    /Cannot assign a Num to a Str/,
  ],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }

  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
});
