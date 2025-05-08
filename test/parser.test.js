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
  ["Missing semicolon in print", `shout "Hello, world!"`, /Expected ";"$/],
  [
    "Unrecognized keyword in variable declaration",
    `letgo name = "Metro Boomin;"`,
    /Expected "return", "break", "4x4", "ifLit", "const", "letsgo", or "shout"/,
  ],
  [
    "Incorrect conditional syntax",
    `ifLit temperature > 100 { shout "It's hot!"; }`,
    /Expected "\("/,
  ],
  [
    "Loop without braces",
    `4x4 let i = 0; i < 10; i++ shout i;`,
    /Expected "\("/,
  ],
  ["unterminated string", `shout "hello;`, /Expected "\""|Unexpected end/],
  ["illegal keyword", `returnz 5;`, /Expected end of input/],
  ["missing equals in var declaration", `letsgo x "Travis";`, /Expected "="/],
  [
    "incomplete function def",
    `youngMetro f(x: Num) {`,
    /Expected "sendit"|"seeyuh"/,
  ],
  ["completely invalid input", `???`, /Expected/],
];

describe("The parser for MISC language", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`correctly parses ${scenario}`, () => {
      const result = parse(source);
      console.log(
        `PARSE RESULT (${scenario}):`,
        result.succeeded?.(),
        result.message
      );
      assert(result.succeeded(), `Parsing failed for scenario: ${scenario}`);
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`detects errors in ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
