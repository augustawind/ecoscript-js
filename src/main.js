import 'babel-polyfill'
import 'source-map-support/register'
import yaml from 'js-yaml'

import parseWorld from './configParser'

export default function *ecoscript(text) {
  const config = yaml.safeLoad(text)
  const world = parseWorld(config)

  while (true) {
    yield world.toString()
    world.turn()
  }
}
