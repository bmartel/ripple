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

export const atom = <T = any>(value: T): Atom<T> => {
  return {
    [ReconcileId]: null,
    [HistoryId]: new CustomSet(),
    [DependentsId]: new CustomSet(),
    [VersionId]: 0,
    [Keys.Value]: value,
    [Keys.CommitVersion]: 0,
  }
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

  return _atomList
}

export const useAtom = <T, A extends Atom<T>>(
  atom: A,
  reducer?: AtomReducer<typeof atom>,
): [AtomValue<typeof atom>, AtomUpdate<typeof atom>] => {
  const atomState = useRef<typeof atom>(atom)
  const [atomValue, setAtomValue] = useState(() => atom[Keys.Value])

  const readAtomState = useMemo(
    () => ({
      [Keys.Read]: () => setAtomValue(atomState.current[Keys.Value]),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomState = useMemo<AtomUpdate<typeof atom>>(
    () => (u) => {
      let next: AtomValue<typeof atom>
      if (typeof u === 'function') {
        next = (u as any)(atomState.current[Keys.Value])
      } else {
        next = u
      }
      if (next !== atomState.current[Keys.Value]) {
        atomState.current[HistoryId].add({ [Keys.Value]: next, [Keys.CommitVersion]: ++atomState.current[VersionId] })
        if (atomState.current[ReconcileId]) clearTimeout(atomState.current[ReconcileId])
        atomState.current[ReconcileId] = setTimeout(() => {
          const update = reducer
            ? Array.from(atomState.current[HistoryId]).reduce(reducer as any, {
                [Keys.Value]: atomState.current[Keys.Value],
                [Keys.CommitVersion]: atomState.current[Keys.CommitVersion],
              })
            : atomState.current[HistoryId][LastId]
          if (update) {
            atomState.current[HistoryId].clear()
            atomState.current[Keys.Value] = update[Keys.Value]
            atomState.current[Keys.CommitVersion] = update[Keys.CommitVersion]
            if (process.env.NODE_ENV !== 'production') {
              console.log(JSON.parse(JSON.stringify(atomState.current)))
            }
            for (const dependent of atomState.current[DependentsId]) {
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
    atomState.current[DependentsId].add(readAtomState)
    return () => {
      atomState.current[DependentsId].delete(readAtomState)
    }
  }, [atom])

  return [atomValue, writeAtomState]
}

export const useAtomList = <T, L extends AtomList<T>>(
  atomList: L,
): [string[], (u: typeof atomList[Keys.ListValue]['id'][Keys.Value][]) => void] => {
  const atomListState = useRef<typeof atomList>(atomList)
  const [atomListValue, setAtomListValue] = useState(() => atomList[Keys.Value])

  const readListAtomState = useMemo(
    () => ({
      [Keys.Read]: () => setAtomListValue(atomListState.current[Keys.Value]),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomListState = useMemo<(u: typeof atomList[Keys.ListValue]['id'][Keys.Value][]) => void>(
    () => (u) => {
      const next = u.map((v) => {
        const id = atomListState.current[MapperId](v)
        if (!(id in atomListState.current[Keys.ListValue])) {
          atomListState.current[Keys.ListValue][id] = atom(v)
        }
        return [id, v]
      })
      atomListState.current[HistoryId].add({
        [Keys.Value]: next as any,
        [Keys.CommitVersion]: ++atomListState.current[VersionId],
      })
      if (atomListState.current[ReconcileId]) clearTimeout(atomListState.current[ReconcileId])
      atomListState.current[ReconcileId] = setTimeout(() => {
        const update = atomListState.current[HistoryId][LastId]
        if (update) {
          atomListState.current[HistoryId].clear()
          atomListState.current[Keys.Value] = update[Keys.Value].map(([id, v]) => {
            atomListState.current[Keys.ListValue][id][Keys.CommitVersion] = update[Keys.CommitVersion]
            atomListState.current[Keys.ListValue][id][Keys.Value] = v as any
            for (const dependent of atomListState.current[Keys.ListValue][id][DependentsId]) {
              dependent[Keys.Read]()
            }
            return id
          })
          atomListState.current[Keys.CommitVersion] = update[Keys.CommitVersion]
          if (process.env.NODE_ENV !== 'production') {
            console.log(JSON.parse(JSON.stringify(atomListState.current)))
          }
          for (const dependent of atomListState.current[DependentsId]) {
            dependent[Keys.Read]()
          }
        }
      }, 0)
    },
    // eslint-disable-next-line
    [],
  )

  useEffect(() => {
    atomListState.current[DependentsId].add(readListAtomState)
    return () => {
      atomListState.current[DependentsId].delete(readListAtomState)
    }
  }, [atomList])

  return [atomListValue, writeAtomListState]
}

export const useAtomSelector = <T, L extends AtomList<T>>(
  atomList: L,
  id: string,
): [AtomValue<typeof atomList[Keys.ListValue][typeof id]>, AtomUpdate<typeof atomList[Keys.ListValue][typeof id]>] => {
  const atomRef = useRef(atomList[Keys.ListValue][id])
  return useAtom(atomRef.current) as any
}
