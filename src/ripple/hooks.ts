import { useEffect, useMemo, useRef, useState } from 'haunted'
import {
  atom,
  Atom,
  atomGet,
  atomGetValue,
  AtomList,
  AtomListSnapshot,
  AtomListUpdate,
  AtomReducer,
  atomSet,
  AtomUpdate,
  AtomValue,
  DependentsId,
  HistoryId,
  Keys,
  LastId,
  MapperId,
  ReconcileId,
  VersionId,
} from './atom'

export const useAtom = <T, A extends Atom<T>>(
  _atom: A,
  reducer?: AtomReducer<typeof _atom>,
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
      let next: AtomValue<typeof _atom>

      let _current = atomGet(_atom) as typeof _atom
      if (!_current) return

      if (typeof u === 'function') {
        next = (u as any)(_current)
      } else {
        next = u
      }
      if (next !== _current[Keys.Value]) {
        _current[HistoryId].add({ [Keys.Value]: next, [Keys.Version]: ++_current[VersionId] })
        if (_current[ReconcileId]) clearTimeout(_current[ReconcileId])
        _current[ReconcileId] = setTimeout(() => {
          _current = atomGet(_atom) as typeof _atom
          if (!_current) return
          const update = reducer
            ? Array.from(_current[HistoryId]).reduce(reducer as any, {
                [Keys.Value]: _current[Keys.Value],
                [Keys.Version]: _current[Keys.Version],
              })
            : _current[HistoryId][LastId]
          if (update) {
            _current[HistoryId].clear()
            _current[Keys.Value] = update[Keys.Value]
            _current[Keys.Version] = update[Keys.Version]
            atomSet(_atom, _current)
            if (process.env.NODE_ENV !== 'production') {
              //
            }
            for (const dependent of _current[DependentsId]) {
              dependent[Keys.Read]()
            }
          }
        }, 0)
        atomSet(_atom, _current)
      }
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    const _current = atomGet(_atom) as typeof _atom
    _current?.[DependentsId]?.add(readAtomState)
    atomSet(_atom, _current)
    return () => {
      const _current = atomGet(_atom) as typeof _atom
      _current?.[DependentsId]?.delete(readAtomState)
      atomSet(_atom, _current)
    }
  }, [_atom])

  return [atomValue, writeAtomState]
}

export const useAtomList = <T, L extends AtomList<T>>(
  _atomList: L,
  hydrateList = false,
): [
  string[] | typeof _atomList[Keys.ListValue]['id'][Keys.Value][],
  AtomListUpdate<AtomListSnapshot<string[], typeof _atomList[Keys.ListValue]['id'][Keys.Value][]>>,
] => {
  const [atomListValue, setAtomListValue] = useState(() =>
    hydrateList
      ? atomGetValue(_atomList as any)?.map(
          (key: string) => atomGet((atomGet(_atomList) as AtomList)?.[Keys.ListValue]?.[key] as any)?.[Keys.Value],
        )
      : (atomGet(_atomList) as AtomList)?.[Keys.Value] || [],
  )

  const readListAtomState = useMemo(
    () => ({
      [Keys.Read]: () =>
        setAtomListValue(
          hydrateList
            ? atomGetValue(_atomList as any)?.map(
                (key: string) =>
                  atomGet((atomGet(_atomList) as AtomList)?.[Keys.ListValue]?.[key] as any)?.[Keys.Value],
              )
            : (atomGet(_atomList) as AtomList)?.[Keys.Value] || [],
        ),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomListState = useMemo<
    AtomListUpdate<AtomListSnapshot<string[], typeof _atomList[Keys.ListValue]['id'][Keys.Value][]>>
  >(
    () => (u) => {
      let next: typeof _atomList[Keys.ListValue]['id'][Keys.Value][]

      let _current = atomGet(_atomList) as typeof _atomList
      if (!_current) return

      if (typeof u === 'function') {
        next = (u as any)(
          _current?.[Keys.Value]?.map(
            (key) => atomGet((atomGet(_atomList) as AtomList)?.[Keys.ListValue]?.[key])?.[Keys.Value],
          ) || [],
        )
      } else {
        next = u
      }

      next = next.map((v) => {
        const id = _current[MapperId](v)
        if (!(id in _current[Keys.ListValue])) {
          ;(_current[Keys.ListValue][id] as any) = atom(v)
        }
        return [id, v]
      }) as any

      _current[HistoryId].add({
        [Keys.Value]: next as any,
        [Keys.Version]: ++_current[VersionId],
      })
      if (_current[ReconcileId]) clearTimeout(_current[ReconcileId])
      _current[ReconcileId] = setTimeout(() => {
        _current = atomGet(_atomList) as typeof _atomList
        if (!_current) return
        const update = _current[HistoryId][LastId]
        if (update) {
          _current[HistoryId].clear()
          _current[Keys.Value] = update[Keys.Value].map(([id, v]) => {
            const _currentAtom = atomGet(_current[Keys.ListValue][id] as any) as any
            _currentAtom[Keys.Version] = update[Keys.Version]
            _currentAtom[Keys.Value] = v
            const deps = (_currentAtom as AtomList)?.[DependentsId]
            for (const dependent of deps) {
              dependent[Keys.Read]()
            }
            return id
          })
          _current[Keys.Version] = update[Keys.Version]
          atomSet(_atomList, _current)
          if (process.env.NODE_ENV !== 'production') {
            //
          }
          for (const dependent of _current[DependentsId]) {
            dependent[Keys.Read]()
          }
        }
      }, 0)
      atomSet(_atomList, _current)
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    const _current = atomGet(_atomList) as typeof _atomList
    _current[DependentsId].add(readListAtomState)
    atomSet(_atomList, _current)
    return () => {
      const _current = atomGet(_atomList) as typeof _atomList
      _current[DependentsId].delete(readListAtomState)
      atomSet(_atomList, _current)
    }
  }, [_atomList])

  return [atomListValue, writeAtomListState]
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
