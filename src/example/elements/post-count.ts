import { html, component } from 'haunted'
import { postListCountAtom } from '../atoms/post'
import { useAtomRef } from '../../ripple'

function PostCount() {
  const count = useAtomRef(postListCountAtom)

  console.log({ postCount: count })

  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
    </style>
    <span>Post Count: ${count}</span>
  `
}

customElements.define('r-post-count', component<any>(PostCount))
