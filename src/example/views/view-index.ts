import { html, component } from 'haunted'
import { initAtomStorage, useAtom } from '../../ripple'
import { showPostsAtom } from '../atoms/content'

import '../elements/todo-list'

initAtomStorage({ version: 1 }, ['posts'])

function ViewIndex() {
  const [showPosts] = useAtom(showPostsAtom)

  if (showPosts) {
    import('../elements/post-list')
  }

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
