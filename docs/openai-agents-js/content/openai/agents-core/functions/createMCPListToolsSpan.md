---
editUrl: false
next: false
prev: false
title: "createMCPListToolsSpan"
---

```ts
function createMCPListToolsSpan(options?, parent?): Span<MCPListToolsSpanData>
```

Create a new MCP list tools span. The span will not be started automatically.

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

`DeepPartial`\<`CreateSpanOptions`\<`MCPListToolsSpanData`\>\>

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

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`MCPListToolsSpanData`\>
