---
editUrl: false
next: false
prev: false
title: "FunctionCallResultItem"
---

```ts
type FunctionCallResultItem = object;
```

## Type declaration

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

The name of the tool that was called

### output

```ts
output: 
  | {
  providerData: Record<string, any>;
  text: string;
  type: "text";
 }
  | {
  data: string;
  mediaType: string;
  providerData: Record<string, any>;
  type: "image";
};
```

The output of the tool call.

#### Type declaration

\{
  `providerData`: `Record`\<`string`, `any`\>;
  `text`: `string`;
  `type`: `"text"`;
 \}

\{
  `data`: `string`;
  `mediaType`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"image"`;
 \}

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

The status of the tool call.

### type

```ts
type: "function_call_result";
```
