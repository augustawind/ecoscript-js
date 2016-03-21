import test from 'tape'

import { World, Vector } from '../src/world'

const setup = () => {
  const T1 = () => {
    return { num: 1 }
  }
  const T2 = () => {
    return { num: 2 }
  }
  const legend = { '1': T1, '2': T2 }
  const map = [
    '12',
    ' 1',
  ]
  const world = World.fromLegend(legend, map)
  return world
}

test('World#fromLegend should create a World from a legend and a map', t => {
  const world = setup()

  t.equal(world.things[0][0].num, 1,
         'world.things[y][x] lookup should use same positioning as map')
  t.equal(world.things[0][1].num, 2,
         'world.things[y][x] lookup should use same positioning as map')
  t.equal(world.things[1][1].num, 1,
         'world.things[y][x] lookup should use same positioning as map')

  t.equal(world.things[0][0].string, '1',
          '#fromLegend should set `thing#string` to corresponding legend key')
  t.equal(world.things[0][1].string, '2',
          '#fromLegend should set `thing#string` to corresponding legend key')

  t.end()
})

test('World#toString to display accurate string representation', t => {
  const world = setup()
  const string = '12\n' +
                 ' 1'

  t.equal(world.toString(), string)
  t.end()
})

test('World#enumerate should return every {vector, thing} pair', t => {
  const world = setup()
  const pairs = world.enumerate()

  let myPairs = []
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      const vector = new Vector(x, y)
      const thing = world.things[y][x]
      myPairs.push({ vector, thing })
    }
  }

  t.deepEqual(pairs.sort(), myPairs.sort())
  t.end()
})

test('World#randomize should randomize each thing\'s properties', t => {
  const T = () => {
    return { energy: 1, baseEnergy: 1, maxEnergy: 10 }
  }
  const legend = { '1': T }
  const map = ['11 ']
  const world = World.fromLegend(legend, map)

  let changed = [false, false]
  for (let i = 0; i < 100; i++) {
    world.randomize()

    const th1 = world.things[0][0]
    const th2 = world.things[0][1]
    t.ok(th1.energy >= th1.baseEnergy, 'energy should not be below baseEnergy')
    t.ok(th2.energy <= th2.maxEnergy, 'energy should not be above maxEnergy')

    if(th1.energy !== 1) changed[0] = true
    if(th2.energy !== 1) changed[1] = true
  }

  t.ok(changed[0], 'energy prop should not always be at its initial level')
  t.ok(changed[1], 'energy prop should not always be at its initial level')
  t.end()
})
