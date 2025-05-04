import * as core from "./core.js";

export default function generate(program) {
  function gen(node) {
    switch (node.kind) {
      case "Program":
        return node.statements.map(gen).join("\n");

      case "Block":
        return node.statements.map(gen).join("\n");

      case "VariableDeclaration":
        return `let ${node.name} = ${gen(node.initializer)};`;

      case "AssignmentStatement":
        return `${node.target} = ${gen(node.source)};`;

      case "PrintStatement":
        return `console.log(${gen(node.argument)});`;

      case "WhileStatement":
        return `while (${gen(node.test)}) {\n${gen(node.body)}\n}`;

      case "IfStatement":
        return (
          `if (${gen(node.test)}) {\n${gen(node.consequent)}\n}` +
          (node.alternate ? ` else {\n${gen(node.alternate)}\n}` : "")
        );

      case "ReturnStatement":
        return `return ${gen(node.expression)};`;

      case "BreakStatement":
        return `break;`;

      case "FunctionDeclaration":
        const params = node.params.map((p) => p.name).join(", ");
        return `function ${node.name}(${params}) {\n${gen(node.body)}\n}`;

      case "BinaryExpression":
        if (node.op === "??") {
          return `(${gen(node.left)} ?? ${gen(node.right)})`;
        }
        return `(${gen(node.left)} ${node.op} ${gen(node.right)})`;

      case "NumberLiteral":
        return node.value.toString();

      case "BooleanLiteral":
        return node.value ? "true" : "false";

      case "NullLiteral":
        return "null";

      case "Identifier":
        return node.name;

      default:
        throw new Error(`Unknown node kind: ${node.kind}`);
    }
  }

  return gen(program);
}
