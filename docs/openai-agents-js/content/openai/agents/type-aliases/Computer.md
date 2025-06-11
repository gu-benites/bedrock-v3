---
editUrl: false
next: false
prev: false
title: "Computer"
---

```ts
type Computer = Expand<ComputerBase & Record<Exclude<ActionNames, keyof ComputerBase>, never>>;
```

Interface representing a fully implemented computer environment.
Combines the base operations with a constraint that no extra
action names beyond those in `ComputerAction` are present.
