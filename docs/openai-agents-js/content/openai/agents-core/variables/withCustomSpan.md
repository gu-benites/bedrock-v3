---
editUrl: false
next: false
prev: false
title: "withCustomSpan"
---

```ts
const withCustomSpan: <TOutput>(fn, ...args) => Promise<TOutput>;
```

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

\[`DeepPartial`\<`CreateSpanOptions`\<`CustomSpanData`\>\> & `object`, \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>\]

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<`TOutput`\>
