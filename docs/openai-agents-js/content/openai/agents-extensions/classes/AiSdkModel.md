---
editUrl: false
next: false
prev: false
title: "AiSdkModel"
---

Wraps a model from the AI SDK that adheres to the LanguageModelV1 spec to be used used as a model
in the OpenAI Agents SDK to use other models.

While you can use this with the OpenAI models, it is recommended to use the default OpenAI model
provider instead.

If tracing is enabled, the model will send generation spans to your traces processor.

```ts
import { aisdk } from '@openai/agents-extensions';
import { openai } from '@ai-sdk/openai';

const model = aisdk(openai('gpt-4o'));

const agent = new Agent({
  name: 'My Agent',
  model
});
```

## Param

The Vercel AI SDK model to wrap.

## Implements

- `Model`

## Constructors

### Constructor

```ts
new AiSdkModel(model): AiSdkModel
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

`model`

</td>
<td>

`LanguageModelV1`

</td>
</tr>
</tbody>
</table>

#### Returns

`AiSdkModel`

## Methods

### getResponse()

```ts
getResponse(request): Promise<{
  output: AgentOutputItem[];
  responseId: string;
  usage: Usage;
}>
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

`Promise`\<\{
  `output`: `AgentOutputItem`[];
  `responseId`: `string`;
  `usage`: `Usage`;
 \}\>

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
