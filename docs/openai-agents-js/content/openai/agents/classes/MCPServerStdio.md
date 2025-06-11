---
editUrl: false
next: false
prev: false
title: "MCPServerStdio"
---

Public interface of an MCP server that provides tools.
You can use this class to pass MCP server settings to your agent.

## Extends

- `BaseMCPServerStdio`

## Constructors

### Constructor

```ts
new MCPServerStdio(options): MCPServerStdio
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

`options`

</td>
<td>

`MCPServerStdioOptions`

</td>
</tr>
</tbody>
</table>

#### Returns

`MCPServerStdio`

#### Overrides

```ts
BaseMCPServerStdio.constructor
```

## Properties

### cacheToolsList

```ts
cacheToolsList: boolean;
```

#### Inherited from

```ts
BaseMCPServerStdio.cacheToolsList
```

## Accessors

### name

#### Get Signature

```ts
get name(): string
```

##### Returns

`string`

#### Overrides

```ts
BaseMCPServerStdio.name
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

#### Overrides

```ts
BaseMCPServerStdio.callTool
```

***

### close()

```ts
close(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
BaseMCPServerStdio.close
```

***

### connect()

```ts
connect(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
BaseMCPServerStdio.connect
```

***

### listTools()

```ts
listTools(): Promise<object[]>
```

#### Returns

`Promise`\<`object`[]\>

#### Overrides

```ts
BaseMCPServerStdio.listTools
```
