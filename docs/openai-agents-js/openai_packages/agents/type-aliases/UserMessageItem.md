---
editUrl: false
next: false
prev: false
title: "UserMessageItem"
---

```ts
type UserMessageItem = object;
```

## Type declaration

### content

```ts
content: 
  | string
  | (
  | {
  providerData: Record<string, any>;
  text: string;
  type: "input_text";
 }
  | {
  image:   | string
     | {
     id: string;
    };
  providerData: Record<string, any>;
  type: "input_image";
 }
  | {
  file:   | string
     | {
     id: string;
    };
  providerData: Record<string, any>;
  type: "input_file";
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
role: "user";
```

### type?

```ts
optional type: "message";
```
