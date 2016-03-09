import 'babel-polyfill'
import yaml from 'js-yaml'

import parseConfig from './configParser'

const EXAMPLE_URL = 'example.yml'
const TIMEOUT = 450

function animateWorld(world, canvas) {
  const step = () => {
    canvas.innerHTML = world.toString()
    world.turn()
  }

  return window.setInterval(step, TIMEOUT)
}

window.onload = () => {
  const doc = window.document
  const canvas = doc.getElementById('ecosystem')
  if (!canvas) return

  let animation

  const xhr = new XMLHttpRequest()

  xhr.onload = () => {
    const config = yaml.safeLoad(xhr.responseText)
    const world = parseConfig(config)
    animation = animateWorld(world, canvas)
  }

  xhr.onerror = () => {
    throw new Error(`Failed to load ${EXAMPLE_URL}: ${xhr.status}`)
  }

  xhr.open('get', EXAMPLE_URL, true)
  xhr.send()

  doc.getElementById('submit-file').onclick = () => {
    const reader = new FileReader()
    reader.onload = event => {
      const contents = event.target.result
      const config = yaml.safeLoad(contents)
      const world = parseConfig(config)
      clearInterval(animation)
      animation = animateWorld(world, canvas)
    }

    const file = doc.getElementById('select-file').files[0]
    reader.readAsText(file)
  }
}
