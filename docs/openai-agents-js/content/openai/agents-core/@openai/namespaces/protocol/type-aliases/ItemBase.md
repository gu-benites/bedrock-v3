---
editUrl: false
next: false
prev: false
title: "ItemBase"
---

```ts
type ItemBase = object;
```

Every item has a shared of shared item data including an optional ID.

## Type declaration

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.
