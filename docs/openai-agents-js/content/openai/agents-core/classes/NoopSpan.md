---
editUrl: false
next: false
prev: false
title: "NoopSpan"
---

## Extends

- [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`TSpanData`\>

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TSpanData` *extends* `SpanData`

</td>
</tr>
</tbody>
</table>

## Constructors

### Constructor

```ts
new NoopSpan<TSpanData>(data, processor): NoopSpan<TSpanData>
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

`data`

</td>
<td>

`TSpanData`

</td>
</tr>
<tr>
<td>

`processor`

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/)

</td>
</tr>
</tbody>
</table>

#### Returns

`NoopSpan`\<`TSpanData`\>

#### Overrides

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`constructor`](/openai-agents-js/openai/agents-core/classes/span/#constructor)

## Properties

### type

```ts
type: "trace.span";
```

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`type`](/openai-agents-js/openai/agents-core/classes/span/#type)

## Accessors

### endedAt

#### Get Signature

```ts
get endedAt(): null | string
```

##### Returns

`null` \| `string`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`endedAt`](/openai-agents-js/openai/agents-core/classes/span/#endedat)

***

### error

#### Get Signature

```ts
get error(): null | SpanError
```

##### Returns

`null` \| `SpanError`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`error`](/openai-agents-js/openai/agents-core/classes/span/#error)

***

### parentId

#### Get Signature

```ts
get parentId(): null | string
```

##### Returns

`null` \| `string`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`parentId`](/openai-agents-js/openai/agents-core/classes/span/#parentid)

***

### previousSpan

#### Get Signature

```ts
get previousSpan(): 
  | undefined
| Span<any>
```

##### Returns

  \| `undefined`
  \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

#### Set Signature

```ts
set previousSpan(span): void
```

##### Parameters

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

`span`

</td>
<td>

 \| `undefined` \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`previousSpan`](/openai-agents-js/openai/agents-core/classes/span/#previousspan)

***

### spanData

#### Get Signature

```ts
get spanData(): TData
```

##### Returns

`TData`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`spanData`](/openai-agents-js/openai/agents-core/classes/span/#spandata)

***

### spanId

#### Get Signature

```ts
get spanId(): string
```

##### Returns

`string`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`spanId`](/openai-agents-js/openai/agents-core/classes/span/#spanid)

***

### startedAt

#### Get Signature

```ts
get startedAt(): null | string
```

##### Returns

`null` \| `string`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`startedAt`](/openai-agents-js/openai/agents-core/classes/span/#startedat)

***

### traceId

#### Get Signature

```ts
get traceId(): string
```

##### Returns

`string`

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`traceId`](/openai-agents-js/openai/agents-core/classes/span/#traceid)

## Methods

### clone()

```ts
clone(): Span<TSpanData>
```

#### Returns

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`TSpanData`\>

#### Inherited from

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`clone`](/openai-agents-js/openai/agents-core/classes/span/#clone)

***

### end()

```ts
end(): void
```

#### Returns

`void`

#### Overrides

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`end`](/openai-agents-js/openai/agents-core/classes/span/#end)

***

### setError()

```ts
setError(): void
```

#### Returns

`void`

#### Overrides

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`setError`](/openai-agents-js/openai/agents-core/classes/span/#seterror)

***

### start()

```ts
start(): void
```

#### Returns

`void`

#### Overrides

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`start`](/openai-agents-js/openai/agents-core/classes/span/#start)

***

### toJSON()

```ts
toJSON(): null
```

#### Returns

`null`

#### Overrides

[`Span`](/openai-agents-js/openai/agents-core/classes/span/).[`toJSON`](/openai-agents-js/openai/agents-core/classes/span/#tojson)
