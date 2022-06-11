import { atomEffect, atomIsInit } from '../../ripple/atom'
import { postListAtom, postListLoadingAtom, showPostCountAtom } from '../atoms/post'
import { showPostsAtom } from '../atoms/content'

export const postListLoadingEffect = atomEffect(async (get, set) => {
  const postsLoaded = get(postListAtom)
  if (atomIsInit(postListAtom) && !postsLoaded.length) {
    const posts = await fetch('http://jsonplaceholder.typicode.com/posts').then((res) => (res.ok ? res.json() : []))
    set(postListAtom, posts)
  }

  const showPostCount = get(showPostCountAtom)
  const showPosts = get(showPostsAtom)
  get(postListAtom) // Whenever postListAtom changes, even if the next result would be empty
  set(postListLoadingAtom, false) // Set the postListLoading false
  if (showPostCount) {
    setTimeout(() => set(showPostCountAtom, false), 2000)
  }
  if (showPosts) {
    setTimeout(() => set(showPostsAtom, false), 3000)
  }
})
