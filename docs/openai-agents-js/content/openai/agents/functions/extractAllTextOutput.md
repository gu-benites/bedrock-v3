---
editUrl: false
next: false
prev: false
title: "extractAllTextOutput"
---

```ts
function extractAllTextOutput(items): string
```

Extract all text output from a list of run items by concatenating the content of all
message output items.

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

`items`

</td>
<td>

[`RunItem`](/openai-agents-js/openai/agents/type-aliases/runitem/)[]

</td>
<td>

The list of run items to extract text from.

</td>
</tr>
</tbody>
</table>

## Returns

`string`

A string of all the text output from the run items.
