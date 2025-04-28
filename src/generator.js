import { grammar } from "./parser.js";

export default function generate(match) {
  if (!match.succeeded()) throw new Error("Match failed in generator");
  return semantics(match).gen();
}

const semantics = grammar.createSemantics().addOperation("gen()", {
  Program(statements) {
    return statements.children.map((s) => s.gen()).join("\n");
  },

  PrintStmt(_shout, value, _semi) {
    return `console.log(${value.gen()});`;
  },

  VarDecl(kind, id, _eq, expr, _semi) {
    const jsKind = kind.sourceString === "letsgo" ? "let" : "const";
    return `${jsKind} ${id.sourceString} = ${expr.gen()};`;
  },

  IfStmt(_if, _open, testExpr, _close, block) {
    return `if (${testExpr.gen()}) ${block.gen()}`;
  },

  LoopStmt(_loop, _open, init, _semi1, cond, _semi2, update, _close, block) {
    return `for (${init.gen()}; ${cond.gen()}; ${update.gen()}) ${block.gen()}`;
  },

  BreakStmt(_break, _semi) {
    return "break;";
  },

  ReturnStmt(_return, expr, _semi) {
    if (expr.children.length === 0) {
      return "return;";
    }
    return `return ${expr.gen()};`;
  },

  Block(_open, statements, _close) {
    const body = statements.children.map((s) => s.gen()).join("\n");
    return `{\n${indent(body)}\n}`;
  },

  Init(id, _eq, expr) {
    return `${id.sourceString} = ${expr.gen()}`;
  },

  Condition(expr) {
    return expr.gen();
  },

  Increment(id, _op) {
    return `${id.sourceString}++`;
  },

  Identifier(_first, _rest) {
    return this.sourceString;
  },

  Number(_digits) {
    return this.sourceString;
  },

  StringLiteral(_open, _content, _close) {
    return `"${this.sourceString.slice(1, -1)}"`;
  },

  ArrayLiteral(_open, elements, _close) {
    return `[${elements.gen()}]`;
  },

  NonemptyListOf(first, _sep, rest) {
    return [first, ...rest.children].map((e) => e.gen()).join(", ");
  },

  Expr(expr) {
    return expr.gen();
  },

  OrExpr(left, ops, rights) {
    return [left, ...rights.children].map((e) => e.gen()).join(" || ");
  },

  AndExpr(left, ops, rights) {
    return [left, ...rights.children].map((e) => e.gen()).join(" && ");
  },

  EqualityExpr(left, ops, rights) {
    return [left, ...rights.children].map((e) => e.gen()).join(" == ");
  },

  RelationalExpr(left, ops, rights) {
    return [left, ...rights.children].map((e) => e.gen()).join(" < ");
  },

  AdditiveExpr(left, ops, rights) {
    return [left, ...rights.children].map((e) => e.gen()).join(" + ");
  },

  MultiplicativeExpr(left, ops, rights) {
    const pieces = [left.gen()];
    for (let i = 0; i < rights.children.length; i++) {
      const op = ops.child(i).sourceString;
      pieces.push(op);
      pieces.push(rights.child(i).gen());
    }
    return pieces.join(" ");
  },

  PrimaryExpr_group(_open, expr, _close) {
    return `(${expr.gen()})`;
  },

  PrimaryExpr_number(n) {
    return n.gen();
  },

  PrimaryExpr_identifier(id) {
    return id.gen();
  },

  PrimaryExpr_string(s) {
    return s.gen();
  },

  PrimaryExpr_array(arr) {
    return arr.gen();
  },
});

// Helper to indent blocks
function indent(text) {
  return text
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
}
