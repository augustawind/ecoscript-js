import random from 'lodash/random'

import parseWorld from './configParser'

function randomizeWorld(world) {
  for (const [_, thing] of world.enumerate()) {
    if (thing && 'energy' in thing) {
      thing.energy = random(thing.baseEnergy, thing.maxEnergy)
    }
  }
}

function animateWorld(world) {
  const doc = window.document

  const canvas = doc.createElement('pre')
  doc.body.appendChild(canvas)

  const step = () => {
    canvas.innerHTML = world.toString()
    world.turn()
  }
  window.setInterval(step, 500)
}

window.onload = () => {
  const xhr = new XMLHttpRequest()
  const url = 'example.json'

  xhr.onload = () => {
    const json = JSON.parse(xhr.responseText)
    const world = parseWorld(json)
    randomizeWorld(world)
    animateWorld(world)
  }

  xhr.onerror = () => {
    throw new Error(`Failed to load ${url}: ${xhr.status}`)
  }

  xhr.open('get', url, true)
  xhr.send()
}
