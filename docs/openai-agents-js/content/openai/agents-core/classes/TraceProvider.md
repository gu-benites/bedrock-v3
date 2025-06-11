---
editUrl: false
next: false
prev: false
title: "TraceProvider"
---

## Constructors

### Constructor

```ts
new TraceProvider(): TraceProvider
```

#### Returns

`TraceProvider`

## Methods

### createSpan()

```ts
createSpan<TSpanData>(spanOptions, parent?): Span<TSpanData>
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

`TSpanData` *extends* `SpanData`

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

`spanOptions`

</td>
<td>

`CreateSpanOptions`\<`TSpanData`\>

</td>
</tr>
<tr>
<td>

`parent`?

</td>
<td>

 \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/) \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

</td>
</tr>
</tbody>
</table>

#### Returns

[`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`TSpanData`\>

***

### createTrace()

```ts
createTrace(traceOptions): Trace
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

`traceOptions`

</td>
<td>

`TraceOptions`

</td>
</tr>
</tbody>
</table>

#### Returns

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

***

### getCurrentSpan()

```ts
getCurrentSpan(): 
  | null
| Span<any>
```

#### Returns

  \| `null`
  \| [`Span`](/openai-agents-js/openai/agents-core/classes/span/)\<`any`\>

***

### getCurrentTrace()

```ts
getCurrentTrace(): null | Trace
```

Get the current trace.

#### Returns

`null` \| [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

The current trace.

***

### registerProcessor()

```ts
registerProcessor(processor): void
```

Add a processor to the list of processors. Each processor will receive all traces/spans.

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

`processor`

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/)

</td>
<td>

The processor to add.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### setDisabled()

```ts
setDisabled(disabled): void
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

`disabled`

</td>
<td>

`boolean`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### setProcessors()

```ts
setProcessors(processors): void
```

Set the list of processors. This will replace any existing processors.

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

`processors`

</td>
<td>

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/)[]

</td>
<td>

The list of processors to set.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### shutdown()

```ts
shutdown(timeout?): Promise<void>
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

`timeout`?

</td>
<td>

`number`

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>
