import { html, component } from 'haunted'
import { useAtom } from '../../ripple'

import { todoAtom } from '../atoms/todo'
import '../elements/todo'

function ViewIndex() {
  const [todo] = useAtom(todoAtom)

  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
      }
    </style>

    <h1 id="title">${todo.title}</h1>
    <r-todo></r-todo>
  `
}

customElements.define('view-index', component<any>(ViewIndex))
