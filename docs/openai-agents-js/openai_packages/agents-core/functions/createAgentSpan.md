---
editUrl: false
next: false
prev: false
title: "createAgentSpan"
---

```ts
function createAgentSpan(options?, parent?): Span<AgentSpanData>
```

Create a new agent span. The span will not be started automatically, you should either
use `withAgentSpan()` or call `span.start()` and `span.end()` manually.

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

`DeepPartial`\<`CreateSpanOptions`\<`AgentSpanData`\>\>

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

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`AgentSpanData`\>

The newly created agent span.
