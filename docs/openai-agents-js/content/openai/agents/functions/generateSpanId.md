---
editUrl: false
next: false
prev: false
title: "generateSpanId"
---

```ts
function generateSpanId(): string
```

Generate a span ID by creating a random UUID v4 and removing the dashes. This is the equivalent
of `uuid4().hex` in Python and prefixing it with `span_`.

## Returns

`string`

A span ID.
