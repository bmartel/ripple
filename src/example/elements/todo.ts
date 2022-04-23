import { html, component } from 'haunted'
import { useAtomSelector } from '../../ripple'
import { todoListAtom } from '../atoms/todo'

interface TodoProps extends Element {
  todoId: string
}

function Todo({ todoId }: TodoProps) {
  const [todo, setTodo] = useAtomSelector(todoListAtom, todoId)

  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
    </style>
    <header>${todo.title}</header>
    <form>
      <input
        name="title"
        .value=${todo.title}
        @input=${(e: Event) => setTodo((prev) => ({ ...prev, title: (e.target as HTMLInputElement)?.value || '' }))}
      />
    </form>
  `
}

customElements.define('r-todo', component<TodoProps>(Todo))
