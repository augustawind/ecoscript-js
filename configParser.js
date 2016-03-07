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

  const actions = ['eat'].concat(behaviors)

  return stampit({
    refs: config.properties,

    methods: {
      act(world, vector) {
        return some(actions, action => this[action](world, vector))
      }
    }

  }).compose(...mixins)
}

function parseConfig(config) {
  const entities = mapValues(config.organisms, parseOrganism)
  entities.Wall = things.Wall

  const legend = new Map(
    config.world.legend.map(([key, val]) => {
      return [key, entities[val]]
    })
  )

  return {
    timeout: config.app.timeout,
    world: World.fromLegend(legend, config.world.map),
  }
}

export { parseConfig as default }
