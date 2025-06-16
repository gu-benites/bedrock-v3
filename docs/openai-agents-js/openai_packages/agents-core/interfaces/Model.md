---
editUrl: false
next: false
prev: false
title: "Model"
---

The base interface for calling an LLM.

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

[`ModelRequest`](/openai-agents-js/openai/agents-core/type-aliases/modelrequest/)

</td>
<td>

The request to get a response for.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<[`ModelResponse`](/openai-agents-js/openai/agents-core/type-aliases/modelresponse/)\>

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

[`ModelRequest`](/openai-agents-js/openai/agents-core/type-aliases/modelrequest/)

</td>
</tr>
</tbody>
</table>

#### Returns

`AsyncIterable`\<[`StreamEvent`](/openai-agents-js/openai/agents-core/type-aliases/streamevent/)\>
