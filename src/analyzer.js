import parse, { grammar } from "./parser.js";
import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    inLoop = false,
    inFunction = false,
    functionReturnType = null,
  } = {}) {
    this.parent = parent;
    this.symbols = new Map();
    this.inLoop = inLoop;
    this.inFunction = inFunction;
    this.functionReturnType = functionReturnType;
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

function pretty(type) {
  return type === "Str"
    ? "string"
    : type === "Num"
    ? "number"
    : type === "Bool"
    ? "boolean"
    : type;
}

function must(condition, message, node) {
  if (!condition) {
    const loc = node.source.getLineAndColumnMessage();
    throw new Error(`${message}`);
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
        functionReturnType: context.functionReturnType,
      });
      const result = core.block(statements.children.map((s) => s.analyze()));
      context = context.parent;
      return result;
    },

    PrintStmt(_shout, expression, _semi) {
      return core.call(core.variable("print"), [expression.analyze()]);
    },

    Statement_exprStmt(expr, _semi) {
      return expr.analyze();
    },

    AssignmentStmt_assignStmt(id, _eq, expr, _semi) {
      const entity = context.lookup(id.sourceString);
      must(entity, `Identifier ${id.sourceString} not declared`, id);
      must(!entity.constant, "Cannot assign to constant", id);
      const rhs = expr.analyze();
      must(
        core.isAssignable(entity.type, rhs.type),
        `Cannot assign a ${pretty(rhs.type)} to a ${pretty(entity.type)}`,
        expr
      );
      return core.assignment(core.variable(id.sourceString), rhs);
    },

    VarDecl_value(kind, id, typeOpt, _eq, exp, _semi) {
      const name = id.sourceString;
      must(!context.lookup(name), `Variable ${name} already declared`, id);
      const init = exp.analyze();
      const constant = kind.sourceString === "const";
      const type = typeOpt.children[0]?.sourceString ?? init.type;
      const variable = core.variable(name, !constant, type);
      variable.constant = constant;
      context.add(name, variable);
      return core.variableDeclaration(name, init, constant);
    },

    VarDecl_function(_kind, id, typeOpt, funcDef) {
      const name = id.sourceString;
      must(!context.lookup(name), `Function ${name} already declared`, id);

      const stub = {
        kind: "Function",
        name,
        params: [],
        returnType: "Void",
        type: core.functionType([], "Void"),
      };
      context.add(name, stub);

      const returnType =
        funcDef.children[3]?.children[1]?.sourceString ?? "Void";
      context = context.newChild({
        inFunction: true,
        functionReturnType: returnType,
      });
      const { params, returnType: ret, body } = funcDef.analyze();
      context = context.parent;

      stub.params = params;
      stub.returnType = ret;
      stub.type = core.functionType(
        params.map((p) => p.type ?? "Any"),
        ret
      );
      return core.functionDeclaration(name, params, ret, body);
    },

    FunctionDef(_open, params, _close, returnTypeOpt, body) {
      const parameters = params.asIteration().analyze();
      const returnType =
        returnTypeOpt.children[0]?.children[1]?.sourceString ?? "Void";
      const bodyNode = body.analyze();
      return { params: parameters, returnType, body: bodyNode };
    },

    FunctionExpr(_open, paramsOpt, _close, returnTypeOpt, body) {
      const parameters =
        paramsOpt.children.length > 0
          ? paramsOpt.children[0].asIteration().analyze()
          : [];
      const returnType =
        returnTypeOpt.children.length > 0
          ? returnTypeOpt.children[0].children[1].sourceString
          : "Void";

      const savedContext = context;
      context = context.newChild({
        inFunction: true,
        functionReturnType: returnType,
      });
      parameters.forEach(({ name, type }) => context.add(name, { type }));
      const analyzedBody = body.analyze();
      context = savedContext;

      const expr = core.functionDeclaration(
        null,
        parameters,
        returnType,
        analyzedBody
      );
      expr.type = core.functionType(
        parameters.map((p) => p.type ?? "Any"),
        returnType
      );
      return expr;
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
      must(context.inLoop, "Break must only appear in a loop", _1);
      return core.breakStatement;
    },

    ReturnStmt(_ret, exprOpt, _semi) {
      must(context.inFunction, "Return must only appear in a function", _ret);
      if (exprOpt.children.length === 0) return core.shortReturnStatement();
      const expr = exprOpt.children[0].analyze();
      const actual = expr?.type ?? "Any";
      const expected = context.functionReturnType ?? "Any";
      must(
        core.isAssignable(expected, actual),
        `Cannot return a ${pretty(actual)} to a ${pretty(expected)}`,
        exprOpt
      );
      return core.returnStatement(expr);
    },

    SwampizzoStmt(_1, _2) {
      return core.swampizzoStatement;
    },

    OrExpr(left, _ops, rights) {
      const expr = rights.children.reduce(
        (acc, r) => core.binary("||", acc, r.analyze()),
        left.analyze()
      );
      expr.type = core.booleanType;
      return expr;
    },

    AndExpr(left, _ops, rights) {
      const expr = rights.children.reduce(
        (acc, r) => core.binary("&&", acc, r.analyze()),
        left.analyze()
      );
      expr.type = core.booleanType;
      return expr;
    },

    EqualityExpr(left, op, right) {
      const expr = core.binary(
        op.sourceString,
        left.analyze(),
        right.analyze()
      );
      expr.type = core.booleanType;
      return expr;
    },

    RelationalExpr(left, op, right) {
      const expr = core.binary(
        op.sourceString,
        left.analyze(),
        right.analyze()
      );
      expr.type = core.booleanType;
      return expr;
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
      return (object) => core.member(object, id.sourceString);
    },

    SubscriptOrDot_subscript(_open, index, _close) {
      const analyzed = index.analyze();
      return (array) => core.subscript(array, analyzed);
    },

    SubscriptOrDot_call(_open, args, _close) {
      return (callee) => {
        must(
          callee && typeof callee === "object" && Array.isArray(callee.params),
          `Function ${callee?.name ?? "(?)"} not declared`,
          _open
        );
        const argNodes = args.asIteration().analyze();
        must(
          callee.params.length === argNodes.length,
          `${callee.params.length} argument(s) required but ${argNodes.length} passed`,
          _open
        );
        for (let i = 0; i < callee.params.length; i++) {
          const expected = callee.params[i].type ?? "Any";
          const actual = argNodes[i].type ?? "Any";
          must(
            core.isAssignable(expected, actual),
            `Cannot assign a ${pretty(actual)} to a ${pretty(expected)}`,
            args.child(i)
          );
        }
        const call = core.call(callee, argNodes);
        call.type = callee.returnType ?? "Any";
        return call;
      };
    },

    Init(id, _eq, expr) {
      const entity = context.lookup(id.sourceString);
      must(entity, `Identifier ${id.sourceString} not declared`, id);
      must(!entity.constant, "Cannot assign to constant", id);
      const rhs = expr.analyze();
      must(
        core.isAssignable(entity.type, rhs.type),
        `Cannot assign a ${pretty(rhs.type)} to a ${pretty(entity.type)}`,
        expr
      );
      return core.assignment(core.variable(id.sourceString), rhs);
    },

    PrimaryExpr_group(_open, expr, _close) {
      return expr.analyze();
    },

    BooleanLiteral(_) {
      const node = core.boolean(this.sourceString === "onGod");
      node.type = "Bool";
      return node;
    },

    NullLiteral(_) {
      return core.nullLiteral;
    },

    Number(_) {
      const node = core.number(Number(this.sourceString));
      node.type = "Num";
      return node;
    },

    Identifier(_1, _2) {
      const entity = context.lookup(this.sourceString);
      must(entity, `Identifier ${this.sourceString} not declared`, this);
      return entity;
    },

    StringLiteral(_open, chars, _close) {
      const node = core.string(this.sourceString.slice(1, -1));
      node.type = "Str";
      return node;
    },

    ArrayLiteral(_open, elems, _close) {
      const items = elems.asIteration().analyze();
      const types = [...new Set(items.map((e) => e.type))];
      must(types.length <= 1, "Not all elements have the same type", this);
      const array = core.arrayLiteral(items);
      array.type = core.arrayType(types[0]);
      return array;
    },

    ObjectLiteral(_open, pairs, _close) {
      const pairNodes = pairs.asIteration().analyze();
      const obj = core.objectLiteral(pairNodes);
      obj.type = core.objectType(
        Object.fromEntries(pairNodes.map((p) => [p.key, p.value.type ?? "Any"]))
      );
      return obj;
    },

    Pair(id, _colon, expr) {
      const value = expr.analyze();
      return core.pair(id.sourceString, value);
    },

    _iter(...children) {
      return children.map((c) => c.analyze());
    },
  });

  return semantics(match).analyze();
}
