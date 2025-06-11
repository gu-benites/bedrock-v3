---
editUrl: false
next: false
prev: false
title: "ComputerAction"
---

```ts
type ComputerAction = 
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
