import get from 'lodash/get'
import sample from 'lodash/sample'
import stampit from 'stampit'

import { directions } from './world'


function reduceByDistance(origin, vectors, comparison) {
  return vectors.reduce((previous, current) => {
    const previousDistance = previous.minus(origin).map(Math.abs)
    const currentDistance = current.minus(origin).map(Math.abs)
    const result = currentDistance.compare(previousDistance)
    return result === comparison ? current : previous
  })
}

function closestTo(origin, vectors) {
  return reduceByDistance(origin, vectors, -1)
}

function furthestFrom(origin, vectors) {
  return reduceByDistance(origin, vectors, 1)
}

export const Grow = stampit({
  methods: {
    grow() {
      this.energy += this.growthRate
      return true
    },
  },
})

export const Eat = stampit({
  methods: {
    eat(world, origin) {
      for (const target of world.view(origin)) {
        const thing = world.get(target)

        if (thing && this.diet.includes(thing.species)) {
          debugger;
          this.energy += Math.max(thing.energy, thing.baseEnergy)
          world.kill(target)
          return true
        }
      }
      return false
    },
  },
})

export const Metabolize = stampit({
  methods: {
    metabolize(world, origin) {
      this.energy -= this.metabolism

      if (this.energy > 0) return false

      world.remove(origin)
      return true
    },
  },
})

export const Wander = stampit({
  methods: {
    wander(world, origin) {
      const dest = sample(world.viewWalkable(origin))
      if (!dest) return false

      this.dir = dest.minus(origin)
      this.energy -= this.movementCost
      world.move(origin, dest)
      return true
    },
  },
})

export const Go = stampit({
  init() {
    this.dir = this.dir || sample(directions)
  },

  methods: {
    go(world, origin) {
      let dest = origin.plus(this.dir)

      if (!world.isWalkable(dest)) {
        dest = sample(world.viewWalkable(origin))
        if (!dest) return false

        this.dir = dest.minus(origin)
      }

      world.move(origin, dest)
      this.energy -= this.movementCost
      return true
    },
  },
})

export const AvoidPredators = stampit({
  methods: {
    avoidPredators(world, origin) {
      const view = world.view(origin, this.senseRadius)

      const predators = view.filter(target => {
        const thing = world.get(target)
        const isPredator = get(thing, 'diet', []).includes(this.species)
        return isPredator && world.findPath(origin, target).length <= this.senseRadius
      })

      if (predators.length) {
        const closest = closestTo(origin, predators)
        const dir = origin.minus(closest).dir()
        const dest = origin.plus(dir)

        if (world.isWalkable(dest)) {
          this.dir = dir
        } else {
          const options = world.viewWalkable(origin)
          if (options.length) {
            const best = furthestFrom(closest, options)
            this.dir = best.dir()
          }
        }

        return this.go(world, origin)
      }

      return false
    },
  },
}).compose(Go)

export const Herd = stampit({
  methods: {
    herd(world, origin) {
      const view = world.view(origin, this.senseRadius)

      const flock = view.filter(target => {
        const thing = world.get(target)
        return thing && this.species === thing.species
      })

      if (flock.length) {
        const closest = closestTo(origin, flock)
        const path = world.findPath(origin, closest)

        if (path.length > 1) {
          this.dir = path[0].minus(origin)
          return this.go(world, origin)
        }
      }

      return false
    },
  },
}).compose(Go)

export const Hunt = stampit({
  methods: {
    hunt(world, origin) {
      const view = world.view(origin, this.senseRadius)

      const prey = view.filter(target => {
        const thing = world.get(target)
        return thing && this.diet.includes(thing.species)
      })

      if (prey.length) {
        const closest = closestTo(origin, prey)
        const path = world.findPath(origin, closest)

        if (path.length > 1) {
          this.dir = path[0].minus(origin)
          return this.go(world, origin)
        }
      }

      return false
    },
  },
}).compose(Go)

export const Wall = stampit({
  refs: {
    species: 'wall',
    image: '=',
  },
})

export const Organism = stampit({
  init({ stamp }) {
    this.another = stamp
    this.energy = this.baseEnergy
  },

  methods: {
    reproduce(world, origin) {
      if (this.energy < this.maxEnergy) return false

      const target = sample(world.viewWalkable(origin))
      if (!target) return false

      debugger;
      this.energy = this.baseEnergy
      world.set(target, this.another())
      return true
    },

    pass() {
      return false
    },
  },
})

export const Plant = stampit({
  methods: {
    preAct(world, origin) {
      return (
        this.reproduce(world, origin) ||
        this.grow(world, origin)
      )
    },
  },
}).compose(Organism, Grow)

export const Animal = stampit({
  methods: {
    preAct(world, origin) {
      return (
        this.avoidPredators(world, origin) ||
        this.reproduce(world, origin) ||
        this.metabolize(world, origin)
      )
    },
  },
}).compose(Organism, Eat, Metabolize, AvoidPredators)

export default { Grow, Eat, Metabolize, Wander, Go, AvoidPredators, Herd,
                 Hunt, Wall, Organism, Plant, Animal }
