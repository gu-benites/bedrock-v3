---
editUrl: false
next: false
prev: false
title: "GuardrailFunctionOutput"
---

The output of a guardrail function.

## Properties

### outputInfo

```ts
outputInfo: any;
```

Optional information about the guardrail's output.
For example, the guardrail could include information about the checks it performed and granular results.

***

### tripwireTriggered

```ts
tripwireTriggered: boolean;
```

Whether the tripwire was triggered. If triggered, the agent's execution will be halted.
