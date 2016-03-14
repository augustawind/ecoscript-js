import 'babel-polyfill'
import fs from 'fs'
import yaml from 'js-yaml'

import parseWorld from './configParser'

export default function *ecoscript(text) {
  const config = yaml.safeLoad(text)
  const world = parseWorld(config)

  let done = false
  while (!done) {
    world.turn()
    done = yield world.toString()
  }
}
