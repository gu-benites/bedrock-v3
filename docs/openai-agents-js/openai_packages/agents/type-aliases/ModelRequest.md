---
editUrl: false
next: false
prev: false
title: "ModelRequest"
---

```ts
type ModelRequest = object;
```

A request to a large language model.

## Properties

### handoffs

```ts
handoffs: SerializedHandoff[];
```

The handoffs to use for the model.

***

### input

```ts
input: 
  | string
  | AgentInputItem[];
```

The input to the model.

***

### modelSettings

```ts
modelSettings: ModelSettings;
```

The model settings to use for the model.

***

### outputType

```ts
outputType: SerializedOutputType;
```

The type of the output to use for the model.

***

### previousResponseId?

```ts
optional previousResponseId: string;
```

The ID of the previous response to use for the model.

***

### signal?

```ts
optional signal: AbortSignal;
```

An optional signal to abort the model request.

***

### systemInstructions?

```ts
optional systemInstructions: string;
```

The system instructions to use for the model.

***

### tools

```ts
tools: SerializedTool[];
```

The tools to use for the model.

***

### tracing

```ts
tracing: ModelTracing;
```

Whether to enable tracing for the model.
