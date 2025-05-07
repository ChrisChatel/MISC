// === Top-Level Structures ===
export function program(statements) {
  return { kind: "Program", statements };
}

export function block(statements) {
  return { kind: "Block", statements };
}

// === Declarations ===
export function variableDeclaration(name, initializer, constant) {
  return { kind: "VariableDeclaration", name, initializer, constant };
}

export function functionDeclaration(name, params, returnType, body) {
  return { kind: "FunctionDeclaration", name, params, returnType, body };
}

export function parameter(name, type) {
  return { kind: "Parameter", name, type };
}

// === Statements ===
export const breakStatement = { kind: "BreakStatement" };

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export function shortReturnStatement() {
  return { kind: "ReturnStatement", expression: null };
}

export function ifStatement(test, consequent, alternate) {
  return { kind: "IfStatement", test, consequent, alternate };
}

export function loopStatement(initializer, test, update, body) {
  return { kind: "LoopStatement", initializer, test, update, body };
}

export const swampizzoStatement = { kind: "SwampizzoStatement" };

// === Expressions ===
export function binary(op, left, right) {
  return { kind: "BinaryExpression", op, left, right };
}

export function unary(op, operand) {
  return { kind: "UnaryExpression", op, operand };
}

export function call(callee, args) {
  return { kind: "CallExpression", callee, args };
}

export function variable(name) {
  return { kind: "Variable", name };
}

export function number(value) {
  return { kind: "NumberLiteral", value, type: "Num" };
}

export function string(value) {
  return { kind: "StringLiteral", value, type: "Str" };
}

export function boolean(value) {
  return { kind: "BooleanLiteral", value, type: "Bool" };
}

export const nullLiteral = { kind: "NullLiteral", type: "Null" };

export function arrayLiteral(elements) {
  return { kind: "ArrayLiteral", elements };
}

export function objectLiteral(pairs) {
  return { kind: "ObjectLiteral", pairs };
}

export function pair(key, value) {
  return { key, value };
}

export function member(object, field) {
  return { kind: "MemberExpression", object, field };
}

export function subscript(array, index) {
  return { kind: "SubscriptExpression", array, index };
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source };
}

// === Type Helpers ===
export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType };
}

export function arrayType(baseType) {
  return { kind: "ArrayType", baseType };
}

export function objectType(fields) {
  return { kind: "ObjectType", fields };
}

// === Type Checking Utilities ===

export function isAssignable(expected, actual) {
  return expected === actual || expected === "Any" || actual === "Any";
}
