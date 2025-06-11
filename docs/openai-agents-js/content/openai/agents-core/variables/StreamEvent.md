---
editUrl: false
next: false
prev: false
title: "StreamEvent"
---

```ts
const StreamEvent: ZodDiscriminatedUnion<"type", [ZodObject<object & object, "strip", ZodTypeAny, {
  delta: string;
  providerData: Record<string, any>;
  type: "output_text_delta";
 }, {
  delta: string;
  providerData: Record<string, any>;
  type: "output_text_delta";
 }>, ZodObject<object & object, "strip", ZodTypeAny, {
  providerData: Record<string, any>;
  response: {
     id: string;
     output: (
        | {
        content: (
           | {
           providerData: ...;
           refusal: ...;
           type: ...;
          }
           | {
           providerData: ...;
           text: ...;
           type: ...;
          }
           | {
           providerData: ...;
           text: ...;
           type: ...;
          }
           | {
           audio: ...;
           format: ...;
           providerData: ...;
           transcript: ...;
           type: ...;
          }
           | {
           image: ...;
           providerData: ...;
           type: ...;
          })[];
        id: string;
        providerData: Record<string, any>;
        role: "assistant";
        status: "in_progress" | "completed" | "incomplete";
        type: "message";
       }
        | {
        id: string;
        name: string;
        output: string;
        providerData: Record<string, any>;
        status: string;
        type: "hosted_tool_call";
       }
        | {
        arguments: string;
        callId: string;
        id: string;
        name: string;
        providerData: Record<string, any>;
        status: "in_progress" | "completed" | "incomplete";
        type: "function_call";
       }
        | {
        action:   | {
           type: "screenshot";
          }
           | {
           button: ... | ... | ... | ... | ...;
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
           keys: ...[];
           type: "keypress";
          }
           | {
           path: ...[];
           type: "drag";
          };
        callId: string;
        id: string;
        providerData: Record<string, any>;
        status: "in_progress" | "completed" | "incomplete";
        type: "computer_call";
       }
        | {
        content: object[];
        id: string;
        providerData: Record<string, any>;
        type: "reasoning";
       }
        | {
        id: string;
        providerData: Record<string, any>;
        type: "unknown";
       })[];
     providerData: Record<string, any>;
     usage: {
        inputTokens: number;
        inputTokensDetails: Record<string, number>;
        outputTokens: number;
        outputTokensDetails: Record<string, number>;
        requests: number;
        totalTokens: number;
       };
    };
  type: "response_done";
 }, {
  providerData: Record<string, any>;
  response: {
     id: string;
     output: (
        | {
        content: (
           | {
           providerData: ...;
           refusal: ...;
           type: ...;
          }
           | {
           providerData: ...;
           text: ...;
           type: ...;
          }
           | {
           providerData: ...;
           text: ...;
           type: ...;
          }
           | {
           audio: ...;
           format: ...;
           providerData: ...;
           transcript: ...;
           type: ...;
          }
           | {
           image: ...;
           providerData: ...;
           type: ...;
          })[];
        id: string;
        providerData: Record<string, any>;
        role: "assistant";
        status: "in_progress" | "completed" | "incomplete";
        type: "message";
       }
        | {
        id: string;
        name: string;
        output: string;
        providerData: Record<string, any>;
        status: string;
        type: "hosted_tool_call";
       }
        | {
        arguments: string;
        callId: string;
        id: string;
        name: string;
        providerData: Record<string, any>;
        status: "in_progress" | "completed" | "incomplete";
        type: "function_call";
       }
        | {
        action:   | {
           type: "screenshot";
          }
           | {
           button: ... | ... | ... | ... | ...;
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
           keys: ...[];
           type: "keypress";
          }
           | {
           path: ...[];
           type: "drag";
          };
        callId: string;
        id: string;
        providerData: Record<string, any>;
        status: "in_progress" | "completed" | "incomplete";
        type: "computer_call";
       }
        | {
        content: object[];
        id: string;
        providerData: Record<string, any>;
        type: "reasoning";
       }
        | {
        id: string;
        providerData: Record<string, any>;
        type: "unknown";
       })[];
     providerData: Record<string, any>;
     usage: {
        inputTokens: number;
        inputTokensDetails: Record<string, number>;
        outputTokens: number;
        outputTokensDetails: Record<string, number>;
        requests: number;
        totalTokens: number;
       };
    };
  type: "response_done";
 }>, ZodObject<object & object, "strip", ZodTypeAny, {
  providerData: Record<string, any>;
  type: "response_started";
 }, {
  providerData: Record<string, any>;
  type: "response_started";
 }>, ZodObject<object & object, "strip", ZodTypeAny, {
  event: any;
  providerData: Record<string, any>;
  type: "model";
 }, {
  event: any;
  providerData: Record<string, any>;
  type: "model";
}>]>;
```
