---
editUrl: false
next: false
prev: false
title: "RunRawModelStreamEvent"
---

Streaming event from the LLM. These are `raw` events, i.e. they are directly passed through from
the LLM.

## Constructors

### Constructor

```ts
new RunRawModelStreamEvent(data): RunRawModelStreamEvent
```

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

`data`

</td>
<td>

[`StreamEvent`](/openai-agents-js/openai/agents-core/type-aliases/streamevent/)

</td>
<td>

The raw responses stream events from the LLM.

</td>
</tr>
</tbody>
</table>

#### Returns

`RunRawModelStreamEvent`

## Properties

### data

```ts
data: StreamEvent;
```

The raw responses stream events from the LLM.

***

### type

```ts
readonly type: "raw_model_stream_event" = 'raw_model_stream_event';
```

The type of the event.
