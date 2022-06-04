export enum Keys {
  Value = '=',
  ListValue = '==',
  Version = '#',
  Read = '<',
  Write = '>',
  Self = '.',
}

export const InitId = Symbol('ripple.initId')
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
  [InitId]: boolean
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

export const atomSubscribe = <T = any>(atom: Atom<T> | AtomList<T>, subscription: Read<typeof atom>): void => {
  const _current = atomGet<T>(atom)
  if (_current && DependentsId in _current) {
    _current[DependentsId].add(subscription)
    atomSet(atom, _current)
  }
}
export const atomUnsubscribe = <T = any>(atom: Atom<T> | AtomList<T>, subscription: Read<typeof atom>): void => {
  const _current = atomGet<T>(atom)
  if (_current && DependentsId in _current) {
    _current[DependentsId].delete(subscription)
    atomSet(atom, _current)
  }
}
export const atomGetValue = <T extends AtomSnapshot>(atom: Atom<T> | AtomList<T>): AtomValue<T> | undefined =>
  state.get(atom)?.[Keys.Value]
export const atomSetValue = <T = any>(atom: Atom<T> | AtomList<T>, v: T): void => {
  const _current = atomGet<T>(atom)
  if (_current && Keys.Value in _current) {
    _current[Keys.Value] = v
    _current[InitId] = true
    atomSet(atom, _current)
  }
}

export const atomListGetListValue = <T extends AtomListSnapshot>(atomList: AtomList<T>): Atom<T>[] => {
  return (
    atomGetValue(atomList as any)?.map(
      (key: string) => atomGet((atomGet(atomList) as AtomList)?.[Keys.ListValue]?.[key] as any)?.[Keys.Value],
    ) || []
  )
}
export const atomListGetValue = <T extends AtomListSnapshot>(atomList: AtomList<T>): string[] => {
  return (atomGet(atomList) as AtomList)?.[Keys.Value] || []
}

export const atomNotify = <T, A extends Atom<T>>(atom: A) => {
  const _current = DependentsId in atom ? atom : (atomGet(atom) as typeof atom)
  if (_current && DependentsId in _current) {
    for (const dependent of _current[DependentsId]) {
      dependent[Keys.Read]()
    }
  }
}

export type AtomWriteConfig<T extends Atom> = {
  reducer?: AtomReducer<T>
}
export const atomWrite = <T, A extends Atom<T>>(
  atom: A,
  update: Write<typeof atom[Keys.Value]>,
  { reducer } = {} as AtomWriteConfig<typeof atom>,
) => {
  let next: AtomValue<typeof atom>

  let _current = atomGet(atom) as typeof atom
  if (!_current) return

  if (typeof update === 'function') {
    next = (update as any)(_current)
  } else {
    next = update
  }
  if (next !== _current[Keys.Value]) {
    _current[HistoryId].add({ [Keys.Value]: next, [Keys.Version]: ++_current[VersionId] })
    if (_current[ReconcileId]) clearTimeout(_current[ReconcileId])
    _current[ReconcileId] = setTimeout(() => {
      _current = atomGet(atom) as typeof atom
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
        atomSet(atom, _current)
        if (process.env.NODE_ENV !== 'production') {
          //
        }
        atomNotify(atom)
      }
    }, 0)
    atomSet(atom, _current)
  }
}

export const atomWriteList = <T = any>(
  atomList: AtomList<T>,
  update: Write<typeof atomList[Keys.ListValue]['id'][Keys.Value][]>,
) => {
  let next: typeof atomList[Keys.ListValue]['id'][Keys.Value][]

  let _current = atomGet(atomList) as typeof atomList
  if (!_current) return

  if (typeof update === 'function') {
    next = (update as any)(
      _current?.[Keys.Value]?.map(
        (key) => atomGet((atomGet(atomList) as AtomList)?.[Keys.ListValue]?.[key])?.[Keys.Value],
      ) || [],
    )
  } else {
    next = update
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
    _current = atomGet(atomList) as typeof atomList
    if (!_current) return
    const update = _current[HistoryId][LastId]
    if (update) {
      _current[HistoryId].clear()
      _current[Keys.Value] = update[Keys.Value].map(([id, v]) => {
        const _currentAtom = atomGet(_current[Keys.ListValue][id] as any) as any
        if (_currentAtom) {
          _currentAtom[Keys.Version] = update[Keys.Version]
          _currentAtom[Keys.Value] = v
          atomNotify(_currentAtom)
        }
        return id
      })
      _current[Keys.Version] = update[Keys.Version]
      atomSet(atomList, _current)
      if (process.env.NODE_ENV !== 'production') {
        //
      }

      atomNotify(atomList)
    }
  }, 0)
  atomSet(atomList, _current)
}

