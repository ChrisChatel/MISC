import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";

function analyzeOk(source) {
  it("analyzes: " + source, () => {
    const match = parse(source);
    assert.doesNotThrow(() => analyze(match));
  });
}

function analyzeError(source, expectedMessage) {
  it("throws on: " + source, () => {
    const match = parse(source);
    assert.throws(() => analyze(match), new RegExp(expectedMessage));
  });
}

describe("Analyzer static checks", () => {
  // Valid examples
  analyzeOk(`letsgo x = 5;`);
  analyzeOk(`const y = "hi";`);
  analyzeOk(`4x4 (i = 0; i < 5; i++) { break; }`);
  analyzeOk(`ifLit (1 < 2) { shout "ok"; }`);
  analyzeOk(`shout "Hello!";`);

  // Re-declaration and scoping
  analyzeOk(`letsgo x = 1; ifLit (x > 0) { letsgo x = 2; }`);
  analyzeOk(`ifLit (true) { letsgo x = 1; } ifLit (true) { letsgo x = 1; }`);

  // Type compatibility
  analyzeOk(`letsgo x = 1 + 2;`);
  analyzeOk(`letsgo y = "hi" + " there";`);
  analyzeOk(`letsgo z = [1, 2, 3];`);

  // Return
  analyzeOk(`4x4 (i = 0; i < 5; i++) { ifLit (i > 2) { return i; } }`);

  // Errors
  analyzeError(`break;`, "break used outside of loop");
  analyzeError(`shout z;`, "z is not declared");
  analyzeError(`letsgo a = 5; letsgo a = 10;`, "a already declared");
  analyzeError(`const b = 5; b = 10;`, "Assignment to constant variable");
  analyzeError(`letsgo z = 5 + "yo";`, "Type mismatch");
  analyzeError(
    `ifLit (true) { letsgo x = 1; letsgo x = 2; }`,
    "x already declared"
  );
  analyzeError(`i++;`, "i is not declared");
  analyzeError(`const z = 5; z++;`, "Cannot increment a constant");
  analyzeError(`shout q + 3;`, "q is not declared");
  analyzeError(
    `4x4 (x = 0; x < 10; x++) { const x = 5; }`,
    "x already declared"
  );
  analyzeError(`4x4 (i = 0; i < 5; i++) { shout a; }`, "a is not declared");
  analyzeError(`return 7;`, "return used outside of function");

  // More valid constructs
  analyzeOk(`letsgo a = 3 * 4 + 5;`);
  analyzeOk(`letsgo s = "Metro" + " Boomin";`);
  analyzeOk(`letsgo l = ["a", "b", "c"];`);
  analyzeOk(`4x4 (i = 0; i < 3; i++) { ifLit (i == 1) { shout "mid"; } }`);
  analyzeOk(`ifLit (1 < 2) { shout "yes"; } else { shout "no"; }`);
  analyzeOk(`const t = [1, 2, 3];`);
  analyzeOk(`ifLit (true) { letsgo val = "sick"; }`);

  // Mixed expressions
  analyzeOk(`letsgo combo = "test" + (1 + 2);`);
  analyzeError(`letsgo bad = [1, "two", true];`, "Type mismatch");

  // Loop edge cases
  analyzeError(`4x4 (i = 0; i < 3; i++) break;`, "Expected '{'");

  // Deep scope access
  analyzeOk(`letsgo outer = 7; ifLit (outer == 7) { shout outer; }`);

  // Array use
  analyzeOk(`letsgo playlist = ["track1", "track2"]; shout playlist;`);
  analyzeError(`shout playlist[0];`, "playlist is not declared");

  // Long chain
  analyzeOk(`letsgo one = 1; letsgo two = one + 1; letsgo three = two + 1;`);

  // EXTRA TESTS to hit 50+
  analyzeOk(`letsgo artist = "Metro";`);
  analyzeOk(`letsgo level = 99 + 1;`);
  analyzeOk(`ifLit (false) { shout "nah"; } else { shout "yep"; }`);
  analyzeOk(`letsgo switches = [true, false, true];`);
  analyzeOk(`4x4 (j = 0; j < 3; j++) { shout j; }`);
  analyzeOk(`ifLit (1 != 2 && 3 > 2) { shout "logic works"; }`);
});
