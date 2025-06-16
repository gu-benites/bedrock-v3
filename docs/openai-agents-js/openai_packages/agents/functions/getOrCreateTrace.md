---
editUrl: false
next: false
prev: false
title: "getOrCreateTrace"
---

```ts
function getOrCreateTrace<T>(fn, options?): Promise<T>
```

This function will check if there is an existing active trace in the execution context. If there
is, it will run the given function with the existing trace. If there is no trace, it will create
a new one and assign it to the execution context of the function.

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

`fn`

</td>
<td>

() => `Promise`\<`T`\>

</td>
<td>

The fzunction to run and assign the trace context to.

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
