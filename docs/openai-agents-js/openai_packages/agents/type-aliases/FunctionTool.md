---
editUrl: false
next: false
prev: false
title: "FunctionTool"
---

```ts
type FunctionTool<Context, TParameters, Result> = object;
```

Exposes a function to the agent as a tool to be called

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

`Context`

</td>
<td>

[`UnknownContext`](/openai-agents-js/openai/agents/type-aliases/unknowncontext/)

</td>
<td>

The context of the tool

</td>
</tr>
<tr>
<td>

`TParameters` *extends* `ToolInputParameters`

</td>
<td>

`undefined`

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`Result`

</td>
<td>

`unknown`

</td>
<td>

The result of the tool

</td>
</tr>
</tbody>
</table>

## Properties

### description

```ts
description: string;
```

The description of the tool that helps the model to understand when to use the tool

***

### invoke()

```ts
invoke: (runContext, input) => Promise<string | Result>;
```

The function to invoke when the tool is called.

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

[`RunContext`](/openai-agents-js/openai/agents/classes/runcontext/)\<`Context`\>

</td>
</tr>
<tr>
<td>

`input`

</td>
<td>

`string`

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`string` \| `Result`\>

***

### name

```ts
name: string;
```

The name of the tool.

***

### needsApproval

```ts
needsApproval: ToolApprovalFunction<TParameters>;
```

Whether the tool needs human approval before it can be called. If this is true, the run will result in an `interruption` that the
program has to resolve by approving or rejecting the tool call.

***

### parameters

```ts
parameters: JsonObjectSchema<any>;
```

A JSON schema describing the parameters of the tool.

***

### strict

```ts
strict: boolean;
```

Whether the tool is strict. If true, the model must try to strictly follow the schema (might result in slower response times).

***

### type

```ts
type: "function";
```
