---
editUrl: false
next: false
prev: false
title: "ComputerToolOutput"
---

```ts
type ComputerToolOutput = object;
```

## Type declaration

### data

```ts
data: string;
```

A base64 encoded image data or a URL representing the screenshot.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "computer_screenshot";
```
