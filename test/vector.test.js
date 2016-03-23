import test from 'tape'

import { Vector } from '../src/world'

test('Vector#plus should add two Vectors', t => {
  const v1 = new Vector(1, 4)
  const v2 = new Vector(2, 0)
  t.deepEqual(v1.plus(v2), new Vector(3, 4))
  t.end()
})

test('Vector#minus should subtract two Vectors', t => {
  const v1 = new Vector(5, 8)
  const v2 = new Vector(9, 2)
  t.deepEqual(v1.minus(v2), new Vector(-4, 6))
  t.end()
})

test('Vector#equals should return true if x and y values match up', t => {
  const v1 = new Vector(1, 2)
  const v2 = new Vector(1, 2)
  const v3 = new Vector(2, 1)
  t.ok(v1.equals(v2))
  t.notOk(v2.equals(v3))
  t.end()
})

test('Vector#dir should reduce a Vector to a cardinal direction', t => {
  const v1 = new Vector(4, -8)
  const v2 = new Vector(0, 1)
  t.deepEqual(v1.dir(), new Vector(1, -1))
  t.deepEqual(v2.dir(), new Vector(0, 1))
  t.end()
})

test('Vector#map should apply a function to each coordinate', t => {
  const v = new Vector(5, 12)
  const f = n => n * n
  t.deepEqual(v.map(f), new Vector(25, 144))
  t.end()
})

test('Vector#compare should determine ordinality between two Vectors', t => {
  const v1 = new Vector(2, 4)
  const v2 = new Vector(8, -3)
  t.equal(v1.compare(v2), 1)
  t.equal(v2.compare(v1), -1)

  const v3 = new Vector(4, 6)
  const v4 = new Vector(8, 2)
  t.equal(v3.compare(v4), 0)
  t.equal(v4.compare(v3), 0)

  t.end()
})
