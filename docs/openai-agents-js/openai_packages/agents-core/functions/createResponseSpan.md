---
editUrl: false
next: false
prev: false
title: "createResponseSpan"
---

```ts
function createResponseSpan(options?, parent?): Span<ResponseSpanData>
```

Create a new response span. The span will not be started automatically, you should either
use `withResponseSpan()` or call `span.start()` and `span.end()` manually.

This span captures the details of a model response, primarily the response identifier.
If you need to capture detailed generation information such as input/output messages,
model configuration, or usage data, use `createGenerationSpan()` instead.

## Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options`?

</td>
<td>

`DeepPartial`\<`CreateSpanOptions`\<`ResponseSpanData`\>\>

</td>
<td>

Optional span creation options, including span data and identifiers.

</td>
</tr>
<tr>
<td>

`parent`?

</td>
<td>

 \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

</td>
<td>

The parent span or trace. If not provided, the current trace/span will be used
automatically.

</td>
</tr>
</tbody>
</table>

## Returns

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`ResponseSpanData`\>

The newly created response span.
