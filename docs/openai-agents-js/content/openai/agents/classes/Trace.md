---
editUrl: false
next: false
prev: false
title: "Trace"
---

## Extended by

- [`NoopTrace`](/openai-agents-js/openai/agents/classes/nooptrace/)

## Constructors

### Constructor

```ts
new Trace(options, processor?): Trace
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

`options`

</td>
<td>

`TraceOptions`

</td>
</tr>
<tr>
<td>

`processor`?

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents/interfaces/tracingprocessor/)

</td>
</tr>
</tbody>
</table>

#### Returns

`Trace`

## Properties

### groupId

```ts
groupId: null | string;
```

***

### metadata?

```ts
optional metadata: Record<string, any>;
```

***

### name

```ts
name: string;
```

***

### traceId

```ts
traceId: string;
```

***

### type

```ts
type: "trace";
```

## Methods

### clone()

```ts
clone(): Trace
```

#### Returns

`Trace`

***

### end()

```ts
end(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

***

### start()

```ts
start(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

***

### toJSON()

```ts
toJSON(): null | object
```

#### Returns

`null` \| `object`
