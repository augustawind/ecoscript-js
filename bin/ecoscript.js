#!/usr/bin/env node
'use strict'

const minimist = require('minimist')
const ecoscript = require('../dist/main.js')

const isPositiveInteger = (n) => Number.isInteger(n) && n >= 0

function fail(msg) {
  console.error(`ecoscript: ${msg}`)
  process.exit(1)
}

function step(ecosystem) {
  console.log(ecosystem.next().value)
}

function animate(ecosystem) {
  if (!isPositiveInteger(argv.delay)) {
    fail('Invalid argument: "--delay" must be a positive integer')
  }

  return setInterval(step, argv.delay, ecosystem)
}

const argv = minimist(process.argv.slice(2), {
  'default': {
    interactive: false,
    result: null,
    delay: 500,
  },

  'alias': { 'i': 'interactive', 'r': 'result', 'd': 'delay' },
  'boolean': 'interactive',
})

if (!argv._.length) {
  fail('Missing parameter: filename must be provided')
}

const filename = argv._[0]
const eco = ecoscript(filename)

// Result mode -- dump results after n iterations
if (argv.result) {
  if (argv.result === true) {
    argv.result = 1
  }

  else if (!isPositiveInteger(argv.result)) {
    fail('Invalid argument: "--result" must be a positive integer')
  }

  for (let i = 0; i < argv.result - 1; i++) {
    eco.next()
  }

  console.log(eco.next().value)
}

// Interactive mode -- allow user to pause/resume execution
else if (argv.interactive) {
  process.stdin.setEncoding('utf8')

  let paused = true
  let animation

  process.stdin.on('data', data => {
    if (paused) animation = animate(eco)
    else clearInterval(animation)
    paused = !paused
  })

  console.log('Press <Enter> to pause/resume execution.')
}

// Normal mode -- run animation indefinitely
else {
  animate(eco)
}
