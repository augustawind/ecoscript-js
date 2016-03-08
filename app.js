import yaml from 'js-yaml'

import parseConfig from './configParser'

const EXAMPLE_URL = 'example.yml'
const TIMEOUT = 450

function animateWorld(world, canvas) {
  const step = () => {
    canvas.innerHTML = world.toString()
    world.turn()
  }

  window.setInterval(step, TIMEOUT)
}

window.onload = () => {
  const canvas = window.document.querySelector('#ecosystem')
  if (!canvas) return

  const xhr = new XMLHttpRequest()

  xhr.onload = () => {
    const config = yaml.safeLoad(xhr.responseText)
    const world = parseConfig(config)
    world.randomize()
    animateWorld(world, canvas)
  }

  xhr.onerror = () => {
    throw new Error(`Failed to load ${EXAMPLE_URL}: ${xhr.status}`)
  }

  xhr.open('get', EXAMPLE_URL, true)
  xhr.send()
}
