import * as Comlink from 'comlink'

const refetchable = new Map()

const fetchId = (input, init) => {
  const url = input.toString()
  if (!init) {
    return url
  }

  let id = url
  for (const [key, value] of Object.entries(init).sort(([a], [b]) => a.localeCompare(b))) {
    id = `${id}::${key}=${value.toString()}`
  }
  return id
}

setInterval(() => {
  for (const [id, f] of refetchable) {
    f.init = f.init || {}
    const fetchedAt = f.fetchedAt || 0
    const { refetch = 0, ..._init } = f.init
    if (Date.now() - refetch > fetchedAt * 1000) {
      f.fetchedAt = Date.now()
      refetchable.set(id, f)
      fetch(f.input, _init).then(async (res) => {
        const headers = {}
        for (const [key, value] of res.headers) {
          headers[key] = value
        }
        const isJson = headers["content-type"]?.startsWith("application/json")
        const body = isJson ? await res.json() : await res.text()
        return f.onFetch({ headers, ok: res.ok, redirected: res.redirected, status: res.status, statusText: res.statusText, body })
      })
    }
  }
}, 1000)

const background = {
  cancel(input, init) {
    const { refetch, ..._init } = init || {}
    if (refetch) {
      refetchable.delete(fetchId(input, _init))
    }
  },
  fetch(input, onFetch, init) {
    const { refetch, ..._init } = init || {}
    if (refetch) {
      refetchable.set(fetchId(input, _init), { input, init, onFetch, fetchedAt: 0 })
    } else {
      fetch(input, _init).then(async (res) => {
        const headers = {}
        for (const [key, value] of res.headers) {
          headers[key] = value
        }
        const isJson = headers["content-type"]?.startsWith("application/json")
        const body = isJson ? await res.json() : await res.text()
        return onFetch({ headers, ok: res.ok, redirected: res.redirected, status: res.status, statusText: res.statusText, body })
      })
    }
  },
}

Comlink.expose(background)
