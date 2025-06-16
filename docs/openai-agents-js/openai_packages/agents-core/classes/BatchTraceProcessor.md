---
editUrl: false
next: false
prev: false
title: "BatchTraceProcessor"
---

Interface for processing traces

## Implements

- [`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/)

## Constructors

### Constructor

```ts
new BatchTraceProcessor(exporter, __namedParameters): BatchTraceProcessor
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

`exporter`

</td>
<td>

[`TracingExporter`](/openai-agents-js/openai/agents-core/interfaces/tracingexporter/)

</td>
</tr>
<tr>
<td>

`__namedParameters`

</td>
<td>

`BatchTraceProcessorOptions`

</td>
</tr>
</tbody>
</table>

#### Returns

`BatchTraceProcessor`

## Methods

### forceFlush()

```ts
forceFlush(): Promise<void>
```

Called when a trace is being flushed

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`forceFlush`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#forceflush)

***

### onSpanEnd()

```ts
onSpanEnd(span): Promise<void>
```

Called when a span is ended

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

`span`

</td>
<td>

`Span`

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`onSpanEnd`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#onspanend)

***

### onSpanStart()

```ts
onSpanStart(_span): Promise<void>
```

Called when a span is started

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

`_span`

</td>
<td>

`Span`

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`onSpanStart`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#onspanstart)

***

### onTraceEnd()

```ts
onTraceEnd(_trace): Promise<void>
```

Called when a trace is ended

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

`_trace`

</td>
<td>

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`onTraceEnd`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#ontraceend)

***

### onTraceStart()

```ts
onTraceStart(trace): Promise<void>
```

Called when a trace is started

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

`trace`

</td>
<td>

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`onTraceStart`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#ontracestart)

***

### shutdown()

```ts
shutdown(timeout?): Promise<void>
```

Called when the trace processor is shutting down

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

#### Implementation of

[`TracingProcessor`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/).[`shutdown`](/openai-agents-js/openai/agents-core/interfaces/tracingprocessor/#shutdown)
