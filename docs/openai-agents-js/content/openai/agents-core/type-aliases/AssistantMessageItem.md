---
editUrl: false
next: false
prev: false
title: "AssistantMessageItem"
---

```ts
type AssistantMessageItem = object;
```

## Type declaration

### content

```ts
content: (
  | {
  providerData: Record<string, any>;
  refusal: string;
  type: "refusal";
 }
  | {
  providerData: Record<string, any>;
  text: string;
  type: "output_text";
 }
  | {
  providerData: Record<string, any>;
  text: string;
  type: "input_text";
 }
  | {
  audio:   | string
     | {
     id: string;
    };
  format: null | string;
  providerData: Record<string, any>;
  transcript: null | string;
  type: "audio";
 }
  | {
  image: string;
  providerData: Record<string, any>;
  type: "image";
 })[];
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
role: "assistant";
```

Representing a message from the assistant (i.e. the model)

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

The status of the message.

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message
