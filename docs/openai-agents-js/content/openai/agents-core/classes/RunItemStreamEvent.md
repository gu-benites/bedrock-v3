---
editUrl: false
next: false
prev: false
title: "RunItemStreamEvent"
---

Streaming events that wrap a `RunItem`. As the agent processes the LLM response, it will generate
these events from new messages, tool calls, tool outputs, handoffs, etc.

## Constructors

### Constructor

```ts
new RunItemStreamEvent(name, item): RunItemStreamEvent
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

`name`

</td>
<td>

`RunItemStreamEventName`

</td>
<td>

The name of the event.

</td>
</tr>
<tr>
<td>

`item`

</td>
<td>

[`RunItem`](/openai-agents-js/openai/agents-core/type-aliases/runitem/)

</td>
<td>

The item that was created.

</td>
</tr>
</tbody>
</table>

#### Returns

`RunItemStreamEvent`

## Properties

### item

```ts
item: RunItem;
```

The item that was created.

***

### name

```ts
name: RunItemStreamEventName;
```

The name of the event.

***

### type

```ts
readonly type: "run_item_stream_event" = 'run_item_stream_event';
```
