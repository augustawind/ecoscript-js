import 'babel-polyfill'
import ajax from 'ajax'
import yaml from 'js-yaml'

import parseWorld from './configParser'

const exampleURL = 'example.yml'
const interval = 450

function animateWorld(world, canvas) {
  const step = () => {
    canvas.innerHTML = world.toString()
    world.turn()
  }

  return window.setInterval(step, interval)
}

window.onload = () => {
  const settings = {
    error: (xhr, status, exception) => {
      console.log(status)
    }
  }

  const callback = data => {
    const config = yaml.safeLoad(data)
    const world = parseWorld(config)
    const canvas = window.document.getElementById('ecosystem')
    animateWorld(world, canvas)
  }

  ajax.get(exampleURL, settings, callback)
}
