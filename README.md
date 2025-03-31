![MISC Logo](docs/MISCLogo.png)

# MISC

Try it live: [https://stan319.github.io/MISCLang/](https://stan319.github.io/MISCLang/)

MISC is the intersection of programming and the hype of hip-hop culture. Inspired by the adlibs, producer tags, and iconic quotes of artists like Travis Scott and Metro Boomin, MISC turns your code into an energetic performance.

## Authors

Martel, Isaiah, Stanley, Chris

## Features

Static Typing
First-Class Functions
Pattern Matching
Object-Oriented Programming
Loops and Nesting
Tuples

## Static Errors

The MISC static analyzer detects and reports the following errors:

- Using `break` outside of a loop
- Using `return` outside of a function
- Referencing undeclared variables
- Redeclaring variables in the same scope
- Assigning to a constant variable
- Type mismatch in expressions (e.g., adding a number and a string)
- Type mismatch in array literals
- Incrementing a constant variable
- Array access is not currently supported
- Declaring a variable with the same name as a loop variable

## Examples

Printing Output
JavaScript:

```
console.log("Hello, world!");
```

MISC:

```
shout "Hello, world!";
```

Variable Declaration
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

Arrays
JavaScript:

```
let artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

MISC:

```
letsgo artists = ["Travis Scott", "Metro Boomin", "The Weeknd"];
```

Conditional Logic
JavaScript:

```
if (temperature > 100) {
  console.log("It's really hot!");
}
```

MISC:

```
ifLit (temperature > 100) {
  shout "It's really hot!";
}
```

Loops
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
