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

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

### role

```ts
role: "assistant";
```

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

### type?

```ts
optional type: "message";
```
