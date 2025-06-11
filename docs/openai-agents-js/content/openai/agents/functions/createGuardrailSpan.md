---
editUrl: false
next: false
prev: false
title: "createGuardrailSpan"
---

```ts
function createGuardrailSpan(options, parent?): Span<GuardrailSpanData>
```

Create a new guardrail span. The span will not be started automatically, you should either use
`withGuardrailSpan()` or call `span.start()` and `span.end()` manually.

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

`options`

</td>
<td>

`DeepPartial`\<`CreateSpanOptions`\<`GuardrailSpanData`\>\> & `object`

</td>
</tr>
<tr>
<td>

`parent`?

</td>
<td>

 \| [`Span`](/openai-agents-js/openai/agents/classes/span/)\<`any`\> \| [`Trace`](/openai-agents-js/openai/agents/classes/trace/)

</td>
</tr>
</tbody>
</table>

## Returns

[`Span`](/openai-agents-js/openai/agents/classes/span/)\<`GuardrailSpanData`\>
