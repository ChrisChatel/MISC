import { Context } from "./core.js";
import { grammar } from "./parser.js";

export default function analyze(match) {
  if (!match.succeeded()) throw new Error("Match failed in analyzer");
  return semantics(match).analyze(new Context());
}

const semantics = grammar.createSemantics().addOperation("analyze(context)", {
  Program(statements) {
    return statements.children.map((s) => s.analyze(this.args.context));
  },

  PrintStmt(_shout, value, _semi) {
    value.analyze(this.args.context);
  },

  VarDecl(kind, id, _eq, expr, _semi) {
    const name = id.sourceString;
    const context = this.args.context;
    if (context.has(name)) {
      throw new Error(`${name} already declared`);
    }
    const valueType = expr.analyze(context);
    context.add(name, {
      type: valueType,
      constant: kind.sourceString === "const",
    });
  },

  IfStmt(_if, _open, testExpr, _close, block) {
    testExpr.analyze(this.args.context);
    block.analyze(this.args.context.createChildContext());
  },

  LoopStmt(_loop, _open, init, _semi1, cond, _semi2, update, _close, block) {
    const child = this.args.context.createChildContext();
    child.insideLoop = true;

    if (init.children.length > 0) init.analyze(child);
    if (cond.children.length > 0) cond.analyze(child);
    if (update.children.length > 0) update.analyze(child);
    block.analyze(child);
  },

  BreakStmt(_break, _semi) {
    if (!this.args.context.insideLoop) {
      throw new Error("break used outside of loop");
    }
  },

  ReturnStmt(_return, expr, _semi) {
    if (!this.args.context.insideFunction) {
      throw new Error("return used outside of function");
    }
    if (expr.children.length > 0) {
      expr.analyze(this.args.context);
    }
  },

  Block(_open, statements, _close) {
    const child = this.args.context.createChildContext();
    return statements.children.map((s) => s.analyze(child));
  },

  Init(id, _eq, expr) {
    const name = id.sourceString;
    const context = this.args.context;
    const info = context.lookup(name);
    if (info.constant) {
      throw new Error("Assignment to constant variable");
    }
    const type = expr.analyze(context);
    if (info.type !== type) {
      throw new Error("Type mismatch");
    }
  },

  Condition(expr) {
    expr.analyze(this.args.context);
  },

  Increment(id, _op) {
    const info = this.args.context.lookup(id.sourceString);
    if (info.constant) throw new Error("Cannot increment a constant");
  },

  Identifier(_first, _rest) {
    const name = this.sourceString;
    const info = this.args.context.lookup(name);
    return info.type;
  },

  Number(_digits) {
    return "number";
  },

  StringLiteral(_open, _content, _close) {
    return "string";
  },

  ArrayLiteral(_open, elements, _close) {
    const elementTypes = elements.children.map((e) =>
      e.analyze(this.args.context)
    );
    if (
      elementTypes.length > 0 &&
      !elementTypes.every((t) => t === elementTypes[0])
    ) {
      throw new Error("Type mismatch");
    }
    const elementType = elementTypes[0] ?? "any";
    return `array<${elementType}>`;
  },

  NonemptyListOf(first, _sep, rest) {
    first.analyze(this.args.context);
    rest.children.forEach((e) => e.analyze(this.args.context));
  },

  Expr(expr) {
    return expr.analyze(this.args.context);
  },

  OrExpr(left, _ops, rights) {
    left.analyze(this.args.context);
    rights.children.forEach((r) => r.analyze(this.args.context));
    return "boolean";
  },

  AndExpr(left, _ops, rights) {
    left.analyze(this.args.context);
    rights.children.forEach((r) => r.analyze(this.args.context));
    return "boolean";
  },

  EqualityExpr(left, _ops, rights) {
    left.analyze(this.args.context);
    rights.children.forEach((r) => r.analyze(this.args.context));
    return "boolean";
  },

  RelationalExpr(left, _ops, rights) {
    left.analyze(this.args.context);
    rights.children.forEach((r) => r.analyze(this.args.context));
    return "boolean";
  },

  AdditiveExpr(left, _ops, rights) {
    const leftType = left.analyze(this.args.context);
    const rightTypes = rights.children.map((r) => r.analyze(this.args.context));
    const allTypes = [leftType, ...rightTypes];

    if (allTypes.includes(undefined))
      throw new Error("Expression type could not be determined");

    if (allTypes.includes("string")) return "string";

    if (!allTypes.every((t) => t === "number"))
      throw new Error("Type mismatch");

    return "number";
  },

  MultiplicativeExpr(left, _ops, rights) {
    const leftType = left.analyze(this.args.context);
    const rightTypes = rights.children.map((r) => r.analyze(this.args.context));
    const allTypes = [leftType, ...rightTypes];

    if (!allTypes.every((t) => t === "number")) {
      throw new Error("Only numbers allowed in multiplication/division");
    }

    return "number";
  },

  PrimaryExpr_group(_open, expr, _close) {
    return expr.analyze(this.args.context);
  },

  PrimaryExpr_number(n) {
    return n.analyze(this.args.context);
  },

  PrimaryExpr_identifier(id) {
    return id.analyze(this.args.context);
  },

  PrimaryExpr_string(s) {
    return s.analyze(this.args.context);
  },

  PrimaryExpr_array(arr) {
    return arr.analyze(this.args.context);
  },
});
