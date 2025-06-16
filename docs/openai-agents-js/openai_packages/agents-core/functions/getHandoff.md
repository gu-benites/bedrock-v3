---
editUrl: false
next: false
prev: false
title: "getHandoff"
---

```ts
function getHandoff<TContext, TOutput>(agent): Handoff<TContext, TOutput>
```

Returns a handoff for the given agent. If the agent is already wrapped into a handoff,
it will be returned as is. Otherwise, a new handoff instance will be created.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

The context of the handoff

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)

</td>
<td>

The output type of the handoff

</td>
</tr>
</tbody>
</table>

## Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`agent`

</td>
<td>

 \| [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\> \| [`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`TContext`, `TOutput`\>

</td>
</tr>
</tbody>
</table>

## Returns

[`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`TContext`, `TOutput`\>
