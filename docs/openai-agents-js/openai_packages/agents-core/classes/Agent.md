---
editUrl: false
next: false
prev: false
title: "Agent"
---

The class representing an AI agent configured with instructions, tools, guardrails, handoffs and more.

We strongly recommend passing `instructions`, which is the "system prompt" for the agent. In
addition, you can pass `handoffDescription`, which is a human-readable description of the
agent, used when the agent is used inside tools/handoffs.

Agents are generic on the context type. The context is a (mutable) object you create. It is
passed to tool functions, handoffs, guardrails, etc.

## Extends

- [`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/)\<`TContext`, `TOutput`\>

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

[`UnknownContext`](/openai-agents-js/openai/agents-core/type-aliases/unknowncontext/)

</td>
</tr>
<tr>
<td>

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)

</td>
<td>

[`TextOutput`](/openai-agents-js/openai/agents-core/type-aliases/textoutput/)

</td>
</tr>
</tbody>
</table>

## Implements

- [`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/)\<`TContext`, `TOutput`\>

## Constructors

### Constructor

```ts
new Agent<TContext, TOutput>(config): Agent<TContext, TOutput>
```

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

`config`

</td>
<td>

\{ `handoffDescription`: `string`; `handoffOutputTypeWarningEnabled`: `boolean`; `handoffs`: ( \| `Agent`\<`any`, `any`\> \| [`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`any`, `TOutput`\>)[]; `inputGuardrails`: [`InputGuardrail`](/openai-agents-js/openai/agents-core/interfaces/inputguardrail/)[]; `instructions`: `string` \| (`runContext`, `agent`) => `string` \| `Promise`\<`string`\>; `mcpServers`: [`MCPServer`](/openai-agents-js/openai/agents-core/interfaces/mcpserver/)[]; `model`: \| `string` \| [`Model`](/openai-agents-js/openai/agents-core/interfaces/model/); `modelSettings`: [`ModelSettings`](/openai-agents-js/openai/agents-core/type-aliases/modelsettings/); `name`: `string`; `outputGuardrails`: [`OutputGuardrail`](/openai-agents-js/openai/agents-core/interfaces/outputguardrail/)\<`TOutput`\>[]; `outputType`: `TOutput`; `resetToolChoice`: `boolean`; `tools`: [`Tool`](/openai-agents-js/openai/agents-core/type-aliases/tool/)\<`TContext`\>[]; `toolUseBehavior`: [`ToolUseBehavior`](/openai-agents-js/openai/agents-core/type-aliases/toolusebehavior/); \}

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`config.handoffDescription`?

</td>
<td>

`string`

</td>
<td>

A description of the agent. This is used when the agent is used as a handoff, so that an LLM
knows what it does and when to invoke it.

</td>
</tr>
<tr>
<td>

`config.handoffOutputTypeWarningEnabled`?

</td>
<td>

`boolean`

</td>
<td>

The warning log would be enabled when multiple output types by handoff agents are detected.

</td>
</tr>
<tr>
<td>

`config.handoffs`?

</td>
<td>

( \| `Agent`\<`any`, `any`\> \| [`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`any`, `TOutput`\>)[]

</td>
<td>

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
and the agent can choose to delegate to them if relevant. Allows for separation of concerns
and modularity.

</td>
</tr>
<tr>
<td>

`config.inputGuardrails`?

</td>
<td>

[`InputGuardrail`](/openai-agents-js/openai/agents-core/interfaces/inputguardrail/)[]

</td>
<td>

A list of checks that run in parallel to the agent's execution, before generating a response.
Runs only if the agent is the first agent in the chain.

</td>
</tr>
<tr>
<td>

`config.instructions`?

</td>
<td>

`string` \| (`runContext`, `agent`) => `string` \| `Promise`\<`string`\>

</td>
<td>

The instructions for the agent. Will be used as the "system prompt" when this agent is
invoked. Describes what the agent should do, and how it responds.

Can either be a string, or a function that dynamically generates instructions for the agent.
If you provide a function, it will be called with the context and the agent instance. It
must return a string.

</td>
</tr>
<tr>
<td>

`config.mcpServers`?

</td>
<td>

[`MCPServer`](/openai-agents-js/openai/agents-core/interfaces/mcpserver/)[]

</td>
<td>

A list of [Model Context Protocol](https://modelcontextprotocol.io/) servers the agent can use.
Every time the agent runs, it will include tools from these servers in the list of available
tools.

NOTE: You are expected to manage the lifecycle of these servers. Specifically, you must call
`server.connect()` before passing it to the agent, and `server.cleanup()` when the server is
no longer needed.

</td>
</tr>
<tr>
<td>

`config.model`?

</td>
<td>

 \| `string` \| [`Model`](/openai-agents-js/openai/agents-core/interfaces/model/)

</td>
<td>

The model implementation to use when invoking the LLM. By default, if not set, the agent will
use the default model configured in modelSettings.defaultModel

</td>
</tr>
<tr>
<td>

`config.modelSettings`?

</td>
<td>

[`ModelSettings`](/openai-agents-js/openai/agents-core/type-aliases/modelsettings/)

</td>
<td>

Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)

</td>
</tr>
<tr>
<td>

`config.name`

</td>
<td>

`string`

</td>
<td>

The name of the agent.

</td>
</tr>
<tr>
<td>

`config.outputGuardrails`?

</td>
<td>

[`OutputGuardrail`](/openai-agents-js/openai/agents-core/interfaces/outputguardrail/)\<`TOutput`\>[]

</td>
<td>

A list of checks that run on the final output of the agent, after generating a response. Runs
only if the agent produces a final output.

</td>
</tr>
<tr>
<td>

`config.outputType`?

</td>
<td>

`TOutput`

</td>
<td>

The type of the output object. If not provided, the output will be a string.

</td>
</tr>
<tr>
<td>

`config.resetToolChoice`?

</td>
<td>

`boolean`

</td>
<td>

Wether to reset the tool choice to the default value after a tool has been called. Defaults
to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage.

</td>
</tr>
<tr>
<td>

`config.tools`?

</td>
<td>

[`Tool`](/openai-agents-js/openai/agents-core/type-aliases/tool/)\<`TContext`\>[]

</td>
<td>

A list of tools the agent can use.

</td>
</tr>
<tr>
<td>

`config.toolUseBehavior`?

</td>
<td>

[`ToolUseBehavior`](/openai-agents-js/openai/agents-core/type-aliases/toolusebehavior/)

</td>
<td>

This lets you configure how tool use is handled.
- run_llm_again: The default behavior. Tools are run, and then the LLM receives the results
  and gets to respond.
- stop_on_first_tool: The output of the frist tool call is used as the final output. This means
  that the LLM does not process the result of the tool call.
- A list of tool names: The agent will stop running if any of the tools in the list are called.
  The final output will be the output of the first matching tool call. The LLM does not process
  the result of the tool call.
- A function: if you pass a function, it will be called with the run context and the list of
  tool results. It must return a `ToolsToFinalOutputResult`, which determines whether the tool
  call resulted in a final output.

NOTE: This configuration is specific to `FunctionTools`. Hosted tools, such as file search, web
search, etc. are always processed by the LLM

</td>
</tr>
</tbody>
</table>

#### Returns

`Agent`\<`TContext`, `TOutput`\>

#### Overrides

[`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/).[`constructor`](/openai-agents-js/openai/agents-core/classes/agenthooks/#constructor)

## Properties

### handoffDescription

```ts
handoffDescription: string;
```

A description of the agent. This is used when the agent is used as a handoff, so that an LLM
knows what it does and when to invoke it.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`handoffDescription`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#handoffdescription)

***

### handoffs

```ts
handoffs: (
  | Agent<any, TOutput>
  | Handoff<any, TOutput>)[];
```

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
and the agent can choose to delegate to them if relevant. Allows for separation of concerns
and modularity.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`handoffs`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#handoffs)

***

### inputGuardrails

```ts
inputGuardrails: InputGuardrail[];
```

A list of checks that run in parallel to the agent's execution, before generating a response.
Runs only if the agent is the first agent in the chain.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`inputGuardrails`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#inputguardrails)

***

### instructions

```ts
instructions: string | (runContext, agent) => string | Promise<string>;
```

The instructions for the agent. Will be used as the "system prompt" when this agent is
invoked. Describes what the agent should do, and how it responds.

Can either be a string, or a function that dynamically generates instructions for the agent.
If you provide a function, it will be called with the context and the agent instance. It
must return a string.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`instructions`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#instructions)

***

### mcpServers

```ts
mcpServers: MCPServer[];
```

A list of [Model Context Protocol](https://modelcontextprotocol.io/) servers the agent can use.
Every time the agent runs, it will include tools from these servers in the list of available
tools.

NOTE: You are expected to manage the lifecycle of these servers. Specifically, you must call
`server.connect()` before passing it to the agent, and `server.cleanup()` when the server is
no longer needed.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`mcpServers`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#mcpservers)

***

### model

```ts
model: 
  | string
  | Model;
```

The model implementation to use when invoking the LLM. By default, if not set, the agent will
use the default model configured in modelSettings.defaultModel

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`model`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#model)

***

### modelSettings

```ts
modelSettings: ModelSettings;
```

Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`modelSettings`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#modelsettings)

***

### name

```ts
name: string;
```

The name of the agent.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`name`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#name)

***

### outputGuardrails

```ts
outputGuardrails: OutputGuardrail<AgentOutputType<unknown>>[];
```

A list of checks that run on the final output of the agent, after generating a response. Runs
only if the agent produces a final output.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`outputGuardrails`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#outputguardrails)

***

### outputType

```ts
outputType: TOutput;
```

The type of the output object. If not provided, the output will be a string.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`outputType`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#outputtype)

***

### resetToolChoice

```ts
resetToolChoice: boolean;
```

Wether to reset the tool choice to the default value after a tool has been called. Defaults
to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`resetToolChoice`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#resettoolchoice)

***

### tools

```ts
tools: Tool<TContext>[];
```

A list of tools the agent can use.

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`tools`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#tools)

***

### toolUseBehavior

```ts
toolUseBehavior: ToolUseBehavior;
```

This lets you configure how tool use is handled.
- run_llm_again: The default behavior. Tools are run, and then the LLM receives the results
  and gets to respond.
- stop_on_first_tool: The output of the frist tool call is used as the final output. This means
  that the LLM does not process the result of the tool call.
- A list of tool names: The agent will stop running if any of the tools in the list are called.
  The final output will be the output of the first matching tool call. The LLM does not process
  the result of the tool call.
- A function: if you pass a function, it will be called with the run context and the list of
  tool results. It must return a `ToolsToFinalOutputResult`, which determines whether the tool
  call resulted in a final output.

NOTE: This configuration is specific to `FunctionTools`. Hosted tools, such as file search, web
search, etc. are always processed by the LLM

#### Implementation of

[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/).[`toolUseBehavior`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/#toolusebehavior)

## Accessors

### outputSchemaName

#### Get Signature

```ts
get outputSchemaName(): string
```

Ouput schema name

##### Returns

`string`

## Methods

### asTool()

```ts
asTool(options): FunctionTool
```

Transform this agent into a tool, callable by other agents.

This is different from handoffs in two ways:
1. In handoffs, the new agent receives the conversation history. In this tool, the new agent
   receives generated input.
2. In handoffs, the new agent takes over the conversation. In this tool, the new agent is
   called as a tool, and the conversation is continued by the original agent.

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

`options`

</td>
<td>

\{ `customOutputExtractor`: (`output`) => `string` \| `Promise`\<`string`\>; `toolDescription`: `string`; `toolName`: `string`; \}

</td>
<td>

Options for the tool.

</td>
</tr>
<tr>
<td>

`options.customOutputExtractor`?

</td>
<td>

(`output`) => `string` \| `Promise`\<`string`\>

</td>
<td>

A function that extracts the output text from the agent. If not provided, the last message
from the agent will be used.

</td>
</tr>
<tr>
<td>

`options.toolDescription`?

</td>
<td>

`string`

</td>
<td>

The description of the tool, which should indicate what the tool does and when to use it.

</td>
</tr>
<tr>
<td>

`options.toolName`?

</td>
<td>

`string`

</td>
<td>

The name of the tool. If not provided, the name of the agent will be used.

</td>
</tr>
</tbody>
</table>

#### Returns

[`FunctionTool`](/openai-agents-js/openai/agents-core/type-aliases/functiontool/)

A tool that runs the agent and returns the output text.

***

### clone()

```ts
clone(config): Agent<TContext, TOutput>
```

Makes a copy of the agent, with the given arguments changed. For example, you could do:

```
const newAgent = agent.clone({ instructions: 'New instructions' })
```

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

`config`

</td>
<td>

`Partial`\<[`AgentConfiguration`](/openai-agents-js/openai/agents-core/interfaces/agentconfiguration/)\<`TContext`, `TOutput`\>\>

</td>
<td>

A partial configuration to change.

</td>
</tr>
</tbody>
</table>

#### Returns

`Agent`\<`TContext`, `TOutput`\>

A new agent with the given changes.

***

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

`K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\>

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

`AgentHookEvents`\<`TContext`, `TOutput`\>\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Inherited from

[`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/).[`emit`](/openai-agents-js/openai/agents-core/classes/agenthooks/#emit)

***

### getAllTools()

```ts
getAllTools(): Promise<Tool<TContext>[]>
```

ALl agent tools, including the MCPl and function tools.

#### Returns

`Promise`\<[`Tool`](/openai-agents-js/openai/agents-core/type-aliases/tool/)\<`TContext`\>[]\>

all configured tools

***

### getMcpTools()

```ts
getMcpTools(): Promise<Tool<TContext>[]>
```

Fetches the available tools from the MCP servers.

#### Returns

`Promise`\<[`Tool`](/openai-agents-js/openai/agents-core/type-aliases/tool/)\<`TContext`\>[]\>

the MCP powered tools

***

### getSystemPrompt()

```ts
getSystemPrompt(runContext): Promise<undefined | string>
```

Returns the system prompt for the agent.

If the agent has a function as its instructions, this function will be called with the
runContext and the agent instance.

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

`runContext`

</td>
<td>

[`RunContext`](/openai-agents-js/openai/agents-core/classes/runcontext/)\<`TContext`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`undefined` \| `string`\>

***

### off()

```ts
off<K>(type, listener): EventEmitter<AgentHookEvents<TContext, TOutput>>
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

`K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\>

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

`EventEmitter`\<`AgentHookEvents`\<`TContext`, `TOutput`\>\>

#### Inherited from

[`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/).[`off`](/openai-agents-js/openai/agents-core/classes/agenthooks/#off)

***

### on()

```ts
on<K>(type, listener): EventEmitter<AgentHookEvents<TContext, TOutput>>
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

`K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\>

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

`EventEmitter`\<`AgentHookEvents`\<`TContext`, `TOutput`\>\>

#### Inherited from

[`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/).[`on`](/openai-agents-js/openai/agents-core/classes/agenthooks/#on)

***

### once()

```ts
once<K>(type, listener): EventEmitter<AgentHookEvents<TContext, TOutput>>
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

`K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\>

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

`EventEmitter`\<`AgentHookEvents`\<`TContext`, `TOutput`\>\>

#### Inherited from

[`AgentHooks`](/openai-agents-js/openai/agents-core/classes/agenthooks/).[`once`](/openai-agents-js/openai/agents-core/classes/agenthooks/#once)

***

### processFinalOutput()

```ts
processFinalOutput(output): ResolvedAgentOutput<TOutput>
```

Processes the final output of the agent.

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

`output`

</td>
<td>

`string`

</td>
<td>

The output of the agent.

</td>
</tr>
</tbody>
</table>

#### Returns

`ResolvedAgentOutput`\<`TOutput`\>

The parsed out.

***

### toJSON()

```ts
toJSON(): object
```

Returns a JSON representation of the agent, which is serializable.

#### Returns

`object`

A JSON object containing the agent's name.

##### name

```ts
name: string;
```

***

### create()

```ts
static create<TOutput, Handoffs>(config): Agent<unknown, TOutput | HandoffsOutputUnion<Handoffs>>
```

Create an Agent with handoffs and automatically infer the union type for TOutput from the handoff agents' output types.

#### Type Parameters

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

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents-core/type-aliases/agentoutputtype/)\<`unknown`\>

</td>
<td>

`"text"`

</td>
</tr>
<tr>
<td>

`Handoffs` *extends* readonly (
  \| `Agent`\<`any`, `any`\>
  \| [`Handoff`](/openai-agents-js/openai/agents-core/classes/handoff/)\<`any`, `any`\>)[]

</td>
<td>

\[\]

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

`config`

</td>
<td>

[`AgentConfigWithHandoffs`](/openai-agents-js/openai/agents-core/type-aliases/agentconfigwithhandoffs/)\<`TOutput`, `Handoffs`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Agent`\<`unknown`, `TOutput` \| `HandoffsOutputUnion`\<`Handoffs`\>\>
