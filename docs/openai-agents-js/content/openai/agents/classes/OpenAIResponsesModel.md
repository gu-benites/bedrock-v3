---
editUrl: false
next: false
prev: false
title: "OpenAIResponsesModel"
---

Model implementation that uses OpenAI's Responses API to generate responses.

## Implements

- [`Model`](/openai-agents-js/openai/agents/interfaces/model/)

## Constructors

### Constructor

```ts
new OpenAIResponsesModel(client, model): OpenAIResponsesModel
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

`OpenAIResponsesModel`

## Methods

### getResponse()

```ts
getResponse(request): Promise<ModelResponse>
```

Get a response from the OpenAI model using the Responses API.

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

[`ModelRequest`](/openai-agents-js/openai/agents/type-aliases/modelrequest/)

</td>
<td>

The request to send to the model.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<[`ModelResponse`](/openai-agents-js/openai/agents/type-aliases/modelresponse/)\>

A promise that resolves to the response from the model.

#### Implementation of

[`Model`](/openai-agents-js/openai/agents/interfaces/model/).[`getResponse`](/openai-agents-js/openai/agents/interfaces/model/#getresponse)

***

### getStreamedResponse()

```ts
getStreamedResponse(request): AsyncIterable<StreamEvent>
```

Get a streamed response from the OpenAI model using the Responses API.

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

[`ModelRequest`](/openai-agents-js/openai/agents/type-aliases/modelrequest/)

</td>
<td>

The request to send to the model.

</td>
</tr>
</tbody>
</table>

#### Returns

`AsyncIterable`\<[`StreamEvent`](/openai-agents-js/openai/agents/type-aliases/streamevent/)\>

An async iterable of the response from the model.

#### Implementation of

[`Model`](/openai-agents-js/openai/agents/interfaces/model/).[`getStreamedResponse`](/openai-agents-js/openai/agents/interfaces/model/#getstreamedresponse)
