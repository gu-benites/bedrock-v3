---
editUrl: false
next: false
prev: false
title: "getAllMcpTools"
---

```ts
function getAllMcpTools<TContext>(mcpServers, convertSchemasToStrict): Promise<Tool<TContext>[]>
```

Returns all MCP tools from the provided servers, using the function tool conversion.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>

## Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Default value</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`mcpServers`

</td>
<td>

[`MCPServer`](/openai-agents-js/openai/agents-core/interfaces/mcpserver/)[]

</td>
<td>

`undefined`

</td>
</tr>
<tr>
<td>

`convertSchemasToStrict`

</td>
<td>

`boolean`

</td>
<td>

`false`

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<[`Tool`](/openai-agents-js/openai/agents-core/type-aliases/tool/)\<`TContext`\>[]\>
