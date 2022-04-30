import { html, component, useEffect } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { todoListAtom } from '../atoms/todo'
import { useAtomList } from '../../ripple'
import './todo'

function TodoList() {
  const [todos, setTodos] = useAtomList(todoListAtom)

  useEffect(() => {
    setTimeout(() => {
      setTodos((prev) => {
        const update = prev.find(({ id }) => id === '1')
        if (update) {
          update.title = 'That works?'
          update.completedAt = Date.now()
        }
        prev.splice(1)

        console.log({ prev })
        return prev
      })
    }, 1500)
  }, [])

  console.log({ todos })
  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
    </style>
    ${todos
      ? repeat(
          todos as any,
          (t: any) => t,
          (t: any) => html`<r-todo .todoId=${t}></r-todo>`,
        )
      : ''}
  `
}

customElements.define('r-todo-list', component<any>(TodoList))
