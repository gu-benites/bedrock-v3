---
editUrl: false
next: false
prev: false
title: "TwilioRealtimeTransportLayer"
---

An adapter to connect a websocket that is receiving messages from Twilio's Media Streams API to
the OpenAI Realtime API via WebSocket.

It automatically handles setting the right audio format for the input and output audio, passing
the data along and handling the timing for interruptions using Twilio's `mark` events.

It does require you to run your own WebSocket server that is receiving connection requests from
Twilio.

It will emit all Twilio received messages as `twilio_message` type messages on the `*` handler.
If you are using a `RealtimeSession` you can listen to the `transport_event`.

## Example

```ts
const transport = new TwilioRealtimeTransportLayer({
  twilioWebSocket: twilioWebSocket,
});

transport.on('*', (event) => {
  if (event.type === 'twilio_message') {
    console.log('Twilio message:', event.data);
  }
});
```

## Extends

- `OpenAIRealtimeWebSocket`

## Constructors

### Constructor

```ts
new TwilioRealtimeTransportLayer(options): TwilioRealtimeTransportLayer
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options`

</td>
<td>

[`TwilioRealtimeTransportLayerOptions`](/openai-agents-js/openai/agents-extensions/type-aliases/twiliorealtimetransportlayeroptions/)

</td>
</tr>
</tbody>
</table>

#### Returns

`TwilioRealtimeTransportLayer`

#### Overrides

```ts
OpenAIRealtimeWebSocket.constructor
```

## Accessors

### \_tracingConfig

#### Set Signature

```ts
set _tracingConfig(tracingConfig): void
```

Sets the internal tracing config. This is used to track the tracing config that has been set
during the session.create event.

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`tracingConfig`

</td>
<td>

`null` \| `RealtimeTracingConfig`

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket._tracingConfig
```

***

### connectionState

#### Get Signature

```ts
get connectionState(): WebSocketState
```

The current connection state of the WebSocket connection.

##### Returns

`WebSocketState`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.connectionState
```

***

### currentModel

#### Get Signature

```ts
get currentModel(): OpenAIRealtimeModels
```

The current model that is being used by the transport layer.

##### Returns

`OpenAIRealtimeModels`

#### Set Signature

```ts
set currentModel(model): void
```

The current model that is being used by the transport layer.
**Note**: The model cannot be changed mid conversation.

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`model`

</td>
<td>

`OpenAIRealtimeModels`

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.currentModel
```

***

### muted

#### Get Signature

```ts
get muted(): null
```

Always returns `null` as the WebSocket transport layer does not handle muting. Instead,
this should be handled by the client by not triggering the `sendAudio` method.

##### Returns

`null`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.muted
```

***

### status

#### Get Signature

```ts
get status(): "connected" | "disconnected" | "connecting"
```

The current status of the WebSocket connection.

##### Returns

`"connected"` \| `"disconnected"` \| `"connecting"`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.status
```

## Methods

### \_cancelResponse()

```ts
_cancelResponse(): void
```

Send a cancel response event to the Realtime API. This is used to cancel an ongoing
 response that the model is currently generating.

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket._cancelResponse
```

***

### \_interrupt()

```ts
_interrupt(_elapsedTime): void
```

Do NOT call this method directly. Call `interrupt()` instead for proper interruption handling.

This method is used to send the right events to the API to inform the model that the user has
interrupted the response. It might be overridden/extended by an extended transport layer. See
the `TwilioRealtimeTransportLayer` for an example.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`_elapsedTime`

</td>
<td>

`number`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Overrides

```ts
OpenAIRealtimeWebSocket._interrupt
```

***

### \_setInputAndOutputAudioFormat()

```ts
_setInputAndOutputAudioFormat(partialConfig?): Partial<RealtimeSessionConfig>
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`partialConfig`?

</td>
<td>

`Partial`\<`RealtimeSessionConfig`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Partial`\<`RealtimeSessionConfig`\>

***

### close()

```ts
close(): void
```

Close the WebSocket connection.

This will also reset any internal connection tracking used for interruption handling.

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.close
```

***

### connect()

```ts
connect(options): Promise<void>
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options`

</td>
<td>

`RealtimeTransportLayerConnectOptions`

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
OpenAIRealtimeWebSocket.connect
```

***

