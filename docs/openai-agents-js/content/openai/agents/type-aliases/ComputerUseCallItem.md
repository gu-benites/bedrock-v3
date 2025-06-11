---
editUrl: false
next: false
prev: false
title: "ComputerUseCallItem"
---

```ts
type ComputerUseCallItem = object;
```

## Type declaration

### action

```ts
action: 
  | {
  type: "screenshot";
 }
  | {
  button: "left" | "right" | "wheel" | "back" | "forward";
  type: "click";
  x: number;
  y: number;
 }
  | {
  type: "double_click";
  x: number;
  y: number;
 }
  | {
  scroll_x: number;
  scroll_y: number;
  type: "scroll";
  x: number;
  y: number;
 }
  | {
  text: string;
  type: "type";
 }
  | {
  type: "wait";
 }
  | {
  type: "move";
  x: number;
  y: number;
 }
  | {
  keys: string[];
  type: "keypress";
 }
  | {
  path: object[];
  type: "drag";
};
```

### callId

```ts
callId: string;
```

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

### type

```ts
type: "computer_call";
```
