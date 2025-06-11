---
editUrl: false
next: false
prev: false
title: "generateTraceId"
---

```ts
function generateTraceId(): string
```

Generate a trace ID by creating a random UUID v4 and removing the dashes. This is the equivalent
of `uuid4().hex` in Python and prefixing it with `trace_`.

## Returns

`string`

A trace ID.
