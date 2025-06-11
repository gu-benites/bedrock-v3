---
editUrl: false
next: false
prev: false
title: "TracingExporter"
---

Exports traces and spans. For example, could log them or send them to a backend.

## Methods

### export()

```ts
export(items, signal?): Promise<void>
```

Export the given traces and spans

#### Parameters

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

`items`

</td>
<td>

([`Trace`](/openai-agents-js/openai/agents/classes/trace/) \| `Span`)[]

</td>
<td>

The traces and spans to export

</td>
</tr>
<tr>
<td>

`signal`?

</td>
<td>

`AbortSignal`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>
