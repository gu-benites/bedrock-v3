---
editUrl: false
next: false
prev: false
title: "codeInterpreterTool"
---

```ts
function codeInterpreterTool(options): HostedTool
```

Adds code interpreter abilities to your agent

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

`options`

</td>
<td>

`Partial`\<`Omit`\<`CodeInterpreterTool`, `"type"`\>\>

</td>
<td>

Additional configuration for the code interpreter

</td>
</tr>
</tbody>
</table>

## Returns

`HostedTool`

a code interpreter tool definition
