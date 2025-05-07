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
      let x_1 = (10);
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
      let x_1 = (2);
      console.log((-x_1));
    `,
  },
  {
    name: "boolean literal",
    source: `
      shout onGod;
    `,
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
      let x_1 = (5);
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
        let x_2 = (1);
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
      let x_1 = (1);
      if ((x_1 === 1)) {
        console.log("yes");
        // swampizzo
      } else {
        console.log("no");
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
  }
});
