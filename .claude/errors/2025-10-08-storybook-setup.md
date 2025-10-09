# Storybook Setup Error - 2025-10-08

## Issue

When trying to set up Storybook for the ai-wallet component library, encountered multiple compatibility issues:

1. **Vite version incompatibility**: Project uses Vite 7, but Storybook 8.6 only supports Vite <= 6
2. **Webpack TypeScript configuration**: Switched to webpack5 builder but TypeScript files in `.storybook/` directory aren't being processed correctly

## Error Message

```
ERROR in ./.storybook/preview.ts 1:12
Module parse failed: Unexpected token (1:12)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file.
> import type { Preview } from '@storybook/web-components';
```

## What Was Tried

1. Initially tried `@storybook/web-components-vite` but it doesn't exist as a separate package
2. Installed `@storybook/web-components-webpack5@8.6.14` instead
3. Added `ts-loader` to webpack config in `.storybook/main.ts`
4. The webpack config for TypeScript isn't being applied correctly to `.storybook/` files

## Root Cause

The webpack configuration in `webpackFinal` hook isn't processing TypeScript files in the `.storybook` directory. The Storybook config entry point needs TypeScript support before our webpack customization runs.

## Potential Solutions

### Option 1: Convert Stories to JavaScript
Convert `.storybook/preview.ts` and `*.stories.ts` files to `.js` and use JSDoc for types.

### Option 2: Use Storybook 9
Upgrade to Storybook 9 which might have better TypeScript support out of the box.

### Option 3: Simplify Testing Approach
Since the main goal is testing, consider:
- Skip Storybook for now
- Use the existing Playwright tests against the React example app
- Tests in `tests/component/` and `tests/react-integration/` are already structured correctly
- Can add Storybook later once the version conflicts are resolved

## Recommendation

For now, I recommend **Option 3**: Use the Playwright test structure that's already set up. The testing strategy is sound - testing the component API rather than examples. Storybook can be added later once there's a stable version that supports your Vite 7 setup.

## Files Created

- `.storybook/main.ts` - Storybook webpack5 configuration (has issues)
- `.storybook/preview.ts` - Storybook preview config (TypeScript not parsing)
- `.storybook/test-runner.ts` - Test runner config
- `src/components/ai-wallet/ai-wallet.stories.ts` - Component stories  (TypeScript not parsing)
- `tests/component/storybook.spec.ts` - Playwright tests for stories
- `tests/component/ai-wallet.spec.ts` - Existing tests (moved from e2e/)
- `tests/react-integration/hooks.spec.ts` - React integration tests
- `README.testing.md` - Complete testing documentation

## Status

- ✅ Test structure implemented correctly
- ✅ Playwright configuration updated
- ✅ Test files created and organized
- ✅ Documentation written
- ❌ Storybook not working due to TypeScript/Webpack config issues

The testing infrastructure is ready to use with Playwright even without Storybook.
