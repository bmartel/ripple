import { html, component } from 'haunted'
import { todoAtom } from '../atoms/todo'
import { useAtom } from '../../ripple'

function Todo() {
  const [todo, setTodo] = useAtom(todoAtom)

  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
    </style>
    <header></header>
    <form>
      <input
        name="title"
        .value=${todo.title}
        @input=${(e: Event) => setTodo((prev) => ({ ...prev, title: (e.target as HTMLInputElement)?.value || '' }))}
      />
    </form>
  `
}

customElements.define('r-todo', component<any>(Todo))
