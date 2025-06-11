---
editUrl: false
next: false
prev: false
title: "JsonSchemaDefinition"
---

```ts
type JsonSchemaDefinition = object;
```

Wrapper around a JSON schema used for describing tool parameters.

## Properties

### name

```ts
name: string;
```

***

### schema

```ts
schema: JsonObjectSchema<Record<string, JsonSchemaDefinitionEntry>>;
```

***

### strict

```ts
strict: boolean;
```

***

### type

```ts
type: "json_schema";
```
