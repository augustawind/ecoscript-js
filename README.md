# EcoScript

A simple, YAML-configurable natural ecosystem simulator.

## Installation

```bash
$ npm install ecoscript
```

## Example

See [the example config](https://github.com/dustinrohde/ecoscript/examples/example.yml)

## Usage

```
SYNOPSIS
  
    ecoscript FILE [OPTIONS]

DESCRIPTION

    ecoscript reads a YAML-formatted config file and creates an "ecosystem"
    internally. It then spits out a textual representation of the ecosystem
    turn by turn until the shell recieves the signal to terminate (usually
    by pressing CTRL-C).

OPTIONS

    -d [NUMBER], --delay [NUMBER]
          Sets the delay in milliseconds between each turn. Defaults to 500.

    -r [TURNS], --result [TURNS]
          Run the ecosystem silently for the specified number of turns,
          then spit out the result. If no number is specified, just print
          the ecosystem as-is and exit.

    -i, --interactive
          Run normally, but allow execution to paused or resumed with the
          Enter key. Start paused.
```

## API

```js
const ecoscript = require('ecoscript')
const fs = require('fs')

const text = fs.readFileSync('myConfig.yml')
const world = ecoscript(text)

console.log(world.next().value)
// Output:
// =========
// =     w =
// =    ***=
// = **    =
// =  b  **=
// =========
```
