// This module exports a collection of stamps used to create entities in the
// world. Stamps are composable factory functions. See
// <https://github.com/stampit-org/stampit/> for more information.
//
// Most of these simply define one method with the same name as the stamp,
// lowercased. Some of these also define an `init()` method that is called 
// on instantiation. It is also possible to simply define some properties
// that are called by reference (see the `Wall` stamp).
//
// Methods that are to be used as actions (to be called by `World.turn`) should
// take two arguments: a `World` object and a `Vector` of its current position.
// They should return a Boolean value that indicates success or failure.
// [`World.turn` annotations](world.html).

import clamp from 'lodash/clamp'
import get from 'lodash/get'
import sample from 'lodash/sample'
import stampit from 'stampit'

import { directions } from './world'

// Helper functions
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
// ---------------------------------------------------------------------

// A thing that gains energy over time.
export const Grow = stampit.methods({
  // Increase this thing's `energy` by its `growthRate`.
  // `energy` and `growthRate` must be numbers.
  //
  // Return `true`.
  grow() {
    this.energy += this.growthRate
    return true
  },
})

// A thing that eats.
export const Eat = stampit.methods({
  // Find a thing adjacent to this one whose `species` is in this thing's
  // `diet`, then remove it from the world and increase this thing's `energy`
  // by the the eaten's `energy` or `baseEnergy`, whichever is higher.
  // `energy` must be a number, and `diet` must be an array of strings.
  //
  // Return `true` if it ate something, else `false`.
  eat(world, origin) {
    for (const target of world.view(origin)) {
      const thing = world.get(target)

      if (thing && this.diet.includes(thing.species)) {
        this.energy += Math.max(thing.energy, thing.baseEnergy)
        world.kill(target)
        return true
      }
    }
    return false
  },
})

// A thing that loses energy over time.
export const Metabolize = stampit.methods({
  // Decrease this thing's `energy` by its `metabolism`, then if its `energy`
  // is less than `0`, remove it from the world. `energy` and `metabolism`
  // must be numbers.
  //
  // Return `true` if it survived, else `false`.
  metabolize(world, origin) {
    this.energy -= this.metabolism

    if (this.energy > 0) return true

    world.kill(origin)
    return false
  },
})

// A thing that moves in a straight line.
export const Go = stampit({
  // Initialize it. If this thing does not already have a direction (`dir`),
  // set it to a random direction.
  init() {
    this.dir = this.dir || sample(directions)
  },

  methods: {
    // Check the next square in the current direction of movement (`dir`). If
    // the destination isn't walkable, try to find an adjacent square that is.
    // If found set `dir` to that direction, decrease `energy` by
    // `movementCost`, and move to that square. `energy` and `movementCost`
    // must be numbers. `dir` must be a Vector.
    //
    // Return `true` if successfully moved, else `false`.
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

// A thing that moves randomly each turn.
export const Wander = stampit.methods({
  // Randomly find an adjacent square that is walkable, then set this thing's
  // `dir` to the direction of the target, and call its `go` method, defined in
  // the `Go` stamp. `dir` must be a `Vector` whose `x` and `y` are between `1`
  // and `-1`.
  //
  // Return `false` if there was no walkable square, else return the result
  // of calling `this.go`.
  wander(world, origin) {
    const dest = sample(world.viewWalkable(origin))
    if (!dest) return false

    this.dir = dest.minus(origin)
    return this.go(world, origin)
  },
}).compose(Go)

// A thing that avoids predators.
export const AvoidPredators = stampit.methods({
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
}).compose(Go)

// A thing that forms groups with similar things.
export const Herd = stampit.methods({
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
}).compose(Go)

// A thing that actively searches for food.
export const Hunt = stampit.methods({
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
}).compose(Go)

// A wall.
export const Wall = stampit.refs({ species: 'wall' })

// A thing that has energy and reproduces.
export const Organism = stampit({
  init({ stamp }) {
    this.another = stamp
    this.energy = this.baseEnergy
    let energy = this.baseEnergy
    Reflect.defineProperty(this, 'energy', {
      get() {
        return energy
      },
      set(value) {
        energy = clamp(value, 0, this.maxEnergy)
      },
    }) 
  },

  methods: {
    reproduce(world, origin) {
      if (this.energy < this.maxEnergy) return false

      const target = sample(world.viewWalkable(origin))
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

// A plant.
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

// An animal.
export const Animal = stampit({
  methods: {
    preAct(world, origin) {
      return (
        this.metabolize(world, origin) && 
        this.avoidPredators(world, origin) ||
        this.eat(world, origin) ||
        this.reproduce(world, origin)
      )
    },
  },
}).compose(Organism, Eat, Metabolize, AvoidPredators)

export default { Grow, Eat, Metabolize, Wander, Go, AvoidPredators, Herd,
                 Hunt, Wall, Organism, Plant, Animal }
