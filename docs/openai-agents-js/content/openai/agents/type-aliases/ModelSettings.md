---
editUrl: false
next: false
prev: false
title: "ModelSettings"
---

```ts
type ModelSettings = object;
```

Settings to use when calling an LLM.

This class holds optional model configuration parameters (e.g. temperature,
topP, penalties, truncation, etc.).

Not all models/providers support all of these parameters, so please check the API documentation
for the specific model and provider you are using.

## Properties

### frequencyPenalty?

```ts
optional frequencyPenalty: number;
```

The frequency penalty to use when calling the model.

***

### maxTokens?

```ts
optional maxTokens: number;
```

The maximum number of output tokens to generate.

***

### parallelToolCalls?

```ts
optional parallelToolCalls: boolean;
```

Whether to use parallel tool calls when calling the model.
Defaults to false if not provided.

***

### presencePenalty?

```ts
optional presencePenalty: number;
```

The presence penalty to use when calling the model.

***

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional provider specific settings to be passed directly to the model
request.

***

### store?

```ts
optional store: boolean;
```

Whether to store the generated model response for later retrieval.
Defaults to true if not provided.

***

### temperature?

```ts
optional temperature: number;
```

The temperature to use when calling the model.

***

### toolChoice?

```ts
optional toolChoice: ModelSettingsToolChoice;
```

The tool choice to use when calling the model.

***

### topP?

```ts
optional topP: number;
```

The topP to use when calling the model.

***

### truncation?

```ts
optional truncation: "auto" | "disabled";
```

The truncation strategy to use when calling the model.
