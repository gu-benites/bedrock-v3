---
editUrl: false
next: false
prev: false
title: "Tool"
---

```ts
type Tool<Context> = 
  | FunctionTool<Context, any, any>
  | ComputerTool
  | HostedTool;
```

A tool that can be called by the model.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`Context`

</td>
<td>

`unknown`

</td>
<td>

The context passed to the tool

</td>
</tr>
</tbody>
</table>
