---
editUrl: false
next: false
prev: false
title: "withMCPListToolsSpan"
---

```ts
const withMCPListToolsSpan: <TOutput>(fn, options?, parent?) => Promise<TOutput>;
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

`options`?

</td>
<td>

`DeepPartial`\<`CreateSpanOptions`\<`MCPListToolsSpanData`\>\>

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
