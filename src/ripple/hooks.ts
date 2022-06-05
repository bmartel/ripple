import { useEffect, useMemo, useRef, useState } from 'haunted'
import {
  Atom,
  atomGet,
  atomGetValue,
  atomSubscribe,
  atomUnsubscribe,
  atomWriteList,
  AtomList,
  AtomListSnapshot,
  AtomListUpdate,
  AtomUpdate,
  AtomValue,
  Keys,
  Read,
  atomWrite,
  AtomWriteConfig,
  atomListGetValue,
  atomListGetListValue,
  AtomEffect,
  AtomRef,
} from './atom'

export type UseAtomConfig<T extends Atom> = AtomWriteConfig<T>
export const useAtom = <T, A extends Atom<T>>(
  _atom: A,
  { reducer } = {} as UseAtomConfig<typeof _atom>,
): [AtomValue<typeof _atom>, AtomUpdate<typeof _atom>] => {
  const [atomValue, setAtomValue] = useState(() => atomGetValue(_atom as any) as unknown as typeof _atom[Keys.Value])

  const readAtomState = useMemo(
    () => ({
      [Keys.Read]: () => setAtomValue(atomGetValue(_atom as any) as unknown as typeof _atom[Keys.Value]),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomState = useMemo<AtomUpdate<typeof _atom>>(
    () => (u) => {
      atomWrite(_atom, u, { reducer })
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    atomSubscribe(_atom, readAtomState as Read<typeof _atom>)
    return () => {
      atomUnsubscribe(_atom, readAtomState as Read<typeof _atom>)
    }
  }, [_atom])

  return [atomValue, writeAtomState]
}

export type UseAtomListConfig = {
  hydrateList: boolean
}
export const useAtomList = <T, L extends AtomList<T>>(
  _atomList: L,
  { hydrateList = false } = {} as UseAtomListConfig,
): [
  string[] | typeof _atomList[Keys.ListValue]['id'][Keys.Value][],
  AtomListUpdate<AtomListSnapshot<string[], typeof _atomList[Keys.ListValue]['id'][Keys.Value][]>>,
] => {
  const [atomListValue, setAtomListValue] = useState(() =>
    hydrateList ? atomListGetListValue(_atomList as AtomList) : atomListGetValue(_atomList as AtomList),
  )

  const readListAtomState = useMemo(
    () => ({
      [Keys.Read]: () =>
        setAtomListValue(
          hydrateList ? atomListGetListValue(_atomList as AtomList) : atomListGetValue(_atomList as AtomList),
        ),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomListState = useMemo<
    AtomListUpdate<AtomListSnapshot<string[], typeof _atomList[Keys.ListValue]['id'][Keys.Value][]>>
  >(
    () => (u) => {
      atomWriteList(_atomList, u)
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    atomSubscribe(_atomList, readListAtomState as Read<typeof _atomList>)
    return () => {
      atomUnsubscribe(_atomList, readListAtomState as Read<typeof _atomList>)
    }
  }, [_atomList])

  return [atomListValue as any, writeAtomListState]
}

export const useAtomSelector = <T, L extends AtomList<T>>(
  atomList: L,
  id: string,
): [AtomValue<typeof atomList[Keys.ListValue][typeof id]>, AtomUpdate<typeof atomList[Keys.ListValue][typeof id]>] => {
  const atomRef = useRef<typeof atomList[Keys.ListValue][typeof id]>(undefined as any)
  if (!atomRef.current) {
    atomRef.current = (atomGet(atomList) as typeof atomList)?.[Keys.ListValue]?.[id] as any
  }
  return useAtom(atomRef.current) as any
}

export const useAtomEffect = (atomEffect: AtomEffect): void => {
  useEffect(() => {
    const stop = atomEffect() // executor function starts the effects, and returns a stop function
    return stop
  }, [atomEffect])
}

export const useAtomRef = <T = any>(atomRef: AtomRef): T | undefined => {
  const [, update] = useState()
  const notify = () => update({})
  const ref = useRef(undefined as any)
  if (!ref.current) {
    ref.current = atomRef(notify)
  }

  useEffect(() => {
    const { start, stop } = ref.current
    start()
    return stop
  }, [])

  return ref.current?.value?.()
}
