---
editUrl: false
next: false
prev: false
title: "StreamEventTextStream"
---

```ts
type StreamEventTextStream = object;
```

Event returned by the model when new output text is available to stream to the user.

## Type declaration

### delta

```ts
delta: string;
```

The delta text that was streamed by the modelto the user.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "output_text_delta";
```
