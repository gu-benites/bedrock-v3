---
editUrl: false
next: false
prev: false
title: "addTraceProcessor"
---

```ts
function addTraceProcessor(processor): void
```

Add a processor to the list of processors. Each processor will receive all traces/spans.

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

`processor`

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents/interfaces/tracingprocessor/)

</td>
<td>

The processor to add.

</td>
</tr>
</tbody>
</table>

## Returns

`void`
