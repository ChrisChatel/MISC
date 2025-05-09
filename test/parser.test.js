import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["Printing Output", `shout "Hello, world!";`],
  ["Variable Declaration", `letsgo name = "Travis Scott"; const age = 28;`],
  [
    "Arrays",
    `letsgo artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];`,
  ],
  [
    "Conditional Logic",
    `ifLit (temperature > 100) { shout "It's really hot!"; }`,
  ],
  ["Loops", `4x4 (let i = 0; i < 10; i++) { shout i; }`],
  [
    "function declaration with params and return type",
    `youngMetro sum(a: Num, b: Num): Num { sendit a + b; }`,
  ],

  [
    "function expression assigned to variable",
    `letsgo f = (x: Num): Num { sendit x + 1; };`,
  ],

  [
    "member and subscript expressions",
    `letsgo x = obj.name; letsgo y = arr[0];`,
  ],

  ["chained function calls and member access", `shout getObj().field[1];`],

  ["return without value", `youngMetro done(): Void { seeyuh; }`],

  ["unary and binary ops", `shout -1 + 2 * 3 / 4 - 5 % 6;`],
  [
    "Function type with multiple parameters",
    `letsgo f: (Num, Str) -> Bool = (a: Num, b: Str): Bool { sendit onGod; };`,
  ],
  [
    "Object type with multiple properties",
    `letsgo person: { name: Str, age: Num } = { name: "Carti", age: 27 };`,
  ],
  [
    "Function expression with no parameters and return type",
    `letsgo f = (): Num { sendit 42; };`,
  ],
  [
    "Object type with one property",
    `letsgo artist: { name: Str } = { name: "Utopia" };`,
  ],
  [
    "Function type with one parameter",
    `letsgo f: (Num) -> Str = (x: Num): Str { sendit "done"; };`,
  ],
  [
    "Function type with one parameter",
    `letsgo f: (Num) -> Str = (x: Num): Str { sendit "done"; };`,
  ],
  [
    "Object type with one property",
    `letsgo artist: { name: Str } = { name: "Utopia" };`,
  ],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["missing semicolon in print", `shout "hello"`, /Expected ";"$/],

  ["unterminated string", `shout "hello;`, /Expected "\\\""/],

  [
    "invalid condition missing parens",
    `ifLit true { shout "hot"; }`,
    /Expected "\("/,
  ],

  [
    "missing closing block in if",
    `ifLit (true) { shout "hi";`,
    /Expected "\}"/,
  ],

  [
    "missing else block",
    `ifLit (true) { shout "hi"; } elseLit`,
    /Expected "\{"/,
  ],

  [
    "invalid loop syntax (no parens)",
    `4x4 i = 0; i < 5; i++ { shout i; }`,
    /Expected "\("/,
  ],

  [
    "loop missing closing paren",
    `4x4 (i = 0; i < 5; i++ { shout i; }`,
    /Expected "\)"/,
  ],

  ["loop missing braces", `4x4 (i = 0; i < 5; i++) shout i;`, /Expected "\{"/],

  ["missing = in variable declaration", `letsgo x "Travis";`, /Expected .*"="/],

  ["array literal missing bracket", `letsgo a = [1, 2, 3;`, /Expected "\]"/],

  [
    "object literal missing colon",
    `letsgo x = { name "Travis" };`,
    /Expected ":"/,
  ],

  [
    "object type missing colon",
    `letsgo p: { name Num } = { name: 1 };`,
    /Expected ":"/,
  ],

  ["function call missing )", `shout sum(1, 2;`, /Expected "\)"/],

  [
    "bad return (no semicolon)",
    `youngMetro f(): Num { sendit 5 }`,
    /Expected ";".*/,
  ],

  [
    "function expression missing body",
    `letsgo f = (x: Num): Num;`,
    /Expected "\{"/,
  ],

  [
    "chained dot access with no base",
    `.field;`,
    /Expected (PrimaryExpr|end of input)/,
  ],

  ["completely invalid input", `???`, /Expected/],
];

describe("The parser for MISC language", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`correctly parses ${scenario}`, () => {
      const result = parse(source);
      assert(result.succeeded(), `Parsing failed for scenario: ${scenario}`);
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`detects errors in ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
