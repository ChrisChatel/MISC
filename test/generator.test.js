import assert from "assert";
import generate from "../src/generator.js";
import analyze from "../src/analyzer.js";
import parse from "../src/parser.js";

function compile(source) {
  const match = parse(source);
  const analyzed = analyze(match);
  return generate(analyzed);
}

describe("The code generator", () => {
  it("generates shout statements", () => {
    assert.strictEqual(compile('shout "hello";'), 'console.log("hello");');
  });

  it("generates variable declarations", () => {
    assert.strictEqual(compile("letsgo x = 5;"), "let x = 5;");
    assert.strictEqual(compile('const y = "hi";'), 'const y = "hi";');
  });

  it("generates if statements", () => {
    const source = `
      ifLit (1 < 2) {
        shout "yes";
      }
    `;
    assert.strictEqual(
      compile(source),
      `if (1 < 2) {
  console.log("yes");
}`
    );
  });

  it("generates loops", () => {
    const source = `
      4x4 (i = 0; i < 3; i++) {
        shout i;
      }
    `;
    assert.strictEqual(
      compile(source),
      `for (let i = 0; i < 3; i++) {
  console.log(i);
}`
    );
  });

  it("generates arrays", () => {
    assert.strictEqual(compile("letsgo a = [1, 2, 3];"), "let a = [1, 2, 3];");
  });

  it("generates return statements", () => {
    const source = `
      letsgo x = 7;
      ifLit (x > 5) {
        return x;
      }
    `;
    assert.strictEqual(
      compile(source),
      `let x = 7;
if (x > 5) {
  return x;
}`
    );
  });

  it("generates arithmetic expressions", () => {
    assert.strictEqual(
      compile("letsgo sum = 1 + 2 * 3;"),
      "let sum = 1 + 2 * 3;"
    );
  });

  it("generates string concatenations", () => {
    assert.strictEqual(
      compile('letsgo greeting = "hi" + " there";'),
      'let greeting = "hi" + " there";'
    );
  });

  it("generates booleans in logic expressions", () => {
    assert.strictEqual(
      compile("letsgo ok = true && false;"),
      "let ok = true && false;"
    );
  });

  it("handles nested blocks and scopes", () => {
    const source = `
      letsgo x = 1;
      ifLit (x == 1) {
        letsgo y = 2;
        shout y;
      }
    `;
    assert.strictEqual(
      compile(source),
      `let x = 1;
if (x == 1) {
  let y = 2;
  console.log(y);
}`
    );
  });
});
