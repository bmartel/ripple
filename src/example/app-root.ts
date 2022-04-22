import { html, component } from 'haunted'
import { nothing } from 'lit-html'
import { useRoutes } from '@martel/haunted-router'
import { routes } from './app-routes'

interface AppProps {
  title?: string
}

function App({ title: _title }: AppProps) {
  const { outlet } = useRoutes(routes, nothing)
  return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
        height: 100%;
      }
      main {
        min-height: 100%;
      }
    </style>

    <main>${outlet}</main>
  `
}

customElements.define('app-root', component<any>(App, { observedAttributes: ['title'] }))
