---
editUrl: false
next: false
prev: false
title: "RealtimeSessionConfig"
---

```ts
type RealtimeSessionConfig = object;
```

## Properties

### inputAudioFormat

```ts
inputAudioFormat: RealtimeAudioFormat;
```

***

### inputAudioTranscription

```ts
inputAudioTranscription: Record<string, any>;
```

***

### instructions

```ts
instructions: string;
```

***

### modalities

```ts
modalities: ("text" | "audio")[];
```

***

### model

```ts
model: string;
```

***

### outputAudioFormat

```ts
outputAudioFormat: RealtimeAudioFormat;
```

***

### providerData?

```ts
optional providerData: Record<string, any>;
```

***

### toolChoice

```ts
toolChoice: ModelSettingsToolChoice;
```

***

### tools

```ts
tools: FunctionToolDefinition[];
```

***

### tracing?

```ts
optional tracing: RealtimeTracingConfig | null;
```

***

### turnDetection

```ts
turnDetection: Record<string, any>;
```

***

### voice

```ts
voice: string;
```
