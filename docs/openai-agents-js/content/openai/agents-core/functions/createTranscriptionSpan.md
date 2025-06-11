---
editUrl: false
next: false
prev: false
title: "createTranscriptionSpan"
---

```ts
function createTranscriptionSpan(options, parent?): Span<TranscriptionSpanData>
```

Create a new transcription span. The span will not be started automatically.

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

`DeepPartial`\<`CreateSpanOptions`\<`TranscriptionSpanData`\>\> & `object`

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

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`TranscriptionSpanData`\>
