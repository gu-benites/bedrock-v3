---
editUrl: false
next: false
prev: false
title: "OpenAIChatCompletionsModel"
---

A model that uses (or is compatible with) OpenAI's Chat Completions API.

## Implements

- [`Model`](/openai-agents-js/openai/agents/interfaces/model/)

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

[`ModelRequest`](/openai-agents-js/openai/agents/type-aliases/modelrequest/)

</td>
<td>

The request to get a response for.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<[`ModelResponse`](/openai-agents-js/openai/agents/type-aliases/modelresponse/)\>

#### Implementation of

[`Model`](/openai-agents-js/openai/agents/interfaces/model/).[`getResponse`](/openai-agents-js/openai/agents/interfaces/model/#getresponse)

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

[`ModelRequest`](/openai-agents-js/openai/agents/type-aliases/modelrequest/)

</td>
</tr>
</tbody>
</table>

#### Returns

`AsyncIterable`\<[`StreamEvent`](/openai-agents-js/openai/agents/type-aliases/streamevent/)\>

#### Implementation of

[`Model`](/openai-agents-js/openai/agents/interfaces/model/).[`getStreamedResponse`](/openai-agents-js/openai/agents/interfaces/model/#getstreamedresponse)
