---
editUrl: false
next: false
prev: false
title: "computerTool"
---

```ts
function computerTool(options): ComputerTool
```

Exposes a computer to the agent as a tool to be called

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

`Partial`\<`Omit`\<[`ComputerTool`](/openai-agents-js/openai/agents/type-aliases/computertool/), `"type"`\>\> & `object`

</td>
<td>

Additional configuration for the computer tool like specifying the location of your agent

</td>
</tr>
</tbody>
</table>

## Returns

[`ComputerTool`](/openai-agents-js/openai/agents/type-aliases/computertool/)

a computer tool definition
