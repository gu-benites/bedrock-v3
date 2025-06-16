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
 } = computerActions;
```

The action to be performed by the computer.

### callId

```ts
callId: string;
```

The ID of the computer call. Required to match up the respective computer call result.

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

The status of the computer call.

### type

```ts
type: "computer_call";
```
