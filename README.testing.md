# Testing Strategy

This document outlines the testing approach for the AI Wallet component library.

## Overview

The testing structure is designed to test the **component itself** rather than individual examples. This ensures maintainability as the library grows and new framework integrations are added.

## Test Structure

```
tests/
├── component/           # Core web component tests
│   └── ai-wallet.spec.ts      # Thorough component functionality tests
├── react-integration/   # React wrapper tests
│   └── hooks.spec.ts          # React hooks and context tests
└── examples/            # Example app smoke tests
    └── react-app.spec.ts      # Verify React example loads
```

## Testing Approaches

### 1. Component Tests (`tests/component/`) - **Thorough**

Tests the core Stencil web component functionality:
- Configuration persistence
- Setup wizard flows
- Advanced settings
- Model selection
- localStorage interactions
- UI state management

**Run these tests:**
```bash
npm run test:playwright -- --project=component
```

### 2. React Integration Tests (`tests/react-integration/`) - **API Testing**

Tests the React wrapper functionality:
- `useAIWallet()` hook
- `useAIConfig()` hook
- `AIWalletProvider` context
- Configuration updates propagation

**Prerequisites:**
1. Start the React example: `cd examples/react-app && npm run dev`
2. Run tests: `npm run test:playwright -- --project=react-integration`

### 3. Example Smoke Tests (`tests/examples/`) - **Light Touch**

Simple smoke tests to verify examples load and work:
- Just verifies the example renders
- Tests basic integration works
- One test file per example app

**Purpose:** Catch if an example is completely broken, but don't test features exhaustively (that's what component tests are for).

**Run these tests:**
```bash
npm run test:playwright -- --project=examples
```

## Running Tests

### All Tests
```bash
npm run test:playwright
```

### Component Tests Only
```bash
npm run test:playwright -- --project=component
```

### React Integration Tests Only
```bash
npm run test:playwright -- --project=react-integration
```

### Example Smoke Tests Only
```bash
npm run test:playwright -- --project=examples
```

### Interactive UI Mode
```bash
npm run test:playwright:ui
```

## Why This Approach?

### ✅ Benefits

1. **Maintainable**: Test the component API, not implementation examples
2. **Scalable**: Add Vue, Angular, Svelte examples without new test suites
3. **Fast**: Direct component testing is faster than full app testing
4. **Flexible**: Easy to add new test scenarios

### ❌ What We Don't Do

1. **Don't test individual example apps** - Examples are documentation, not production code
2. **Don't duplicate tests** - One test per feature, not per framework
3. **Don't test through real APIs** - Use localStorage mocks and fixtures

## Adding New Tests

### For New Component Features
Add thorough tests to `tests/component/ai-wallet.spec.ts`

### For New React Features
1. Update React wrapper in `src/react/`
2. Add test to `tests/react-integration/hooks.spec.ts`

### For New Framework Wrappers (Vue, Angular, etc.)
1. Create wrapper in `src/{framework}/`
2. Add API tests in `tests/{framework}-integration/`
3. Create example app in `examples/{framework}-app/`
4. Add smoke test in `tests/examples/{framework}-app.spec.ts`

### For New Example Apps
Create a simple smoke test in `tests/examples/` that just verifies:
- Example loads without errors
- Main component renders
- Basic interaction works

**Don't** duplicate all the feature tests - that's what `tests/component/` is for!

## Test Prerequisites

### Component Tests
These run against `http://localhost:5173` which should serve your component:
```bash
# Terminal 1: Build and serve your component
npm run build
# Or start dev server if configured
```

### React Integration Tests
These require the React example to be running:
```bash
# Terminal 1: Start React example
cd examples/react-app
npm run dev

# Terminal 2: Run tests
cd ../..
npm run test:playwright -- --project=react-integration
```

## CI/CD Recommendations

```yaml
# Example GitHub Actions workflow
test:
  - npm run build
  - npm run test:playwright
```

## Troubleshooting

### React integration tests fail
Make sure the React example is running: `cd examples/react-app && npm run dev`

### Tests are flaky
Increase timeout values in individual tests or adjust wait times for async operations.

### Port conflicts
If localhost:5173 is in use, update `playwright.config.ts` to use a different port.

## Testing Philosophy

This testing structure follows a **hybrid approach**:

### 🎯 Three Layers of Testing

1. **Component Tests** (Thorough) - `tests/component/`
   - Test the web component exhaustively
   - All features, edge cases, configurations
   - **This is your main test suite**

2. **Integration Tests** (API Focus) - `tests/{framework}-integration/`
   - Test framework wrapper APIs (hooks, context, etc.)
   - Verify the wrapper works in framework context
   - Don't re-test component features

3. **Example Smoke Tests** (Light) - `tests/examples/`
   - Just verify examples load and render
   - Basic interaction works
   - Catch breaking changes in examples
   - **NOT exhaustive feature testing**

### 📊 Test Distribution

```
Component tests:     ████████████████████  80% of test effort
Integration tests:   ████████              15% of test effort
Example smoke tests: ██                     5% of test effort
```

### ✅ DO:
- Test `src/components/` thoroughly
- Test `src/react/` API thoroughly
- Smoke test `examples/` lightly

### ❌ DON'T:
- Re-test component features in example tests
- Make examples hard to change due to tests
- Duplicate test logic across examples
