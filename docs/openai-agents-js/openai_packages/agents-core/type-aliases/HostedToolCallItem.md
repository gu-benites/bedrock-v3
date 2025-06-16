---
editUrl: false
next: false
prev: false
title: "HostedToolCallItem"
---

```ts
type HostedToolCallItem = object;
```

## Type declaration

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

The name of the hosted tool. For example `web_search_call` or `file_search_call`

### output?

```ts
optional output: string;
```

The primary output of the tool call. Additional output might be in the `providerData` field.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status?

```ts
optional status: string;
```

The status of the tool call.

### type

```ts
type: "hosted_tool_call";
```
