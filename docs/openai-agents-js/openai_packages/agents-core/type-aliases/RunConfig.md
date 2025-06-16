---
editUrl: false
next: false
prev: false
title: "RunConfig"
---

```ts
type RunConfig = object;
```

Configures settings for the entire agent run.

## Properties

### groupId?

```ts
optional groupId: string;
```

A grouping identifier to use for tracing, to link multiple traces from the same conversation
or process. For example, you might use a chat thread ID.

***

### handoffInputFilter?

```ts
optional handoffInputFilter: HandoffInputFilter;
```

A global input filter to apply to all handoffs. If `Handoff.inputFilter` is set, then that
will take precedence. The input filter allows you to edit the inputs that are sent to the new
agent. See the documentation in `Handoff.inputFilter` for more details.

***

### inputGuardrails?

```ts
optional inputGuardrails: InputGuardrail[];
```

A list of input guardrails to run on the initial run input.

***

### model?

```ts
optional model: 
  | string
  | Model;
```

The model to use for the entire agent run. If set, will override the model set on every
agent. The modelProvider passed in below must be able to resolve this model name.

***

### modelProvider

```ts
modelProvider: ModelProvider;
```

The model provider to use when looking up string model names. Defaults to OpenAI.

***

### modelSettings?

```ts
optional modelSettings: ModelSettings;
```

Configure global model settings. Any non-null values will override the agent-specific model
settings.

***

### outputGuardrails?

```ts
optional outputGuardrails: OutputGuardrail<AgentOutputType<unknown>>[];
```

A list of output guardrails to run on the final output of the run.

***

### traceId?

```ts
optional traceId: string;
```

A custom trace ID to use for tracing. If not provided, we will generate a new trace ID.

***

### traceIncludeSensitiveData

```ts
traceIncludeSensitiveData: boolean;
```

Whether we include potentially sensitive data (for example: inputs/outputs of tool calls or
LLM generations) in traces. If false, we'll still create spans for these events, but the
sensitive data will not be included.

***

### traceMetadata?

```ts
optional traceMetadata: Record<string, any>;
```

An optional dictionary of additional metadata to include with the trace.

***

### tracingDisabled

```ts
tracingDisabled: boolean;
```

Whether tracing is disabled for the agent run. If disabled, we will not trace the agent run.

***

### workflowName?

```ts
optional workflowName: string;
```

The name of the run, used for tracing. Should be a logical name for the run, like
"Code generation workflow" or "Customer support agent".
