---
editUrl: false
next: false
prev: false
title: "ToolCallItem"
---

```ts
type ToolCallItem = 
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
};
```

## Type declaration

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
