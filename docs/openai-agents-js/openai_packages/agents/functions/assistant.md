---
editUrl: false
next: false
prev: false
title: "assistant"
---

```ts
function assistant(content, options?): object
```

Creates an assistant message entry for example for multi-shot prompting

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

`content`

</td>
<td>

 \| `string` \| ( \| \{ `providerData`: `Record`\<`string`, `any`\>; `text`: `string`; `type`: `"output_text"`; \} \| \{ `providerData`: `Record`\<`string`, `any`\>; `refusal`: `string`; `type`: `"refusal"`; \} \| \{ `providerData`: `Record`\<`string`, `any`\>; `text`: `string`; `type`: `"input_text"`; \} \| \{ `audio`: \| `string` \| \{ `id`: `string`; \}; `format`: `null` \| `string`; `providerData`: `Record`\<`string`, `any`\>; `transcript`: `null` \| `string`; `type`: `"audio"`; \} \| \{ `image`: `string`; `providerData`: `Record`\<`string`, `any`\>; `type`: `"image"`; \})[]

</td>
<td>

&hyphen;

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
content: (
  | {
  providerData: Record<string, any>;
  refusal: string;
  type: "refusal";
 }
  | {
  providerData: Record<string, any>;
  text: string;
  type: "output_text";
 }
  | {
  providerData: Record<string, any>;
  text: string;
  type: "input_text";
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
 }
  | {
  image: string;
  providerData: Record<string, any>;
  type: "image";
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
role: "assistant";
```

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

### type?

```ts
optional type: "message";
```
