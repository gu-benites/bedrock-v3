---
editUrl: false
next: false
prev: false
title: "OutputGuardrailFunctionArgs"
---

Arguments for an output guardrail function.

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

`TContext`

</td>
<td>

[`UnknownContext`](/openai-agents-js/openai/agents/type-aliases/unknowncontext/)

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
agent: Agent<any, any>;
```

***

### agentOutput

```ts
agentOutput: ResolvedAgentOutput<TOutput>;
```

***

### context

```ts
context: RunContext<TContext>;
```
