import { atom, atomList } from '../../ripple'

export interface IPost {
  id: number
  userId: number
  title: string
  body: string
}

export const postAtom = atom<IPost>(() =>
  fetch('http://jsonplaceholder.typicode.com/posts/1').then((res) => (res.ok ? res.json() : ({} as any))),
)
export const postListLoadingAtom = atom(true)
export const postListAtom = atomList<IPost>(() =>
  fetch('http://jsonplaceholder.typicode.com/posts').then((res) => (res.ok ? res.json() : [])),
)
