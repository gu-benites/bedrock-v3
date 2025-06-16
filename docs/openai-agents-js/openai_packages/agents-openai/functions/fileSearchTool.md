---
editUrl: false
next: false
prev: false
title: "fileSearchTool"
---

```ts
function fileSearchTool(vectorStoreIds, options): HostedTool
```

Adds file search abilities to your agent

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

`vectorStoreIds`

</td>
<td>

`string` \| `string`[]

</td>
<td>

The IDs of the vector stores to search.

</td>
</tr>
<tr>
<td>

`options`

</td>
<td>

`Partial`\<`Omit`\<`FileSearchTool`, `"type"` \| `"vectorStoreId"`\>\>

</td>
<td>

Additional configuration for the file search like specifying the maximum number of results to return.

</td>
</tr>
</tbody>
</table>

## Returns

`HostedTool`

a file search tool definition
