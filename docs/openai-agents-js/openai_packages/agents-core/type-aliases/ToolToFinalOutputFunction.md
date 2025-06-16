---
editUrl: false
next: false
prev: false
title: "ToolToFinalOutputFunction"
---

```ts
type ToolToFinalOutputFunction = (context, toolResults) => 
  | ToolsToFinalOutputResult
| Promise<ToolsToFinalOutputResult>;
```

A function that takes a run context and a list of tool results and returns a `ToolsToFinalOutputResult`.

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

`context`

</td>
<td>

[`RunContext`](/openai-agents-js/openai/agents-core/classes/runcontext/)

</td>
</tr>
<tr>
<td>

`toolResults`

</td>
<td>

[`FunctionToolResult`](/openai-agents-js/openai/agents-core/type-aliases/functiontoolresult/)[]

</td>
</tr>
</tbody>
</table>

## Returns

  \| [`ToolsToFinalOutputResult`](/openai-agents-js/openai/agents-core/type-aliases/toolstofinaloutputresult/)
  \| `Promise`\<[`ToolsToFinalOutputResult`](/openai-agents-js/openai/agents-core/type-aliases/toolstofinaloutputresult/)\>
