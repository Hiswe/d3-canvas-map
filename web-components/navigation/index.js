// https://stackoverflow.com/questions/55080103/how-to-separate-web-components-to-individual-files-and-load-them
// single file component alternative
// https://ckeditor.com/blog/implementing-single-file-web-components/

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