export const atom = <T = any>(value: T | (() => Promise<T>)): Atom<T> => {
  const ref = {} as Atom<T>

  const hasInit = typeof value === 'function'
  if (hasInit) {
    ;(async () => {
      atomSet(
        ref as any,
        {
          [ReconcileId]: null,
          [HistoryId]: new CustomSet(),
          [DependentsId]: new CustomSet(),
          [InitId]: false,
          [VersionId]: 0,
          [Keys.Value]: undefined as any,
          [Keys.Version]: 0,
        } as Atom<T>,
      )
      atomSetValue(ref, await (value as () => Promise<T>)())
    })()
  } else {
    atomSet(
      ref as any,
      {
        [ReconcileId]: null,
        [HistoryId]: new CustomSet(),
        [DependentsId]: new CustomSet(),
        [InitId]: true,
        [VersionId]: 0,
        [Keys.Value]: value as any,
        [Keys.Version]: 0,
      } as Atom<T>,
    )
  }
  return ref as any
}

export const atomList = <T = any>(value: T[] | (() => Promise<T[]>), idMapper: IdFunc = defaultIdFunc): AtomList<T> => {
  const atomListValue: AtomList<T>[Keys.ListValue] = {}

  const hasInit = typeof value === 'function'

  let resolve: null | ((v?: any) => void) = null
  let promise: null | Promise<any> = null

  if (hasInit) {
    promise = new Promise((res) => (resolve = res))
  }

  const idList = hasInit
    ? async () => {
        const ids = (await value()).map((v) => {
          const id = idMapper(v)
          if (!(id in atomListValue)) {
            atomListValue[id] = atom(v)
          }
          return id
        })
        resolve?.()
        return ids
      }
    : value.map((v) => {
        const id = idMapper(v)
        if (!(id in atomListValue)) {
          atomListValue[id] = atom(v)
        }
        return id
      })

  const ref = atom(idList) as AtomList<T>

  if (promise) {
    ;(async () => {
      await promise
      const _atomList = atomGet(ref) as AtomList<T>
      _atomList[Keys.ListValue] = atomListValue
      _atomList[MapperId] = idMapper
      atomSet(ref, _atomList)
      setTimeout(() => {
        atomNotify(ref)
      }, 0)
    })()
  } else {
    const _atomList = atomGet(ref) as AtomList<T>
    _atomList[Keys.ListValue] = atomListValue
    _atomList[MapperId] = idMapper
    atomSet(ref, _atomList)
  }

  return ref
}

export type AtomEffectOperator = (
  get: (a: Atom | AtomList) => any,
  set: (
    a: Atom | AtomList,
    v: Write<typeof a extends AtomList<any> ? typeof a[Keys.ListValue] : typeof a[Keys.Value]>,
  ) => void,
) => void
export type AtomEffect = (effect: AtomEffectOperator) => void

export const atomEffect = (effect: AtomEffectOperator): void => {
  const get = (_atom: Atom | AtomList) => {
    atomSubscribe(_atom, run as any)
  }
  const set = (
    _atom: Atom | AtomList,
    value: Write<typeof _atom extends AtomList<any> ? typeof _atom[Keys.ListValue] : typeof _atom[Keys.Value]>,
  ) => {
    atomWrite(_atom, value)
  }
  let deferId: any
  function run() {
    if (deferId) clearTimeout(deferId)
    deferId = setTimeout(() => effect(get, set), 1)
  }
}