### emit()

```ts
emit<K>(type, ...args): boolean
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RealtimeTranportEventTypes`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

...`args`

</td>
<td>

`OpenAIRealtimeEventTypes`\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.emit
```

***

### interrupt()

```ts
interrupt(): void
```

Interrupt the ongoing response. This method is triggered automatically by the client when
voice activity detection (VAD) is enabled (default) as well as when an output guardrail got
triggered.

You can also call this method directly if you want to interrupt the conversation for example
based on an event in the client.

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.interrupt
```

***

### mute()

```ts
mute(_muted): never
```

Will throw an error as the WebSocket transport layer does not support muting.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`_muted`

</td>
<td>

`boolean`

</td>
</tr>
</tbody>
</table>

#### Returns

`never`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.mute
```

***

### off()

```ts
off<K>(type, listener): EventEmitter<OpenAIRealtimeEventTypes>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RealtimeTranportEventTypes`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`OpenAIRealtimeEventTypes`\>

#### Inherited from

```ts
OpenAIRealtimeWebSocket.off
```

***

### on()

```ts
on<K>(type, listener): EventEmitter<OpenAIRealtimeEventTypes>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RealtimeTranportEventTypes`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`OpenAIRealtimeEventTypes`\>

#### Inherited from

```ts
OpenAIRealtimeWebSocket.on
```

***

### once()

```ts
once<K>(type, listener): EventEmitter<OpenAIRealtimeEventTypes>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RealtimeTranportEventTypes`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`OpenAIRealtimeEventTypes`\>

#### Inherited from

```ts
OpenAIRealtimeWebSocket.once
```

***

### resetHistory()

```ts
resetHistory(oldHistory, newHistory): void
```

Reset the history of the conversation. This will create a diff between the old and new history
and send the necessary events to the Realtime API to update the history.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`oldHistory`

</td>
<td>

`RealtimeItem`[]

</td>
<td>

The old history of the conversation.

</td>
</tr>
<tr>
<td>

`newHistory`

</td>
<td>

`RealtimeItem`[]

</td>
<td>

The new history of the conversation.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.resetHistory
```

***

### sendAudio()

```ts
sendAudio(audio, options?): void
```

Send an audio buffer to the Realtime API. This is used for your client to send audio to the
model to respond.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`audio`

</td>
<td>

`ArrayBuffer`

</td>
<td>

The audio buffer to send.

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

\{ `commit`: `boolean`; \}

</td>
<td>

The options for the audio buffer.

</td>
</tr>
<tr>
<td>

`options.commit`?

</td>
<td>

`boolean`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.sendAudio
```

***

### sendEvent()

```ts
sendEvent(event): void
```

Send an event to the Realtime API. This will stringify the event and send it directly to the
API. This can be used if you want to take control over the connection and send events manually.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`event`

</td>
<td>

`RealtimeClientMessage`

</td>
<td>

The event to send.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.sendEvent
```

***

### sendFunctionCallOutput()

```ts
sendFunctionCallOutput(
   toolCall, 
   output, 
   startResponse?): void
```

Send the output of a function call to the Realtime API.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`toolCall`

</td>
<td>

`TransportToolCallEvent`

</td>
<td>

The tool call to send the output for.

</td>
</tr>
<tr>
<td>

`output`

</td>
<td>

`string`

</td>
<td>

The output of the function call.

</td>
</tr>
<tr>
<td>

`startResponse`?

</td>
<td>

`boolean`

</td>
<td>

Whether to start a new response after sending the output.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.sendFunctionCallOutput
```

***

### sendMessage()

```ts
sendMessage(message, otherEventData): void
```

Send a message to the Realtime API. This will create a new item in the conversation and
trigger a response.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`message`

</td>
<td>

`RealtimeUserInput`

</td>
<td>

The message to send.

</td>
</tr>
<tr>
<td>

`otherEventData`

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

Additional event data to send.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.sendMessage
```

***

### updateSessionConfig()

```ts
updateSessionConfig(config): void
```

Updates the session config. This will merge it with the current session config with the default
values and send it to the Realtime API.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`config`

</td>
<td>

`Partial`\<`RealtimeSessionConfig`\>

</td>
<td>

The session config to update.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
OpenAIRealtimeWebSocket.updateSessionConfig
```
