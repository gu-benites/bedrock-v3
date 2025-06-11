---
editUrl: false
next: false
prev: false
title: "FunctionCallItem"
---

```ts
type FunctionCallItem = object;
```

## Type declaration

### arguments

```ts
arguments: string;
```

The arguments of the function call.

### callId

```ts
callId: string;
```

The ID of the tool call. Required to match up the respective tool call result.

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### name

```ts
name: string;
```

The name of the function.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status?

```ts
optional status: "in_progress" | "completed" | "incomplete";
```

The status of the function call.

### type

```ts
type: "function_call";
```
