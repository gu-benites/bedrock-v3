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
role: "user";
```

### type?

```ts
optional type: "message";
```
