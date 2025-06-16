---
editUrl: false
next: false
prev: false
title: "AudioContent"
---

```ts
type AudioContent = object;
```

## Type declaration

### audio

```ts
audio: 
  | string
  | {
  id: string;
};
```

The audio input to the model. Could be base64 encoded audio data or an object with a file ID.

### format?

```ts
optional format: null | string;
```

The format of the audio.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### transcript?

```ts
optional transcript: null | string;
```

The transcript of the audio.

### type

```ts
type: "audio";
```
