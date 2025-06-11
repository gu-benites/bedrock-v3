---
editUrl: false
next: false
prev: false
title: "OpenAITracingExporter"
---

A tracing exporter that exports traces to OpenAI's tracing API.

## Implements

- [`TracingExporter`](/openai-agents-js/openai/agents/interfaces/tracingexporter/)

## Constructors

### Constructor

```ts
new OpenAITracingExporter(options?): OpenAITracingExporter
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

`options`?

</td>
<td>

`Partial`\<[`OpenAITracingExporterOptions`](/openai-agents-js/openai/agents/type-aliases/openaitracingexporteroptions/)\>

</td>
</tr>
</tbody>
</table>

#### Returns

`OpenAITracingExporter`

## Methods

### export()

```ts
export(items, signal?): Promise<void>
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

( \| [`Span`](/openai-agents-js/openai/agents/classes/span/)\<`any`\> \| [`Trace`](/openai-agents-js/openai/agents/classes/trace/))[]

</td>
<td>

The traces and spans to export

</td>
</tr>
<tr>
<td>

`signal`?

</td>
<td>

`AbortSignal`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TracingExporter`](/openai-agents-js/openai/agents/interfaces/tracingexporter/).[`export`](/openai-agents-js/openai/agents/interfaces/tracingexporter/#export)
