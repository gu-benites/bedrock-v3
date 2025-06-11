---
editUrl: false
next: false
prev: false
title: "SerializedHandoff"
---

```ts
type SerializedHandoff = object;
```

## Properties

### inputJsonSchema

```ts
inputJsonSchema: Handoff["inputJsonSchema"];
```

The JSON schema for the handoff input. Can be empty if the handoff does not take an input

***

### strictJsonSchema

```ts
strictJsonSchema: Handoff["strictJsonSchema"];
```

Whether the input JSON schema is in strict mode. We strongly recommend setting this to true,
as it increases the likelihood of correct JSON input.

***

### toolDescription

```ts
toolDescription: Handoff["toolDescription"];
```

The tool description for the handoff

***

### toolName

```ts
toolName: Handoff["toolName"];
```

The name of the tool that represents the handoff.
