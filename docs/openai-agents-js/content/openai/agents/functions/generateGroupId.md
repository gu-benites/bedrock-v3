---
editUrl: false
next: false
prev: false
title: "generateGroupId"
---

```ts
function generateGroupId(): string
```

Generate a group ID by creating a random UUID v4 and removing the dashes. This is the equivalent
of `uuid4().hex` in Python and prefixing it with `group_`.

## Returns

`string`

A group ID.
