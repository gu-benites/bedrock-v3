---
editUrl: false
next: false
prev: false
title: "Span"
---

## Extended by

- [`NoopSpan`](/openai-agents-js/openai/agents/classes/noopspan/)

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

`TData` *extends* `SpanData`

</td>
</tr>
</tbody>
</table>

## Constructors

### Constructor

```ts
new Span<TData>(options, processor): Span<TData>
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

`SpanOptions`\<`TData`\>

</td>
</tr>
<tr>
<td>

`processor`

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents/interfaces/tracingprocessor/)

</td>
</tr>
</tbody>
</table>

#### Returns

`Span`\<`TData`\>

## Properties

### type

```ts
type: "trace.span";
```

## Accessors

### endedAt

#### Get Signature

```ts
get endedAt(): null | string
```

##### Returns

`null` \| `string`

***

### error

#### Get Signature

```ts
get error(): null | SpanError
```

##### Returns

`null` \| `SpanError`

***

### parentId

#### Get Signature

```ts
get parentId(): null | string
```

##### Returns

`null` \| `string`

***

### previousSpan

#### Get Signature

```ts
get previousSpan(): undefined | Span<any>
```

##### Returns

`undefined` \| `Span`\<`any`\>

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

`undefined` \| `Span`\<`any`\>

</td>
</tr>
</tbody>
</table>

##### Returns

`void`

***

### spanData

#### Get Signature

```ts
get spanData(): TData
```

##### Returns

`TData`

***

### spanId

#### Get Signature

```ts
get spanId(): string
```

##### Returns

`string`

***

### startedAt

#### Get Signature

```ts
get startedAt(): null | string
```

##### Returns

`null` \| `string`

***

### traceId

#### Get Signature

```ts
get traceId(): string
```

##### Returns

`string`

## Methods

### clone()

```ts
clone(): Span<TData>
```

#### Returns

`Span`\<`TData`\>

***

### end()

```ts
end(): void
```

#### Returns

`void`

***

### setError()

```ts
setError(error): void
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

`error`

</td>
<td>

`SpanError`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### start()

```ts
start(): void
```

#### Returns

`void`

***

### toJSON()

```ts
toJSON(): null | object
```

#### Returns

`null` \| `object`
