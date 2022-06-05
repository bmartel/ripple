import { html, component } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { IPost, postListAtom, postListLoadingAtom } from '../atoms/post'
import { useAtom, useAtomList, useAtomEffect } from '../../ripple'
import { postListLoadingEffect } from '../effects/post'

function PostList() {
  const [posts] = useAtomList(postListAtom, { hydrateList: true })
  const [loading] = useAtom(postListLoadingAtom)

  useAtomEffect(postListLoadingEffect) // NOTE: this is contrived, you wouldn't have to do this for loading tracking per list atom

  console.log({ posts, loading })

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
