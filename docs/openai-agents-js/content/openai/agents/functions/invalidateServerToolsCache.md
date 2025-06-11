---
editUrl: false
next: false
prev: false
title: "invalidateServerToolsCache"
---

```ts
function invalidateServerToolsCache(serverName): void
```

Remove cached tools for the given server so the next lookup fetches fresh data.

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

`serverName`

</td>
<td>

`string`

</td>
<td>

Name of the MCP server whose cache should be cleared.

</td>
</tr>
</tbody>
</table>

## Returns

`void`
