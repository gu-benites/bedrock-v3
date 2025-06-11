---
editUrl: false
next: false
prev: false
title: "system"
---

```ts
function system(input, options?): object
```

Creates a system message entry

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

`input`

</td>
<td>

`string`

</td>
<td>

The system prompt

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

Any additional options that will be directly passed to the model

</td>
</tr>
</tbody>
</table>

## Returns

`object`

a message entry

### content

```ts
content: string;
```

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

### role

```ts
role: "system";
```

### type?

```ts
optional type: "message";
```
