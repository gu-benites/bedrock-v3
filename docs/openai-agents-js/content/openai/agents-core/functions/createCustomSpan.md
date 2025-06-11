---
editUrl: false
next: false
prev: false
title: "createCustomSpan"
---

```ts
function createCustomSpan(options, parent?): Span<CustomSpanData>
```

Create a new custom span. The span will not be started automatically, you should either use
`withCustomSpan()` or call `span.start()` and `span.end()` manually.

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

`DeepPartial`\<`CreateSpanOptions`\<`CustomSpanData`\>\> & `object`

</td>
</tr>
<tr>
<td>

`parent`?

</td>
<td>

 \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

</td>
</tr>
</tbody>
</table>

## Returns

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`CustomSpanData`\>
