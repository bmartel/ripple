import { atom, atomList } from '../../ripple'

export interface ITodo {
  id: string
  title: string
  content: string
  completedAt: number
}

export const todoAtom = atom<ITodo>({
  id: '1',
  title: 'Vite + Haunted',
  content: '',
  completedAt: 0,
})

export const todoListAtom = atomList<ITodo>([
  {
    id: '1',
    title: 'Vite + Haunted',
    content: '',
    completedAt: 0,
  },
  {
    id: '2',
    title: 'Works!',
    content: '',
    completedAt: 0,
  },
])
