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

### providerData?

```ts
optional providerData: Record<string, any>;
```

### type

```ts
type: "output_text_delta";
```
