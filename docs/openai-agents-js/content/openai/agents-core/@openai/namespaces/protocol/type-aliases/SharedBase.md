---
editUrl: false
next: false
prev: false
title: "SharedBase"
---

```ts
type SharedBase = object;
```

Every item in the protocol provides a `providerData` field to accomodate custom functionality
or new fields

## Type declaration

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.
