import { atom } from '../../ripple'

interface ITodo {
  title: string
  content: string
  completedAt: number
}

export const todoAtom = atom<ITodo>({
  title: 'Vite + Haunted',
  content: '',
  completedAt: 0,
})
