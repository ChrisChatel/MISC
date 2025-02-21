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
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  [
    "Missing semicolon in print",
    `shout "Hello, world!"`,
    /Expected ';' at end of statement/,
  ],
  [
    "Unrecognized keyword in variable declaration",
    `letgo name = "Metro Boomin"`,
    /Expected 'letsgo' or 'const'/,
  ],
  [
    "Incorrect conditional syntax",
    `ifLit temperature > 100 { shout "It's hot!"; }`,
    /Expected '(' after 'ifLit'/,
  ],
  [
    "Loop without braces",
    `4x4 let i = 0; i < 10; i++ shout i;`,
    /Expected '{' at start of loop body/,
  ],
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
