import * as core from "./core.js";

function asLines(output) {
  return Array.isArray(output) ? output : output.split("\n");
}

export default function generate(program) {
  const targetName = ((mapping) => {
    return (entity) => {
      const name = entity.name;
      if (!mapping.has(name)) {
        mapping.set(name, mapping.size + 1);
      }
      return `${name}_${mapping.get(name)}`;
    };
  })(new Map());

  let gen = (node) => generators[node.kind](node);

  const generators = {
    Program(p) {
      return p.statements.map(gen).join("\n");
    },

    Block(b) {
      return b.statements.map(gen);
    },

    VariableDeclaration(d) {
      const value = gen(d.initializer);
      return `let ${targetName(
        core.variable(d.name, true, d.initializer.type)
      )} = ${value};`;
    },

    FunctionDeclaration(d) {
      const renamedFunctionName = targetName({ name: d.name });
      const paramMap = new Map();
      d.params.forEach((param) => {
        paramMap.set(param.name, targetName({ name: param.name }));
      });
      const renamedParams = d.params.map((p) => generators.Variable(p.name));
      const oldGenerators = { ...generators };

      generators.Variable = (v) => {
        const renamed = paramMap.get(v.name) ?? targetName(v);
        return renamed;
      };

      generators.BinaryExpression = (e) => {
        const left = generators.Variable(e.left);
        const right = generators.Variable(e.right);
        return `(${left} ${e.op} ${right})`;
      };

      const bodyLines = asLines(gen(d.body)).map((line) => `  ${line}`);
      const header = `function ${renamedFunctionName}(${renamedParams.join(
        ", "
      )}) {`;
      const result = `${header}\n${bodyLines.join("\n")}\n}`;

      Object.assign(generators, oldGenerators);
      return result;
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
      let alt = "";
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
      let init = gen(s.initializer);
      if (init.endsWith(";")) init = init.slice(0, -1);
      const test = gen(s.test);
      let update = gen(s.update);
      if (update.endsWith(";")) update = update.slice(0, -1);

      const incrementRegex = /^\s*(\w+)\s*=\s*(?:\(\s*)?\1\s*\+\s*1\s*(?:\))?$/;
      const decrementRegex = /^\s*(\w+)\s*=\s*(?:\(\s*)?\1\s*-\s*1\s*(?:\))?$/;
      if (incrementRegex.test(update)) {
        update = `${update.match(incrementRegex)[1]}++`;
      } else if (decrementRegex.test(update)) {
        update = `${update.match(decrementRegex)[1]}--`;
      }

      const bodyLines = asLines(gen(s.body)).map((line) => `  ${line}`);
      return `for (${init}; ${test}; ${update}) {\n${bodyLines.join("\n")}\n}`;
    },

    Assignment(a) {
      return `${gen(a.target)} = ${gen(a.source)};`;
    },

    ExpressionStatement(s) {
      return `${gen(s.expression)};`;
    },

    CallExpression(c) {
      const calleeName =
        c.callee.name === "print"
          ? "console.log"
          : targetName({ name: c.callee.name });
      const args = c.args.map(gen).join(", ");
      return `${calleeName}(${args})`;
    },

    BinaryExpression(e) {
      const left = gen(e.left);
      const right = gen(e.right);
      const op = e.op === "==" ? "===" : e.op === "!=" ? "!==" : e.op;
      return `(${left} ${op} ${right})`;
    },

    UnaryExpression(e) {
      return `(${e.op}${gen(e.operand)})`;
    },

    Variable(v) {
      return targetName(typeof v === "string" ? { name: v } : v);
    },

    NumberLiteral(n) {
      return `${n.value}`;
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
      return `${gen(m.object)}[${JSON.stringify(m.field)}]`;
    },

    SubscriptExpression(s) {
      return `${gen(s.array)}[${gen(s.index)}]`;
    },
  };

  return gen(program);
}

export { asLines };
