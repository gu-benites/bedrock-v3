---
editUrl: false
next: false
prev: false
title: "RealtimeSessionEventTypes"
---

```ts
type RealtimeSessionEventTypes<TContext> = object;
```

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>

## Properties

### agent\_end

```ts
agent_end: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, string];
```

Triggered when an agent ends its work on a response.

***

### agent\_handoff

```ts
agent_handoff: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, AgentWithOrWithoutHistory<TContext>];
```

Triggered when an agent hands off to another agent.

***

### agent\_start

```ts
agent_start: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>];
```

Triggered when an agent starts its work on a response.

***

### agent\_tool\_end

```ts
agent_tool_end: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, FunctionTool<RealtimeContextData<TContext>>, string];
```

Triggered when an agent ends a tool call.

***

### agent\_tool\_start

```ts
agent_tool_start: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, FunctionTool<RealtimeContextData<TContext>>];
```

Triggered when an agent starts a tool call.

***

### audio

```ts
audio: [TransportLayerAudio];
```

Triggered when there is new audio data available for playing to the user.

***

### audio\_interrupted

```ts
audio_interrupted: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>];
```

Triggered when the agent is interrupted. Can be listened to by the user to stop audio playback
or give visual indicators to the user.

***

### audio\_start

```ts
audio_start: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>];
```

Triggered when the agent starts generating audio.

***

### audio\_stopped

```ts
audio_stopped: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>];
```

Triggered when the agent stops generating audio.

***

### error

```ts
error: [RealtimeSessionError];
```

Triggered when an error occurs.

***

### guardrail\_tripped

```ts
guardrail_tripped: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, OutputGuardrailTripwireTriggered<RealtimeGuardrailMetadata>];
```

Triggered when an output guardrail is tripped.

***

### history\_added

```ts
history_added: [RealtimeItem];
```

Triggered when a new item is added to the history. At this point the transcript/response
might still be in progress.

***

### history\_updated

```ts
history_updated: [RealtimeItem[]];
```

Triggered when the history got updated. Contains the full history of the conversation.

***

### tool\_approval\_requested

```ts
tool_approval_requested: [RunContext<RealtimeContextData<TContext>>, AgentWithOrWithoutHistory<TContext>, RealtimeToolApprovalRequest];
```

Triggered when a tool approval is requested.

***

### transport\_event

```ts
transport_event: [TransportEvent];
```

Emits all the raw events from the transport layer.
