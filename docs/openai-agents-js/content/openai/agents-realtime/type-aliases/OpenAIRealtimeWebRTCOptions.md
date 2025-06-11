---
editUrl: false
next: false
prev: false
title: "OpenAIRealtimeWebRTCOptions"
---

```ts
type OpenAIRealtimeWebRTCOptions = object & OpenAIRealtimeBaseOptions;
```

The options for the OpenAI Realtime WebRTC transport layer.

## Type declaration

### audioElement?

```ts
optional audioElement: HTMLAudioElement;
```

The audio element to use for audio playback. If not provided, a new audio element will be
created.

### baseUrl?

```ts
optional baseUrl: string;
```

Override of the base URL for the Realtime API

### mediaStream?

```ts
optional mediaStream: MediaStream;
```

The media stream to use for audio input. If not provided, the default microphone will be used.

### useInsecureApiKey?

```ts
optional useInsecureApiKey: boolean;
```

**Important**: Do not use this option unless you know what you are doing.

Whether to use an insecure API key. This has to be set if you are trying to use a regular
OpenAI API key instead of a client ephemeral key.

#### See

https://platform.openai.com/docs/guides/realtime#creating-an-ephemeral-token
