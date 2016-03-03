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
  const organisms = Object.create(null)

  forOwn(config.plants, (val, key) => {
    organisms[key] = parsePlant(val)
  })

  forOwn(config.animals, (val, key) => {
    organisms[key] = parseAnimal(val)
  })

  return organisms
}

function parseWorld(config) {
  const organisms = parseOrganisms(config)

  const legend = new Map(
    config.world.legend.map(([key, val]) => {
      return [key, organisms[val]]
    })
  )

  legend.set('=', things.Wall)

  return World.fromLegend(legend, config.world.map)
}

export { parseWorld as default }
