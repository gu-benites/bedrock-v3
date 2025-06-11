---
editUrl: false
next: false
prev: false
title: "FunctionToolResult"
---

```ts
type FunctionToolResult<Context, TParameters, Result> = 
  | {
  output: string | unknown;
  runItem: RunToolCallOutputItem;
  tool: FunctionTool<Context, TParameters, Result>;
  type: "function_output";
 }
  | {
  runItem: RunToolApprovalItem;
  tool: FunctionTool<Context, TParameters, Result>;
  type: "function_approval";
};
```

The result of invoking a function tool. Either the actual output of the execution or a tool
approval request.

These get passed for example to the `toolUseBehavior` option of the `Agent` constructor.

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

`Context`

</td>
<td>

[`UnknownContext`](/openai-agents-js/openai/agents-core/type-aliases/unknowncontext/)

</td>
</tr>
<tr>
<td>

`TParameters` *extends* `ToolInputParameters`

</td>
<td>

`any`

</td>
</tr>
<tr>
<td>

`Result`

</td>
<td>

`any`

</td>
</tr>
</tbody>
</table>

## Type declaration

\{
  `output`: `string` \| `unknown`;
  `runItem`: [`RunToolCallOutputItem`](/openai-agents-js/openai/agents-core/classes/runtoolcalloutputitem/);
  `tool`: [`FunctionTool`](/openai-agents-js/openai/agents-core/type-aliases/functiontool/)\<`Context`, `TParameters`, `Result`\>;
  `type`: `"function_output"`;
 \}

### output

```ts
output: string | unknown;
```

The output of the tool call. This can be a string or a stringifable item.

### runItem

```ts
runItem: RunToolCallOutputItem;
```

The run item representing the tool call output.

### tool

```ts
tool: FunctionTool<Context, TParameters, Result>;
```

The tool that was called.

### type

```ts
type: "function_output";
```

\{
  `runItem`: [`RunToolApprovalItem`](/openai-agents-js/openai/agents-core/classes/runtoolapprovalitem/);
  `tool`: [`FunctionTool`](/openai-agents-js/openai/agents-core/type-aliases/functiontool/)\<`Context`, `TParameters`, `Result`\>;
  `type`: `"function_approval"`;
 \}

### runItem

```ts
runItem: RunToolApprovalItem;
```

The item representing the tool call that is requiring approval.

### tool

```ts
tool: FunctionTool<Context, TParameters, Result>;
```

The tool that is requiring to be approved.

### type

```ts
type: "function_approval";
```

Indiciates that the tool requires approval before it can be called.
