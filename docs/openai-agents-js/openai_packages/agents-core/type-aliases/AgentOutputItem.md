---
editUrl: false
next: false
prev: false
title: "AgentOutputItem"
---

```ts
type AgentOutputItem = 
  | UserMessageItem
  | AssistantMessageItem
  | SystemMessageItem
  | HostedToolCallItem
  | FunctionCallItem
  | ComputerUseCallItem
  | FunctionCallResultItem
  | ComputerCallResultItem
  | ReasoningItem
  | UnknownItem;
```

Agent output items
