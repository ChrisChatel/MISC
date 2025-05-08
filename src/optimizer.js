import * as core from "./core.js";

export default function optimize(node) {
  return optimizers?.[node?.kind]?.(node) ?? node;
}

const isZero = (n) => n?.kind === "NumberLiteral" && n.value === 0;
const isOne = (n) => n?.kind === "NumberLiteral" && n.value === 1;

const optimizers = {
  Program(p) {
    p.statements = p.statements.map(optimize).filter((s) => s !== null);
    return p;
  },
  Block(b) {
    b.statements = b.statements.map(optimize).filter((s) => s !== null);
    return b;
  },
  VariableDeclaration(d) {
    d.initializer = optimize(d.initializer);
    return d;
  },
  Assignment(s) {
    s.target = optimize(s.target);
    s.source = optimize(s.source);
    if (
      s.target.kind === "Variable" &&
      s.source.kind === "Variable" &&
      s.target.name === s.source.name
    ) {
      return null;
    }
    return s;
  },
  ReturnStatement(s) {
    s.expression = optimize(s.expression);
    return s;
  },
  ShortReturnStatement(s) {
    return s;
  },
  BreakStatement(s) {
    return s;
  },
  SwampizzoStatement(s) {
    return s;
  },
  IfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = optimize(s.consequent);
    if (s.alternate) {
      s.alternate = optimize(s.alternate);
    }
    if (s.test?.kind === "BooleanLiteral") {
      return s.test.value ? s.consequent : s.alternate ?? null;
    }
    return s;
  },
  LoopStatement(s) {
    s.initializer = optimize(s.initializer);
    s.test = optimize(s.test);
    s.update = optimize(s.update);
    s.body = optimize(s.body);
    return s;
  },
  BinaryExpression(e) {
    e.left = optimize(e.left);
    e.right = optimize(e.right);

    const l = e.left;
    const r = e.right;

    if (l?.kind === "NumberLiteral" && r?.kind === "NumberLiteral") {
      const a = l.value;
      const b = r.value;
      switch (e.op) {
        case "+":
          return core.number(a + b);
        case "-":
          return core.number(a - b);
        case "*":
          return core.number(a * b);
        case "/":
          return core.number(a / b);
        case "%":
          return core.number(a % b);
        case "**":
          return core.number(a ** b);
        case "<":
          return core.boolean(a < b);
        case "<=":
          return core.boolean(a <= b);
        case ">":
          return core.boolean(a > b);
        case ">=":
          return core.boolean(a >= b);
        case "==":
          return core.boolean(a === b);
        case "!=":
          return core.boolean(a !== b);
      }
    }

    if (l?.kind === "BooleanLiteral" && r?.kind === "BooleanLiteral") {
      switch (e.op) {
        case "==":
          return core.boolean(l.value === r.value);
        case "!=":
          return core.boolean(l.value !== r.value);
      }
    }

    // Strength reductions
    if (e.op === "+") {
      if (isZero(r)) return l;
      if (isZero(l)) return r;
    } else if (e.op === "-") {
      if (isZero(r)) return l;
      if (isZero(l)) return core.unary("-", r);
    } else if (e.op === "*") {
      if (isOne(r)) return l;
      if (isOne(l)) return r;
      if (isZero(l) || isZero(r)) return core.number(0);
    } else if (e.op === "/") {
      if (isOne(r)) return l;
      if (isZero(l)) return core.number(0);
    } else if (e.op === "**") {
      if (isZero(r)) return core.number(1);
      if (isOne(l)) return core.number(1);
    }

    return e;
  },
  UnaryExpression(e) {
    e.operand = optimize(e.operand);
    if (e.op === "-" && e.operand.kind === "NumberLiteral") {
      return core.number(-e.operand.value);
    }
    return e;
  },
  ArrayLiteral(a) {
    a.elements = a.elements.map(optimize);
    return a;
  },
  ObjectLiteral(o) {
    o.pairs = o.pairs.map((p) => core.pair(p.key, optimize(p.value)));
    return o;
  },
  CallExpression(c) {
    c.callee = optimize(c.callee);
    c.args = c.args.map(optimize);
    return c;
  },
  MemberExpression(m) {
    m.object = optimize(m.object);
    return m;
  },
  SubscriptExpression(s) {
    s.array = optimize(s.array);
    s.index = optimize(s.index);
    return s;
  },
  FunctionDeclaration(f) {
    f.body = optimize(f.body);
    return f;
  },
  NumberLiteral(n) {
    return n;
  },
  StringLiteral(s) {
    return s;
  },
  BooleanLiteral(b) {
    return b;
  },
  NullLiteral(n) {
    return n;
  },
  Variable(v) {
    return v;
  },
};
