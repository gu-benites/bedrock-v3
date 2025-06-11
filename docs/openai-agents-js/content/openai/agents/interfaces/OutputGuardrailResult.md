---
editUrl: false
next: false
prev: false
title: "OutputGuardrailResult"
---

The result of an output guardrail execution.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TMeta`

</td>
<td>

`OutputGuardrailMetadata`

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents/type-aliases/textoutput/)

</td>
</tr>
</tbody>
</table>

## Properties

### agent

```ts
agent: Agent<unknown, TOutput>;
```

The agent that ran.

***

### agentOutput

```ts
agentOutput: ResolvedAgentOutput<TOutput>;
```

The output of the agent that ran.

***

### guardrail

```ts
guardrail: TMeta;
```

The metadata of the guardrail.

***

### output

```ts
output: GuardrailFunctionOutput;
```

The output of the guardrail.
