import * as d3 from 'd3'
import * as topojson from 'topojson'

import './style.css'

const MAP_URL = `https://unpkg.com/world-atlas@1/world/110m.json`
const COUNTRIES_URL = `https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv`

//
// Configuration
//

// scale of the map (not the canvas element)
const scaleFactor = 0.6
// colors
const STROKE_COLOR = `#ccc`
const colorCountry = '#a00'

//
// Variables
//

const PIXEL_RATIO = window.devicePixelRatio || 1
const $countryName = document.querySelector(`#current`)
const $wrapper = document.querySelector(`.map`)
const $canvas = $wrapper.querySelector(`canvas`)
const context = $canvas.getContext(`2d`)
const projection = d3.geoMercator().precision(0.1)
const path = d3.geoPath(projection).context(context)
let width, height
let countries
let countryList
var currentCountry

context.scale(PIXEL_RATIO, PIXEL_RATIO)

//
// Handler
//

function enter(country) {
  var country = countryList.find(function (c) {
    return parseInt(c.id, 10) === parseInt(country.id, 10)
  })
  $countryName.textContent = (country && country.name) || ``
}

function leave(country) {
  $countryName.textContent = ``
}

//
// Functions
//

function scale() {
  console.log(`scale`)
  const boundingBox = $wrapper.getBoundingClientRect()
  width = boundingBox.width
  height = boundingBox.height
  $canvas.setAttribute(`width`, width * PIXEL_RATIO)
  $canvas.setAttribute(`height`, height * PIXEL_RATIO)
  projection
    .scale(
      (scaleFactor * Math.min(width * PIXEL_RATIO, height * PIXEL_RATIO)) / 2,
    )
    .translate([(width * PIXEL_RATIO) / 2, (height * PIXEL_RATIO) / 2])
  render()
}

function render() {
  context.clearRect(0, 0, width, height)
  for (let country of countries.features) {
    fill(country, `#fff`)
    stroke(country, STROKE_COLOR)
  }
  if (currentCountry) {
    fill(currentCountry, colorCountry)
  }
}

function fill(obj, color) {
  context.beginPath()
  path(obj)
  context.fillStyle = color
  context.fill()
}

function stroke(obj, color) {
  context.beginPath()
  path(obj)
  context.strokeStyle = color
  context.stroke()
}

// https://github.com/d3/d3-polygon
function polygonContains(polygon, point) {
  var n = polygon.length
  var p = polygon[n - 1]
  var x = point[0],
    y = point[1]
  var x0 = p[0],
    y0 = p[1]
  var x1, y1
  var inside = false
  for (var i = 0; i < n; ++i) {
    ;(p = polygon[i]), (x1 = p[0]), (y1 = p[1])
    if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1)
      inside = !inside
    ;(x0 = x1), (y0 = y1)
  }
  return inside
}

function mousemove(event) {
  var c = getCountry(event)
  if (!c) {
    if (currentCountry) {
      leave(currentCountry)
      currentCountry = undefined
      render()
    }
    return
  }
  if (c === currentCountry) return
  currentCountry = c
  render()
  enter(c)
}

function getCountry(event) {
  const pointerCoords = d3.pointer(event, $canvas)
  const adjustedCoords = pointerCoords.map((coord) => coord * PIXEL_RATIO)
  const pos = projection.invert(adjustedCoords)
  return countries.features.find((f) => {
    return f.geometry.coordinates.find((c1) => {
      return (
        polygonContains(c1, pos) ||
        c1.find(function (c2) {
          return polygonContains(c2, pos)
        })
      )
    })
  })
}

//
// Initialization
//

async function loadData() {
  const [mapResponse, countriesResponse] = await Promise.all([
    fetch(MAP_URL),
    fetch(COUNTRIES_URL),
  ])
  const [world, rawCountriesList] = await Promise.all([
    mapResponse.json(),
    countriesResponse.text(),
  ])
  countries = topojson.feature(world, world.objects.countries)
  countryList = rawCountriesList
    .split(`\n`)
    .map((line) => {
      const [id, name] = line.trim().split(`\t`)
      return { id, name }
    })
    .slice(1)
}

export default async function init() {
  await loadData()
  $canvas.addEventListener(`mousemove`, mousemove)
  window.addEventListener(`resize`, scale)
  scale()
}

init()
