import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

describe("Compiler", () => {
  it("can invoke the parser", () => {
    const sourceCode = `shout "Hello, world!";`; // Simple valid MISC program
    assert.doesNotThrow(() => parse(sourceCode));
  });
});
