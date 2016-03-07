import parseConfig from './configParser'

function animateWorld(world, canvas, timeout) {
  const step = () => {
    canvas.innerHTML = world.toString()
    world.turn()
  }

  window.setInterval(step, timeout)
}

window.onload = () => {
  const canvas = window.document.querySelector('#ecosystem')
  if (!canvas) return

  const xhr = new XMLHttpRequest()
  const url = 'example.json'

  xhr.onload = () => {
    const json = JSON.parse(xhr.responseText)
    const { timeout, world } = parseConfig(json)
    world.randomize()
    animateWorld(world, canvas, timeout)
  }

  xhr.onerror = () => {
    throw new Error(`Failed to load ${url}: ${xhr.status}`)
  }

  xhr.open('get', url, true)
  xhr.send()
}
