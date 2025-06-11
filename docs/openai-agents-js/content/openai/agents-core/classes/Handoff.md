---
editUrl: false
next: false
prev: false
title: "Handoff"
---

A handoff is when an agent delegates a task to another agent.
For example, in a customer support scenario you might have a "triage agent" that determines which
agent should handle the user's request, and sub-agents that specialize in different areas like
billing, account management, etc.

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TContext`

</td>
<td>

[`UnknownContext`](/openai-agents-js/openai/agents-core/type-aliases/unknowncontext/)

</td>
<td>

The context of the handoff

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents-core/type-aliases/textoutput/)

</td>
<td>

The output type of the handoff

</td>
</tr>
</tbody>
</table>

## Constructors

### Constructor

```ts
new Handoff<TContext, TOutput>(agent, onInvokeHandoff): Handoff<TContext, TOutput>
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

`agent`

</td>
<td>

[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\>

</td>
</tr>
<tr>
<td>

`onInvokeHandoff`

</td>
<td>

(`context`, `args`) => \| [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\> \| `Promise`\<[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\>\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Handoff`\<`TContext`, `TOutput`\>

## Properties

### agent

```ts
agent: Agent<TContext, TOutput>;
```

The agent that is being handed off to.

***

### agentName

```ts
agentName: string;
```

The name of the agent that is being handed off to.

***

### inputFilter?

```ts
optional inputFilter: HandoffInputFilter;
```

A function that filters the inputs that are passed to the next agent. By default, the new agent
sees the entire conversation history. In some cases, you may want to filter inputs e.g. to
remove older inputs, or remove tools from existing inputs.

The function will receive the entire conversation hisstory so far, including the input item
that triggered the handoff and a tool call output item representing the handoff tool's output.

You are free to modify the input history or new items as you see fit. The next agent that runs
will receive `handoffInputData.allItems

***

### inputJsonSchema

```ts
inputJsonSchema: JsonObjectSchema<any>;
```

The JSON schema for the handoff input. Can be empty if the handoff does not take an input

***

### onInvokeHandoff()

```ts
onInvokeHandoff: (context, args) => 
  | Agent<TContext, TOutput>
| Promise<Agent<TContext, TOutput>>;
```

The function that invokes the handoff. The parameters passed are:
1. The handoff run context
2. The arugments from the LLM, as a JSON string. Empty string if inputJsonSchema is empty.

Must return an agent

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

`context`

</td>
<td>

[`RunContext`](/openai-agents-js/openai/agents-core/classes/runcontext/)\<`TContext`\>

</td>
</tr>
<tr>
<td>

`args`

</td>
<td>

`string`

</td>
</tr>
</tbody>
</table>

#### Returns

  \| [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\>
  \| `Promise`\<[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`TContext`, `TOutput`\>\>

***

### strictJsonSchema

```ts
strictJsonSchema: boolean = true;
```

Whether the input JSON schema is in strict mode. We **strongly** recommend setting this to
true, as it increases the likelihood of correct JSON input.

***

### toolDescription

```ts
toolDescription: string;
```

The description of the tool that represents the handoff.

***

### toolName

```ts
toolName: string;
```

The name of the tool that represents the handoff.

## Methods

### getHandoffAsFunctionTool()

```ts
getHandoffAsFunctionTool(): object
```

Returns a function tool definition that can be used to invoke the handoff.

#### Returns

`object`

##### description

```ts
description: string;
```

##### name

```ts
name: string;
```

##### parameters

```ts
parameters: JsonObjectSchema<any>;
```

##### strict

```ts
strict: boolean;
```

##### type

```ts
type: "function";
```
