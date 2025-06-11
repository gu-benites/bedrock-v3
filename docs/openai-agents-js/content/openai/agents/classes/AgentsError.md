---
editUrl: false
next: false
prev: false
title: "AgentsError"
---

Base class for all errors thrown by the library.

## Extends

- `Error`

## Extended by

- [`GuardrailExecutionError`](/openai-agents-js/openai/agents/classes/guardrailexecutionerror/)
- [`InputGuardrailTripwireTriggered`](/openai-agents-js/openai/agents/classes/inputguardrailtripwiretriggered/)
- [`MaxTurnsExceededError`](/openai-agents-js/openai/agents/classes/maxturnsexceedederror/)
- [`ModelBehaviorError`](/openai-agents-js/openai/agents/classes/modelbehaviorerror/)
- [`OutputGuardrailTripwireTriggered`](/openai-agents-js/openai/agents/classes/outputguardrailtripwiretriggered/)
- [`ToolCallError`](/openai-agents-js/openai/agents/classes/toolcallerror/)
- [`UserError`](/openai-agents-js/openai/agents/classes/usererror/)
- [`SystemError`](/openai-agents-js/openai/agents/classes/systemerror/)

## Constructors

### Constructor

```ts
new AgentsError(message, state?): AgentsError
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

`AgentsError`

#### Overrides

```ts
Error.constructor
```

## Properties

### message

```ts
message: string;
```

#### Inherited from

```ts
Error.message
```

***

### name

```ts
name: string;
```

#### Inherited from

```ts
Error.name
```

***

### stack?

```ts
optional stack: string;
```

#### Inherited from

```ts
Error.stack
```

***

### state?

```ts
optional state: RunState<any, Agent<any, any>>;
```

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

```ts
Error.prepareStackTrace
```

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

#### Inherited from

```ts
Error.stackTraceLimit
```

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

```ts
Error.captureStackTrace
```
