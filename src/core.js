export class Context {
  constructor(parent = null) {
    this.parent = parent;
    this.variables = new Map([
      ["true", { type: "boolean", constant: true }],
      ["false", { type: "boolean", constant: true }],
    ]);
    this.insideLoop = false;
    this.insideFunction = false;
  }

  createChildContext() {
    const child = new Context(this);
    // Inherit loop and function context flags
    child.insideLoop = this.insideLoop;
    child.insideFunction = this.insideFunction;
    return child;
  }

  add(name, info) {
    // 🔁 Only check for re-declaration in *this* scope
    if (this.variables.has(name)) {
      throw new Error(`${name} already declared`);
    }
    this.variables.set(name, info);
  }

  has(name) {
    return this._lookup(name, false) !== undefined;
  }

  lookup(name) {
    const found = this._lookup(name, true);
    if (!found) throw new Error(`Variable "${name}" not declared`);
    return found;
  }

  _lookup(name, throwIfNotFound) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    } else if (this.parent !== null) {
      return this.parent._lookup(name, throwIfNotFound);
    } else {
      if (throwIfNotFound) throw new Error(`Variable "${name}" not declared`);
      return undefined;
    }
  }
}
