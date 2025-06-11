---
editUrl: false
next: false
prev: false
title: "ModelProvider"
---

The base interface for a model provider.

The model provider is responsible for looking up `Model` instances by name.

## Methods

### getModel()

```ts
getModel(modelName?): 
  | Model
| Promise<Model>
```

Get a model by name

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

`modelName`?

</td>
<td>

`string`

</td>
<td>

The name of the model to get.

</td>
</tr>
</tbody>
</table>

#### Returns

  \| [`Model`](/openai-agents-js/openai/agents-core/interfaces/model/)
  \| `Promise`\<[`Model`](/openai-agents-js/openai/agents-core/interfaces/model/)\>
