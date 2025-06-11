---
editUrl: false
next: false
prev: false
title: "AgentOutputType"
---

```ts
type AgentOutputType<HandoffOutputType> = 
  | TextOutput
  | ZodObject<any>
  | JsonSchemaDefinition
| HandoffsOutput<HandoffOutputType>;
```

The type of the output object. If not provided, the output will be a string.
'text' is a special type that indicates the output will be a string.

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

`HandoffOutputType`

</td>
<td>

[`UnknownContext`](/openai-agents-js/openai/agents-core/type-aliases/unknowncontext/)

</td>
<td>

The type of the output of the handoff.

</td>
</tr>
</tbody>
</table>
