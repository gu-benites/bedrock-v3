---
editUrl: false
next: false
prev: false
title: "OutputModelItem"
---

```ts
type OutputModelItem = 
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
};
```

## Type declaration

\{
  `content`: (
     \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `refusal`: `string`;
     `type`: `"refusal"`;
    \}
     \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `text`: `string`;
     `type`: `"output_text"`;
    \}
     \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `text`: `string`;
     `type`: `"input_text"`;
    \}
     \| \{
     `audio`:   \| `string`
        \| \{
        `id`: `string`;
       \};
     `format`: `null` \| `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `transcript`: `null` \| `string`;
     `type`: `"audio"`;
    \}
     \| \{
     `image`: `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"image"`;
    \})[];
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `role`: `"assistant"`;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"message"`;
 \}

### content

```ts
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
```

The content of the message.

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

### role

```ts
role: "assistant";
```

Representing a message from the assistant (i.e. the model)

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

The status of the message.

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message

\{
  `id`: `string`;
  `name`: `string`;
  `output`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `string`;
  `type`: `"hosted_tool_call"`;
 \}

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### name

```ts
name: string;
```

The name of the hosted tool. For example `web_search_call` or `file_search_call`

### output?

```ts
optional output: string;
```

The primary output of the tool call. Additional output might be in the `providerData` field.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status?

```ts
optional status: string;
```

The status of the tool call.

### type

```ts
type: "hosted_tool_call";
```

\{
  `arguments`: `string`;
  `callId`: `string`;
  `id`: `string`;
  `name`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"function_call"`;
 \}

### arguments

```ts
arguments: string;
```

The arguments of the function call.

### callId

```ts
callId: string;
```

The ID of the tool call. Required to match up the respective tool call result.

### id?

```ts
optional id: string;
```

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

### name

```ts
name: string;
```

The name of the function.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### status?

```ts
optional status: "in_progress" | "completed" | "incomplete";
```

The status of the function call.

### type

```ts
type: "function_call";
```

\{
  `action`:   \| \{
     `type`: `"screenshot"`;
    \}
     \| \{
     `button`: `"left"` \| `"right"` \| `"wheel"` \| `"back"` \| `"forward"`;
     `type`: `"click"`;
     `x`: `number`;
     `y`: `number`;
    \}
     \| \{
     `type`: `"double_click"`;
     `x`: `number`;
     `y`: `number`;
    \}
     \| \{
     `scroll_x`: `number`;
     `scroll_y`: `number`;
     `type`: `"scroll"`;
     `x`: `number`;
     `y`: `number`;
    \}
     \| \{
     `text`: `string`;
     `type`: `"type"`;
    \}
     \| \{
     `type`: `"wait"`;
    \}
     \| \{
     `type`: `"move"`;
     `x`: `number`;
     `y`: `number`;
    \}
     \| \{
     `keys`: `string`[];
     `type`: `"keypress"`;
    \}
     \| \{
     `path`: `object`[];
     `type`: `"drag"`;
    \};
  `callId`: `string`;
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"computer_call"`;
 \}

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

\{
  `content`: `object`[];
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"reasoning"`;
 \}

### content

```ts
content: object[];
```

The user facing representation of the reasoning. Additional information might be in the `providerData` field.

### id?

```ts
optional id: string;
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "reasoning";
```

\{
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"unknown"`;
 \}

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

### type

```ts
type: "unknown";
```
