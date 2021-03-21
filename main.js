// full d3 library is 266.6k (gzipped: 86.5.k)
// import * as d3 from 'd3'
import * as d3Geo from 'd3-geo'
// d3-selection is 13.4k (gzipped: 4.2k)
// we only used it for d3.pointer(event, $canvas)
// import * as d3Selection from 'd3-selection'
import * as d3Polygon from 'd3-polygon'
import * as topojson from 'topojson'

import './style.css'

const MAP_URL = `https://unpkg.com/world-atlas@1/world/110m.json`
const COUNTRIES_URL = `https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv`

const d3 = {
  ...d3Geo,
  ...d3Polygon,
}

// from
// https://codepen.io/jorin/pen/YNajXZ

//
// Configuration
//

// colors
let STROKE_COLOR
let FILL_COLOR
let SELECTED_FILL_COLOR

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
let currentCountry

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
  // projection
  //   .scale(
  //     (scaleFactor * Math.min(width * PIXEL_RATIO, height * PIXEL_RATIO)) / 2,
  //   )
  //   .translate([(width * PIXEL_RATIO) / 2, (height * PIXEL_RATIO) / 2])
  projection
    .scale((width * PIXEL_RATIO) / Math.PI / 2)
    .translate([(width * PIXEL_RATIO) / 2, (height * PIXEL_RATIO) / 1.55])
  render()
}

function render() {
  context.clearRect(0, 0, width, height)
  for (let country of countries.features) {
    fill(country, FILL_COLOR)
    stroke(country, STROKE_COLOR)
  }
  if (currentCountry) {
    fill(currentCountry, SELECTED_FILL_COLOR)
    stroke(currentCountry, SELECTED_FILL_COLOR)
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
  // get relative coordinates
  const rect = $canvas.getBoundingClientRect()
  const pointerCoords = [event.clientX - rect.left, event.clientY - rect.top]
  // take in account PIXEL_RATIO
  const adjustedCoords = pointerCoords.map((coord) => coord * PIXEL_RATIO)
  const pos = projection.invert(adjustedCoords)
  return countries.features.find((f) => {
    return f.geometry.coordinates.find((c1) => {
      return (
        d3.polygonContains(c1, pos) ||
        c1.find((c2) => d3.polygonContains(c2, pos))
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

function getColors() {
  const computedStyles = getComputedStyle(document.documentElement)
  STROKE_COLOR = computedStyles.getPropertyValue(`--stroke-color`)
  FILL_COLOR = computedStyles.getPropertyValue(`--fill-color`)
  SELECTED_FILL_COLOR = computedStyles.getPropertyValue(`--selected-fill-color`)
}

export default async function init() {
  await loadData()
  getColors()
  const resizeObserver = new ResizeObserver(scale)
  resizeObserver.observe($canvas)
  $canvas.addEventListener(`mousemove`, mousemove)
  scale()
}

init()
