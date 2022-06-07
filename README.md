# Ripple

Atom based state management for [Haunted](https://github.com/matthewp/haunted) web components, heavily inspired by the [Jotai](https://github.com/pmndrs/jotai) project.

**Note** _Due to some React specific implementations that do not overlap with Haunted, this project is required. It is possible in the future that this project may not be required if the internals of Jotai use only React apis that can be aliased by Haunted._

## Installation

```bash
npm i @martel/ripple haunted
```

## Define an atom

```ts
import { atom } from '@martel/ripple'

export const countAtom = atom(0)
```

## Use the atom

```ts
import { component, html } from 'haunted'
import { useAtom } from '@martel/ripple'

function Counter() {
  const [count, setCount] = useAtom(countAtom)

  return html`
    <div id="count">${count}</div>
    <button type="button" @click=${() => setCount(count + 1)}>Increment</button>
  `
}

customElements.define('my-counter', component(Counter))
```

## Define an atomList

```ts
import { atomList } from '@martel/ripple'

export interface IPost {
  id: number
  userId: number
  title: string
  body: string
}

export const postsAtom = atomList<IPost>([
  {id: 1, userId: 1, body: 'foo', title: 'bar'},
  {id: 2, userId: 1, body: 'baz', title: 'bar'},
])
```

## Use the atomList

```ts
import { component, html } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { useAtomList } from '@martel/ripple'

function PostList() {
  const [posts] = useAtomList(postsAtom, { hydrateList: true }) // Load list of IPost[], not string[]
  
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

customElements.define('my-posts', component(PostList))
```

## Define an effect

```ts
import { atomList, atomEffect } from '@martel/ripple'

export interface IPost {
  id: number
  userId: number
  title: string
  body: string
}

export const postsAtom = atomList<IPost>([])

export const postsLoadEffect = atomEffect(async (get, set) => {
  const posts = await fetch('http://jsonplaceholder.typicode.com/posts').then((res) => (res.ok ? res.json() : []))
  set(postsAtom, posts)
})
```

## Use the effect

```ts
import { component, html } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { useAtomList, useAtomEffect } from '@martel/ripple'

function PostList() {
  const [posts] = useAtomList(postsAtom, { hydrateList: true }) // Load list of IPost[], not string[]
  
  useAtomEffect(postsLoadEffect) // Handle async fetching
  
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

customElements.define('my-posts', component(PostList))
```
