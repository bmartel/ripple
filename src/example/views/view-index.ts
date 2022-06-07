import { html, component } from 'haunted'
import { useAtom } from '../../ripple'
import { showPostsAtom } from '../atoms/post'

import '../elements/post-list'
import '../elements/todo-list'

function ViewIndex() {
  const [showPosts] = useAtom(showPostsAtom)

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
    ${showPosts ? html`<r-post-list></r-post-list>` : ''}
  `
}

customElements.define('view-index', component<any>(ViewIndex))
