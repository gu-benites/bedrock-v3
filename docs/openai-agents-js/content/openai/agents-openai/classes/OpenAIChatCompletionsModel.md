---
editUrl: false
next: false
prev: false
title: "OpenAIChatCompletionsModel"
---

A model that uses (or is compatible with) OpenAI's Chat Completions API.

## Implements

- `Model`

## Constructors

### Constructor

```ts
new OpenAIChatCompletionsModel(client, model): OpenAIChatCompletionsModel
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`client`

</td>
<td>

`OpenAI`

</td>
</tr>
<tr>
<td>

`model`

</td>
<td>

`string`

</td>
</tr>
</tbody>
</table>

#### Returns

`OpenAIChatCompletionsModel`

## Methods

### getResponse()

```ts
getResponse(request): Promise<ModelResponse>
```

Get a response from the model.

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

`request`

</td>
<td>

`ModelRequest`

</td>
<td>

The request to get a response for.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`ModelResponse`\>

#### Implementation of

```ts
Model.getResponse
```

***

### getStreamedResponse()

```ts
getStreamedResponse(request): AsyncIterable<StreamEvent>
```

Get a streamed response from the model.

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`request`

</td>
<td>

`ModelRequest`

</td>
</tr>
</tbody>
</table>

#### Returns

`AsyncIterable`\<`StreamEvent`\>

#### Implementation of

```ts
Model.getStreamedResponse
```
