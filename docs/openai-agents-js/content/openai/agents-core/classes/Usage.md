---
editUrl: false
next: false
prev: false
title: "Usage"
---

Tracks token usage and request counts for an agent run.

## Constructors

### Constructor

```ts
new Usage(input?): Usage
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

`input`?

</td>
<td>

`Partial`\<\{ `inputTokens`: `number`; `inputTokensDetails`: `Record`\<`string`, `number`\>; `outputTokens`: `number`; `outputTokensDetails`: `Record`\<`string`, `number`\>; `requests`: `number`; `totalTokens`: `number`; \}\> & `object`

</td>
</tr>
</tbody>
</table>

#### Returns

`Usage`

## Properties

### inputTokens

```ts
inputTokens: number;
```

The number of input tokens used across all requests.

***

### inputTokensDetails

```ts
inputTokensDetails: Record<string, number>[] = [];
```

Details about the input tokens used across all requests.

***

### outputTokens

```ts
outputTokens: number;
```

The number of output tokens used across all requests.

***

### outputTokensDetails

```ts
outputTokensDetails: Record<string, number>[] = [];
```

Details about the output tokens used across all requests.

***

### requests

```ts
requests: number;
```

The number of requests made to the LLM API.

***

### totalTokens

```ts
totalTokens: number;
```

The total number of tokens sent and received, across all requests.

## Methods

### add()

```ts
add(newUsage): void
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

`newUsage`

</td>
<td>

`Usage`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`
