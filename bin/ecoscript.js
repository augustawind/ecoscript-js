#!/usr/bin/env node
'use strict'

const minimist = require('minimist')
const ecoscript = require('../dist/main.js')

const argv = minimist(process.argv.slice(2))
const filename = argv._[0]

const world = ecoscript(filename)

console.log(world.next().value)
console.log(world.next().value)
console.log(world.next().value)
