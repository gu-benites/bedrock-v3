---
editUrl: false
next: false
prev: false
title: "AssistantContent"
---

```ts
type AssistantContent = 
  | {
  providerData: Record<string, any>;
  text: string;
  type: "output_text";
 }
  | {
  providerData: Record<string, any>;
  refusal: string;
  type: "refusal";
 }
  | {
  providerData: Record<string, any>;
  text: string;
  type: "input_text";
 }
  | {
  audio:   | string
     | {
     id: string;
    };
  format: null | string;
  providerData: Record<string, any>;
  transcript: null | string;
  type: "audio";
 }
  | {
  image: string;
  providerData: Record<string, any>;
  type: "image";
};
```
