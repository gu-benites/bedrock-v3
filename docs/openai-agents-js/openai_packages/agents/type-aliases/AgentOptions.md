---
editUrl: false
next: false
prev: false
title: "AgentOptions"
---

```ts
type AgentOptions<TContext, TOutput> = Expand<Pick<AgentConfiguration<TContext, TOutput>, "name"> & Partial<AgentConfiguration<TContext, TOutput>>>;
```

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
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents/type-aliases/textoutput/)

</td>
</tr>
</tbody>
</table>
