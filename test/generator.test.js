import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "variable declaration and shout",
    source: `
      letsgo x = 3 + 4;
      shout(x);
    `,
    expected: dedent`
      let x_1 = (3 + 4);
      console.log(x_1);
    `,
  },
  {
    name: "while loop",
    source: `
      letsgo x = 0;
      4x4 (x < 10; x++) {
        shout(x);
      }
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 10)) {
        console.log(x_1);
      }
    `,
  },
  {
    name: "ifLit and elseLit",
    source: `
      letsgo score = 21;
      ifLit (score > 10) {
        shout("🔥");
      } elseLit {
        shout("💀");
      }
    `,
    expected: dedent`
      let score_1 = 21;
      if ((score_1 > 10)) {
        console.log("🔥");
      } else {
        console.log("💀");
      }
    `,
  },
  {
    name: "short return in function",
    source: `
      youngMetro sum() {
        sendit;
      }
    `,
    expected: dedent`
      function sum_1() {
        return;
      }
    `,
  },
  {
    name: "optional expression with ??",
    source: `
      letsgo x = ghost int;
      letsgo y = x ?? 7;
    `,
    expected: dedent`
      let x_1 = undefined;
      let y_2 = (x_1 ?? 7);
    `,
  },
  {
    name: "print shout with multiplication and subtraction",
    source: `
      letsgo z = 8;
      shout(z * -2 + 4);
    `,
    expected: dedent`
      let z_1 = 8;
      console.log(((z_1 * -2) + 4));
    `,
  },
];

describe("The MISC code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected JS output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
