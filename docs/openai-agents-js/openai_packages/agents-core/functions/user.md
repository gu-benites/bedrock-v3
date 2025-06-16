---
editUrl: false
next: false
prev: false
title: "user"
---

```ts
function user(input, options?): object
```

Creates a user message entry

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

 \| `string` \| ( \| \{ `providerData`: `Record`\<`string`, `any`\>; `text`: `string`; `type`: `"input_text"`; \} \| \{ `image`: \| `string` \| \{ `id`: `string`; \}; `providerData`: `Record`\<`string`, `any`\>; `type`: `"input_image"`; \} \| \{ `file`: \| `string` \| \{ `id`: `string`; \}; `providerData`: `Record`\<`string`, `any`\>; `type`: `"input_file"`; \} \| \{ `audio`: \| `string` \| \{ `id`: `string`; \}; `format`: `null` \| `string`; `providerData`: `Record`\<`string`, `any`\>; `transcript`: `null` \| `string`; `type`: `"audio"`; \})[]

</td>
<td>

The input message from the user

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
content: 
  | string
  | (
  | {
  providerData: Record<string, any>;
  text: string;
  type: "input_text";
 }
  | {
  image:   | string
     | {
     id: string;
    };
  providerData: Record<string, any>;
  type: "input_image";
 }
  | {
  file:   | string
     | {
     id: string;
    };
  providerData: Record<string, any>;
  type: "input_file";
 }
  | {
  audio:   | string
     | {
     id: string;
    };
  format: null | string;
  providerData: Record<string, any>;
  transcript: null | string;
  type: "audio";
 })[];
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
role: "user";
```

Representing a message from the user

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message
