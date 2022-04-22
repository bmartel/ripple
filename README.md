# Haunted Vite

Simple, yet complete setup for building apps with Web Components.

## Features

- [Vite](https://vitejs.dev) with [Haunted](https://hauntedhooks.netlify.app/), [TypeScript](https://www.typescriptlang.org) and [absolute imports](https://github.com/aleclarson/vite-tsconfig-paths).
- [OpenProps](https://github.com/argyleink/open-props) to aid in styling web components with css variables.
- Use [ESLint](https://eslint.org) and [Prettier](https://prettier.io) on VSCode and before you commit with [Husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged).
- [PWA](https://github.com/antfu/vite-plugin-pwa) enabled.
- Write unit and integration tests with [@open-wc/testing](https://open-wc.org/docs/testing/testing-package/) and [@web/test-runner](https://www.npmjs.com/package/@web/test-runner).
- GitHub Actions for automatic testing of Pull Request branches, and all pushes to `main` branch.
- Deploy to [Vercel](vercel.com) with pre-configured SPA fallback.

## Getting started

Use this repository as a [GitHub template](https://github.com/bmartel/haunted-vite/generate) or use [degit](https://github.com/Rich-Harris/degit) to clone to your machine with an empty git history:

```
npx degit bmartel/haunted-vite#main my-app
```

Then, install the dependencies:

```
npm install
```

### Before you start

- [ ] If you don't plan to use GitHub Actions, delete the `.github` directory.
- [ ] Change the `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `safari-pinned-tab.svg`, `pwa-192x192.png` and `pwa-512x512.png`. [favicon.io](https://favicon.io) is a good resource for generating these assets.
- [ ] Change the title, description and theme color in the `index.html` and `vite.config.ts`.
- [ ] Change the `name` field in package.json.

## Scripts

- `npm run dev` - start a development server with hot reload.
- `npm run build` - build for production. The generated files will be output to the `./dist` directory.
- `npm run preview` - locally preview the production build.
- `npm run test` - run unit and integration tests related to changed files based on git.
- `npm run format` - format all files with Prettier.
- `npm run lint` - runs TypeScript and ESLint.
