---
editUrl: false
next: false
prev: false
title: "AgentConfiguration"
---

Configuration for an agent.

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

The type of the context object.

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

The type of the output object.

</td>
</tr>
</tbody>
</table>

## Properties

### handoffDescription

```ts
handoffDescription: string;
```

A description of the agent. This is used when the agent is used as a handoff, so that an LLM
knows what it does and when to invoke it.

***

### handoffOutputTypeWarningEnabled?

```ts
optional handoffOutputTypeWarningEnabled: boolean;
```

The warning log would be enabled when multiple output types by handoff agents are detected.

***

### handoffs

```ts
handoffs: (
  | Agent<any, any>
  | Handoff<any, TOutput>)[];
```

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
and the agent can choose to delegate to them if relevant. Allows for separation of concerns
and modularity.

***

### inputGuardrails

```ts
inputGuardrails: InputGuardrail[];
```

A list of checks that run in parallel to the agent's execution, before generating a response.
Runs only if the agent is the first agent in the chain.

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

***

### model

```ts
model: 
  | string
  | Model;
```

The model implementation to use when invoking the LLM. By default, if not set, the agent will
use the default model configured in modelSettings.defaultModel

***

### modelSettings

```ts
modelSettings: ModelSettings;
```

Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)

***

### name

```ts
name: string;
```

The name of the agent.

***

### outputGuardrails

```ts
outputGuardrails: OutputGuardrail<TOutput>[];
```

A list of checks that run on the final output of the agent, after generating a response. Runs
only if the agent produces a final output.

***

### outputType

```ts
outputType: TOutput;
```

The type of the output object. If not provided, the output will be a string.

***

### resetToolChoice

```ts
resetToolChoice: boolean;
```

Wether to reset the tool choice to the default value after a tool has been called. Defaults
to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage.

***

### tools

```ts
tools: Tool<TContext>[];
```

A list of tools the agent can use.

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
