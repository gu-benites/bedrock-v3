---
editUrl: false
next: false
prev: false
title: "StreamRunOptions"
---

```ts
type StreamRunOptions<TContext> = SharedRunOptions<TContext> & object;
```

## Type declaration

### stream

```ts
stream: true;
```

Whether to stream the run. If true, the run will emit events as the model responds.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

`undefined`

</td>
</tr>
</tbody>
</table>
