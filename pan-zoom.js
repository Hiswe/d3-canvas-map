import * as d3Geo from 'd3-geo'
import * as d3Polygon from 'd3-polygon'
import * as d3Selection from 'd3-selection'
import * as d3Zoom from 'd3-zoom'
import * as d3Transition from 'd3-transition'

import './style.css'

// We followed this example for getting the data
// https://www.d3-graph-gallery.com/graph/backgroundmap_basic.html
const MAP_URL = `https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson`

const d3 = {
  ...d3Geo,
  ...d3Polygon,
  ...d3Selection,
  ...d3Zoom,
  ...d3Transition,
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
const $countryName = document.querySelector(`.map__country-name`)
const $wrapper = document.querySelector(`.map`)
const $canvas = $wrapper.querySelector(`canvas`)
const context = $canvas.getContext(`2d`)
const projection = d3.geoMercator().precision(0.1)
const path = d3.geoPath(projection).context(context)
const zoom = d3.zoom().scaleExtent([1, 8]).on(`zoom`, zoomed)
let width, height
let countries
let currentCountry

context.scale(PIXEL_RATIO, PIXEL_RATIO)

//
// Handler
//

function enter(country) {
  $countryName.textContent = country.properties?.name ?? ``
}

function leave() {
  $countryName.textContent = ``
}

//
// Functions
//

function scale() {
  const boundingBox = $wrapper.getBoundingClientRect()
  width = boundingBox.width
  height = boundingBox.height
  $canvas.setAttribute(`width`, width * PIXEL_RATIO)
  $canvas.setAttribute(`height`, height * PIXEL_RATIO)
  projection
    .scale((width * PIXEL_RATIO) / Math.PI / 2)
    .translate([(width * PIXEL_RATIO) / 2, (height * PIXEL_RATIO) / 1.55])
  render()
}

function render() {
  cleanCanvas()
  drawCountries()
}

function drawCountries() {
  for (let country of countries.features) {
    fill(country, FILL_COLOR)
    stroke(country, STROKE_COLOR)
  }
  if (currentCountry) {
    fill(currentCountry, SELECTED_FILL_COLOR)
    stroke(currentCountry, SELECTED_FILL_COLOR, 2)
  }
}

function fill(obj, color) {
  context.beginPath()
  path(obj)
  context.fillStyle = color
  context.fill()
}

function stroke(obj, color, width = 1) {
  context.lineWidth = width
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

// https://stackoverflow.com/a/6722031
function cleanCanvas() {
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, width * PIXEL_RATIO, height * PIXEL_RATIO)
  context.restore()
}

function zoomed(event) {
  const { transform } = event
  cleanCanvas()
  context.save()
  context.translate(transform.x, transform.y)
  context.scale(transform.k, transform.k)
  drawCountries()
  context.restore()
}

//
// Initialization
//

function getColors() {
  const computedStyles = getComputedStyle(document.documentElement)
  STROKE_COLOR = computedStyles.getPropertyValue(`--stroke-color`)
  FILL_COLOR = computedStyles.getPropertyValue(`--fill-color`)
  SELECTED_FILL_COLOR = computedStyles.getPropertyValue(`--selected-fill-color`)
}

export default async function init() {
  countries = await fetch(MAP_URL).then((res) => res.json())
  getColors()
  const resizeObserver = new ResizeObserver(scale)
  resizeObserver.observe($canvas)
  d3.select(`.map__canvas`).call(zoom).on(`dblclick.zoom`, null)
  scale()
}

init()
