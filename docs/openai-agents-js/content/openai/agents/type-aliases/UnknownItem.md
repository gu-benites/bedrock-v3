---
editUrl: false
next: false
prev: false
title: "UnknownItem"
---

```ts
type UnknownItem = object;
```

This is a catch all for items that are not part of the protocol.

For example, a model might return an item that is not part of the protocol using this type.

In that case everything returned from the model should be passed in the `providerData` field.

This enables new features to be added to be added by a model provider without breaking the protocol.

## Type declaration

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

### type

```ts
type: "unknown";
```
