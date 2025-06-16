---
editUrl: false
next: false
prev: false
title: "RunContext"
---

A context object that is passed to the `Runner.run()` method.

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
new RunContext<TContext>(context?): RunContext<TContext>
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

`context`?

</td>
<td>

`TContext`

</td>
</tr>
</tbody>
</table>

#### Returns

`RunContext`\<`TContext`\>

## Properties

### context

```ts
context: TContext;
```

The context object passed by you to the `Runner.run()`

***

### usage

```ts
usage: Usage;
```

The usage of the agent run so far. For streamed responses, the usage will be stale until the
last chunk of the stream is processed.

## Methods

### approveTool()

```ts
approveTool(approvalItem, callId?): void
```

Approve a tool call.

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

`approvalItem`

</td>
<td>

[`RunToolApprovalItem`](/openai-agents-js/openai/agents/classes/runtoolapprovalitem/)

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`callId`?

</td>
<td>

\{ `alwaysApprove`: `boolean`; \}

</td>
<td>

The call ID of the tool call.

</td>
</tr>
<tr>
<td>

`callId.alwaysApprove`?

</td>
<td>

`boolean`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### isToolApproved()

```ts
isToolApproved(__namedParameters): undefined | boolean
```

Check if a tool call has been approved.

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

`__namedParameters`

</td>
<td>

\{ `callId`: `string`; `toolName`: `string`; \}

</td>
</tr>
<tr>
<td>

`__namedParameters.callId`

</td>
<td>

`string`

</td>
</tr>
<tr>
<td>

`__namedParameters.toolName`

</td>
<td>

`string`

</td>
</tr>
</tbody>
</table>

#### Returns

`undefined` \| `boolean`

`true` if the tool call has been approved, `false` if blocked and `undefined` if not yet approved or rejected.

***

### rejectTool()

```ts
rejectTool(approvalItem, __namedParameters?): void
```

Reject a tool call.

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

`approvalItem`

</td>
<td>

[`RunToolApprovalItem`](/openai-agents-js/openai/agents/classes/runtoolapprovalitem/)

</td>
<td>

The tool approval item to reject.

</td>
</tr>
<tr>
<td>

`__namedParameters`?

</td>
<td>

\{ `alwaysReject`: `boolean`; \}

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`__namedParameters.alwaysReject`?

</td>
<td>

`boolean`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### toJSON()

```ts
toJSON(): object
```

#### Returns

`object`

##### approvals

```ts
approvals: Record<string, ApprovalRecord>;
```

##### context

```ts
context: any;
```

##### usage

```ts
usage: Usage;
```
