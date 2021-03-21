fetch(`/web-components/navigation/navigation.html`)
  .then((stream) => stream.text())
  .then((text) => define(text))

function define(html) {
  class MapNavigation extends HTMLElement {
    constructor() {
      super()
      const shadow = this.attachShadow({ mode: `open` })
      shadow.innerHTML = html
    }
  }

  customElements.define(`map-navigation`, MapNavigation)
}
