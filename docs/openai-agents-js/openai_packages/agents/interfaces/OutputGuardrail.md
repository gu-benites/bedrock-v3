---
editUrl: false
next: false
prev: false
title: "OutputGuardrail"
---

A guardrail that checks the output of the agent.

## Extended by

- [`RealtimeOutputGuardrail`](/openai-agents-js/openai/agents/openai/namespaces/realtime/interfaces/realtimeoutputguardrail/)

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

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents/type-aliases/textoutput/)

</td>
</tr>
</tbody>
</table>

## Properties

### execute

```ts
execute: OutputGuardrailFunction<TOutput>;
```

The function that performs the guardrail check.

***

### name

```ts
name: string;
```

The name of the guardrail.
