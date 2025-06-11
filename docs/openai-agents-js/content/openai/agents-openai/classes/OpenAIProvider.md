---
editUrl: false
next: false
prev: false
title: "OpenAIProvider"
---

The provider of OpenAI's models (or Chat Completions compatible ones)

## Implements

- `ModelProvider`

## Constructors

### Constructor

```ts
new OpenAIProvider(options): OpenAIProvider
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

`options`

</td>
<td>

`OpenAIProviderOptions`

</td>
</tr>
</tbody>
</table>

#### Returns

`OpenAIProvider`

## Methods

### getModel()

```ts
getModel(modelName?): Promise<Model>
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

`Promise`\<`Model`\>

#### Implementation of

```ts
ModelProvider.getModel
```
