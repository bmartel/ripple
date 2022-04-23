import { useEffect, useMemo, useRef, useState } from 'haunted'

export enum Keys {
  Value = '=',
  ListValue = '==',
  CommitVersion = '#',
  Read = '<',
  Write = '>',
  Update = '^',
  Current = '~',
}

const ReconcileId = Symbol('ripple.reconcileId')
const MapperId = Symbol('ripple.MapperId')
const LastId = Symbol('ripple.lastId')
const VersionId = Symbol('ripple.versionId')
const HistoryId = Symbol('ripple.historyId')
const DependentsId = Symbol('ripple.dependentsId')

type IdFunc = (v: any) => string
const defaultIdFunc: IdFunc = (v: any): string => v?.id

class CustomSet<T = any> extends Set<T> {
  [LastId]: T

  add(value: T) {
    super.add(value)
    this[LastId] = value
    return this
  }
}

export type Read<T = any> = {
  [Keys.Read]: () => T
}

export type Write<U = any> = ((u: U) => U) | U

export type AtomSnapshot<T = any> = {
  [Keys.Value]: T
  [Keys.CommitVersion]: number
}

export type Atom<T = any> = AtomSnapshot<T> & {
  [ReconcileId]: any
  [VersionId]: number
  [HistoryId]: CustomSet<AtomSnapshot<T>>
  [DependentsId]: CustomSet<Read>
}

export type AtomList<T = any> = Atom<string[]> & {
  [MapperId]: IdFunc
  [Keys.ListValue]: { [id: string]: Atom<T> }
}

export type AtomValue<V extends AtomSnapshot> = V[Keys.Value]
export type AtomUpdate<V extends AtomSnapshot> = (u: Write<V[Keys.Value]>) => void
export type AtomReducer<V extends AtomSnapshot> = (v: V, u: V) => V

const state = new WeakMap<Atom | AtomList, Atom | AtomList>()
const atomGet = <T = any>(atom: Atom<T> | AtomList<T>): Atom<T> | AtomList<T> | undefined => state.get(atom)
const atomSet = <T = any>(atom: Atom<T> | AtomList<T>, v: Atom<T> | AtomList<T>): void => {
  state.set(atom, v)
}

export const atomGetValue = <T extends AtomSnapshot>(atom: Atom<T> | AtomList<T>): AtomValue<T> | undefined =>
  state.get(atom)?.[Keys.Value]
export const atomSetValue = <T = any>(atom: Atom<T> | AtomList<T>, v: T): void => {
  const _current = atomGet<T>(atom)!
  _current[Keys.Value] = v
}

export const atom = <T = any>(value: T): Atom<T> => {
  const _atom = {
    [ReconcileId]: null,
    [HistoryId]: new CustomSet(),
    [DependentsId]: new CustomSet(),
    [VersionId]: 0,
    [Keys.Value]: value,
    [Keys.CommitVersion]: 0,
  }
  atomSet(_atom, _atom)
  return _atom
}

export const atomList = <T = any>(value: T[], idMapper: IdFunc = defaultIdFunc): AtomList<T> => {
  const atomListValue: AtomList<T>[Keys.ListValue] = {}

  const idList = value.map((v) => {
    const id = idMapper(v)
    if (!(id in atomListValue)) {
      atomListValue[id] = atom(v)
    }
    return id
  })

  const _atomList = atom(idList) as AtomList<T>

  _atomList[Keys.ListValue] = atomListValue
  _atomList[MapperId] = idMapper

  atomSet(_atomList, _atomList)

  return _atomList
}

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

      const _current = atomGet(_atom) as typeof _atom

      if (!_current) return

      if (typeof u === 'function') {
        next = (u as any)(_current)
      } else {
        next = u
      }
      if (next !== _current[Keys.Value]) {
        _current[HistoryId].add({ [Keys.Value]: next, [Keys.CommitVersion]: ++_current[VersionId] })
        if (_current[ReconcileId]) clearTimeout(_current[ReconcileId])
        _current[ReconcileId] = setTimeout(() => {
          const update = reducer
            ? Array.from(_current[HistoryId]).reduce(reducer as any, {
                [Keys.Value]: _current[Keys.Value],
                [Keys.CommitVersion]: _current[Keys.CommitVersion],
              })
            : _current[HistoryId][LastId]
          if (update) {
            _current[HistoryId].clear()
            _current[Keys.Value] = update[Keys.Value]
            _current[Keys.CommitVersion] = update[Keys.CommitVersion]

            if (process.env.NODE_ENV !== 'production') {
              console.log(JSON.parse(JSON.stringify(_atom)))
            }
            for (const dependent of _current[DependentsId]) {
              dependent[Keys.Read]()
            }
          }
        }, 0)
      }
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    const _current = atomGet(_atom) as typeof _atom
    _current?.[DependentsId]?.add(readAtomState)
    return () => {
      const _current = atomGet(_atom) as typeof _atom
      _current?.[DependentsId]?.delete(readAtomState)
    }
  }, [_atom])

  return [atomValue, writeAtomState]
}

