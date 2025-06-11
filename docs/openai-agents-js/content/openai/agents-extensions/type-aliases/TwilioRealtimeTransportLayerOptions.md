---
editUrl: false
next: false
prev: false
title: "TwilioRealtimeTransportLayerOptions"
---

```ts
type TwilioRealtimeTransportLayerOptions = OpenAIRealtimeWebSocketOptions & object;
```

The options for the Twilio Realtime Transport Layer.

## Type declaration

### twilioWebSocket

```ts
twilioWebSocket: WebSocket;
```

The websocket that is receiving messages from Twilio's Media Streams API. Typically the
connection gets passed into your request handler when running your WebSocket server.
