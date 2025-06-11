---
editUrl: false
next: false
prev: false
title: "imageGenerationTool"
---

```ts
function imageGenerationTool(options?): HostedTool
```

Adds image generation abilities to your agent

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

`Partial`\<`Omit`\<`ImageGenerationTool`, `"type"`\>\>

</td>
<td>

Additional configuration for the image generation

</td>
</tr>
</tbody>
</table>

## Returns

[`HostedTool`](/openai-agents-js/openai/agents/type-aliases/hostedtool/)

an image generation tool definition
