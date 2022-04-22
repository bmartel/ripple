import { useSearchParams } from '@martel/haunted-router'
import { html, component, createContext, useContext } from 'haunted'

export interface Route {
  ready: boolean
  params: any
  query: any
}

const RouteContext = createContext({} as Route)
customElements.define('route-context', RouteContext.Provider as any)

export const useRouteProvider = (_params: any): Route => {
  const query = useSearchParams()

  return {
    ready: _params !== undefined,
    params: _params || {},
    query,
  }
}

export const useRoute = (): Route => useContext(RouteContext)

const RouteProvider = ({ params }: { params: any }) => {
  const ctx = useRouteProvider(params || undefined)
  return html`<route-context .value=${ctx}><slot></slot></route-context>`
}
customElements.define('route-provider', component<any>(RouteProvider))
