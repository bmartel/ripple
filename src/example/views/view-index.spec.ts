import { fixture, expect } from '@open-wc/testing'

import './view-index'

const TAG = 'view-index'

describe(TAG, async () => {
  it('displays banner text', async () => {
    const el = await fixture(`<view-index></view-index>`)

    expect(el?.shadowRoot?.getElementById('title')?.innerText).to.equal('Vite + Haunted')
  })
})
