---
editUrl: false
next: false
prev: false
title: "RealtimeTranportEventTypes"
---

```ts
type RealtimeTranportEventTypes = object;
```

## Indexable

```ts
[key: string]: any[]
```

## Properties

### \*

```ts
*: [TransportEvent];
```

A raw event from the transport layer. Allows a user to tap directly into the events of the
transport layer.

***

### audio

```ts
audio: [TransportLayerAudio];
```

Triggered when there is new audio data available. Might not be triggered if the transport layer
handles the audio internally (WebRTC).

***

### audio\_done

```ts
audio_done: [];
```

Triggered when the audio generation is done.

***

### audio\_interrupted

```ts
audio_interrupted: [];
```

Triggered when the model detected that it was interrupted. This can be used by the client
to stop audio playback.

***

### audio\_transcript\_delta

```ts
audio_transcript_delta: [TransportLayerTranscriptDelta];
```

Triggered when there is a new text delta of the transcript available.

***

### connection\_change

```ts
connection_change: [ConnectionStatus];
```

Triggered whenever the connection status of the transport changes.
Emits the new status after the change.

***

### error

```ts
error: [TransportError];
```

Triggered if the model / transport layer encountered an error

***

### function\_call

```ts
function_call: [TransportToolCallEvent];
```

Triggered when the model is trying to call a function.

***

### item\_deleted

```ts
item_deleted: [RealtimeBaseItem];
```

Triggered when an item is deleted.

***

### item\_update

```ts
item_update: [RealtimeItem];
```

Triggered when the history is added or updated.

***

### turn\_done

```ts
turn_done: [TransportLayerResponseCompleted];
```

Triggered when the model is done generating a response for a turn.

***

### turn\_started

```ts
turn_started: [TransportLayerResponseStarted];
```

Triggered when the model starts generating a response for a turn.

***

### usage\_update

```ts
usage_update: [Usage];
```

Triggered when the usage update is available.
