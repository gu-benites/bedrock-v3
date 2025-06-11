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

The content of the message.

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### role

```ts
role: "system";
```

Representing a system message to the user

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message
