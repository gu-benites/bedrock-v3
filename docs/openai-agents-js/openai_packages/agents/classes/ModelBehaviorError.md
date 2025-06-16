---
editUrl: false
next: false
prev: false
title: "ModelBehaviorError"
---

Error thrown when a model behavior is unexpected.

## Extends

- [`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/)

## Constructors

### Constructor

```ts
new ModelBehaviorError(message, state?): ModelBehaviorError
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

`message`

</td>
<td>

`string`

</td>
</tr>
<tr>
<td>

`state`?

</td>
<td>

[`RunState`](/openai-agents-js/openai/agents/classes/runstate/)\<`any`, [`Agent`](/openai-agents-js/openai/agents/classes/agent/)\<`any`, `any`\>\>

</td>
</tr>
</tbody>
</table>

#### Returns

`ModelBehaviorError`

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`constructor`](/openai-agents-js/openai/agents/classes/agentserror/#constructor)

## Properties

### message

```ts
message: string;
```

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`message`](/openai-agents-js/openai/agents/classes/agentserror/#message)

***

### name

```ts
name: string;
```

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`name`](/openai-agents-js/openai/agents/classes/agentserror/#name)

***

### stack?

```ts
optional stack: string;
```

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`stack`](/openai-agents-js/openai/agents/classes/agentserror/#stack)

***

### state?

```ts
optional state: RunState<any, Agent<any, any>>;
```

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`state`](/openai-agents-js/openai/agents/classes/agentserror/#state)

***

### prepareStackTrace()?

```ts
static optional prepareStackTrace: (err, stackTraces) => any;
```

Optional override for formatting stack traces

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

`err`

</td>
<td>

`Error`

</td>
</tr>
<tr>
<td>

`stackTraces`

</td>
<td>

`CallSite`[]

</td>
</tr>
</tbody>
</table>

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`prepareStackTrace`](/openai-agents-js/openai/agents/classes/agentserror/#preparestacktrace)

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`stackTraceLimit`](/openai-agents-js/openai/agents/classes/agentserror/#stacktracelimit)

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

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

`targetObject`

</td>
<td>

`object`

</td>
</tr>
<tr>
<td>

`constructorOpt`?

</td>
<td>

`Function`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

[`AgentsError`](/openai-agents-js/openai/agents/classes/agentserror/).[`captureStackTrace`](/openai-agents-js/openai/agents/classes/agentserror/#capturestacktrace)
