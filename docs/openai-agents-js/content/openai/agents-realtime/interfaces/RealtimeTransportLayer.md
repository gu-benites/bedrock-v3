---
editUrl: false
next: false
prev: false
title: "RealtimeTransportLayer"
---

The transport layer is the layer that handles the connection to the model
and the communication with the model.

## Extends

- `EventEmitter`\<[`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)\>

## Properties

### muted

```ts
readonly muted: null | boolean;
```

Whether the input audio track is currently muted
null if the muting is not handled by the transport layer

***

### status

```ts
status: "connecting" | "connected" | "disconnected" | "disconnecting";
```

## Methods

### close()

```ts
close(): void
```

Closes the connection to the model

#### Returns

`void`

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

[`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Inherited from

```ts
EventEmitter.emit
```

***

### interrupt()

```ts
interrupt(): void
```

Interrupts the current turn. Used for example when a guardrail is triggered

#### Returns

`void`

***

### mute()

```ts
mute(muted): void
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

***

### off()

```ts
off<K>(type, listener): EventEmitter<RealtimeTranportEventTypes>
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

`EventEmitter`\<[`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)\>

#### Inherited from

```ts
EventEmitter.off
```

***

### on()

```ts
on<K>(type, listener): EventEmitter<RealtimeTranportEventTypes>
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

`EventEmitter`\<[`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)\>

#### Inherited from

```ts
EventEmitter.on
```

***

### once()

```ts
once<K>(type, listener): EventEmitter<RealtimeTranportEventTypes>
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

`EventEmitter`\<[`RealtimeTranportEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimetranporteventtypes/)\>

#### Inherited from

```ts
EventEmitter.once
```

***

### resetHistory()

```ts
resetHistory(oldHistory, newHistory): void
```

Resets the conversation history / context to a specific state

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

`oldHistory`

</td>
<td>

[`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

</td>
</tr>
<tr>
<td>

`newHistory`

</td>
<td>

[`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### sendAudio()

```ts
sendAudio(audio, options): void
```

Sends a raw audio buffer to the model

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

The audio buffer to send

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

Additional options

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

Whether to commit the audio buffer to the model. If the model does not do turn detection, this can be used to indicate the turn is completed.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### sendEvent()

```ts
sendEvent(event): void
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

[`RealtimeClientMessage`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeclientmessage/)

</td>
<td>

The event to send

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### sendFunctionCallOutput()

```ts
sendFunctionCallOutput(
   toolCall, 
   output, 
   startResponse): void
```

Sends a function call output to the model

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

[`TransportToolCallEvent`](/openai-agents-js/openai/agents-realtime/type-aliases/transporttoolcallevent/)

</td>
<td>

The tool call to send

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

The output of the tool call

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

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### sendMessage()

```ts
sendMessage(message, otherEventData): void
```

Sends a text message to the model

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

The message to send

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

Additional event data, will be merged into the event

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### updateSessionConfig()

```ts
updateSessionConfig(config): void
```

Sends an updated session configuration to the model. Used to update for example the model instructions during a handoff

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

The new session config

</td>
</tr>
</tbody>
</table>

#### Returns

`void`
