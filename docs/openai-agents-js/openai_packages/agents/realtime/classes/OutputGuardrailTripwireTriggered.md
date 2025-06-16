---
editUrl: false
next: false
prev: false
title: "OutputGuardrailTripwireTriggered"
---

Error thrown when an output guardrail tripwire is triggered.

## Extends

- `AgentsError`

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

`TMeta` *extends* `OutputGuardrailMetadata`

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`TOutputType` *extends* `AgentOutputType`

</td>
<td>

`TextOutput`

</td>
</tr>
</tbody>
</table>

## Constructors

### Constructor

```ts
new OutputGuardrailTripwireTriggered<TMeta, TOutputType>(
   message, 
   result, 
state?): OutputGuardrailTripwireTriggered<TMeta, TOutputType>
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

`result`

</td>
<td>

`OutputGuardrailResult`\<`TMeta`, `TOutputType`\>

</td>
</tr>
<tr>
<td>

`state`?

</td>
<td>

`RunState`\<`any`, `any`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`OutputGuardrailTripwireTriggered`\<`TMeta`, `TOutputType`\>

#### Overrides

```ts
AgentsError.constructor
```

## Properties

### message

```ts
message: string;
```

#### Inherited from

```ts
AgentsError.message
```

***

### name

```ts
name: string;
```

#### Inherited from

```ts
AgentsError.name
```

***

### result

```ts
result: OutputGuardrailResult<TMeta, TOutputType>;
```

***

### stack?

```ts
optional stack: string;
```

#### Inherited from

```ts
AgentsError.stack
```

***

### state?

```ts
optional state: RunState<any, Agent<any, any>>;
```

#### Inherited from

```ts
AgentsError.state
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
AgentsError.prepareStackTrace
```

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

#### Inherited from

```ts
AgentsError.stackTraceLimit
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
AgentsError.captureStackTrace
```
