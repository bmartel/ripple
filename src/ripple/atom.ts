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

export const atomNotify = <T, A extends Atom<T>>(atom: A, skip: Read[Keys.Read][] = []) => {
  const _current = DependentsId in atom ? atom : (atomGet(atom) as typeof atom)
  if (_current && DependentsId in _current) {
    for (const dependent of _current[DependentsId]) {
      const read = dependent[Keys.Read]

      if (read && !skip.includes(read)) {
        read()
      }
    }
  }
}

export type AtomWriteConfig<T extends Atom> = {
  reducer?: AtomReducer<T>
  skipNotify?: Read[Keys.Read][]
}
export const atomWrite = <T, A extends Atom<T>>(
  atom: A,
  update: Write<typeof atom[Keys.Value]>,
  { reducer, skipNotify = [] } = {} as AtomWriteConfig<typeof atom>,
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
        // TODO:
        // - make this not auto-clear, but retain checkpoints of data for moving back and forth in history.
        // - maybe this behaviour has opt-in?
        _current[HistoryId].clear()
        _current[Keys.Value] = update[Keys.Value]
        _current[Keys.Version] = update[Keys.Version]
        atomSet(atom, _current)
        if (process.env.NODE_ENV !== 'production') {
          //
        }
        atomNotify(atom, skipNotify)
      }
    }, 0)
    atomSet(atom, _current)
  }
}

export const atomWriteList = <T = any>(
  atomList: AtomList<T>,
  update: Write<typeof atomList[Keys.ListValue]['id'][Keys.Value][]>,
  { skipNotify = [] }: { skipNotify: Read[Keys.Read][] } = { skipNotify: [] },
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
      // TODO:
      // - make this not auto-clear, but retain checkpoints of data for moving back and forth in history.
      // - maybe this behaviour has opt-in?
      _current[HistoryId].clear()
      _current[Keys.Value] = update[Keys.Value].map(([id, v]) => {
        const _currentAtom = atomGet(_current[Keys.ListValue][id] as any) as any
        if (_currentAtom) {
          _currentAtom[Keys.Version] = update[Keys.Version]
          _currentAtom[Keys.Value] = v
          atomNotify(_currentAtom, skipNotify)
        }
        return id
      })
      _current[Keys.Version] = update[Keys.Version]
      atomSet(atomList, _current)
      if (process.env.NODE_ENV !== 'production') {
        //
      }

      atomNotify(atomList, skipNotify)
    }
  }, 0)
  atomSet(atomList, _current)
}

export const atom = <T = any>(value: T): Atom<T> => {
  const ref = {} as Atom<T>

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

export type AtomEffectOperator = (
  get: (a: Atom | AtomList) => any,
  set: (
    a: Atom | AtomList,
    v: Write<typeof a extends AtomList<any> ? typeof a[Keys.ListValue] : typeof a[Keys.Value]>,
  ) => void,
) => void | Promise<void>
export type AtomEffectUnsubscribe = () => void
export type AtomEffect = () => AtomEffectUnsubscribe

export const atomEffect = (effect: AtomEffectOperator): AtomEffect => {
  const start = () => {
    const subscriptions = new Map()

    const get = (_atom: Atom | AtomList) => {
      if (!subscriptions.has(_atom)) {
        const subscription = { [Keys.Read]: run as any }
        atomSubscribe(_atom, subscription)
        subscriptions.set(_atom, () => atomUnsubscribe(_atom, subscription))
      }

      const storedAtom = atomGet(_atom)

      return !storedAtom
        ? undefined
        : Keys.ListValue in storedAtom
        ? atomListGetListValue(_atom as AtomList<any>)
        : atomGetValue(_atom)
    }

    const set = (
      _atom: Atom | AtomList,
      value: Write<typeof _atom extends AtomList<any> ? typeof _atom[Keys.ListValue] : typeof _atom[Keys.Value]>,
    ) => {
      const storedAtom = atomGet(_atom)
      if (!storedAtom) return
      if (Keys.ListValue in storedAtom) {
        atomWriteList(_atom as AtomList<any>, value, { skipNotify: [run] })
      } else {
        atomWrite(_atom, value, { skipNotify: [run] })
      }
    }

    let deferId: any
    function run() {
      if (deferId) clearTimeout(deferId)
      deferId = setTimeout(async () => {
        await effect(get, set)
      }, 0)
    }

    run()

    return () => {
      for (const [_k, unsub] of subscriptions) {
        unsub()
      }
      subscriptions.clear()
    }
  }

  return start
}

export type AtomRefOperator<T = any> = (get: (a: Atom | AtomList) => any) => T | Promise<T>
export type AtomRefReturn<T = any> = {
  value: () => T | undefined
  start: () => void
  stop: AtomEffectUnsubscribe
}
export type AtomRef<T = any> = (notify: () => void) => AtomRefReturn<T>

export const atomRef = <T = any>(ref: AtomRefOperator<T>, defaultValue?: T): AtomRef<T> => {
  const value: { current?: T } = { current: defaultValue }
  return (notify) => {
    const subscriptions = new Map()

    const get = (_atom: Atom | AtomList): T => {
      if (!subscriptions.has(_atom)) {
        const subscription = { [Keys.Read]: run as any }
        atomSubscribe(_atom, subscription)
        subscriptions.set(_atom, () => atomUnsubscribe(_atom, subscription))
      }

      const storedAtom = atomGet(_atom)

      return !storedAtom
        ? undefined
        : Keys.ListValue in storedAtom
        ? atomListGetListValue(_atom as AtomList<any>)
        : atomGetValue(_atom)
    }

    let deferId: any
    function run() {
      if (deferId) clearTimeout(deferId)
      deferId = setTimeout(async () => {
        value.current = await ref(get)
        notify()
      }, 0)
    }

    return {
      value: (): T | undefined => value.current,
      start: run,
      stop: () => {
        if (!subscriptions) return
        for (const [_k, unsub] of subscriptions) {
          unsub()
        }
        subscriptions.clear()
      },
    }
  }
}
