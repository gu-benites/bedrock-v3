---
editUrl: false
next: false
prev: false
title: "WebRTCState"
---

```ts
type WebRTCState = 
  | {
  dataChannel: undefined;
  peerConnection: undefined;
  status: "disconnected";
 }
  | {
  dataChannel: RTCDataChannel;
  peerConnection: RTCPeerConnection;
  status: "connecting";
 }
  | {
  dataChannel: RTCDataChannel;
  peerConnection: RTCPeerConnection;
  status: "connected";
};
```

The connection state of the WebRTC connection.
