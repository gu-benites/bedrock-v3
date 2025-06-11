---
editUrl: false
next: false
prev: false
title: "Runner"
---

A Runner is responsible for running an agent workflow.

## Extends

- `RunHooks`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>

## Constructors

### Constructor

```ts
new Runner(config): Runner
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

`config`

</td>
<td>

`Partial`\<[`RunConfig`](/openai-agents-js/openai/agents-core/type-aliases/runconfig/)\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Runner`

#### Overrides

```ts
RunHooks<any, AgentOutputType<unknown>>.constructor
```

## Properties

### config

```ts
readonly config: RunConfig;
```

## Methods

### emit()

```ts
emit<K>(type, ...args): boolean
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>

</td>
</tr>
</tbody>
</table>

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

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

...`args`

</td>
<td>

`RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Inherited from

```ts
RunHooks.emit
```

***

### off()

```ts
off<K>(type, listener): EventEmitter<RunHookEvents<any, AgentOutputType<unknown>>>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>

</td>
</tr>
</tbody>
</table>

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

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>\>

#### Inherited from

```ts
RunHooks.off
```

***

### on()

```ts
on<K>(type, listener): EventEmitter<RunHookEvents<any, AgentOutputType<unknown>>>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>

</td>
</tr>
</tbody>
</table>

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

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>\>

#### Inherited from

```ts
RunHooks.on
```

***

### once()

```ts
once<K>(type, listener): EventEmitter<RunHookEvents<any, AgentOutputType<unknown>>>
```

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`K` *extends* keyof `RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>

</td>
</tr>
</tbody>
</table>

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

`type`

</td>
<td>

`K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

(...`args`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`EventEmitter`\<`RunHookEvents`\<`any`, [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>\>\>

#### Inherited from

```ts
RunHooks.once
```

***

### run()

#### Call Signature

```ts
run<TAgent, TContext>(
   agent, 
   input, 
options?): Promise<RunResult<TContext, TAgent>>
```

Run a workflow starting at the given agent. The agent will run in a loop until a final
output is generated. The loop runs like so:
1. The agent is invoked with the given input.
2. If there is a final output (i.e. the agent produces something of type
   `agent.outputType`, the loop terminates.
3. If there's a handoff, we run the loop again, with the new agent.
4. Else, we run tool calls (if any), and re-run the loop.

In two cases, the agent may raise an exception:
1. If the maxTurns is exceeded, a MaxTurnsExceeded exception is raised.
2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.

Note that only the first agent's input guardrails are run.

##### Type Parameters

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

`TAgent` *extends* [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`any`, `any`\>

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`TContext`

</td>
<td>

`undefined`

</td>
</tr>
</tbody>
</table>

##### Parameters

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

`agent`

</td>
<td>

`TAgent`

</td>
<td>

The starting agent to run.

</td>
</tr>
<tr>
<td>

`input`

</td>
<td>

 \| `string` \| [`AgentInputItem`](/openai-agents-js/openai/agents-core/type-aliases/agentinputitem/)[] \| [`RunState`](/openai-agents-js/openai/agents-core/classes/runstate/)\<`TContext`, `TAgent`\>

</td>
<td>

The initial input to the agent. You can pass a string or an array of
`AgentInputItem`.

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

[`NonStreamRunOptions`](/openai-agents-js/openai/agents-core/type-aliases/nonstreamrunoptions/)\<`TContext`\>

</td>
<td>

The options for the run.

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`\<[`RunResult`](/openai-agents-js/openai/agents-core/classes/runresult/)\<`TContext`, `TAgent`\>\>

The result of the run.

#### Call Signature

```ts
run<TAgent, TContext>(
   agent, 
   input, 
options?): Promise<StreamedRunResult<TContext, TAgent>>
```

Run a workflow starting at the given agent. The agent will run in a loop until a final
output is generated. The loop runs like so:
1. The agent is invoked with the given input.
2. If there is a final output (i.e. the agent produces something of type
   `agent.outputType`, the loop terminates.
3. If there's a handoff, we run the loop again, with the new agent.
4. Else, we run tool calls (if any), and re-run the loop.

In two cases, the agent may raise an exception:
1. If the maxTurns is exceeded, a MaxTurnsExceeded exception is raised.
2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.

Note that only the first agent's input guardrails are run.

##### Type Parameters

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

`TAgent` *extends* [`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`any`, `any`\>

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`TContext`

</td>
<td>

`undefined`

</td>
</tr>
</tbody>
</table>

##### Parameters

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

`agent`

</td>
<td>

`TAgent`

</td>
<td>

The starting agent to run.

</td>
</tr>
<tr>
<td>

`input`

</td>
<td>

 \| `string` \| [`AgentInputItem`](/openai-agents-js/openai/agents-core/type-aliases/agentinputitem/)[] \| [`RunState`](/openai-agents-js/openai/agents-core/classes/runstate/)\<`TContext`, `TAgent`\>

</td>
<td>

The initial input to the agent. You can pass a string or an array of
`AgentInputItem`.

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

[`StreamRunOptions`](/openai-agents-js/openai/agents-core/type-aliases/streamrunoptions/)\<`TContext`\>

</td>
<td>

The options for the run.

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`\<[`StreamedRunResult`](/openai-agents-js/openai/agents-core/classes/streamedrunresult/)\<`TContext`, `TAgent`\>\>

The result of the run.
