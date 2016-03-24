import test from 'tape'

import sinon from 'sinon'
import sortBy from 'lodash/fp/sortBy'

import { World, Vector } from '../src/world'

// helpers

const sortByXY = sortBy(['x', 'y'])

const setup = () => {
  function T1() {
    this.num = 1
  }
  function T2() {
    this.num = 2
  }
  const legend = { '1': T1, '2': T2 }
  const map = [
    '12',
    ' 1',
  ]
  const world = World.fromLegend(legend, map)
  return world
}

// tests

test('World#fromLegend', t => {
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

test('World#toString', t => {
  const world = setup()
  const string = '12\n' +
                 ' 1'

  t.equal(world.toString(), string,
          'should display accurate string representation')
  t.end()
})

test('World#get', t => {
  const world = setup()
  t.equal(world.get(new Vector(0, 0)).num, 1,
          'should return the thing at the vector')
  t.equal(world.get(new Vector(1, 0)).num, 2,
          'should return the thing at the vector')
  t.equal(world.get(new Vector(0, 1)), null,
          'should return the thing at the vector')
  t.end()
})

test('World#set', t => {
  const world = setup()
  const v = new Vector(0, 0)
  t.notEqual(world.get(v).num, 3)
  world.set(v, { num: 3 })
  t.equal(world.get(v).num, 3, 'should set the vector to the thing')
  t.end()
})

test('World#remove', t => {
  const world = setup()
  const v = new Vector(1, 0)
  t.notEqual(world.get(v), null)
  world.remove(v)
  t.equal(world.get(v), null, 'should set the vector to null')
  t.end()
})

test('World#kill', t => {
  function T() {
    this.energy = 2
  }
  const legend = { '1': T }
  const map = ['11']
  const world = World.fromLegend(legend, map)

  const v0 = new Vector(0, 0)
  const t0 = world.get(v0)
  t.equals(t0.energy, 2)
  world.kill(v0)
  t.equals(t0.energy, 0,
           'should set the thing at the vectors energy to 0')
  t.equals(world.get(v0), null,
           'should remove the thing at the vector from the world')
  t.end()
})

test('World#move', t => {
  const world = setup()
  const v1 = new Vector(0, 0)
  const v2 = new Vector(1, 0)
  world.move(v2, v1)
  t.equal(world.get(v1).num, 2, 'should set vector2 to vector1')
  t.equal(world.get(v2), null, 'should set vector1 to null')
  t.end()
})

test('World#inBounds', t => {
  const world = setup()
  t.equal(world.inBounds(new Vector(-1, 0)), false,
         'should return false if a coord is less than 0')
  t.equal(world.inBounds(new Vector(0, 0)), true)
  t.equal(world.inBounds(new Vector(1, 2)), false,
         'should return false if a coord is greater than width/height')
  t.equal(world.inBounds(new Vector(1, 1)), true)
  t.end()
})

test('World#isWalkable', t => {
  const world = setup()
  t.equal(world.isWalkable(new Vector(0, 1)), true,
         'should return true if vector is not null')
  t.equal(world.isWalkable(new Vector(0, 0)), false,
         'should return false is vector is null')
  t.end()
})

test('World#enumerate', t => {
  const world = setup()
  const pairs = world.enumerate()

  let myPairs = [
    { vector: new Vector(0, 0), thing: world.things[0][0] },
    { vector: new Vector(1, 0), thing: world.things[0][1] },
    { vector: new Vector(0, 1), thing: null },
    { vector: new Vector(1, 1), thing: world.things[1][1] },
  ]

  t.deepEqual(sortByXY(pairs), sortByXY(myPairs),
             'should return every {vector, thing} pair')
  t.end()
})

test('World#enumerateChars', t => {
  const world = setup()
  const pairs = world.enumerateChars()

  let myPairs = [
    { vector: new Vector(0, 0), chr: world.things[0][0].string },
    { vector: new Vector(1, 0), chr: world.things[0][1].string },
    { vector: new Vector(0, 1), chr: ' ' },
    { vector: new Vector(1, 1), chr: world.things[1][1].string },
  ]

  t.deepEqual(sortByXY(pairs), sortByXY(myPairs),
             'should return every {vector, chr} pair')
  t.end()
})

test('World#view', t=> {
  const legend = {}
  const map = [
    '     ',
    '     ',
    '     ',
    '     ',
    '     ',
  ]
  const world = World.fromLegend(legend, map)

  t.deepEqual(
    sortByXY(world.view(new Vector(0, 0))),
    sortByXY([new Vector(1, 0), new Vector(1, 1), new Vector(0, 1)]),
    'should return only vectors that are in bounds'
  )

  t.deepEqual(
    sortByXY(world.view(new Vector(2, 2), 2)),

    sortByXY(
      world
        .enumerate()
        .map(({ vector }) => vector)
        .filter(vector => !vector.equals(new Vector(2, 2)))
    ),

    'should return vectors up to the given distance'
  )

  t.deepEqual(
    sortByXY(world.view(new Vector(1, 1))),

    sortByXY([
      new Vector(0, 0), new Vector(1, 0), new Vector(2, 0),
      new Vector(2, 1), new Vector(2, 2), new Vector(1, 2),
      new Vector(0, 2), new Vector(0, 1)
    ]),

    'should return all vectors within distance of 1 if distance not given'
  )

  t.end()
})
test('World#viewWalkable', t => {
  const legend = {
    '1': Object
  }
  const map = [
    '11 ',
    ' 11',
    '1 1',
  ]
  const world = World.fromLegend(legend, map)

  t.deepEqual(
    sortByXY(world.viewWalkable(new Vector(1, 1), 2)),
    sortByXY([new Vector(2, 0), new Vector(0, 1), new Vector(1, 2)]),
    'should only return vectors that are walkable and in bounds'
  )

  t.end()
})

test('World#randomize', t => {
  function T() {
    this.energy = 1
    this.baseEnergy = 1
    this.maxEnergy = 10
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

test('World#turn', t => {
  function T1() {
    this.energy = 1
    this.preAct = sinon.stub()
    this.act  = sinon.spy()
  }

  function T2() {
    this.energy = 1
    this.preAct = sinon.stub()
  }

  function T3() {
    this.energy = 1
    this.act = sinon.spy()
  }

  function T4() {
    this.energy = 0
    this.preAct = sinon.stub()
    this.act = sinon.spy()
  }

  const legend = { '1': T1, '2': T1, '3': T2, '4': T3, '5': T4 }
  const map = ['12345']
  const world = World.fromLegend(legend, map)

  const t1 = world.get(new Vector(0, 0))
  t1.preAct.returns(true)
  const t2 = world.get(new Vector(1, 0))
  t2.preAct.returns(false)
  const t3 = world.get(new Vector(2, 0))
  t3.preAct.returns(true)
  const t4 = world.get(new Vector(3, 0))
  const t5 = world.get(new Vector(4, 0))
  t5.preAct.returns(true)

  world.turn()

  t.equal(t1.preAct.callCount, 1, 'should call preAct once')
  t.notOk(t1.act.called, 'should not call act if preAct returned true')

  t.equal(t2.preAct.callCount, 1, 'should call preAct once')
  t.ok(t2.act.calledOnce, 'should call act once if preAct returned true')

  t.equal(t4.act.callCount, 1, 'should call act if no preAct exists')

  t.notOk(t5.preAct.called, 'should not call preAct if its energy <= 0')
  t.notOk(t5.act.called, 'should not call act if its energy <= 0')

  t.end()
})
