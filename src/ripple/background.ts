import * as Comlink from 'comlink'

export interface BackgroundRequestInit extends RequestInit {
  refetch?: number
}

export interface BackgroundResponse<T = Record<string, any> | Array<any> | string> {
  readonly headers: Record<string, any>
  readonly ok: boolean
  readonly redirected: boolean
  readonly status: number
  readonly statusText: string
  readonly body?: T
}

export interface BackgroundFetch extends BackgroundRequestInit {
  url: RequestInfo | URL
  onFetch: (res: Response) => void
}

let background: any

export const initWorker = (worker: () => Promise<new () => Worker>) => {
  if (background) {
    return
  }

  worker().then((BackgroundWorker) => {
    background = Comlink.wrap(new BackgroundWorker())
  })
}

export const backgroundFetch = (
  input: RequestInfo | URL,
  onFetch: (res: Response) => void,
  init?: BackgroundRequestInit,
) => {
  background.fetch(input, Comlink.proxy(onFetch), init)
}

export const cancelBackgroundFetch = (input: RequestInfo | URL, init?: BackgroundRequestInit) => {
  background.cancel(input, init)
}
