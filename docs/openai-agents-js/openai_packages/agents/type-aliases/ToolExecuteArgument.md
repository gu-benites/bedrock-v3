---
editUrl: false
next: false
prev: false
title: "ToolExecuteArgument"
---

```ts
type ToolExecuteArgument<TParameters> = TParameters extends ZodObject<any> ? zInfer<TParameters> : TParameters extends JsonObjectSchema<any> ? unknown : string;
```

The arguments to a tool.

The type of the arguments are derived from the parameters passed to the tool definition.

If the parameters are passed as a JSON schema the type is `unknown`. For Zod schemas it will
match the inferred Zod type. Otherwise the type is `string`

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TParameters` *extends* `ToolInputParameters`

</td>
</tr>
</tbody>
</table>
