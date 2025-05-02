import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import * as core from "../src/core.js";

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
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }

  for (const [scenario, source, errorPattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorPattern);
    });
  }

  it("produces expected core output for a simple program", () => {
    assert.deepEqual(
      analyze(parse("letsgo x = 1 + 2;")),
      core.program([
        core.variableDeclaration(
          "x",
          core.binary("+", core.number(1), core.number(2)),
          false
        ),
      ])
    );
  });
});
