---
editUrl: false
next: false
prev: false
title: "RealtimeMessageItem"
---

```ts
type RealtimeMessageItem = 
  | {
  content: object[];
  itemId: string;
  previousItemId: null | string;
  role: "system";
  type: "message";
 }
  | {
  content: (
     | {
     text: string;
     type: "input_text";
    }
     | {
     audio: null | string;
     transcript: null | string;
     type: "input_audio";
    })[];
  itemId: string;
  previousItemId: null | string;
  role: "user";
  status: "in_progress" | "completed";
  type: "message";
 }
  | {
  content: (
     | {
     text: string;
     type: "text";
    }
     | {
     audio: null | string;
     transcript: null | string;
     type: "audio";
    })[];
  itemId: string;
  previousItemId: null | string;
  role: "assistant";
  status: "in_progress" | "completed" | "incomplete";
  type: "message";
};
```
