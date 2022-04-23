import { html, component } from 'haunted'

import '../elements/todo-list'

function ViewIndex() {
  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
      }
    </style>

    <h1 id="title">Vite + Haunted</h1>
    <r-todo-list></r-todo-list>
  `
}

customElements.define('view-index', component<any>(ViewIndex))
