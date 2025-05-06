import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import * as core from "../src/core.js";

const semanticChecks = [
  {
    label: "variable declarations",
    code: 'letsgo x = 1; const y = "hello";',
  },
  {
    label: "function declaration",
    code: "youngMetro add(x: Num, y: Num): Num { sendit x + y; }",
  },
  {
    label: "nested if and loop",
    code: `
      letsgo i = 0;
      4x4 (i = 0; i < 5; i++) {
        ifLit (i == 2) {
          shout i;
        } elseLit {
          swampizzo;
        }
      }`,
  },
  {
    label: "array and object literal",
    code: 'letsgo a = [1, 2, 3]; letsgo b = { name: "Travis" };',
  },
  {
    label: "boolean and null literals",
    code: "letsgo x = onGod; letsgo y = carti; letsgo z = ghost;",
  },
  {
    label: "member and subscript",
    code: 'letsgo obj = { name: "Travis" }; shout obj.name; letsgo arr = [1]; shout arr[0];',
  },
  {
    label: "return in function",
    code: "youngMetro id(x: Num): Num { sendit x; }",
  },
  {
    label: "short return",
    code: "youngMetro nope(): Void { seeyuh; }",
  },
  {
    label: "binary and unary",
    code: "shout -1 + 2 * 3 / 4 - 5 % 6;",
  },
  {
    label: "call expression",
    code: "youngMetro add(x: Num, y: Num): Num { sendit x + y; } shout add(1, 2);",
  },
  {
    label: "swampizzo as a statement",
    code: "swampizzo;",
  },
  {
    label: "function expression assignment",
    code: "letsgo f = (x: Num): Num { sendit x + 1; };",
  },
  {
    label: "unary plus",
    code: "shout +5;",
  },
  {
    label: "untyped function parameter",
    code: "youngMetro f(x) { seeyuh; }",
  },
  {
    label: "FunctionDef without return type",
    code: "youngMetro f(x: Num) { seeyuh; }",
  },
  {
    label: "function call within array literal",
    code: "youngMetro f(): Num { sendit 1; } shout [f(), 2];",
  },
  {
    label: "function call as object property value",
    code: "youngMetro f(): Num { sendit 1; } shout { x: f() };",
  },
  {
    label: "unary operation on function call",
    code: "youngMetro f(): Num { sendit 1; } shout -f();",
  },
  {
    label: "member access on function call",
    code: `
      youngMetro getObj(): Num { sendit 1; }
      shout getObj();
    `,
  },
  {
    label: "function call as array element and index",
    code: `
      youngMetro one(): Num { sendit 1; }
      shout [one(), 2][one()];
    `,
  },
  {
    label: "explicit parenthesized call",
    code: `
      youngMetro one(): Num { sendit 1; }
      shout (one());
    `,
  },
  {
    label: "if with else clause",
    code: `
      ifLit (onGod) {
        shout 1;
      } elseLit {
        shout 2;
      }
    `,
  },
  {
    label: "loop with decrement",
    code: `
      letsgo i = 5;
      4x4 (i = 5; i > 0; i--) {
        swampizzo;
      }
    `,
  },
  {
    label: "object literal with multiple pairs",
    code: "letsgo x = { a: 1, b: 2 };",
  },
  {
    label: "if without else clause",
    code: `
      ifLit (onGod) {
        shout 1;
      }
    `,
  },
  {
    label: "empty object literal",
    code: "letsgo x = {};",
  },
];

const semanticErrors = [
  {
    label: "redeclared variable",
    code: "letsgo x = 1; const x = 2;",
    error: /already declared/,
  },
  {
    label: "undeclared variable use",
    code: "shout y;",
    error: /not declared/,
  },
  {
    label: "break outside loop",
    code: "skrrt;",
    error: /only appear in a loop/,
  },
  {
    label: "return outside function",
    code: "sendit 5;",
    error: /only appear in a function/,
  },
  {
    label: "assign to const",
    code: "const x = 1; x = 2;",
    error: /Cannot assign to constant/,
  },
  {
    label: "type mismatch in array",
    code: 'letsgo a = [1, "two"];',
    error: /Not all elements have the same type/,
  },
  {
    label: "parameter type mismatch in call",
    code: 'youngMetro add(x: Num): Num { sendit x; } shout add("hi");',
    error: /Cannot assign a string to a Num/,
  },
  {
    label: "wrong number of args in call",
    code: "youngMetro add(x: Num): Num { sendit x; } shout add();",
    error: /1 argument\(s\) required but 0 passed/,
  },
  {
    label: "bad return type",
    code: 'youngMetro f(): Num { sendit "nope"; }',
    error: /Cannot return a string to a Num/,
  },
  {
    label: "type mismatch in assignment",
    code: 'letsgo x = 1; x = "oops";',
    error: /Cannot assign a string to a Num/,
  },
  {
    label: "undeclared variable use with CST node",
    code: "shout notDeclared;",
    error: /not declared/,
  },
  {
    label: "redeclared variable with CST node",
    code: "letsgo x = 1; letsgo x = 2;",
    error: /already declared/,
  },
];

describe("The analyzer", () => {
  for (const {
    label,
    code,
    expected,
    assert: customAssert,
  } of semanticChecks) {
    it(`recognizes ${label}`, () => {
      const ast = analyze(parse(code));
      if (expected) {
        assert.deepEqual(ast, expected);
      } else if (customAssert) {
        customAssert(ast);
      } else {
        assert.ok(ast);
      }
    });
  }

  for (const { label, code, error } of semanticErrors) {
    it(`throws on ${label}`, () => {
      assert.throws(() => analyze(parse(code)), error);
    });
  }
});
