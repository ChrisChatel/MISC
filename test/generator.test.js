import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";
import { asLines } from "../src/generator.js";

function dedent(input) {
  const str = String(input);
  const lines = str.split("\n");
  const trimmedLines = lines.filter((line) => line.trim().length > 0);
  const indent = Math.min(
    ...trimmedLines.map((line) => line.match(/^ */)[0].length)
  );
  return trimmedLines.map((line) => line.slice(indent)).join("\n");
}

const fixtures = [
  {
    name: "if with else",
    source: `
      letsgo x = 10;
      ifLit (x > 5) {
        shout "big";
      } elseLit {
        shout "small";
      }
    `,
    expected: dedent`
      let x_1 = 10;
      if ((x_1 > 5)) {
        console.log("big");
      } else {
        console.log("small");
      }
    `,
  },
  {
    name: "loop and break",
    source: `
      letsgo i = 0;
      4x4 (i = 0; i < 3; i++) {
        skrrt;
      }
    `,
    expected: dedent`
      let i_1 = 0;
      for (i_1 = 0; (i_1 < 3); i_1++) {
        break;
      }
    `,
  },
  {
    name: "function declaration and call",
    source: `
      youngMetro add(x: Num, y: Num): Num {
        sendit x + y;
      }
      shout add(1, 2);
    `,
    expected: dedent`
      function add_1(x_2, y_3) {
        return (x_2 + y_3);
      }
      console.log(add_1(1, 2));
    `,
  },
  {
    name: "array and object literal",
    source: `
      letsgo a = [1, 2];
      letsgo b = { name: "Isaiah" };
      shout a[0];
      shout b.name;
    `,
    expected: dedent`
      let a_1 = [1, 2];
      let b_2 = {"name": "Isaiah"};
      console.log(a_1[0]);
      console.log(b_2["name"]);
    `,
  },
  {
    name: "function with short return",
    source: `
      youngMetro doNothing(): Void {
        sendit;
      }
      shout doNothing();
    `,
    expected: dedent`
      function doNothing_1() {
        return;
      }
      console.log(doNothing_1());
    `,
  },
  {
    name: "unary expression",
    source: `
      letsgo x = 2;
      shout -x;
    `,
    expected: dedent`
      let x_1 = 2;
      console.log((-x_1));
    `,
  },
  {
    name: "boolean literal",
    source: `shout onGod;`,
    expected: `console.log(true);`,
  },
  {
    name: "if with no else branch",
    source: `
      letsgo x = 5;
      ifLit (x > 3) {
        shout "hi";
      }
    `,
    expected: dedent`
      let x_1 = 5;
      if ((x_1 > 3)) {
        console.log("hi");
      }
    `,
  },
  {
    name: "direct null shout",
    source: `shout ghost;`,
    expected: `console.log(null);`,
  },
  {
    name: "function with multiple statements (trigger bodyLines true branch)",
    source: `
      youngMetro g(): Void {
        letsgo x = 1;
        shout x;
      }
    `,
    expected: dedent`
      function g_1() {
        let x_2 = 1;
        console.log(x_2);
      }
    `,
  },
  {
    name: "if/else both blocks (trigger consLines and altLines true branches)",
    source: `
      letsgo x = 1;
      ifLit (x == 1) {
        shout "yes";
        swampizzo;
      } elseLit {
        shout "no";
        swampizzo;
      }
    `,
    expected: dedent`
      let x_1 = 1;
      if ((x_1 === 1)) {
        console.log("yes");
        // swampizzo
      } else {
        console.log("no");
        // swampizzo
      }
    `,
  },
  {
    name: "loop with decrement",
    source: `
      letsgo i = 3;
      4x4 (i = 3; i > 0; i--) {
        shout i;
      }
    `,
    expected: dedent`
      let i_1 = 3;
      for (i_1 = 3; (i_1 > 0); i_1--) {
        console.log(i_1);
      }
    `,
  },
  {
    name: "binary equality and inequality",
    source: `
      letsgo a = 1;
      letsgo b = 2;
      ifLit (a == b) {
        swampizzo;
      }
      ifLit (a != b) {
        swampizzo;
      }
    `,
    expected: dedent`
      let a_1 = 1;
      let b_2 = 2;
      if ((a_1 === b_2)) {
        // swampizzo
      }
      if ((a_1 !== b_2)) {
        // swampizzo
      }
    `,
  },
];

describe("The code generator", () => {
  for (const { name, source, expected } of fixtures) {
    it(`produces expected JavaScript for: ${name}`, () => {
      const output = generate(optimize(analyze(parse(source))));
      assert.deepEqual(output, expected);
    });
    it("returns array as-is (true branch)", () => {
      const input = ["line1", "line2"];
      const result = asLines(input);
      assert.deepEqual(result, input);
    });

    it("splits string on newlines (false branch)", () => {
      const input = "line1\nline2";
      const result = asLines(input);
      assert.deepEqual(result, ["line1", "line2"]);
    });
  }
});
