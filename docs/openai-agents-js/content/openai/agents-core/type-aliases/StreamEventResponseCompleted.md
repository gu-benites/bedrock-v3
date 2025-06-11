---
editUrl: false
next: false
prev: false
title: "StreamEventResponseCompleted"
---

```ts
type StreamEventResponseCompleted = object;
```

Event returned by the model when a response is completed.

## Type declaration

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### response

```ts
response: object;
```

The response from the model.

#### response.id

```ts
id: string;
```

The ID of the response.

#### response.output

```ts
output: (
  | {
  content: (
     | {
     providerData: Record<string, any>;
     refusal: string;
     type: "refusal";
    }
     | {
     providerData: Record<string, any>;
     text: string;
     type: "output_text";
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
```

The output from the model.

#### response.providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

#### response.usage

```ts
usage: object = UsageData;
```

The usage data for the response.

#### response.usage.inputTokens

```ts
inputTokens: number;
```

#### response.usage.inputTokensDetails?

```ts
optional inputTokensDetails: Record<string, number>;
```

#### response.usage.outputTokens

```ts
outputTokens: number;
```

#### response.usage.outputTokensDetails?

```ts
optional outputTokensDetails: Record<string, number>;
```

#### response.usage.requests?

```ts
optional requests: number;
```

#### response.usage.totalTokens

```ts
totalTokens: number;
```

### type

```ts
type: "response_done";
```
