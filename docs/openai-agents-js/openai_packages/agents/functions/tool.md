---
editUrl: false
next: false
prev: false
title: "tool"
---

```ts
function tool<TParameters, Context, Result>(options): FunctionTool<Context, TParameters, Result>
```

Exposes a function to the agent as a tool to be called

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

`TParameters` *extends* `ToolInputParameters`

</td>
<td>

`undefined`

</td>
</tr>
<tr>
<td>

`Context`

</td>
<td>

`unknown`

</td>
</tr>
<tr>
<td>

`Result`

</td>
<td>

`string`

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
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options`

</td>
<td>

`ToolOptions`\<`TParameters`, `Context`\>

</td>
<td>

The options for the tool

</td>
</tr>
</tbody>
</table>

## Returns

[`FunctionTool`](/openai-agents-js/openai/agents/type-aliases/functiontool/)\<`Context`, `TParameters`, `Result`\>

A new tool
