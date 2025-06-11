---
editUrl: false
next: false
prev: false
title: "RealtimeAgentConfiguration"
---

```ts
type RealtimeAgentConfiguration<TContext> = Partial<Omit<AgentConfiguration<TContext, TextOutput>, 
  | "model"
  | "handoffs"
  | "modelSettings"
  | "outputType"
  | "toolUseBehavior"
  | "resetToolChoice"
  | "outputGuardrails"
  | "inputGuardrails"
  | "model">> & object;
```

## Type declaration

### handoffs?

```ts
optional handoffs: (
  | RealtimeAgent
  | Handoff)[];
```

Any other `RealtimeAgent` instances the agent is able to hand off to.

### name

```ts
name: string;
```

The name of your realtime agent.

### voice?

```ts
optional voice: string;
```

The voice intended to be used by the agent. If another agent already spoke during the
RealtimeSession, changing the voice during a handoff will fail.

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

[`UnknownContext`](/openai-agents-js/openai/agents/type-aliases/unknowncontext/)

</td>
</tr>
</tbody>
</table>
