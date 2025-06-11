---
editUrl: false
next: false
prev: false
title: "OutputGuardrailFunction"
---

```ts
type OutputGuardrailFunction<TOutput> = (args) => Promise<GuardrailFunctionOutput>;
```

A function that takes an output guardrail function arguments and returns a `GuardrailFunctionOutput`.

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

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents/type-aliases/textoutput/)

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

`args`

</td>
<td>

[`OutputGuardrailFunctionArgs`](/openai-agents-js/openai/agents/interfaces/outputguardrailfunctionargs/)\<[`UnknownContext`](/openai-agents-js/openai/agents/type-aliases/unknowncontext/), `TOutput`\>

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<[`GuardrailFunctionOutput`](/openai-agents-js/openai/agents/interfaces/guardrailfunctionoutput/)\>
