import { html, component } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { IPost, postListAtom } from '../atoms/post'
import { useAtomList } from '../../ripple'

function PostList() {
  const [posts] = useAtomList(postListAtom, { hydrateList: true })

  console.log({ posts })
  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
    </style>
    ${posts
      ? repeat(
          posts as IPost[],
          (p) => p.id,
          (p) => html`<p>${p.body}</p>`,
        )
      : ''}
  `
}

customElements.define('r-post-list', component<any>(PostList))
