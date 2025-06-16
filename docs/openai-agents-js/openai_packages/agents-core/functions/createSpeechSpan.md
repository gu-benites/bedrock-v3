---
editUrl: false
next: false
prev: false
title: "createSpeechSpan"
---

```ts
function createSpeechSpan(options, parent?): Span<SpeechSpanData>
```

Create a new speech span. The span will not be started automatically.

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

`DeepPartial`\<`CreateSpanOptions`\<`SpeechSpanData`\>\> & `object`

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

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`SpeechSpanData`\>
