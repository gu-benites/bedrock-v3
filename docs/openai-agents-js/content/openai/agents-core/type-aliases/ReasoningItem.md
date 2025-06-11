---
editUrl: false
next: false
prev: false
title: "ReasoningItem"
---

```ts
type ReasoningItem = object;
```

## Type declaration

### content

```ts
content: object[];
```

The user facing representation of the reasoning. Additional information might be in the `providerData` field.

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "reasoning";
```
