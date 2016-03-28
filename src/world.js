// This module exports the following:
//
// - `class World` (default): The top-level data structure of an ecosystem.
// - `class Vector`: A point in 2-D space.
// - `const directions`: An array of cardinal directions, as `Vector`s.
// ---------------------------------------------------------------------
import EasyStar from 'easystarjs'
import flatten from 'lodash/flatten'
import forOwn from 'lodash/forOwn'
import inRange from 'lodash/inRange'
import map from 'lodash/map'
import random from 'lodash/random'
import range from 'lodash/range'

// Reduce a number to its sign.
function toDirection(n) {
  if (n > 0) return 1
  if (n < 0) return -1
  return 0
}

// An immutable (x, y) coordinate.
class Vector {

  constructor(x, y) {
    this._x = x
    this._y = y
  }

  get x() {
    return this._x
  }

  get y() {
    return this._y
  }

  // Add two `Vector`s.
  plus(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y)
  }

  // Subtract two `Vector`s.
  minus(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y)
  }

  // Reduce this `Vector` to a cardinal direction.
  dir() {
    return this.map(toDirection)
  }

  // Return true if both `Vector`s have the same coordinates.
  equals(vector) {
    return this.x === vector.x && this.y === vector.y
  }

  // Apply a function to this `Vector`'s coordinates.
  map(f) {
    return new Vector(f(this.x), f(this.y))
  }

  // Compare two `Vector`s. Return if GT, -1 if LT, or 0 if EQ.
  compare(vector) {
    const thisTotal = this.x + this.y
    const otherTotal = vector.x + vector.y

    if (thisTotal < otherTotal) return -1
    if (thisTotal > otherTotal) return 1
    return 0
  }
}

// Array of all cardinal directions as `Vector`s.
const directions = [
  new Vector(0, -1),
  new Vector(1, -1),
  new Vector(1, 0),
  new Vector(1, 1),
  new Vector(0, 1),
  new Vector(-1, 1),
  new Vector(-1, 0),
  new Vector(-1, -1),
]

// A 2-D grid of objects. The top-level data structure of an ecosystem.
class World {

