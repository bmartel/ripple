// import { navigateTo } from '@martel/haunted-router'
import { html } from 'haunted'
import './hooks/route'

enum RouteMode {
  Any = 'any',
  Unauthenticated = 'unauth',
  Authenticated = 'auth',
}

// Helper decorator for routes
const route =
  (r: (...args: any[]) => any, { mode = RouteMode.Any } = {}) =>
  (...args: any[]): any => {
    if (mode === RouteMode.Any) {
      return html`<route-provider .params=${args[0]}>${r(...args)}</route-provider>`
    }

    // Handle authentication however needed
    // if (mode === RouteMode.Authenticated && !user) {
    //   return html`
    //     <route-provider .params=${args[0]}>
    //       <app-session></app-session>
    //     </route-provider>
    //   `;
    // }
    // if (mode === RouteMode.Unauthenticated && !!user) {
    //   navigateTo('/');
    //   return html`
    //     <route-provider .params=${args[0]}>
    //      <app-index></app-index>
    //     </route-provider>
    //   `;
    // }
    return html`<route-provider .params=${args[0]}>${r(...args)}</route-provider>`
  }

export const routes = {
  '/': route(() => {
    import('./views/view-index')
    return html`<view-index></view-index>`
  }),

  // An URL with parameters
  /* '/product/:id': ({ id }) => html`<x-page-product .id=${id}></x-page-product>`, */

  // Dynamically import the component
  /* '/about': () => { */
  // No need to wait for the result, the component will appear once loaded
  /* import('./about.js'); */
  /* return html`<x-page-about></x-page-about>`; */
  /* }, */

  // Putting a star at the end will match all the URLs that starts with the string
  // It can be used to match subroutes
  /* '/account*': () => html`<x-page-account></x-page-account>`, */
}
