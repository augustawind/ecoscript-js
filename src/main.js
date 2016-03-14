import 'babel-polyfill'
import fs from 'fs'
import yaml from 'js-yaml'

import parseWorld from './configParser'

export default function *ecoscript(text) {
  const config = yaml.safeLoad(text)
  const world = parseWorld(config)

  let stop = false
  while (!stop) {
    world.turn()
    stop = yield world.toString()
  }
}
