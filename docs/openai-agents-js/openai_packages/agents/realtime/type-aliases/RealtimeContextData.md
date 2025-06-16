---
editUrl: false
next: false
prev: false
title: "RealtimeContextData"
---

```ts
type RealtimeContextData<TContext> = TContext & object;
```

The context data for a realtime session. This is the context data that is passed to the agent.
The RealtimeSession will automatically add the current snapshot of the history to the context.

## Type declaration

### history

```ts
history: RealtimeItem[];
```

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

`TContext`

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>
