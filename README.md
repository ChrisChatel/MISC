![MISC Logo](docs/MISCLogo.png)

# MISC

Try it live: [https://stan319.github.io/MISCLang/](https://stan319.github.io/MISCLang/)

MISC is the intersection of programming and the hype of hip-hop culture. Inspired by the adlibs, producer tags, and iconic quotes of artists like Travis Scott and Metro Boomin, MISC turns your code into an energetic performance.

## Authors

Martel, Isaiah, Stanley, Chris

## Features

- Hip-hop inspired syntax
- Static typing
- First-class functions
- C-style loops with `4x4`
- Block statements
- Console output with `shout`
- Full expression support (arithmetic, logical, comparison, etc.)
- Conditionals with `ifLit`, `21if`, and `elseLit`
- Control flow with `skrrt` and `sendit`

## Static Errors

The MISC static analyzer detects and reports the following errors during semantic analysis:

- Using `skrrt` (break) outside of a `4x4` loop
- Using `sendit` (return) outside of a function
- Referencing undeclared variables
- Redeclaring variables in the same scope
- Assigning to a `const` variable
- Type mismatch in binary expressions (e.g., adding `Num` and `Str`)
- Type mismatch in array literals (e.g., mixed types in `[1, "yo", 3]`)
- Incrementing a constant variable
- Using a non-function in a call expression
- Declaring a variable with the same name as a loop control variable

## Keywords

| JavaScript        | MISC                |
| ----------------- | ------------------- |
| `let x = 3;`      | `letsgo x = 3;`     |
| `const y = 5;`    | `const y = 5;`      |
| `function f() {}` | `youngMetro f() {}` |
| `console.log(x);` | `shout x;`          |
| `if (x > 5)`      | `ifLit (x > 5)`     |
| `else`            | `elseLit`           |
| `for (...)`       | `4x4 (...)`         |
| `return 3;`       | `sendit 3;`         |
| `break;`          | `skrrt;`            |
| `null`            | `ghost`             |
| `true / false`    | `onGod / carti`     |

## Examples

** Printing Output **

JavaScript:

```
console.log("Hello, world!");
```

MISC:

```
shout "Hello, world!";
```

** Variable Declaration **

JavaScript:

```
let name = "Travis Scott";
const age = 28;
```

MISC:

```
letsgo name = "Travis Scott";
const age = 28;
```

** Arrays **

JavaScript:

```
let artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

MISC:

```
letsgo artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

** Conditionals **

JavaScript:

```
if (temperature > 100) {
  console.log("It's really hot!");
} else {
  console.log("Stay chill.");
}
```

MISC:

```
ifLit (temperature > 100) {
  shout "It's really hot!";
} elseLit {
  shout("Stay chill.");
}
```

** Loops **

JavaScript:

```
for (let i = 0; i < 10; i++) {
  console.log(i);
}
```

MISC:

```
4x4 (let i = 0; i < 10; i++) {
  shout i;
}
```

** Functions **

JavaScript:

```
function hype(x) {
  return x + 1;
}
```

MISC:

```
youngMetro hype(x: Num): Num {
  sendit x + 1;
}
```

** Objects **

JavaScript:

```
let person = { name: "Travis", age: 34 };
```

MISC:

```
letsgo person: { name: Str, age: Num } = { name: "Travis", age: 34 };
```

** Booleans and Null **

JavaScript:

```
let alive = true;
let dead = null;
```

MISC:

```
letsgo alive = onGod;
letsgo dead = ghost;
```
