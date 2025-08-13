# Getting Started

## Overview

LLM Wallet is a component that aims to provide a fast and familiar interface for AI users, to configure their AI providers with your project.
It also allows users to sync their settings, this way your user onboarding will be faster, and your users don't need to search for their api keys anymore.

```bash
npm install ai-wallet
```

```typescript
import "ai-wallet/index.js";

const wallet = document.querySelector("ai-wallet");

wallet.on("connected", () => {
    console.log(wallet.endpoint);
    console.log(wallet.llmKey);
})
```

```html
<ai-wallet />
```


---

Built on top of [remotestorage.io](https://remotestorage.io/)