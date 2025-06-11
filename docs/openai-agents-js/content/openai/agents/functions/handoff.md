---
editUrl: false
next: false
prev: false
title: "handoff"
---

```ts
function handoff<TContext, TOutput, TInputType>(agent, config?): Handoff<TContext, TOutput>
```

Creates a handoff from an agent. Handoffs are automatically created when you pass an agent
into the `handoffs` option of the `Agent` constructor. Alternatively, you can use this function
to create a handoff manually, giving you more control over configuration.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

`unknown`

</td>
<td>

The context of the handoff

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)

</td>
<td>

`"text"`

</td>
<td>

The output type of the handoff

</td>
</tr>
<tr>
<td>

`TInputType` *extends* `ToolInputParameters`

</td>
<td>

`ToolInputParameters`

</td>
<td>

The input type of the handoff

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

[`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`TContext`, `TOutput`\>

</td>
</tr>
<tr>
<td>

`config`?

</td>
<td>

`HandoffConfig`\<`TInputType`\>

</td>
</tr>
</tbody>
</table>

## Returns

[`Handoff`](/openai-agents-js/openai/agents/classes/handoff/)\<`TContext`, `TOutput`\>
