---
editUrl: false
next: false
prev: false
title: "InputImage"
---

```ts
type InputImage = object;
```

## Type declaration

### image

```ts
image: 
  | string
  | {
  id: string;
};
```

The image input to the model. Could be a URL, base64 or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "input_image";
```
