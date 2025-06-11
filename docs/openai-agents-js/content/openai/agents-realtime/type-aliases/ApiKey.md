---
editUrl: false
next: false
prev: false
title: "ApiKey"
---

```ts
type ApiKey = string | () => string | Promise<string>;
```

The type of the API key. Can be a string or a function that returns a string or a promise that
resolves to a string.
