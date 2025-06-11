---
editUrl: false
next: false
prev: false
title: "getTransferMessage"
---

```ts
function getTransferMessage<TContext, TOutput>(agent): string
```

Generates the message that will be given as tool output to the model that requested the handoff.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)

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
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`agent`

</td>
<td>

[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\>

</td>
<td>

The agent to transfer to

</td>
</tr>
</tbody>
</table>

## Returns

`string`

The message that will be given as tool output to the model that requested the handoff
