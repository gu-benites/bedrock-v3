---
editUrl: false
next: false
prev: false
title: "withResponseSpan"
---

```ts
const withResponseSpan: <TOutput>(fn, options?, parent?) => Promise<TOutput>;
```

Create a new response span and automatically start and end it.

This span captures the details of a model response, primarily the response identifier.
If you need to capture detailed generation information such as input/output messages,
model configuration, or usage data, use `generationSpan()` instead.

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

`options`?

</td>
<td>

`DeepPartial`\<`CreateSpanOptions`\<`ResponseSpanData`\>\>

</td>
</tr>
<tr>
<td>

`parent`?

</td>
<td>

 \| [`Trace`](/openai-agents-js/openai/agents/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents/classes/span/)\<`any`\>

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<`TOutput`\>
