# Ripple

Atom based state management for [Haunted](https://github.com/matthewp/haunted) web components, heavily inspired by the [Jotai](https://github.com/pmndrs/jotai) project.

**Note** _Due to some React specific implementations that do not overlap with Haunted, this project is required. It is possible in the future that this project may not be required if the internals of Jotai use only React apis that can be aliased by Haunted._

## Installation

```bash
npm i ripple haunted
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
