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

## Easter Egg: `swampizzo`

MISC includes a special no-op statement: swampizzo;. It does absolutely nothing—and that’s the point.

This line is an homage to DJ Swamp Izzo, who gained viral recognition after being featured across Playboi Carti’s 2025 album MUSIC, where his signature adlib “SWAMP IZZO!” echoes randomly throughout tracks. Similarly, the swampizzo statement shows up for no reason... and still leaves a mark.

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
// SWAMP IZZO!
```

</td>

<td>

```
swampizzo;
```

</td>
</table>

## Examples

**Printing Output**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
console.log("Hello, world!");
```

</td>

<td>

```
shout "Hello, world!";
```

</td>
</table>

**Variable Declaration**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
let name = "Travis Scott";
const age = 28;
```

</td>

<td>

```
letsgo name = "Travis Scott";
const age = 28;
```

</td>
</table>

**Arrays**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
let artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

</td>

<td>

```
letsgo artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

</td>
</table>

**Conditionals**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
if (temperature > 100) {
  console.log("It's really hot!");
} else {
  console.log("Stay chill.");
}
```

</td>

<td>

```
ifLit (temperature > 100) {
  shout "It's really hot!";
} elseLit {
  shout("Stay chill.");
}
```

</td>
</table>

**Loops**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
for (let i = 0; i < 10; i++) {
  console.log(i);
}
```

</td>

<td>

```
4x4 (let i = 0; i < 10; i++) {
  shout i;
}
```

</td>
</table>

**Functions**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
function hype(x) {
  return x + 1;
}
```

</td>

<td>

```
youngMetro hype(x: Num): Num {
  sendit x + 1;
}
```

</td>
</table>

**Objects**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
let person = { name: "Travis", age: 34 };
```

</td>

<td>

```
letsgo person: { name: Str, age: Num } = { name: "Travis", age: 34 };
```

</td>
</table>

**Booleans and Null**

<table>
<tr> <th>JavaScript</th><th>MISC</th><tr>
</tr>

<td>

```
let alive = true;
let dead = null;
```

</td>

<td>

```
letsgo alive = onGod;
letsgo dead = ghost;
```

</td>
</table>
