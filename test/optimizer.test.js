import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

const x = core.variable("x");
const y = core.variable("y");

const program = (...statements) => core.program(statements);
const block = (...statements) => core.block(statements);

const tests = [
  [
    "folds numeric +",
    core.binary("+", core.number(2), core.number(3)),
    core.number(5),
  ],
  [
    "folds numeric *",
    core.binary("*", core.number(4), core.number(5)),
    core.number(20),
  ],
  [
    "folds boolean ==",
    core.binary("==", core.boolean(true), core.boolean(false)),
    core.boolean(false),
  ],
  [
    "folds boolean !=",
    core.binary("!=", core.boolean(true), core.boolean(false)),
    core.boolean(true),
  ],
  [
    "folds relational <",
    core.binary("<", core.number(1), core.number(10)),
    core.boolean(true),
  ],
  ["negation fold", core.unary("-", core.number(8)), core.number(-8)],
  ["optimizes +0", core.binary("+", x, core.number(0)), x],
  ["optimizes 0+", core.binary("+", core.number(0), x), x],
  ["optimizes *1", core.binary("*", x, core.number(1)), x],
  ["optimizes 1*", core.binary("*", core.number(1), x), x],
  ["optimizes *0", core.binary("*", x, core.number(0)), core.number(0)],
  ["optimizes 0*", core.binary("*", core.number(0), x), core.number(0)],
  ["optimizes -0", core.binary("-", x, core.number(0)), x],
  ["removes assignment x = x", program(core.assignment(x, x)), program()],
  [
    "optimizes array literal with constant math",
    core.arrayLiteral([
      core.number(1),
      core.binary("+", core.number(2), core.number(2)),
    ]),
    core.arrayLiteral([core.number(1), core.number(4)]),
  ],
  [
    "optimizes object literal with folded value",
    core.objectLiteral([
      core.pair("a", core.binary("*", core.number(3), core.number(3))),
    ]),
    core.objectLiteral([core.pair("a", core.number(9))]),
  ],
  [
    "optimizes **0",
    core.binary("**", core.variable("x"), core.number(0)),
    core.number(1),
  ],
  [
    "optimizes 1**",
    core.binary("**", core.number(1), core.variable("x")),
    core.number(1),
  ],
  [
    "optimizes *1 (right side)",
    core.binary("*", core.variable("x"), core.number(1)),
    core.variable("x"),
  ],
  [
    "optimizes 0* (left side)",
    core.binary("*", core.number(0), core.variable("x")),
    core.number(0),
  ],
  [
    "hits *1 exactly",
    core.binary("*", core.variable("x"), core.number(1)),
    core.variable("x"),
  ],
  [
    "hits 0*x exactly",
    core.binary("*", core.number(0), core.variable("x")),
    core.number(0),
  ],
  [
    "if with true condition only executes consequent",
    core.ifStatement(
      core.boolean(true),
      [core.returnStatement(core.number(1))],
      [core.returnStatement(core.number(2))]
    ),
    [core.returnStatement(core.number(1))],
  ],
  [
    "if with false condition only executes alternate",
    core.ifStatement(
      core.boolean(false),
      [core.returnStatement(core.number(1))],
      [core.returnStatement(core.number(2))]
    ),
    [core.returnStatement(core.number(2))],
  ],
  [
    "folds subtraction",
    core.binary("-", core.number(10), core.number(4)),
    core.number(6),
  ],
  [
    "folds division",
    core.binary("/", core.number(20), core.number(5)),
    core.number(4),
  ],
  [
    "folds remainder",
    core.binary("%", core.number(9), core.number(4)),
    core.number(1),
  ],
  [
    "folds exponentiation",
    core.binary("**", core.number(2), core.number(3)),
    core.number(8),
  ],
  [
    "folds <=",
    core.binary("<=", core.number(2), core.number(5)),
    core.boolean(true),
  ],
  [
    "folds >",
    core.binary(">", core.number(7), core.number(5)),
    core.boolean(true),
  ],
  [
    "folds >=",
    core.binary(">=", core.number(7), core.number(7)),
    core.boolean(true),
  ],
  [
    "folds ==",
    core.binary("==", core.number(3), core.number(3)),
    core.boolean(true),
  ],
  [
    "folds !=",
    core.binary("!=", core.number(3), core.number(4)),
    core.boolean(true),
  ],
  [
    "optimizes 0 - x into -x",
    core.binary("-", core.number(0), core.variable("x")),
    core.unary("-", core.variable("x")),
  ],
  [
    "optimizes x / 1",
    core.binary("/", core.variable("x"), core.number(1)),
    core.variable("x"),
  ],
  [
    "optimizes 0 / x",
    core.binary("/", core.number(0), core.variable("x")),
    core.number(0),
  ],
  [
    "if false with no alternate becomes null",
    core.ifStatement(
      core.boolean(false),
      [core.returnStatement(core.number(1))],
      null
    ),
    null,
  ],
];

describe("The optimizer", () => {
  for (const [description, input, expected] of tests) {
    it(description, () => {
      assert.deepEqual(optimize(input), expected);
    });
  }
});
