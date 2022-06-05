import { atomEffect } from '../../ripple/atom'
import { postListAtom, postListLoadingAtom } from '../atoms/post'

export const postListLoadingEffect = atomEffect((get, set) => {
  get(postListAtom) // Whenever postListAtom changes, even if the next result would be empty
  set(postListLoadingAtom, false) // Set the postListLoading false
})
