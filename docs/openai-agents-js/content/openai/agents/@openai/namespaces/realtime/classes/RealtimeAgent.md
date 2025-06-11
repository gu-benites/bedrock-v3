---
editUrl: false
next: false
prev: false
title: "RealtimeAgent"
---

A specialized agent instance that is meant to be used within a `RealtimeSession` to build
voice agents. Due to the nature of this agent, some configuration options are not supported
that are supported by regular `Agent` instances. For example:
- `model` choice is not supported as all RealtimeAgents will be handled by the same model within
  a `RealtimeSession`
- `modelSettings` is not supported as all RealtimeAgents will be handled by the same model within
  a `RealtimeSession`
- `outputType` is not supported as RealtimeAgents do not support structured outputs
- `toolUseBehavior` is not supported as all RealtimeAgents will be handled by the same model within
  a `RealtimeSession`
- `voice` can be configured on an `Agent` level however it cannot be changed after the first
   agent within a `RealtimeSession` spoke

## Example

```ts
const agent = new RealtimeAgent({
  name: 'my-agent',
  instructions: 'You are a helpful assistant that can answer questions and help with tasks.',
})

const session = new RealtimeSession(agent);
```

## Extends

- [`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, [`TextOutput`](/openai-agents-js/openai/agents/type-aliases/textoutput/)\>

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
</tbody>
</table>

## Constructors

### Constructor

```ts
new RealtimeAgent<TContext>(config): RealtimeAgent<TContext>
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

[`RealtimeAgentConfiguration`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimeagentconfiguration/)\<`TContext`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`RealtimeAgent`\<`TContext`\>

#### Overrides

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`constructor`](/openai-agents-js/openai/agents/classes/agent/#constructor)

## Properties

### handoffDescription

```ts
handoffDescription: string;
```

A description of the agent. This is used when the agent is used as a handoff, so that an LLM
knows what it does and when to invoke it.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`handoffDescription`](/openai-agents-js/openai/agents/classes/agent/#handoffdescription)

***

### handoffs

```ts
handoffs: (
  | Handoff<any, "text">
  | Agent<any, "text">)[];
```

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
and the agent can choose to delegate to them if relevant. Allows for separation of concerns
and modularity.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`handoffs`](/openai-agents-js/openai/agents/classes/agent/#handoffs)

***

### inputGuardrails

```ts
inputGuardrails: InputGuardrail[];
```

A list of checks that run in parallel to the agent's execution, before generating a response.
Runs only if the agent is the first agent in the chain.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`inputGuardrails`](/openai-agents-js/openai/agents/classes/agent/#inputguardrails)

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

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`instructions`](/openai-agents-js/openai/agents/classes/agent/#instructions)

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

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`mcpServers`](/openai-agents-js/openai/agents/classes/agent/#mcpservers)

***

### model

```ts
model: string | Model;
```

The model implementation to use when invoking the LLM. By default, if not set, the agent will
use the default model configured in modelSettings.defaultModel

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`model`](/openai-agents-js/openai/agents/classes/agent/#model)

***

### modelSettings

```ts
modelSettings: ModelSettings;
```

Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`modelSettings`](/openai-agents-js/openai/agents/classes/agent/#modelsettings)

***

### name

```ts
name: string;
```

The name of the agent.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`name`](/openai-agents-js/openai/agents/classes/agent/#name)

***

### outputGuardrails

```ts
outputGuardrails: OutputGuardrail<AgentOutputType<unknown>>[];
```

A list of checks that run on the final output of the agent, after generating a response. Runs
only if the agent produces a final output.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`outputGuardrails`](/openai-agents-js/openai/agents/classes/agent/#outputguardrails)

***

### outputType

```ts
outputType: "text";
```

The type of the output object. If not provided, the output will be a string.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`outputType`](/openai-agents-js/openai/agents/classes/agent/#outputtype)

***

### resetToolChoice

```ts
resetToolChoice: boolean;
```

Wether to reset the tool choice to the default value after a tool has been called. Defaults
to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`resetToolChoice`](/openai-agents-js/openai/agents/classes/agent/#resettoolchoice)

***

### tools

```ts
tools: Tool<RealtimeContextData<TContext>>[];
```

A list of tools the agent can use.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`tools`](/openai-agents-js/openai/agents/classes/agent/#tools)

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

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`toolUseBehavior`](/openai-agents-js/openai/agents/classes/agent/#toolusebehavior)

***

### voice

```ts
readonly voice: string;
```

The voice intended to be used by the agent. If another agent already spoke during the
RealtimeSession, changing the voice during a handoff will fail.

## Accessors

### outputSchemaName

#### Get Signature

```ts
get outputSchemaName(): string
```

Ouput schema name

##### Returns

`string`

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`outputSchemaName`](/openai-agents-js/openai/agents/classes/agent/#outputschemaname)

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

[`FunctionTool`](/openai-agents-js/openai/agents/type-aliases/functiontool/)

A tool that runs the agent and returns the output text.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`asTool`](/openai-agents-js/openai/agents/classes/agent/#astool)

***

### clone()

```ts
clone(config): Agent<RealtimeContextData<TContext>, "text">
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

`Partial`\<[`AgentConfiguration`](/openai-agents-js/openai/agents/interfaces/agentconfiguration/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>\>

</td>
<td>

A partial configuration to change.

</td>
</tr>
</tbody>
</table>

#### Returns

[`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>

A new agent with the given changes.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`clone`](/openai-agents-js/openai/agents/classes/agent/#clone)

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

`K` *extends* keyof `AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>

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

`AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>\[`K`\]

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`emit`](/openai-agents-js/openai/agents/classes/agent/#emit)

***

### getAllTools()

```ts
getAllTools(): Promise<Tool<RealtimeContextData<TContext>>[]>
```

ALl agent tools, including the MCPl and function tools.

#### Returns

`Promise`\<[`Tool`](/openai-agents-js/openai/agents/type-aliases/tool/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>\>[]\>

all configured tools

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`getAllTools`](/openai-agents-js/openai/agents/classes/agent/#getalltools)

***

### getMcpTools()

```ts
getMcpTools(): Promise<Tool<RealtimeContextData<TContext>>[]>
```

Fetches the available tools from the MCP servers.

#### Returns

`Promise`\<[`Tool`](/openai-agents-js/openai/agents/type-aliases/tool/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>\>[]\>

the MCP powered tools

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`getMcpTools`](/openai-agents-js/openai/agents/classes/agent/#getmcptools)

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

[`RunContext`](/openai-agents-js/openai/agents/classes/runcontext/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`undefined` \| `string`\>

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`getSystemPrompt`](/openai-agents-js/openai/agents/classes/agent/#getsystemprompt)

***

### off()

```ts
off<K>(type, listener): EventEmitter<AgentHookEvents<RealtimeContextData<TContext>, "text">>
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

`K` *extends* keyof `AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>

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

`EventEmitter`\<`AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>\>

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`off`](/openai-agents-js/openai/agents/classes/agent/#off)

***

### on()

```ts
on<K>(type, listener): EventEmitter<AgentHookEvents<RealtimeContextData<TContext>, "text">>
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

`K` *extends* keyof `AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>

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

`EventEmitter`\<`AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>\>

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`on`](/openai-agents-js/openai/agents/classes/agent/#on)

***

### once()

```ts
once<K>(type, listener): EventEmitter<AgentHookEvents<RealtimeContextData<TContext>, "text">>
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

`K` *extends* keyof `AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>

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

`EventEmitter`\<`AgentHookEvents`\<[`RealtimeContextData`](/openai-agents-js/openai/agents/openai/namespaces/realtime/type-aliases/realtimecontextdata/)\<`TContext`\>, `"text"`\>\>

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`once`](/openai-agents-js/openai/agents/classes/agent/#once)

***

### processFinalOutput()

```ts
processFinalOutput(output): string
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

`string`

The parsed out.

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`processFinalOutput`](/openai-agents-js/openai/agents/classes/agent/#processfinaloutput)

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

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`toJSON`](/openai-agents-js/openai/agents/classes/agent/#tojson)

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

`TOutput` *extends* [`AgentOutputType`](/openai-agents-js/openai/agents/type-aliases/agentoutputtype/)\<`unknown`\>

</td>
<td>

`"text"`

</td>
</tr>
<tr>
<td>

`Handoffs` *extends* readonly (
  \| [`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`any`, `any`\>
  \| [`Handoff`](/openai-agents-js/openai/agents/classes/handoff/)\<`any`, `any`\>)[]

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

[`AgentConfigWithHandoffs`](/openai-agents-js/openai/agents/type-aliases/agentconfigwithhandoffs/)\<`TOutput`, `Handoffs`\>

</td>
</tr>
</tbody>
</table>

#### Returns

[`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`unknown`, `TOutput` \| `HandoffsOutputUnion`\<`Handoffs`\>\>

#### Inherited from

[`Agent`](/openai-agents-js/openai/agents/classes/agent/).[`create`](/openai-agents-js/openai/agents/classes/agent/#create)
