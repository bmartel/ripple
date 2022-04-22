import { useEffect, useMemo, useRef, useState } from 'haunted'

export enum Keys {
  Value = '=',
  CommitVersion = '#',
  Read = '<',
  Write = '>',
  Update = '^',
  Current = '~',
}

const ReconcileId = Symbol()
const LastId = Symbol()
const VersionId = Symbol()
const HistoryId = Symbol()
const DependentsId = Symbol()

class CustomSet<T = any> extends Set<T> {
  [LastId]: T

  add(value: T) {
    super.add(value)
    this[LastId] = value
    return this
  }
}

export type Update<U = any> = { [Keys.Update]: U }
export type Updater<U = any> = (u: U) => U
export type Setter<U = any> = Updater<U> | U

export type Reader<T = any> = {
  [Keys.Read]: () => T
}

export type Writer<T = any> = {
  [Keys.Write]: (u: Update<T>) => void
}

export type AtomSnapshot<T = any> = {
  [Keys.Value]: T
  [Keys.CommitVersion]: number
}

export type Atom<T = any> = AtomSnapshot<T> & {
  [ReconcileId]: any
  [VersionId]: number
  [HistoryId]: CustomSet<AtomSnapshot<T>>
  [DependentsId]: CustomSet<Reader>
}

export type AtomValue<V extends AtomSnapshot> = V[Keys.Value]
export type AtomSet<V extends AtomSnapshot> = (u: Setter<V[Keys.Value]>) => void
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

export const useAtom = <T, A extends Atom<T>>(
  atom: A,
  reducer?: AtomReducer<typeof atom>,
): [AtomValue<typeof atom>, AtomSet<typeof atom>] => {
  const atomState = useRef<typeof atom>(atom)
  const [atomValue, setAtomValue] = useState(() => atom[Keys.Value])

  const readAtomState = useMemo(
    () => ({
      [Keys.Read]: () => setAtomValue(atomState.current[Keys.Value]),
    }),
    // eslint-disable-next-line
    [],
  )

  const writeAtomState = useMemo<AtomSet<typeof atom>>(
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
              console.log(atomState.current)
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

// export const atomFamily = () => {

// }
