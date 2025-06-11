---
editUrl: false
next: false
prev: false
title: "MCPServer"
---

Interface for MCP server implementations.
Provides methods for connecting, listing tools, calling tools, and cleanup.

## Properties

### cacheToolsList

```ts
cacheToolsList: boolean;
```

***

### name

```ts
readonly name: string;
```

## Methods

### callTool()

```ts
callTool(toolName, args): Promise<object[]>
```

#### Parameters

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

`toolName`

</td>
<td>

`string`

</td>
</tr>
<tr>
<td>

`args`

</td>
<td>

`null` \| `Record`\<`string`, `unknown`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`object`[]\>

***

### close()

```ts
close(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

***

### connect()

```ts
connect(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

***

### listTools()

```ts
listTools(): Promise<object[]>
```

#### Returns

`Promise`\<`object`[]\>
