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

function must(condition, message, node) {
  if (!condition) {
    const loc = node.source.getLineAndColumnMessage();
    throw new Error(`${message}`);
  }
}

function parseType(s) {
  s = s.trim();
  if (/^\[.+\]$/.test(s)) {
    return core.arrayType(parseType(s.slice(1, -1)));
  }
  if (/^{.+}$/.test(s)) {
    const content = s.slice(1, -1).trim();
    const fields = {};
    for (const field of content.split(",")) {
      const [k, v] = field.split(":").map((x) => x.trim());
      fields[k] = parseType(v);
    }
    return core.objectType(fields);
  }
  return s;
}

function typeToString(t) {
  if (typeof t === "string") return t;
  if (t.kind === "ObjectType") {
    const fields = Object.entries(t.fields)
      .map(([k, v]) => `${k}: ${typeToString(v)}`)
      .join(", ");
    return `{ ${fields} }`;
  }
}

export default function analyze(match) {
  let context = new Context();

  // MUSTS

  function mustBeDeclared(name, at) {
    const entity = context.lookup(name);
    must(entity, `Identifier ${name} not declared`, at);
    return entity;
  }

  function mustBeMutable(entity, at) {
    must(!entity.constant, `Cannot assign to constant`, at);
  }

  function mustBeAssignableTo(targetType, source, at) {
    must(
      core.isAssignable(targetType, source.type),
      `Cannot assign a ${source.type} to a ${targetType}`,
      at
    );
  }

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Variable ${name} already declared`, at);
  }

  function mustHaveBooleanType(expr, at) {
    must(
      core.isAssignable("Bool", expr.type),
      "If condition must be boolean",
      at
    );
  }

  function mustBeInLoop(at) {
    must(context.inLoop, "Break must only appear in a loop", at);
  }

  function mustBeInFunction(at) {
    must(context.inFunction, "Return must only appear in a function", at);
  }

  function mustReturnTypeMatch(expected, actual, at) {
    const expectedStr = typeToString(expected);
    const actualStr = typeToString(actual);
    must(
      core.isAssignable(expectedStr, actualStr),
      `Cannot return a ${actualStr} to a ${expectedStr}`,
      at
    );
  }

  function mustBeCallable(callee, at) {
    must(
      callee && typeof callee === "object" && Array.isArray(callee.params),
      `Function ${callee?.name ?? "(?)"} not declared`,
      at
    );
  }

  function mustHaveCorrectArgCount(expected, actual, at) {
    must(
      expected === actual,
      `${expected} argument(s) required but ${actual} passed`,
      at
    );
  }

  function mustArgsBeAssignable(params, args, argsNode) {
    for (let i = 0; i < params.length; i++) {
      const expected = params[i].type;
      const actual = args[i].type;
      const expectedStr = typeToString(expected);
      const actualStr = typeToString(actual);
      must(
        core.isAssignable(expected, actual),
        `Cannot assign a ${actualStr} to a ${expectedStr}`,
        argsNode.child(i)
      );
    }
  }

  function mustAllHaveSameType(elements, at) {
    const uniqueTypes = [...new Set(elements.map((e) => e.type))];
    must(uniqueTypes.length <= 1, "Not all elements have the same type", at);
  }

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
      const call = core.call(core.variable("print"), [expression.analyze()]);
      return core.expressionStatement(call);
    },

    Statement_exprStmt(expr, _semi) {
      return core.expressionStatement(expr.analyze());
    },

    AssignmentStmt_assignStmt(id, _eq, expr, _semi) {
      const name = id.sourceString;
      const entity = mustBeDeclared(name, id);
      mustBeMutable(entity, id);
      const rhs = expr.analyze();
      mustBeAssignableTo(entity.type, rhs, expr);
      return core.assignment(core.variable(name), rhs);
    },

    VarDecl_value(kind, id, typeOpt, _eq, exp, _semi) {
      const name = id.sourceString;
      mustNotAlreadyBeDeclared(name, id);
      const init = exp.analyze();
      const constant = kind.sourceString === "const";
      const type =
        typeOpt.children[0]?.sourceString.replace(/^:\s*/, "") ?? init.type;
      const variable = core.variable(name, !constant, type);
      variable.constant = constant;
      variable.type = type;
      context.add(name, variable);
      return core.variableDeclaration(name, init, constant);
    },

    VarDecl_function(_kind, id, _typeOpt, funcDef) {
      const name = id.sourceString;
      mustNotAlreadyBeDeclared(name, id);
      const stub = { kind: "Function", name };
      context.add(name, stub);
      const savedContext = context;
      context = context.newChild({ inFunction: true });
      const { params, returnType, body } = funcDef.analyze();
      context = savedContext;
      stub.params = params;
      stub.returnType = returnType;
      stub.type = core.functionType(
        params.map((p) => p.type ?? "Any"),
        returnType
      );
      const func = core.functionDeclaration(name, params, returnType, body);
      func.type = stub.type;
      return func;
    },

    FunctionDef(_open, params, _close, returnTypeOpt, body) {
      const parameterNodes = params.asIteration().analyze();
      const returnType =
        returnTypeOpt.children[0]?.children[1]?.sourceString.replace(
          /^:\s*/,
          ""
        ) ?? "Any";
      context.functionReturnType = parseType(returnType);
      return { params: parameterNodes, returnType, body: body.analyze() };
    },

    FunctionExpr(_open, params, _close, returnTypeOpt, body) {
      const parameters = params.asIteration().analyze();
      const declaredReturnType =
        returnTypeOpt.children[0]?.children[1]?.sourceString.replace(
          /^:\s*/,
          ""
        ) ?? "Any";
      const savedContext = context;
      context = context.newChild({
        inFunction: true,
        functionReturnType: declaredReturnType,
      });
      parameters.forEach(({ name, type }) => context.add(name, { type }));
      const analyzedBody = body.analyze();
      context = savedContext;
      const expr = core.functionDeclaration(
        null,
        parameters,
        declaredReturnType,
        analyzedBody
      );
      expr.type = core.functionType(
        parameters.map((p) => p.type ?? "Any"),
        declaredReturnType
      );
      return expr;
    },

    TypedParam(id, typeOpt) {
      const name = id.sourceString;
      const type =
        typeOpt.children[0]?.sourceString.replace(/^:\s*/, "") ?? core.anyType;
      const param = core.parameter(name, type);
      context.add(name, param);
      return param;
    },

    IfStmt(_if, _open, test, _close, thenBlock, elseOpt) {
      const testExpr = test.analyze();
      mustHaveBooleanType(testExpr, test);
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

    BreakStmt(_break, _semi) {
      mustBeInLoop(_break);
      return core.breakStatement;
    },

    SwampizzoStmt(_1, _2) {
      return core.swampizzoStatement;
    },

    ReturnStmt(_ret, exprOpt, _semi) {
      mustBeInFunction(_ret);
      if (exprOpt.children.length === 0) {
        return core.shortReturnStatement();
      }
      const expr = exprOpt.children[0].analyze();
      mustReturnTypeMatch(
        context.functionReturnType,
        expr.type ?? "Any",
        exprOpt
      );
      return core.returnStatement(expr);
    },

    OrExpr(left, _ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      return rights.children.reduce((acc, r) => {
        const expr = core.binary("||", acc, r.analyze());
        expr.type = core.booleanType;
        return expr;
      }, left.analyze());
    },

    AndExpr(left, _ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      return rights.children.reduce((acc, r) => {
        const expr = core.binary("&&", acc, r.analyze());
        expr.type = core.booleanType;
        return expr;
      }, left.analyze());
    },

    EqualityExpr(left, ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      return rights.children.reduce((acc, r, i) => {
        const right = r.analyze();
        const expr = core.binary(ops.children[i].sourceString, acc, right);
        expr.type = "Bool";
        return expr;
      }, left.analyze());
    },

    AdditiveExpr(left, ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      return rights.children.reduce((acc, r, i) => {
        const expr = core.binary(
          ops.children[i].sourceString,
          acc,
          r.analyze()
        );
        expr.type = "Num";
        return expr;
      }, left.analyze());
    },

    MultiplicativeExpr(left, ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      return rights.children.reduce((acc, r, i) => {
        const expr = core.binary(
          ops.children[i].sourceString,
          acc,
          r.analyze()
        );
        expr.type = "Num";
        return expr;
      }, left.analyze());
    },

    RelationalExpr(left, ops, rights) {
      if (rights.children.length === 0) return left.analyze();
      const leftExpr = left.analyze();
      return rights.children.reduce((acc, r, i) => {
        const rightExpr = r.analyze();
        const expr = core.binary(ops.children[i].sourceString, acc, rightExpr);
        return expr;
      }, leftExpr);
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
        mustBeCallable(callee, _open);

        const argNodes = args.asIteration().analyze();
        mustHaveCorrectArgCount(callee.params.length, argNodes.length, _open);
        mustArgsBeAssignable(callee.params, argNodes, args);

        const call = core.call(callee, argNodes);
        call.type = callee.returnType;
        return call;
      };
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

    Identifier(_1, _2) {
      return mustBeDeclared(this.sourceString, this);
    },

    Number(_) {
      const node = core.number(Number(this.sourceString));
      node.type = "Num";
      return node;
    },

    StringLiteral(_open, chars, _close) {
      return core.string(this.sourceString.slice(1, -1));
    },

    ArrayLiteral(_open, elems, _close) {
      const items = elems.analyze();
      mustAllHaveSameType(items, this);
      const array = core.arrayLiteral(items);
      array.type = core.arrayType(items[0]?.type ?? "Any");
      return array;
    },

    NonemptyListOf(first, _sep, rest) {
      return [first.analyze(), ...rest.analyze()];
    },

    EmptyListOf() {
      return [];
    },

    ObjectLiteral(_open, pairs, _close) {
      const pairNodes = pairs.asIteration().analyze();
      const obj = core.objectLiteral(pairNodes);
      obj.type = core.objectType(
        Object.fromEntries(pairNodes.map((p) => [p.key, p.value.type]))
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
