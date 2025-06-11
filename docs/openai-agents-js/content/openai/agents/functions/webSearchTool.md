---
editUrl: false
next: false
prev: false
title: "webSearchTool"
---

```ts
function webSearchTool(options?): HostedTool
```

Adds web search abilities to your agent

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

`options`?

</td>
<td>

`Partial`\<`Omit`\<`WebSearchTool`, `"type"`\>\>

</td>
<td>

Additional configuration for the web search like specifying the location of your agent

</td>
</tr>
</tbody>
</table>

## Returns

[`HostedTool`](/openai-agents-js/openai/agents/type-aliases/hostedtool/)

a web search tool definition
