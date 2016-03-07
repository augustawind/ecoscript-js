import clamp from 'lodash/clamp'
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

const Wall = stampit({
  refs: {
    species: 'wall',
    image: '=',
    walkable: false,
  },
})

const Organism = stampit({
  refs: {
    walkable: false,
  },

  init({ stamp }) {
    this.another = stamp

    let energy = this.baseEnergy

    Reflect.defineProperty(this, 'energy', {
      get: () => energy,
      set: (x) => {
        energy = clamp(x, 0, this.maxEnergy)
      }
    })
  },

  methods: {
    reproduce(world, vector) {
      if (this.energy < this.maxEnergy) return false

      const target = sample(world.viewWalkable(vector))
      if (!target) return false

      this.energy = this.baseEnergy
      world.set(target, this.another())
      return true
    },

    pass() {
      return false
    },
  },
})

const Grow = stampit({
  methods: {
    grow() {
      this.energy += this.growthRate
      return true
    },
  },
})

const Eat = stampit({
  methods: {
    eat(world, vector) {
      for (const target of world.view(vector)) {
        const thing = world.get(target)

        if (thing && this.diet.includes(thing.species)) {
          world.remove(target)
          this.energy += Math.min(thing.energy, thing.baseEnergy)
          return true
        }
      }
      return false
    },
  },
})

const Metabolize = stampit({
  methods: {
    metabolize(world, vector) {
      this.energy -= this.metabolism

      if (this.energy > 0) return false

      world.remove(vector)
      return true
    },
  },
})

const AvoidPredators = stampit({
  methods: {
    avoidPredators(world, vector) {
      const view = world.view(vector, this.senseRadius)

      const predators = view.filter(target => {
        const thing = world.get(target)
        return thing && thing.diet && thing.diet.includes(this.species)
      })

      if (predators.length) {
        const closest = closestTo(vector, predators)
        const dir = vector.minus(closest).dir()
        const dest = vector.plus(dir)

        if (world.isWalkable(dest)) {
          this.dir = dir
        } else {
          const options = world.viewWalkable(vector)
          if (options.length) {
            const best = furthestFrom(closest, options)
            this.dir = best.dir()
          }
        }

        return this.go(world, vector)
      }

      return false
    },
  },
})

const Go = stampit({
  init() {
    this.dir = this.dir || sample(directions)
  },

  methods: {
    go(world, vector) {
      let dest = vector.plus(this.dir)

      if (!world.isWalkable(dest)) {
        dest = sample(world.viewWalkable(vector))
        if (!dest) return false

        this.dir = dest.minus(vector)
      }

      world.move(vector, dest)
      this.energy -= this.movementCost
      return true
    },
  },
})

const Wander = stampit({
  methods: {
    wander(world, vector) {
      const dest = sample(world.viewWalkable(vector))
      if (!dest) return false

      this.dir = dest.minus(vector)
      this.energy -= this.movementCost
      world.move(vector, dest)
      return true
    },
  },
})

const Herd = stampit({
  methods: {
    herd(world, vector) {
      const view = world.view(vector, this.senseRadius)

      const flock = view.filter(target => {
        const thing = world.get(target)
        return thing && this.species === thing.species
      })

      if (flock.length) {
        const closest = closestTo(vector, flock)
        const path = world.findPath(vector, closest)

        if (path.length) {
          this.dir = path[0].minus(vector)
          return this.go(world, vector)
        }
      }

      return false
    }
  }
}).compose(Go)

const Hunt = stampit({
  methods: {
    hunt(world, vector) {
      const view = world.view(vector, this.senseRadius)

      const prey = view.filter(target => {
        const thing = world.get(target)
        return thing && this.diet.includes(thing.species)
      })

      if (prey.length) {
        const closest = closestTo(vector, prey)
        const path = world.findPath(vector, closest)

        if (path.length) {
          this.dir = path[0].minus(vector)
          return this.go(world, vector)
        }
      }

      return false
    },
  },
}).compose(Go)

const Plant = stampit({
  methods: {
    preAct(world, vector) {
      return (
        this.reproduce(world, vector) ||
        this.grow(world, vector)
      )
    },
  },
}).compose(Organism, Grow)

const Animal = stampit({
  methods: {
    preAct(world, vector) {
      return (
        this.avoidPredators(world, vector) ||
        this.reproduce(world, vector) ||
        this.metabolize(world, vector)
      )
    },
  },
}).compose(Organism, Eat, Metabolize, AvoidPredators)

export default { Wall, Organism, Plant, Animal, Go, Wander, Hunt, Herd }
