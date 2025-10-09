# AI Wallet

- To see how the client will use this product, you can visit the README.md

## Recent Updates

### Custom Placement and Styling (Latest)

The AI Wallet now supports customizable placement and styling:

1. **Placement Control**: Use the `floating` prop on `AIWalletProvider` to control whether the wallet floats in the corner (default: true) or is manually placed using the `useAIWalletComponent()` hook.

2. **Style Variants**: Use the `variant` prop to choose between:
   - `shadow` (default): Box shadow styling
   - `border`: Border styling instead of shadow

3. **New Hook**: `useAIWalletComponent()` - Returns a render function to place the wallet anywhere in your component tree.

See README.md for full documentation and examples.

## Commands

Here are the npm scripts available:

Lifecycle scripts included in ai-wallet@0.0.10:
  start
    stencil build --dev --watch --serve
  test
    stencil test --spec --e2e
available via `npm run-script`:
  build
    stencil build && npm run build:react
  build:react
    tsc -p src/react/tsconfig.json
  dev:stencil
    stencil build --dev --watch --serve
  dev:react
    cd examples/react-app && npm run dev
  test.watch
    stencil test --spec --e2e --watchAll
  test:playwright
    playwright test
  test:playwright:ui
    playwright test --ui
  generate
    stencil generate
  docs:dev
    npm run build && vitepress dev docs
  docs:build
    vitepress build docs
  docs:preview
    vitepress preview docs
  vercel-build
    npm docs:build

## Development with HMR

The project supports Hot Module Replacement (HMR) for rapid development:

### Developing Stencil Components
Run `npm start` or `npm run dev:stencil` to start the Stencil dev server with HMR.
- Opens at http://localhost:3333
- Auto-reloads on file changes
- Output directory: `dev/` (ignored by git)
- Includes Tailwind HMR support

### Developing with React Example
Run `npm run dev:react` to start the Vite dev server with HMR for the React example app.
- Opens at http://localhost:5173
- Hot reloads React components
- Uses local ai-wallet package via file:../.. reference

### Concurrent Development
To work on both Stencil components and React integration simultaneously:
1. Open two terminal windows
2. Run `npm start` in the first terminal (Stencil HMR)
3. Run `npm run dev:react` in the second terminal (React HMR)
4. Changes to Stencil components require rebuild to reflect in React app


## Updates

If some of this information updates, please update this document.


## Errors

If an error happens, please write it down in .claude/errors folder. Create a new markdown file and then explain the error for future reference.
Also write down what it took to solve it, what commands, what other errors you encountered because of it.