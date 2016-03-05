import forOwn from 'lodash/forOwn'
import upperFirst from 'lodash/upperFirst'
import stampit from 'stampit'

import World from './world'
import things from './things'

function parsePlant(config) {
  return stampit({
    refs: config.properties,
  }).compose(things.Plant)
}

function parseAnimal(config) {
  const strategy = config.actions.move.strategy
  const condition = config.actions.move.condition || 'false'

  const mixins = [
    things.Animal,
    things[upperFirst(strategy)],
  ]

  return stampit({
    refs: config.properties,

    methods: {
      act(world, vector) {
        return (
          this.eat(world, vector) ||
          eval(condition) ||
          this[strategy](world, vector)
        )
      }
    }

  }).compose(...mixins)
}

function parseOrganisms(config) {
  const organisms = {}

  forOwn(config, (settings, name) => {
    switch (settings.type) {
      case 'plant':
        organisms[name] = parsePlant(settings)
        break
      case 'animal':
        organisms[name] = parseAnimal(settings)
        break
      default:
        throw new Error(
          `Invalid type "${settings.type}" for organism "${name}"`)
    }
  })

  return organisms
}

function parseWorld(config) {
  const entities = parseOrganisms(config.organisms)
  entities.Wall = things.Wall

  const legend = new Map(
    config.world.legend.map(([key, val]) => {
      return [key, entities[val]]
    })
  )

  return World.fromLegend(legend, config.world.map)
}

export { parseWorld as default }
