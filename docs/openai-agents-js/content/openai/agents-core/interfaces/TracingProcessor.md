---
editUrl: false
next: false
prev: false
title: "TracingProcessor"
---

Interface for processing traces

## Methods

### forceFlush()

```ts
forceFlush(): Promise<void>
```

Called when a trace is being flushed

#### Returns

`Promise`\<`void`\>

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

***

### onSpanStart()

```ts
onSpanStart(span): Promise<void>
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

***

### onTraceEnd()

```ts
onTraceEnd(trace): Promise<void>
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
