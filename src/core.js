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
  return { kind: "ShortReturnStatement", expression: null };
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
  const type = inferBinaryType(op, left.type, right.type);
  return { kind: "BinaryExpression", op, left, right, type };
}

export function unary(op, operand) {
  const type = op === "-" || op === "+" ? "Num" : (operand.type ?? "Any");
  return { kind: "UnaryExpression", op, operand, type };
}

export function call(callee, args) {
  return {
    kind: "CallExpression",
    callee,
    args,
    type: callee.returnType ?? "Any",
  };
}

export function expressionStatement(expression) {
  return { kind: "ExpressionStatement", expression };
}

export function variable(name, mutable = true, type = "Any") {
  return { kind: "Variable", name, constant: !mutable, type };
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
  const elementType = elements[0]?.type ?? "Any";
  return {
    kind: "ArrayLiteral",
    elements,
    type: `Array<${elementType}>`,
  };
}

export function objectLiteral(pairs) {
  const fields = Object.fromEntries(
    pairs.map((p) => [p.key, p.value.type ?? "Any"])
  );
  return {
    kind: "ObjectLiteral",
    pairs,
    type: objectType(fields),
  };
}

export function pair(key, value) {
  return { key, value };
}

export function member(object, field) {
  const objectFields = object.type?.fields ?? {};
  return {
    kind: "MemberExpression",
    object,
    field,
    type: objectFields[field] ?? "Any",
  };
}

export function subscript(array, index) {
  const baseType = array.type?.startsWith("Array<")
    ? array.type.slice(6, -1)
    : "Any";
  return {
    kind: "SubscriptExpression",
    array,
    index,
    type: baseType,
  };
}

export function assignment(target, source) {
  return {
    kind: "Assignment",
    target,
    source,
    type: source.type ?? "Any",
  };
}

// === Type Helpers ===
export const voidType = "Void";

export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType };
}

export function arrayType(baseType) {
  return `Array<${baseType}>`;
}

export function objectType(fields) {
  return { kind: "ObjectType", fields };
}

// === Type Checking Utilities ===
export function isAssignable(expected, actual) {
  return expected === actual || expected === "Any" || actual === "Any";
}

// === Type Inference for Binary Expressions ===
function inferBinaryType(op, leftType, rightType) {
  if (["+", "-", "*", "/", "%"].includes(op)) return "Num";
  if (["<", "<=", ">", ">=", "==", "!="].includes(op)) return "Bool";
  if (["&&", "||"].includes(op)) return "Bool";
  return "Any";
}
