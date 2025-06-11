---
editUrl: false
next: false
prev: false
title: "StreamEvent"
---

```ts
const StreamEvent: z.ZodDiscriminatedUnion<"type", [z.ZodObject<object & object, "strip", z.ZodTypeAny, {
  delta: string;
  providerData: Record<string, any>;
  type: "output_text_delta";
 }, {
  delta: string;
  providerData: Record<string, any>;
  type: "output_text_delta";
 }>, z.ZodObject<object & object, "strip", z.ZodTypeAny, {
  providerData: Record<string, any>;
  response: {
     id: string;
     output: (
        | {
        content: ...[];
        id: string;
        providerData: Record<..., ...>;
        role: "assistant";
        status: "in_progress" | "completed" | "incomplete";
        type: "message";
       }
        | {
        id: string;
        name: string;
        output: string;
        providerData: Record<..., ...>;
        status: string;
        type: "hosted_tool_call";
       }
        | {
        arguments: string;
        callId: string;
        id: string;
        name: string;
        providerData: Record<..., ...>;
        status: "in_progress" | "completed" | "incomplete";
        type: "function_call";
       }
        | {
        action:   | {
           type: ...;
          }
           | {
           button: ...;
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           scroll_x: ...;
           scroll_y: ...;
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           text: ...;
           type: ...;
          }
           | {
           type: ...;
          }
           | {
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           keys: ...;
           type: ...;
          }
           | {
           path: ...;
           type: ...;
          };
        callId: string;
        id: string;
        providerData: Record<..., ...>;
        status: "in_progress" | "completed" | "incomplete";
        type: "computer_call";
       }
        | {
        content: object[];
        id: string;
        providerData: Record<..., ...>;
        type: "reasoning";
       }
        | {
        id: string;
        providerData: Record<..., ...>;
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
        content: ...[];
        id: string;
        providerData: Record<..., ...>;
        role: "assistant";
        status: "in_progress" | "completed" | "incomplete";
        type: "message";
       }
        | {
        id: string;
        name: string;
        output: string;
        providerData: Record<..., ...>;
        status: string;
        type: "hosted_tool_call";
       }
        | {
        arguments: string;
        callId: string;
        id: string;
        name: string;
        providerData: Record<..., ...>;
        status: "in_progress" | "completed" | "incomplete";
        type: "function_call";
       }
        | {
        action:   | {
           type: ...;
          }
           | {
           button: ...;
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           scroll_x: ...;
           scroll_y: ...;
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           text: ...;
           type: ...;
          }
           | {
           type: ...;
          }
           | {
           type: ...;
           x: ...;
           y: ...;
          }
           | {
           keys: ...;
           type: ...;
          }
           | {
           path: ...;
           type: ...;
          };
        callId: string;
        id: string;
        providerData: Record<..., ...>;
        status: "in_progress" | "completed" | "incomplete";
        type: "computer_call";
       }
        | {
        content: object[];
        id: string;
        providerData: Record<..., ...>;
        type: "reasoning";
       }
        | {
        id: string;
        providerData: Record<..., ...>;
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
 }>, z.ZodObject<object & object, "strip", z.ZodTypeAny, {
  providerData: Record<string, any>;
  type: "response_started";
 }, {
  providerData: Record<string, any>;
  type: "response_started";
 }>, z.ZodObject<object & object, "strip", z.ZodTypeAny, {
  event: any;
  providerData: Record<string, any>;
  type: "model";
 }, {
  event: any;
  providerData: Record<string, any>;
  type: "model";
}>]>;
```
