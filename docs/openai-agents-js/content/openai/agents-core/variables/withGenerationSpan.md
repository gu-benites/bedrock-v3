---
editUrl: false
next: false
prev: false
title: "withGenerationSpan"
---

```ts
const withGenerationSpan: <TOutput>(fn, ...args) => Promise<TOutput>;
```

Automatically create a generation span, run fn and close the span

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

`TOutput`

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

`fn`

</td>
<td>

(`span`) => `Promise`\<`TOutput`\>

</td>
</tr>
<tr>
<td>

...`args`

</td>
<td>

\[`DeepPartial`\<`CreateSpanOptions`\<`GenerationSpanData`\>\>, \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>\]

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<`TOutput`\>
