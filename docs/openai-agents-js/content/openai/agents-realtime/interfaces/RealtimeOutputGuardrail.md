---
editUrl: false
next: false
prev: false
title: "RealtimeOutputGuardrail"
---

## Extends

- `OutputGuardrail`

## Properties

### execute

```ts
execute: OutputGuardrailFunction<"text">;
```

The function that performs the guardrail check.

#### Inherited from

```ts
OutputGuardrail.execute
```

***

### name

```ts
name: string;
```

The name of the guardrail.

#### Inherited from

```ts
OutputGuardrail.name
```

***

### policyHint?

```ts
optional policyHint: string;
```

This will be passed to the model to inform it about why the guardrail was triggered and to
correct the behavior. If it's not specified the name of your guardrail will be passed instead.
