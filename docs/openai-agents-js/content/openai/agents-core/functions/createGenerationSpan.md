---
editUrl: false
next: false
prev: false
title: "createGenerationSpan"
---

```ts
function createGenerationSpan(options?, parent?): Span<GenerationSpanData>
```

Create a new generation span. The span will not be started automatically, you should either
use `withGenerationSpan()` or call `span.start()` and `span.end()` manually.

This span captures the details of a model generation, including input/output message
sequences, model information, and usage data. If you only need to capture a model response
identifier, consider using `createResponseSpan()` instead.

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

`options`?

</td>
<td>

`DeepPartial`\<`CreateSpanOptions`\<`GenerationSpanData`\>\>

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

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`GenerationSpanData`\>
