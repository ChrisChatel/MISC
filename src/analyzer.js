import * as core from "./core.js";
import { grammar } from "./parser.js";

export default function analyze(match) {
  const semantics = grammar.createSemantics().addOperation("analyze", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.analyze()));
    },

    Block(_open, statements, _close) {
      return core.block(statements.children.map((s) => s.analyze()));
    },

    PrintStmt(_shout, expression, _semi) {
      return core.call(core.variable("print"), [expression.analyze()]);
    },

    VarDecl_value(kind, id, typeOpt, _eq, exp, _semi) {
      const name = id.sourceString;
      const init = exp.analyze();
      const constant = kind.sourceString === "const";
      return core.variableDeclaration(name, init, constant);
    },

    VarDecl_function(_kind, id, typeOpt, funcDef) {
      const name = id.sourceString;
      const { params, returnType, body } = funcDef.analyze();
      return core.functionDeclaration(name, params, returnType, body);
    },

    FunctionDef(_open, params, _close, returnTypeOpt, body) {
      const parameters = params.asIteration().children.map((p) => p.analyze());
      const returnType =
        returnTypeOpt.children[0]?.children[1]?.sourceString ?? null;
      return { params: parameters, returnType, body: body.analyze() };
    },

    TypedParam(id, typeOpt) {
      return core.parameter(
        id.sourceString,
        typeOpt.children[0]?.sourceString ?? null
      );
    },

    IfStmt(_if, _open, test, _close, thenBlock, elseOpt) {
      const alternate = elseOpt.children[0]?.analyze() ?? null;
      return core.ifStatement(test.analyze(), thenBlock.analyze(), alternate);
    },

    ElseClause(_else, block) {
      return block.analyze();
    },

    LoopStmt(_loop, _open, init, _semi1, cond, _semi2, incr, _close, body) {
      return core.loopStatement(
        core.assignment(
          core.variable(init.children[0].sourceString),
          init.children[2].analyze()
        ),
        cond.analyze(),
        core.assignment(
          core.variable(incr.children[0].sourceString),
          core.binary(
            incr.children[1].sourceString === "++" ? "+" : "-",
            core.variable(incr.children[0].sourceString),
            core.number(1)
          )
        ),
        body.analyze()
      );
    },

    BreakStmt(_1, _2) {
      return core.breakStatement;
    },

    ReturnStmt(_ret, exprOpt, _semi) {
      return exprOpt.children.length === 0
        ? core.shortReturnStatement()
        : core.returnStatement(exprOpt.children[0].analyze());
    },

    SwampizzoStmt(_1, _2) {
      return core.swampizzoStatement;
    },

    Expr_functionExpr(func) {
      return func.analyze();
    },

    Expr_call(call) {
      console.log("➡ HIT: Expr_call");
      return call.analyze();
    },

    Expr_normalExpr(expr) {
      return expr.analyze();
    },

    CallExpr(id, _open, args, _close) {
      return core.call(
        core.variable(id.sourceString),
        args.asIteration().children.map((arg) => arg.analyze())
      );
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

    // ✅ NEWLY ADDED
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
      console.log("✅ HIT: PrimaryExpr_call (line 169)");
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
      return core.variable(this.sourceString);
    },

    StringLiteral(_open, chars, _close) {
      return core.string(this.sourceString.slice(1, -1));
    },

    ArrayLiteral(_open, elems, _close) {
      return core.arrayLiteral(
        elems.asIteration().children.map((e) => e.analyze())
      );
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
