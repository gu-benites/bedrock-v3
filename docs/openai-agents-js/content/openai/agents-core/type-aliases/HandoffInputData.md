---
editUrl: false
next: false
prev: false
title: "HandoffInputData"
---

```ts
type HandoffInputData = object;
```

Data passed to the handoff function.

## Properties

### inputHistory

```ts
inputHistory: 
  | string
  | AgentInputItem[];
```

The input history before `Runner.run()` was called.

***

### newItems

```ts
newItems: RunItem[];
```

The new items generated during the current agent turn, including the item that triggered the
handoff and the tool output message representing the response from the handoff output.

***

### preHandoffItems

```ts
preHandoffItems: RunItem[];
```

The items generated before the agent turn where the handoff was invoked.
