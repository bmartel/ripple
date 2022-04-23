import { html, component, useEffect } from 'haunted'
import { repeat } from 'lit-html/directives/repeat.js'
import { todoListAtom } from '../atoms/todo'
import { useAtomList } from '../../ripple'
import './todo'

function TodoList() {
  const [todos, setTodos] = useAtomList(todoListAtom, true)

  useEffect(() => {
    setTimeout(() => {
      setTodos([{ id: '1', title: 'That works?', content: '', completedAt: Date.now() }])
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
          (t: any) => t?.id,
          (t: any) => html`<r-todo .todoId=${t?.id}></r-todo>`,
        )
      : ''}
  `
}

customElements.define('r-todo-list', component<any>(TodoList))
