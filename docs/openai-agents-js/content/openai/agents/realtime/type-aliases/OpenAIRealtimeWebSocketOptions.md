---
editUrl: false
next: false
prev: false
title: "OpenAIRealtimeWebSocketOptions"
---

```ts
type OpenAIRealtimeWebSocketOptions = object & OpenAIRealtimeBaseOptions;
```

The options for the OpenAI Realtime WebSocket transport layer.

## Type declaration

### useInsecureApiKey?

```ts
optional useInsecureApiKey: boolean;
```

**Important**: Do not use this option unless you know what you are doing.

Whether to use an insecure API key. This has to be set if you are trying to use a regular
OpenAI API key instead of a client ephemeral key.

#### See

https://platform.openai.com/docs/guides/realtime#creating-an-ephemeral-token
