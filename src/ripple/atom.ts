export enum Keys {
  Value = '=',
  ListValue = '==',
  Version = '#',
  Read = '<',
  Write = '>',
}

export const ReconcileId = Symbol('ripple.reconcileId')
export const MapperId = Symbol('ripple.MapperId')
export const LastId = Symbol('ripple.lastId')
export const VersionId = Symbol('ripple.versionId')
export const HistoryId = Symbol('ripple.historyId')
export const DependentsId = Symbol('ripple.dependentsId')

export type IdFunc = (v: any) => string
export const defaultIdFunc: IdFunc = (v: any): string => v?.id

class CustomSet<T = any> extends Set<T> {
  [LastId]: T

  add(value: T) {
    super.add(value)
    this[LastId] = value
    return this
  }

  clear() {
    super.clear()
    this[LastId] = null as any
  }
}

export type Read<T = any> = {
  [Keys.Read]: () => T
}

export type Write<U = any> = ((u: U) => U) | U

export type AtomSnapshot<T = any> = {
  [Keys.Value]: T
  [Keys.Version]: number
}

export type AtomListSnapshot<T = string[], L = any> = {
  [Keys.Value]: T
  [Keys.ListValue]: L
  [Keys.Version]: number
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
export type AtomListUpdate<V extends AtomListSnapshot> = (u: Write<V[Keys.ListValue]>) => void
export type AtomReducer<V extends AtomSnapshot> = (v: V, u: V) => V

const state = new WeakMap<Atom | AtomList, Atom | AtomList>()
export const atomGet = <T = any>(atom: Atom<T> | AtomList<T>): Atom<T> | AtomList<T> | undefined => state.get(atom)
export const atomSet = <T = any>(atom: Atom<T> | AtomList<T>, v: Atom<T> | AtomList<T>): void => {
  state.set(atom, v)
}

export const atomGetValue = <T extends AtomSnapshot>(atom: Atom<T> | AtomList<T>): AtomValue<T> | undefined =>
  state.get(atom)?.[Keys.Value]
export const atomSetValue = <T = any>(atom: Atom<T> | AtomList<T>, v: T): void => {
  const _current = atomGet<T>(atom)!
  _current[Keys.Value] = v
}

export const atom = <T = any>(value: T): Atom<T> => {
  const ref = {}
  atomSet(
    ref as any,
    {
      [ReconcileId]: null,
      [HistoryId]: new CustomSet(),
      [DependentsId]: new CustomSet(),
      [VersionId]: 0,
      [Keys.Value]: value,
      [Keys.Version]: 0,
    } as Atom<T>,
  )
  return ref as any
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

  const ref = atom(idList) as AtomList<T>

  const _atomList = atomGet(ref) as AtomList<T>

  _atomList[Keys.ListValue] = atomListValue
  _atomList[MapperId] = idMapper

  atomSet(ref, _atomList)

  return ref
}
