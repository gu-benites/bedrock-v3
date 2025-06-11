---
editUrl: false
next: false
prev: false
title: "OpenAIRealtimeWebSocket"
---

Transport layer that's handling the connection between the client and OpenAI's Realtime API
via WebSockets. While this transport layer is designed to be used within a RealtimeSession, it
can also be used standalone if you want to have a direct connection to the Realtime API.

## Extends

- [`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/)

## Implements

- [`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/)

## Constructors

### Constructor

```ts
new OpenAIRealtimeWebSocket(options): OpenAIRealtimeWebSocket
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

[`OpenAIRealtimeWebSocketOptions`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimewebsocketoptions/)

</td>
</tr>
</tbody>
</table>

#### Returns

`OpenAIRealtimeWebSocket`

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`constructor`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#constructor)

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

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`_tracingConfig`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#_tracingconfig)

***

### connectionState

#### Get Signature

```ts
get connectionState(): WebSocketState
```

The current connection state of the WebSocket connection.

##### Returns

[`WebSocketState`](/openai-agents-js/openai/agents-realtime/type-aliases/websocketstate/)

***

### currentModel

#### Get Signature

```ts
get currentModel(): OpenAIRealtimeModels
```

The current model that is being used by the transport layer.

##### Returns

[`OpenAIRealtimeModels`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimemodels/)

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

[`OpenAIRealtimeModels`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimemodels/)

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`currentModel`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#currentmodel)

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

Whether the input audio track is currently muted
null if the muting is not handled by the transport layer

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`muted`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#muted)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`muted`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#muted)

***

### status

#### Get Signature

```ts
get status(): "connecting" | "connected" | "disconnected"
```

The current status of the WebSocket connection.

##### Returns

`"connecting"` \| `"connected"` \| `"disconnected"`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`status`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#status)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`status`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#status)

## Methods

### \_cancelResponse()

```ts
_cancelResponse(): void
```

Send a cancel response event to the Realtime API. This is used to cancel an ongoing
 response that the model is currently generating.

#### Returns

`void`

***

### \_interrupt()

```ts
_interrupt(elapsedTime): void
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
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`elapsedTime`

</td>
<td>

`number`

</td>
<td>

The elapsed time since the response started.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### close()

```ts
close(): void
```

Close the WebSocket connection.

This will also reset any internal connection tracking used for interruption handling.

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`close`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#close)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`close`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#close)

***

### connect()

```ts
connect(options): Promise<void>
```

Establishes the connection to the model and keeps the connection alive

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

`options`

</td>
<td>

[`RealtimeTransportLayerConnectOptions`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransportlayerconnectoptions/)

</td>
<td>

The options for the connection

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`connect`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#connect)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`connect`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#connect)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)

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

[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimeeventtypes/)\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`emit`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#emit)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`emit`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#emit)

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`interrupt`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#interrupt)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`interrupt`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#interrupt)

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`mute`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#mute)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`mute`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#mute)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`off`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#off)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`off`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#off)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`on`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#on)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`on`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#on)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`once`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#once)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`once`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#once)

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

[`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

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

[`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

</td>
<td>

The new history of the conversation.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`resetHistory`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#resethistory)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`resetHistory`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#resethistory)

***

### sendAudio()

```ts
sendAudio(audio, options): void
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

`options`

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendAudio`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendaudio)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendAudio`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendaudio)

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

[`RealtimeClientMessage`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeclientmessage/)

</td>
<td>

The event to send.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendEvent`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendevent)

#### Overrides

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendEvent`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendevent)

***

### sendFunctionCallOutput()

```ts
sendFunctionCallOutput(
   toolCall, 
   output, 
   startResponse): void
```

Send the output of a function call to the Realtime API.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Default value</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`toolCall`

</td>
<td>

[`TransportToolCallEvent`](/openai-agents-js/openai/agents-realtime/type-aliases/transporttoolcallevent/)

</td>
<td>

`undefined`

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

`undefined`

</td>
<td>

The output of the function call.

</td>
</tr>
<tr>
<td>

`startResponse`

</td>
<td>

`boolean`

</td>
<td>

`true`

</td>
<td>

Whether to start a new response after sending the output.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendFunctionCallOutput`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendfunctioncalloutput)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendFunctionCallOutput`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendfunctioncalloutput)

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendMessage`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendmessage)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendMessage`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendmessage)

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

`Partial`\<[`RealtimeSessionConfig`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)\>

</td>
<td>

The session config to update.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`updateSessionConfig`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#updatesessionconfig)

#### Inherited from

[`OpenAIRealtimeBase`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`updateSessionConfig`](/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#updatesessionconfig)
