import { describe, it } from "node:test";
import assert from "node:assert/strict";
import compile from "../src/compiler.js";

// Sample MISC program using your language syntax
const sampleProgram = `
  shout 0;
`;

describe("The compiler", () => {
  it("throws when the output type is missing", () => {
    assert.throws(() => compile(sampleProgram), /Unknown output type/);
  });

  it("throws when the output type is unknown", () => {
    assert.throws(() => compile(sampleProgram, "nope"), /Unknown output type/);
  });

  it("accepts the parsed option", () => {
    const output = compile(sampleProgram, "parsed");
    assert(output, "Parsed output should not be null or undefined");
  });

  it("accepts the analyzed option", () => {
    const output = compile(sampleProgram, "analyzed");
    assert.strictEqual(output.kind, "Program");
  });

  it("accepts the optimized option", () => {
    const output = compile(sampleProgram, "optimized");
    assert.strictEqual(output.kind, "Program");
  });

  it("generates js code when given the js option", () => {
    const output = compile(sampleProgram, "js");
    assert.match(output, /^console\.log\(0\)/);
  });
});
