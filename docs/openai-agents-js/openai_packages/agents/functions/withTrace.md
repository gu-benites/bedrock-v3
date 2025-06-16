---
editUrl: false
next: false
prev: false
title: "withTrace"
---

```ts
function withTrace<T>(
   trace, 
   fn, 
options?): Promise<T>
```

This function will create a new trace and assign it to the execution context of the function
passed to it.

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

`T`

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

`trace`

</td>
<td>

`string` \| [`Trace`](/openai-agents-js/openai/agents/classes/trace/)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`fn`

</td>
<td>

(`trace`) => `Promise`\<`T`\>

</td>
<td>

The function to run and assign the trace context to.

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`TraceOptions`

</td>
<td>

Options for the creation of the trace

</td>
</tr>
</tbody>
</table>

## Returns

`Promise`\<`T`\>
