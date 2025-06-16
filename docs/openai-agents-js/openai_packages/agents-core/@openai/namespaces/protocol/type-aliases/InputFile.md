---
editUrl: false
next: false
prev: false
title: "InputFile"
---

```ts
type InputFile = object;
```

## Type declaration

### file

```ts
file: 
  | string
  | {
  id: string;
};
```

The file input to the model. Could be a URL, base64 or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "input_file";
```
