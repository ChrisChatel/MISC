import * as core from "./core.js";
import { grammar } from "./parser.js";

class Context {
  constructor({ parent = null, inLoop = false, inFunction = false } = {}) {
    this.parent = parent;
    this.symbols = new Map();
    this.inLoop = inLoop;
    this.inFunction = inFunction;
  }
  add(name, entity) {
    this.symbols.set(name, entity);
  }
  lookup(name) {
    return this.symbols.get(name) || this.parent?.lookup(name);
  }
  newChild(props = {}) {
    return new Context({ parent: this, ...props });
  }
}

function must(condition, message, node) {
  if (!condition) {
    const loc = node.source.getLineAndColumnMessage();
    throw new Error(`${loc}${message}`);
  }
}

export default function analyze(match) {
  let context = new Context();

  const semantics = grammar.createSemantics().addOperation("analyze", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.analyze()));
    },

    Block(_open, statements, _close) {
      context = context.newChild({
        inFunction: context.inFunction,
        inLoop: context.inLoop,
      });
      const result = core.block(statements.children.map((s) => s.analyze()));
      context = context.parent;
      return result;
    },

    PrintStmt(_shout, expression, _semi) {
      return core.call(core.variable("print"), [expression.analyze()]);
    },

    VarDecl_value(kind, id, typeOpt, _eq, exp, _semi) {
      const name = id.sourceString;
      must(!context.lookup(name), `Variable ${name} already declared`, id);
      const init = exp.analyze();
      const constant = kind.sourceString === "const";
      const variable = core.variable(name, !constant, init.type);
      context.add(name, variable);
      return core.variableDeclaration(name, init, constant);
    },

    VarDecl_function(_kind, id, typeOpt, funcDef) {
      const name = id.sourceString;
      must(!context.lookup(name), `Function ${name} already declared`, id);

      const stub = { kind: "Function", name, params: [], returnType: "Void" };
      context.add(name, stub);

      context = context.newChild({ inFunction: true });

      const { params, returnType, body } = funcDef.analyze();
      context = context.parent;

      stub.params = params;
      stub.returnType = returnType || "Void";

      return core.functionDeclaration(name, params, stub.returnType, body);
    },

    FunctionDef(_open, params, _close, returnTypeOpt, body) {
      const parameters = params.asIteration().children.map((p) => p.analyze());
      const returnType =
        returnTypeOpt.children[0]?.children[1]?.sourceString ?? null;

      const bodyNode = body.analyze();

      return { params: parameters, returnType, body: bodyNode };
    },

    TypedParam(id, typeOpt) {
      const name = id.sourceString;
      const type = typeOpt.children[0]?.sourceString ?? core.anyType;
      const param = core.parameter(name, type);
      context.add(name, param);
      return param;
    },

    IfStmt(_if, _open, test, _close, thenBlock, elseOpt) {
      const testExpr = test.analyze();
      must(
        testExpr.type === core.booleanType,
        "If condition must be boolean",
        test
      );
      const thenPart = thenBlock.analyze();
      const elsePart = elseOpt.children[0]?.analyze() ?? null;
      return core.ifStatement(testExpr, thenPart, elsePart);
    },

    ElseClause(_else, block) {
      return block.analyze();
    },

    LoopStmt(_loop, _open, init, _semi1, cond, _semi2, incr, _close, body) {
      const initNode = core.assignment(
        core.variable(init.children[0].sourceString),
        init.children[2].analyze()
      );
      const condNode = cond.analyze();
      const incrNode = core.assignment(
        core.variable(incr.children[0].sourceString),
        core.binary(
          incr.children[1].sourceString === "++" ? "+" : "-",
          core.variable(incr.children[0].sourceString),
          core.number(1)
        )
      );
      context = context.newChild({ inLoop: true });
      const bodyNode = body.analyze();
      context = context.parent;
      return core.loopStatement(initNode, condNode, incrNode, bodyNode);
    },

    BreakStmt(_1, _2) {
      must(context.inLoop, "Break must be inside a loop", _1);
      return core.breakStatement;
    },

    ReturnStmt(_ret, exprOpt, _semi) {
      must(context.inFunction, "Return must be inside a function", _ret);
      return exprOpt.children.length === 0
        ? core.shortReturnStatement()
        : core.returnStatement(exprOpt.children[0].analyze());
    },

    SwampizzoStmt(_1, _2) {
      return core.swampizzoStatement;
    },

    Expr_functionExpr(func) {
      context = context.newChild({ inFunction: true });
      const result = func.analyze();
      context = context.parent;
      return result;
    },

    Expr_call(call) {
      return call.analyze();
    },

    Expr_normalExpr(expr) {
      return expr.analyze();
    },

    CallExpr(id, _open, args, _close) {
      const callee = context.lookup(id.sourceString);
      must(callee, `Function ${id.sourceString} not declared`, id);
      must(
        callee.kind === "Function",
        `${id.sourceString} is not callable`,
        id
      );
      const argNodes = args.asIteration().children.map((arg) => arg.analyze());
      must(
        callee.params.length === argNodes.length,
        `${callee.params.length} argument(s) required but ${argNodes.length} passed`,
        id
      );
      for (let i = 0; i < callee.params.length; i++) {
        const expectedType = callee.params[i].type ?? "Any";
        const actualType = argNodes[i].type ?? "Any";

        must(
          core.isAssignable(expectedType, actualType),
          `Cannot assign a ${actualType} to a ${expectedType}`,
          args.child(i)
        );
      }

      const callNode = core.call(core.variable(id.sourceString), argNodes);
      callNode.type = callee.returnType;
      return callNode;
    },

    OrExpr(left, _ops, rights) {
      return rights.children.reduce(
        (acc, r) => core.binary("||", acc, r.analyze()),
        left.analyze()
      );
    },

    AndExpr(left, _ops, rights) {
      return rights.children.reduce(
        (acc, r) => core.binary("&&", acc, r.analyze()),
        left.analyze()
      );
    },

    EqualityExpr(left, op, right) {
      return core.binary(op.sourceString, left.analyze(), right.analyze());
    },

    RelationalExpr(left, op, right) {
      return core.binary(op.sourceString, left.analyze(), right.analyze());
    },

    AdditiveExpr(left, ops, rights) {
      return rights.children.reduce(
        (acc, r, i) =>
          core.binary(ops.children[i].sourceString, acc, r.analyze()),
        left.analyze()
      );
    },

    MultiplicativeExpr(left, ops, rights) {
      return rights.children.reduce(
        (acc, r, i) =>
          core.binary(ops.children[i].sourceString, acc, r.analyze()),
        left.analyze()
      );
    },

    UnaryExpr_neg(_op, expr) {
      return core.unary("-", expr.analyze());
    },

    UnaryExpr_pos(_op, expr) {
      return core.unary("+", expr.analyze());
    },

    MemberExpr(primary, accesses) {
      return accesses.children.reduce(
        (acc, access) => access.analyze()(acc),
        primary.analyze()
      );
    },

    SubscriptOrDot_dot(_dot, id) {
      return () => (object) => core.member(object, id.sourceString);
    },

    SubscriptOrDot_subscript(_open, index, _close) {
      return () => (array) => core.subscript(array, index.analyze());
    },

    PrimaryExpr_call(call) {
      return call.analyze();
    },

    PrimaryExpr_group(_open, expr, _close) {
      return expr.analyze();
    },

    BooleanLiteral(_) {
      return core.boolean(this.sourceString === "onGod");
    },

    NullLiteral(_) {
      return core.nullLiteral;
    },

    Number(_) {
      return core.number(Number(this.sourceString));
    },

    Identifier(_1, _2) {
      const entity = context.lookup(this.sourceString);
      must(entity, `Identifier ${this.sourceString} not declared`, this);
      return entity;
    },

    StringLiteral(_open, chars, _close) {
      return core.string(this.sourceString.slice(1, -1));
    },

    ArrayLiteral(_open, elems, _close) {
      const items = elems.asIteration().children.map((e) => e.analyze());
      return core.arrayLiteral(items);
    },

    ObjectLiteral(_open, pairs, _close) {
      const pairNodes = pairs.asIteration().children.map((p) => p.analyze());
      return core.objectLiteral(pairNodes);
    },

    Pair(id, _colon, expr) {
      return core.pair(id.sourceString, expr.analyze());
    },

    _iter(...children) {
      return children.map((c) => c.analyze());
    },
  });

  return semantics(match).analyze();
}
