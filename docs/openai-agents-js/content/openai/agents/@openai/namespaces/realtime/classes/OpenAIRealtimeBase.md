---
editUrl: false
next: false
prev: false
title: "OpenAIRealtimeBase"
---

The transport layer is the layer that handles the connection to the model
and the communication with the model.

## Extends

- `EventEmitterDelegate`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimeeventtypes/)\>

## Extended by

- [`OpenAIRealtimeWebRTC`](/openai-agents-js/openai/agents/openai/namespaces/realtime/classes/openairealtimewebrtc/)
- [`OpenAIRealtimeWebSocket`](/openai-agents-js/openai/agents/openai/namespaces/realtime/classes/openairealtimewebsocket/)

## Implements

- [`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/)

## Constructors

### Constructor

```ts
new OpenAIRealtimeBase(options?): OpenAIRealtimeBase
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

`options`?

</td>
<td>

[`OpenAIRealtimeBaseOptions`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimebaseoptions/)

</td>
</tr>
</tbody>
</table>

#### Returns

`OpenAIRealtimeBase`

#### Overrides

```ts
EventEmitterDelegate<OpenAIRealtimeEventTypes>.constructor
```

## Properties

### muted

```ts
abstract readonly muted: null | boolean;
```

Whether the input audio track is currently muted
null if the muting is not handled by the transport layer

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`muted`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#muted)

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

***

### currentModel

#### Get Signature

```ts
get currentModel(): OpenAIRealtimeModels
```

The current model that is being used by the transport layer.

##### Returns

[`OpenAIRealtimeModels`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimemodels/)

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

[`OpenAIRealtimeModels`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimemodels/)

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

***

### status

#### Get Signature

```ts
get abstract status(): "connecting" | "connected" | "disconnected" | "disconnecting"
```

##### Returns

`"connecting"` \| `"connected"` \| `"disconnected"` \| `"disconnecting"`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`status`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#status)

## Methods

### close()

```ts
abstract close(): void
```

Closes the connection to the model

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`close`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#close)

***

### connect()

```ts
abstract connect(options): Promise<void>
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

[`RealtimeTransportLayerConnectOptions`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimetransportlayerconnectoptions/)

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

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`connect`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#connect)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimetranporteventtypes/)

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

[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimeeventtypes/)\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`emit`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#emit)

#### Inherited from

```ts
EventEmitterDelegate.emit
```

***

### interrupt()

```ts
abstract interrupt(): void
```

Interrupts the current turn. Used for example when a guardrail is triggered

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`interrupt`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#interrupt)

***

### mute()

```ts
abstract mute(muted): void
```

Mutes the input audio track

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

`muted`

</td>
<td>

`boolean`

</td>
<td>

Whether to mute the input audio track

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`mute`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#mute)

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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`off`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#off)

#### Inherited from

```ts
EventEmitterDelegate.off
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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`on`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#on)

#### Inherited from

```ts
EventEmitterDelegate.on
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

`K` *extends* keyof [`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimetranporteventtypes/)

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

`EventEmitter`\<[`OpenAIRealtimeEventTypes`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/openairealtimeeventtypes/)\>

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`once`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#once)

#### Inherited from

```ts
EventEmitterDelegate.once
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

[`RealtimeItem`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimeitem/)[]

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

[`RealtimeItem`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimeitem/)[]

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

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`resetHistory`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#resethistory)

***

### sendAudio()

```ts
sendAudio(audio, options?): void
```

Send an audio buffer to the Realtime API. If `{ commit: true }` is passed, the audio buffer
will be committed and the model will start processing it. This is necessary if you have
disabled turn detection / voice activity detection (VAD).

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`sendAudio`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#sendaudio)

***

### sendEvent()

```ts
abstract sendEvent(event): void
```

Sends a raw event to the model

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

[`RealtimeClientMessage`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimeclientmessage/)

</td>
<td>

The event to send

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`sendEvent`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#sendevent)

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

[`TransportToolCallEvent`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/transporttoolcallevent/)

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

#### Implementation of

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`sendFunctionCallOutput`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#sendfunctioncalloutput)

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

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`sendMessage`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#sendmessage)

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

`Partial`\<[`RealtimeSessionConfig`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimesessionconfig/)\>

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

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/).[`updateSessionConfig`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimetransportlayer/#updatesessionconfig)
