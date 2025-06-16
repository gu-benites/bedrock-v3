---
editUrl: false
next: false
prev: false
title: "AgentConfigWithHandoffs"
---

```ts
type AgentConfigWithHandoffs<TOutput, Handoffs> = object & Partial<Omit<AgentConfiguration<UnknownContext, TOutput | HandoffsOutputUnion<Handoffs>>, "name" | "handoffs" | "outputType">>;
```

Helper type for config with handoffs

## Type declaration

### handoffs?

```ts
optional handoffs: Handoffs;
```

### name

```ts
name: string;
```

### outputType?

```ts
optional outputType: TOutput;
```

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)

</td>
<td>

The type of the output object.

</td>
</tr>
<tr>
<td>

`Handoffs` *extends* readonly (
  \| [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`any`, `any`\>
  \| [`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`any`, `any`\>)[]

</td>
<td>

The type of the handoffs.

</td>
</tr>
</tbody>
</table>
