---
editUrl: false
next: false
prev: false
title: "getLogger"
---

```ts
function getLogger(namespace?): Logger
```

Get a logger for a given package.

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

`namespace`?

</td>
<td>

`string`

</td>
<td>

the namespace to use for the logger.

</td>
</tr>
</tbody>
</table>

## Returns

`Logger`

A logger object with `debug` and `error` methods.
