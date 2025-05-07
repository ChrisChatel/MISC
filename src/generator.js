import { voidType } from "./core.js";

// Helper to ensure consistent line formatting
function asLines(output) {
  return Array.isArray(output) ? output : output.split("\n");
}

export default function generate(program) {
  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name}_${mapping.get(entity)}`;
    };
  })(new Map());

  const gen = (node) => generators?.[node?.kind]?.(node) ?? node;

  const generators = {
    Program(p) {
      return p.statements.map(gen).join("\n");
    },

    Block(b) {
      const lines = b.statements.map(gen);
      return lines.length === 1 ? lines[0] : lines;
    },

    VariableDeclaration(d) {
      return `let ${gen(d.name)} = ${gen(d.initializer)};`;
    },

    FunctionDeclaration(d) {
      const header = `function ${gen(d.name)}(${d.params
        .map(gen)
        .join(", ")}) {`;
      const bodyOutput = gen(d.body);
      const bodyLines = asLines(bodyOutput);
      const body = bodyLines.map((line) => `  ${line}`).join("\n");
      return `${header}\n${body}\n}`;
    },

    Parameter(p) {
      return gen(p.name);
    },

    ReturnStatement(s) {
      return `return ${gen(s.expression)};`;
    },

    ShortReturnStatement(_) {
      return "return;";
    },

    BreakStatement(_) {
      return "break;";
    },

    SwampizzoStatement(_) {
      return "// swampizzo";
    },

    IfStatement(s) {
      const test = `if (${gen(s.test)}) {`;
      const consLines = asLines(gen(s.consequent)).map((line) => `  ${line}`);
      const consFormatted = consLines.join("\n");

      let alt;
      if (s.alternate) {
        const altLines = asLines(gen(s.alternate)).map((line) => `  ${line}`);
        const altFormatted = altLines.join("\n");
        alt = `} else {\n${altFormatted}\n}`;
      } else {
        alt = `}`;
      }

      return `${test}\n${consFormatted}\n${alt}`;
    },

    LoopStatement(s) {
      const init = gen(s.initializer);
      const test = gen(s.test);
      const update = gen(s.update);
      const bodyLines = asLines(gen(s.body)).map((line) => `  ${line}`);
      return `for (${init} ${test} ${update}) {\n${bodyLines.join("\n")}\n}`;
    },

    Assignment(a) {
      return `${gen(a.target)} = ${gen(a.source)};`;
    },

    CallExpression(c) {
      const calleeName =
        c.callee.name === "print" ? "console.log" : gen(c.callee);
      const args = c.args.map(gen).join(",").trim();
      return c.type === voidType
        ? `${calleeName}(${args});`
        : `${calleeName}(${args})`;
    },

    BinaryExpression(e) {
      return `${gen(e.left)} ${e.op} ${gen(e.right)}`;
    },

    UnaryExpression(e) {
      return `${e.op}${gen(e.operand)}`;
    },

    Variable(v) {
      return targetName(v);
    },

    NumberLiteral(n) {
      return n.value;
    },

    StringLiteral(s) {
      return JSON.stringify(s.value);
    },

    BooleanLiteral(b) {
      return b.value;
    },

    NullLiteral(_) {
      return "null";
    },

    ArrayLiteral(a) {
      return `[${a.elements.map(gen).join(", ")}]`;
    },

    ObjectLiteral(o) {
      const pairs = o.pairs.map(
        (p) => `${JSON.stringify(p.key)}: ${gen(p.value)}`
      );
      return `{${pairs.join(", ")}}`;
    },

    MemberExpression(m) {
      return `${gen(m.object)}.${m.field}`;
    },

    SubscriptExpression(s) {
      const arr = gen(s.array);
      const idx = gen(s.index);
      return `${arr}[${idx}]`;
    },
  };

  return gen(program);
}
