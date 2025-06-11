---
editUrl: false
next: false
prev: false
title: "WebSocketState"
---

```ts
type WebSocketState = 
  | {
  status: "disconnected";
  websocket: undefined;
 }
  | {
  status: "connecting";
  websocket: WebSocket;
 }
  | {
  status: "connected";
  websocket: WebSocket;
};
```

The connection state of the WebSocket connection.
