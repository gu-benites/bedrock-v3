---
editUrl: false
next: false
prev: false
title: "utils"
---

```ts
const utils: object;
```

## Type declaration

### arrayBufferToBase64()

```ts
arrayBufferToBase64: (arrayBuffer) => string = utilImport.arrayBufferToBase64;
```

Converts an ArrayBuffer to a base64 string

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

`arrayBuffer`

</td>
<td>

`ArrayBuffer`

</td>
<td>

</td>
</tr>
</tbody>
</table>

#### Returns

`string`

### base64ToArrayBuffer()

```ts
base64ToArrayBuffer: (base64) => ArrayBuffer = utilImport.base64ToArrayBuffer;
```

Converts a base64 string to an ArrayBuffer

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

`base64`

</td>
<td>

`string`

</td>
<td>

</td>
</tr>
</tbody>
</table>

#### Returns

`ArrayBuffer`

### getLastTextFromAudioOutputMessage()

```ts
getLastTextFromAudioOutputMessage: (item) => undefined | string = utilImport.getLastTextFromAudioOutputMessage;
```

Get the last text from an audio output message

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

`item`

</td>
<td>

`unknown`

</td>
<td>

</td>
</tr>
</tbody>
</table>

#### Returns

`undefined` \| `string`
