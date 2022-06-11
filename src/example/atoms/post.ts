import { atom, atomList, atomRef } from '../../ripple'

export interface IPost {
  id: number
  userId: number
  title: string
  body: string
}

export const postListLoadingAtom = atom(true)
export const postListAtom = atomList<IPost>([], { storage: { key: 'r:posts' } })

export const postListCountAtom = atomRef<number>((get) => {
  console.log('called postListCountAtom')
  return get(postListAtom)?.length || 0
}, 0)
export const showPostCountAtom = atom(true)
