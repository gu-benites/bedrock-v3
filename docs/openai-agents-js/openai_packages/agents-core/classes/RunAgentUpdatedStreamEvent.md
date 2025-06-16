---
editUrl: false
next: false
prev: false
title: "RunAgentUpdatedStreamEvent"
---

Event that notifies that there is a new agent running.

## Constructors

### Constructor

```ts
new RunAgentUpdatedStreamEvent(agent): RunAgentUpdatedStreamEvent
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

`agent`

</td>
<td>

[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`any`, `any`\>

</td>
<td>

The new agent

</td>
</tr>
</tbody>
</table>

#### Returns

`RunAgentUpdatedStreamEvent`

## Properties

### agent

```ts
agent: Agent<any, any>;
```

The new agent

***

### type

```ts
readonly type: "agent_updated_stream_event" = 'agent_updated_stream_event';
```
