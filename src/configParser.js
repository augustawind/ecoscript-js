import get from 'lodash/get'
import mapValues from 'lodash/mapValues'
import some from 'lodash/some'
import upperFirst from 'lodash/upperFirst'
import stampit from 'stampit'

import World from './world'
import things from './things'

function parseOrganism(config) {
  const behaviors = get(config, 'actions') || ['go']

  const mixins = behaviors
    .concat(config.type)
    .map(str => things[upperFirst(str)])

  return stampit({
    refs: config.properties,

    methods: {
      act(world, vector) {
        return some(behaviors, action => this[action](world, vector))
      },
    },

  }).compose(...mixins)
}

function parseConfig(config) {
  const entities = mapValues(config.organisms, parseOrganism)
  entities.wall = things.Wall
  const legend = mapValues(config.world.legend, val => entities[val])
  const world = World.fromLegend(legend, config.world.map)
  world.randomize()
  return world
}

export { parseConfig as default }
