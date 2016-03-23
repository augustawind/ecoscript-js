import test from 'tape'

import { Vector } from '../src/world'

test('Vector#plus', t => {
  const v1 = new Vector(1, 4)
  const v2 = new Vector(2, 0)
  t.deepEqual(v1.plus(v2), new Vector(3, 4), 'should add two Vectors')
  t.end()
})

test('Vector#minus', t => {
  const v1 = new Vector(5, 8)
  const v2 = new Vector(9, 2)
  t.deepEqual(v1.minus(v2), new Vector(-4, 6), 'should subtract two Vectors')
  t.end()
})

test('Vector#equals', t => {
  const v1 = new Vector(1, 2)
  const v2 = new Vector(1, 2)
  const v3 = new Vector(2, 1)
  t.ok(v1.equals(v2), 'should return true if x and y values match up')
  t.notOk(v2.equals(v3), 'should return false if x and y values dont match')
  t.end()
})

test('Vector#dir', t => {
  const v1 = new Vector(4, -8)
  const v2 = new Vector(0, 1)
  t.deepEqual(v1.dir(), new Vector(1, -1),
              'should reduce a Vector to a cardinal direction')
  t.deepEqual(v2.dir(), new Vector(0, 1),
              'should reduce a Vector to a cardinal direction')
  t.end()
})

test('Vector#map', t => {
  const v = new Vector(5, 12)
  const f = n => n * n
  t.deepEqual(v.map(f), new Vector(25, 144),
              'should apply a function to each coordinate')
  t.end()
})

test('Vector#compare', t => {
  const v1 = new Vector(2, 4)
  const v2 = new Vector(8, -3)
  t.equal(v1.compare(v2), 1, 'should return 1 if v1 > v2')
  t.equal(v2.compare(v1), -1, 'should return -1 if v1 < v2')

  const v3 = new Vector(4, 6)
  const v4 = new Vector(8, 2)
  t.equal(v3.compare(v4), 0, 'should return 0 if v1 ~= v2')
  t.equal(v4.compare(v3), 0, 'should return 0 if v1 ~= v2')

  t.end()
})
