---
editUrl: false
next: false
prev: false
title: "run"
---

## Call Signature

```ts
function run<TAgent, TContext>(
   agent, 
   input, 
options?): Promise<RunResult<TContext, TAgent>>
```

### Type Parameters

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

`TAgent` *extends* [`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`any`, `any`\>

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`TContext`

</td>
<td>

`undefined`

</td>
</tr>
</tbody>
</table>

### Parameters

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

`TAgent`

</td>
</tr>
<tr>
<td>

`input`

</td>
<td>

 \| `string` \| [`AgentInputItem`](/openai-agents-js/openai/agents/type-aliases/agentinputitem/)[] \| [`RunState`](/openai-agents-js/openai/agents/classes/runstate/)\<`TContext`, `TAgent`\>

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

[`NonStreamRunOptions`](/openai-agents-js/openai/agents/type-aliases/nonstreamrunoptions/)\<`TContext`\>

</td>
</tr>
</tbody>
</table>

### Returns

`Promise`\<[`RunResult`](/openai-agents-js/openai/agents/classes/runresult/)\<`TContext`, `TAgent`\>\>

## Call Signature

```ts
function run<TAgent, TContext>(
   agent, 
   input, 
options?): Promise<StreamedRunResult<TContext, TAgent>>
```

### Type Parameters

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

`TAgent` *extends* [`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`any`, `any`\>

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`TContext`

</td>
<td>

`undefined`

</td>
</tr>
</tbody>
</table>

### Parameters

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

`TAgent`

</td>
</tr>
<tr>
<td>

`input`

</td>
<td>

 \| `string` \| [`AgentInputItem`](/openai-agents-js/openai/agents/type-aliases/agentinputitem/)[] \| [`RunState`](/openai-agents-js/openai/agents/classes/runstate/)\<`TContext`, `TAgent`\>

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

[`StreamRunOptions`](/openai-agents-js/openai/agents/type-aliases/streamrunoptions/)\<`TContext`\>

</td>
</tr>
</tbody>
</table>

### Returns

`Promise`\<[`StreamedRunResult`](/openai-agents-js/openai/agents/classes/streamedrunresult/)\<`TContext`, `TAgent`\>\>
