---
editUrl: false
next: false
prev: false
title: "InputGuardrailFunction"
---

```ts
type InputGuardrailFunction = (args) => Promise<GuardrailFunctionOutput>;
```

The function that performs the actual input guardrail check and returns the decision on whether
a guardrail was triggered.

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

[`InputGuardrailFunctionArgs`](/openai-agents-js/openai/agents/interfaces/inputguardrailfunctionargs/)

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<[`GuardrailFunctionOutput`](/openai-agents-js/openai/agents/interfaces/guardrailfunctionoutput/)\>
