---
editUrl: false
next: false
prev: false
title: "RealtimeSessionOptions"
---

```ts
type RealtimeSessionOptions<TContext> = object;
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

### apiKey

```ts
apiKey: ApiKey;
```

The API key to use for the connection. Pass a function to lazily load the API key

***

### config?

```ts
optional config: Partial<RealtimeSessionConfig>;
```

Additional session config options. Overrides default client options.

***

### context?

```ts
optional context: TContext;
```

Additional context to pass to the agent

***

### groupId?

```ts
optional groupId: string;
```

A group identifier to use for tracing, to link multiple traces together. For example, if you
want to connect your RealtimeSession traces with those of a backend text-based agent run.

***

### historyStoreAudio?

```ts
optional historyStoreAudio: boolean;
```

Whether the history copy should include a local copy of the audio data. By default it is not
included in the history to save runtime memory on the client. If you wish to keep this data
you can enable this option.

***

### model?

```ts
optional model: 
  | OpenAIRealtimeModels
  | string & object;
```

The model to use.

***

### outputGuardrails?

```ts
optional outputGuardrails: RealtimeOutputGuardrail[];
```

Any output guardrails to apply to agent output in parallel

***

### outputGuardrailSettings?

```ts
optional outputGuardrailSettings: RealtimeOutputGuardrailSettings;
```

Configure the behavior of your guardrails

***

### traceMetadata?

```ts
optional traceMetadata: Record<string, any>;
```

An optional dictionary of additional metadata to include with the trace.

***

### tracingDisabled?

```ts
optional tracingDisabled: boolean;
```

Whether tracing is disabled for this session. If disabled, we will not trace the agent run.

***

### transport

```ts
transport: 
  | "webrtc"
  | "websocket"
  | RealtimeTransportLayer;
```

The transport layer to use.

***

### workflowName?

```ts
optional workflowName: string;
```

The workflow name to use for tracing.
