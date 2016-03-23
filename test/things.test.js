import test from 'tape'

import ts from '../src/things'
import { World, Vector } from '../src/world'

test('things.Grow', t => {
  const thing = ts.Grow({ energy: 5, growthRate: 4 })
  thing.grow()
  t.equals(thing.energy, 9, 'should increase its energy by its growthRate')
  t.end()
})

test('things.Eat', t => {
  const pred = ts.Eat({ diet: ['prey'], energy: 5 })
  const prey1 = { species: 'prey', energy: 4, baseEnergy: 3 }
  const world = new World([[pred, prey1]])

  pred.eat(world, new Vector(0, 0))
  t.equals(world.get(new Vector(1, 0)), null,
           'should remove the eaten from the world')
  t.equals(prey1.energy, 0,
          'should set the eatens energy to 0')
  t.equals(pred.energy, 9,
          'should increase the eaters energy by the eatens energy')

  const prey2 = { species: 'prey', energy: 4, baseEnergy: 5 }
  world.set(new Vector(1, 0), prey2)
  pred.eat(world, new Vector(0, 0))
  t.equals(pred.energy, 14,
          'should increase the eaters energy by eatens baseEnergy if higher')
  t.end()
})

test('things.Metabolize')
test('things.Wander')
test('things.Go')
test('things.AvoidPredators')
test('things.Herd')
test('things.Hunt')
test('things.Organism#pass')
test('things.Organism#reproduce')
test('things.Plant#preAct')
test('things.Animal#preAct')