  constructor(things) {
    // Private properties.
    this._things = things.map(row => [...row])
    this._height = this._things.length
    this._width = this._things[0].length

    // Each row in the grid must be the same width.
    if (things.some(row => row.length !== this.width)) {
      throw Error('Width/height do not match things array')
    }

    // Setup pathfinding.
    this._astar = new EasyStar.js()
    this._astar.setAcceptableTiles([null])
    this._astar.enableDiagonals()
    this._astar.enableCornerCutting()
    this._astar.enableSync()
  }

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }

  get things() {
    return this._things
  }

  // Create a new `World` from a legend and a map.
  //
  // `legend` is an object that maps characters to object constructors, and
  // `worldMap` is an array of strings. Each character
  //  in the map must correspond with entries in the `legend`. Example:
  //    
  //     const legend = {
  //       '=': Wall,
  //       'h': Herbivore,
  //       '@': Carnivore,
  //       'y': Plant,
  //     }
  //
  //     const worldMap = [
  //       '=====',
  //       '= h =',
  //       '=yy =',
  //       '=  @=',
  //       '=====',
  //     ]
  //
  // Spaces are mapped to `null`, which is represents empty space
  // in the world.
  static fromLegend(legend, worldMap) {
    // Set each thing's `string` property (for use with `World.toString`)
    forOwn(legend, (constructor, key) => {
      // If it's a stamp, mutate `fixed.refs`.
      if (constructor.fixed) constructor.fixed.refs.string = key
      // Otherwise, mutate its `prototype`.
      else constructor.prototype.string = key
    })

    return new World(
      map(worldMap, keys => {
        return map(keys, k => {
          if (k === ' ') return null
          const Thing = legend[k]
          // If its a stamp, just call it, else call it with new
          return Thing.fixed ? Thing() : new Thing()
        })
      })
    )
  }

  // Return a string representation of the world. This is basically
  // identical to the `map` parameter given to `World.fromLegend`.
  toString() {
    return this.things.map(row => {
      return row.map(thing => {
        return thing ? thing.string : ' '
      }).join('')
    }).join('\n')
  }

  // Return the thing at the given `Vector`.
  get(vector) {
    return this.things[vector.y][vector.x]
  }

  // Assign `thing` to the given `Vector`.
  set(vector, thing) {
    this._things[vector.y][vector.x] = thing
  }

  // Set the given `Vector` to `null`.
  remove(vector) {
    this.set(vector, null)
  }

  // Like `World.remove` but also sets the thing's `energy` to 0 to ensure
  // that its actions are not executed if its turn hasn't passed yet.
  kill(vector) {
    this.get(vector).energy = 0
    this.remove(vector)
  }

  // Assign the thing at `vector1` to `vector2` and set `vector1` to `null`.
  move(vector1, vector2) {
    const thing = this.get(vector1)
    this.set(vector2, thing)
    this.remove(vector1)
  }

  // Return `true` if the given `Vector` is within the bounds of the world.
  inBounds(vector) {
    return inRange(vector.x, 0, this.width) &&
           inRange(vector.y, 0, this.height)
  }

  // Return `true` if the given `Vector` is in bounds and walkable.
  isWalkable(vector) {
    return this.inBounds(vector) && !this.get(vector)
  }

  // Return an array of named `{ vector, thing }` pairs, representing
  // each object in the world and its corresponding position.
  enumerate() {
    return flatten(
      this._things.map((row, y) => {
        return row.map((thing, x) => {
          return { vector: new Vector(x, y), thing }
        })
      })
    )
  }

  // Return an array of all `Vector`s within `distance` of `origin`, where
  // `origin` is a `Vector` and `distance` is an integer. Used internally.
  _view(origin, distance) {
    const vectors = []
    const _range = range(-distance, distance + 1)

    _range.forEach(dx => {
      _range.forEach(dy => {
        if (dx !== 0 || dy !== 0) {
          vectors.push(origin.plus(new Vector(dx, dy)))
        }
      })
    })

    return vectors
  }

  // Like `World._view` but only returns `Vector`s that are
  // within the bounds of the world. `distance` is optional and
  // defaults to `1`.
  view(vector, distance = 1) {
    return this._view(vector, distance)
               .filter(v => this.inBounds(v))
  }

  // Like `World.view` but also filters out `Vector`s that aren't
  // walkable.
  viewWalkable(vector, distance = 1) {
    return this._view(vector, distance)
               .filter(v => this.isWalkable(v))
  }

  // Find the shortest path between `Vector`s `from` and `to`. Returns an array
  // of `Vector`s for each point on the path, including the destination (`to`)
  // but excluding the starting point (`from`).
  findPath(from, to) {
    const grid = this._things.map(row => [...row])
    grid[to.y][to.x] = null
    this._astar.setGrid(grid)

    let path = []
    this._astar.findPath(from.x, from.y, to.x, to.y, coords => {
      if (coords && coords.length) {
        path = coords.map(p => new Vector(p.x, p.y)).slice(1)
      }
    })

    this._astar.calculate()
    return path
  }

  // Iterate over each thing in the world and do the following:
  // 
  // 1. If it has a property called `energy` and it is at or below `0`,
  //   remove the thing from the world. Otherwise:
  // 2. If it has a method called `preAct`, call it.
  // 3. If `preAct` returned `false` OR if there was no `preAct` method,
  //   see if it has a method called `act`. If it does, call it.
  //
  // This is the world's main loop, and we'll call each invocation of this
  // method a *turn*. Every turn, each thing in the world is given one action.
  // The `preAct` -> `act` sequence allows each thing to provide a default
  // action, which is always called, and the `act` method is only called if
  // that default action failed (returned `false`). This is used to simplify
  // user-end configuration of the ecosystem. Read the docs for `things.js`
  // and `configParser.js` for more information.
  turn() {
    for (const { vector, thing } of this.enumerate()) {
      if (thing && thing.hasOwnProperty('energy')) {
        if (thing.energy > 0) {
          const hasActed = thing.preAct ? thing.preAct(this, vector) : false
          if (!hasActed && thing.act) thing.act(this, vector)
        } else {
          this.remove(vector)
        }
      }
    }
  }

  // Randomize some of the properties of each thing in the world, within set
  // limits. This is subject to change, but it effectively creates the
  // appearance of walking into a preexisting world that's been running for
  // some amount of time.
  randomize() {
    for (const { thing } of this.enumerate()) {
      if (thing && 'energy' in thing) {
        thing.energy = random(thing.baseEnergy, thing.maxEnergy)
      }
    }
  }
}

export { World as default }
export { directions, Vector, World }
