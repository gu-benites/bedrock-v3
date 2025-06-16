---
editUrl: false
next: false
prev: false
title: "ConsoleSpanExporter"
---

Prints the traces and spans to the console

## Implements

- [`TracingExporter`](/openai-agents-js/openai/agents/interfaces/tracingexporter/)

## Constructors

### Constructor

```ts
new ConsoleSpanExporter(): ConsoleSpanExporter
```

#### Returns

`ConsoleSpanExporter`

## Methods

### export()

```ts
export(items): Promise<void>
```

Export the given traces and spans

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

`items`

</td>
<td>

([`Trace`](/openai-agents-js/openai/agents/classes/trace/) \| `Span`)[]

</td>
<td>

The traces and spans to export

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingExporter`](/openai-agents-js/openai/agents/interfaces/tracingexporter/).[`export`](/openai-agents-js/openai/agents/interfaces/tracingexporter/#export)
