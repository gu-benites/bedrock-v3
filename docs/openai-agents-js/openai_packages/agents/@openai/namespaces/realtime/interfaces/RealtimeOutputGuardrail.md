---
editUrl: false
next: false
prev: false
title: "RealtimeOutputGuardrail"
---

A guardrail that checks the output of the agent.

## Extends

- [`OutputGuardrail`](/openai-agents-js/openai/agents/interfaces/outputguardrail/)

## Properties

### execute

```ts
execute: OutputGuardrailFunction<"text">;
```

The function that performs the guardrail check.

#### Inherited from

[`OutputGuardrail`](/openai-agents-js/openai/agents/interfaces/outputguardrail/).[`execute`](/openai-agents-js/openai/agents/interfaces/outputguardrail/#execute)

***

### name

```ts
name: string;
```

The name of the guardrail.

#### Inherited from

[`OutputGuardrail`](/openai-agents-js/openai/agents/interfaces/outputguardrail/).[`name`](/openai-agents-js/openai/agents/interfaces/outputguardrail/#name)

***

### policyHint?

```ts
optional policyHint: string;
```

This will be passed to the model to inform it about why the guardrail was triggered and to
correct the behavior. If it's not specified the name of your guardrail will be passed instead.
