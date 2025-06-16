---
editUrl: false
next: false
prev: false
title: "AgentHooks"
---

Event emitter that every Agent instance inherits from and that emits events for the lifecycle
of the agent.

## Extends

- `EventEmitterDelegate`\<`AgentHookEvents`\<`TContext`, `TOutput`\>\>

## Extended by

- [`Agent`](/openai-agents-js/openai/agents/classes/agent/)

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

## Constructors

### Constructor

```ts
new AgentHooks<TContext, TOutput>(): AgentHooks<TContext, TOutput>
```

#### Returns

`AgentHooks`\<`TContext`, `TOutput`\>

#### Inherited from

```ts
EventEmitterDelegate<AgentHookEvents<TContext, TOutput>>.constructor
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

```ts
EventEmitterDelegate.emit
```

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

```ts
EventEmitterDelegate.off
```

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

```ts
EventEmitterDelegate.on
```

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

```ts
EventEmitterDelegate.once
```
