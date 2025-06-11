---
editUrl: false
next: false
prev: false
title: "aisdk"
---

```ts
function aisdk(model): AiSdkModel
```

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

`model`

</td>
<td>

`LanguageModelV1`

</td>
<td>

The Vercel AI SDK model to wrap.

</td>
</tr>
</tbody>
</table>

## Returns

[`AiSdkModel`](/openai-agents-js/openai/agents-extensions/classes/aisdkmodel/)

The wrapped model.