export const useAtomList = <T, L extends AtomList<T>>(
  _atomList: L,
  hydrateList = false,
): [
  string[] | typeof _atomList[Keys.ListValue]['id'][Keys.Value][],
  (u: typeof _atomList[Keys.ListValue]['id'][Keys.Value][]) => void,
] => {
  const [atomListValue, setAtomListValue] = useState(() =>
    hydrateList
      ? atomGetValue(_atomList as any)?.map(
          (key: string) => (atomGet(_atomList) as AtomList)?.[Keys.ListValue]?.[key]?.[Keys.Value],
        )
      : (atomGet(_atomList) as AtomList)?.[Keys.Value] || [],
  )

  const readListAtomState = useMemo(
    () => ({
      [Keys.Read]: () =>
        setAtomListValue(
          hydrateList
            ? atomGetValue(_atomList as any)?.map(
                (key: string) => (atomGet(_atomList) as AtomList)?.[Keys.ListValue]?.[key]?.[Keys.Value],
              )
            : (atomGet(_atomList) as AtomList)?.[Keys.Value] || [],
        ),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomListState = useMemo<(u: typeof _atomList[Keys.ListValue]['id'][Keys.Value][]) => void>(
    () => (u) => {
      const _current = atomGet(_atomList) as typeof _atomList
      if (!_current) return

      const next = u.map((v) => {
        const id = _current[MapperId](v)
        if (!(id in _current[Keys.ListValue])) {
          _current[Keys.ListValue][id] = atom(v)
        }
        return [id, v]
      })
      _current[HistoryId].add({
        [Keys.Value]: next as any,
        [Keys.CommitVersion]: ++_current[VersionId],
      })
      if (_current[ReconcileId]) clearTimeout(_current[ReconcileId])
      _current[ReconcileId] = setTimeout(() => {
        const update = _current[HistoryId][LastId]
        if (update) {
          _current[HistoryId].clear()
          _current[Keys.Value] = update[Keys.Value].map(([id, v]) => {
            _current[Keys.ListValue][id][Keys.CommitVersion] = update[Keys.CommitVersion]
            _current[Keys.ListValue][id][Keys.Value] = v as any
            for (const dependent of _current[Keys.ListValue][id][DependentsId]) {
              dependent[Keys.Read]()
            }
            return id
          })
          _current[Keys.CommitVersion] = update[Keys.CommitVersion]
          if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.parse(JSON.stringify(_atomList)))
          }
          for (const dependent of _current[DependentsId]) {
            dependent[Keys.Read]()
          }
        }
      }, 0)
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    const _current = atomGet(_atomList) as typeof _atomList
    _current[DependentsId].add(readListAtomState)
    return () => {
      const _current = atomGet(_atomList) as typeof _atomList
      _current[DependentsId].delete(readListAtomState)
    }
  }, [_atomList])

  return [atomListValue, writeAtomListState]
}

export const useAtomSelector = <T, L extends AtomList<T>>(
  atomList: L,
  id: string,
): [AtomValue<typeof atomList[Keys.ListValue][typeof id]>, AtomUpdate<typeof atomList[Keys.ListValue][typeof id]>] => {
  const atomRef = useRef(undefined as any)
  if (!atomRef.current) {
    atomRef.current = (atomGet(atomList) as typeof atomList)?.[Keys.ListValue]?.[id]
  }
  return useAtom(atomRef.current) as any
}
