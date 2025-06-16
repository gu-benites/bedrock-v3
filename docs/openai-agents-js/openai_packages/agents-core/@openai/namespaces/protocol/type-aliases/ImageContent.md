---
editUrl: false
next: false
prev: false
title: "ImageContent"
---

```ts
type ImageContent = object;
```

## Type declaration

### image

```ts
image: string;
```

The image input to the model. Could be base64 encoded image data or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "image";
```
