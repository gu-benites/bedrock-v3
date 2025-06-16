---
editUrl: false
next: false
prev: false
title: "SystemMessageItem"
---

```ts
type SystemMessageItem = object;
```

## Type declaration

### content

```ts
content: string;
```

The content of the message.

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

### role

```ts
role: "system";
```

Representing a system message to the user

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message
