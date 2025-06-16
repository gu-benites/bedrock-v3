---
editUrl: false
next: false
prev: false
title: "ToolUseBehavior"
---

```ts
type ToolUseBehavior = 
  | ToolUseBehaviorFlags
  | {
  stopAtToolNames: string[];
 }
  | ToolToFinalOutputFunction;
```

The behavior of the agent when a tool is called.

## Type declaration

[`ToolUseBehaviorFlags`](/openai-agents-js/openai/agents/type-aliases/toolusebehaviorflags/)

\{
  `stopAtToolNames`: `string`[];
 \}

### stopAtToolNames

```ts
stopAtToolNames: string[];
```

List of tool names that will stop the agent from running further. The final output will be
the output of the first tool in the list that was called.

[`ToolToFinalOutputFunction`](/openai-agents-js/openai/agents/type-aliases/tooltofinaloutputfunction/)
