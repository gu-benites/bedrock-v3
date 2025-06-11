---
editUrl: false
next: false
prev: false
title: "ToolsToFinalOutputResult"
---

```ts
type ToolsToFinalOutputResult = 
  | {
  isFinalOutput: false;
  isInterrupted: undefined;
 }
  | {
  interruptions: RunToolApprovalItem[];
  isFinalOutput: false;
  isInterrupted: true;
 }
  | {
  finalOutput: string;
  isFinalOutput: true;
  isInterrupted: undefined;
};
```

## Type declaration

\{
  `isFinalOutput`: `false`;
  `isInterrupted`: `undefined`;
 \}

### isFinalOutput

```ts
isFinalOutput: false;
```

Wether this is the final output. If `false`, the LLM will run again and receive the tool call output

### isInterrupted

```ts
isInterrupted: undefined;
```

Wether the agent was interrupted by a tool approval. If `true`, the LLM will run again and receive the tool call output

\{
  `interruptions`: [`RunToolApprovalItem`](/openai-agents-js/openai/agents/classes/runtoolapprovalitem/)[];
  `isFinalOutput`: `false`;
  `isInterrupted`: `true`;
 \}

### interruptions

```ts
interruptions: RunToolApprovalItem[];
```

### isFinalOutput

```ts
isFinalOutput: false;
```

### isInterrupted

```ts
isInterrupted: true;
```

Wether the agent was interrupted by a tool approval. If `true`, the LLM will run again and receive the tool call output

\{
  `finalOutput`: `string`;
  `isFinalOutput`: `true`;
  `isInterrupted`: `undefined`;
 \}

### finalOutput

```ts
finalOutput: string;
```

The final output. Can be undefined if `isFinalOutput` is `false`, otherwise it must be a string
that will be processed based on the `outputType` of the agent.

### isFinalOutput

```ts
isFinalOutput: true;
```

Wether this is the final output. If `false`, the LLM will run again and receive the tool call output

### isInterrupted

```ts
isInterrupted: undefined;
```

Wether the agent was interrupted by a tool approval. If `true`, the LLM will run again and receive the tool call output
