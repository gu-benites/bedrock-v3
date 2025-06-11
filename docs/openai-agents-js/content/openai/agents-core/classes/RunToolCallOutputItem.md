---
editUrl: false
next: false
prev: false
title: "RunToolCallOutputItem"
---

## Extends

- `RunItemBase`

## Constructors

### Constructor

```ts
new RunToolCallOutputItem(
   rawItem, 
   agent, 
   output): RunToolCallOutputItem
```

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`rawItem`

</td>
<td>

 \| \{ `callId`: `string`; `id`: `string`; `name`: `string`; `output`: \| \{ `providerData`: `Record`\<`string`, `any`\>; `text`: `string`; `type`: `"text"`; \} \| \{ `data`: `string`; `mediaType`: `string`; `providerData`: `Record`\<`string`, `any`\>; `type`: `"image"`; \}; `providerData`: `Record`\<`string`, `any`\>; `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`; `type`: `"function_call_result"`; \} \| \{ `callId`: `string`; `id`: `string`; `output`: \{ `data`: `string`; `providerData`: `Record`\<`string`, `any`\>; `type`: `"computer_screenshot"`; \}; `providerData`: `Record`\<`string`, `any`\>; `type`: `"computer_call_result"`; \}

</td>
</tr>
<tr>
<td>

`agent`

</td>
<td>

[`Agent`](/openai-agents-js/openai/agents-core/classes/agent/)\<`any`, `any`\>

</td>
</tr>
<tr>
<td>

`output`

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>

#### Returns

`RunToolCallOutputItem`

#### Overrides

```ts
RunItemBase.constructor
```

## Properties

### agent

```ts
agent: Agent<any, any>;
```

***

### output

```ts
output: unknown;
```

***

### rawItem

```ts
rawItem: 
  | {
  callId: string;
  id: string;
  name: string;
  output:   | {
     providerData: Record<string, any>;
     text: string;
     type: "text";
    }
     | {
     data: string;
     mediaType: string;
     providerData: Record<string, any>;
     type: "image";
    };
  providerData: Record<string, any>;
  status: "in_progress" | "completed" | "incomplete";
  type: "function_call_result";
 }
  | {
  callId: string;
  id: string;
  output: {
     data: string;
     providerData: Record<string, any>;
     type: "computer_screenshot";
    };
  providerData: Record<string, any>;
  type: "computer_call_result";
};
```

#### Type declaration

\{
  `callId`: `string`;
  `id`: `string`;
  `name`: `string`;
  `output`:   \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `text`: `string`;
     `type`: `"text"`;
    \}
     \| \{
     `data`: `string`;
     `mediaType`: `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"image"`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"function_call_result"`;
 \}

<table>
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`callId`

</td>
<td>

`string`

</td>
<td>

The ID of the tool call. Required to match up the respective tool call result.

</td>
</tr>
<tr>
<td>

`id?`

</td>
<td>

`string`

</td>
<td>

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

</td>
</tr>
<tr>
<td>

`name`

</td>
<td>

`string`

</td>
<td>

The name of the tool that was called

</td>
</tr>
<tr>
<td>

`output`

</td>
<td>

  \| \{
  `providerData`: `Record`\<`string`, `any`\>;
  `text`: `string`;
  `type`: `"text"`;
 \}
  \| \{
  `data`: `string`;
  `mediaType`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"image"`;
 \}

</td>
<td>

The output of the tool call.

</td>
</tr>
<tr>
<td>

`providerData?`

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

</td>
</tr>
<tr>
<td>

`status`

</td>
<td>

`"in_progress"` \| `"completed"` \| `"incomplete"`

</td>
<td>

The status of the tool call.

</td>
</tr>
<tr>
<td>

`type`

</td>
<td>

`"function_call_result"`

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

\{
  `callId`: `string`;
  `id`: `string`;
  `output`: \{
     `data`: `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"computer_screenshot"`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"computer_call_result"`;
 \}

<table>
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Default value</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`callId`

</td>
<td>

`string`

</td>
<td>

&hyphen;

</td>
<td>

The ID of the computer call. Required to match up the respective computer call result.

</td>
</tr>
<tr>
<td>

`id?`

</td>
<td>

`string`

</td>
<td>

&hyphen;

</td>
<td>

An ID to identify the item. This is optional by default. If a model provider absolutely
requires this field, it will be validated on the model level.

</td>
</tr>
<tr>
<td>

`output`

</td>
<td>

`object`

</td>
<td>

ComputerToolOutput

</td>
<td>

The output of the computer call.

</td>
</tr>
<tr>
<td>

`output.data`

</td>
<td>

`string`

</td>
<td>

&hyphen;

</td>
<td>

A base64 encoded image data or a URL representing the screenshot.

</td>
</tr>
<tr>
<td>

`output.providerData?`

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

&hyphen;

</td>
<td>

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

</td>
</tr>
<tr>
<td>

`output.type`

</td>
<td>

`"computer_screenshot"`

</td>
<td>

&hyphen;

</td>
<td>

&hyphen;

</td>
</tr>
<tr>
<td>

`providerData?`

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

&hyphen;

</td>
<td>

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

</td>
</tr>
<tr>
<td>

`type`

</td>
<td>

`"computer_call_result"`

</td>
<td>

&hyphen;

</td>
<td>

&hyphen;

</td>
</tr>
</tbody>
</table>

#### Inherited from

```ts
RunItemBase.rawItem
```

***

### type

```ts
readonly type: "tool_call_output_item";
```

#### Overrides

```ts
RunItemBase.type
```

## Methods

### toJSON()

```ts
toJSON(): object
```

#### Returns

`object`

##### agent

```ts
agent: object;
```

###### agent.name

```ts
name: string;
```

##### output

```ts
output: string;
```

##### rawItem

```ts
rawItem: 
  | undefined
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
  content:   | string
     | (
     | {
     providerData: Record<string, any>;
     text: string;
     type: "input_text";
    }
     | {
     image:   | string
        | {
        id: string;
       };
     providerData: Record<string, any>;
     type: "input_image";
    }
     | {
     file:   | string
        | {
        id: string;
       };
     providerData: Record<string, any>;
     type: "input_file";
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
    })[];
  id: string;
  providerData: Record<string, any>;
  role: "user";
  type: "message";
 }
  | {
  content: string;
  id: string;
  providerData: Record<string, any>;
  role: "system";
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
  callId: string;
  id: string;
  name: string;
  output:   | {
     providerData: Record<string, any>;
     text: string;
     type: "text";
    }
     | {
     data: string;
     mediaType: string;
     providerData: Record<string, any>;
     type: "image";
    };
  providerData: Record<string, any>;
  status: "in_progress" | "completed" | "incomplete";
  type: "function_call_result";
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
  callId: string;
  id: string;
  output: {
     data: string;
     providerData: Record<string, any>;
     type: "computer_screenshot";
    };
  providerData: Record<string, any>;
  type: "computer_call_result";
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

###### Type declaration

`undefined`

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

\{
  `content`:   \| `string`
     \| (
     \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `text`: `string`;
     `type`: `"input_text"`;
    \}
     \| \{
     `image`:   \| `string`
        \| \{
        `id`: `string`;
       \};
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"input_image"`;
    \}
     \| \{
     `file`:   \| `string`
        \| \{
        `id`: `string`;
       \};
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"input_file"`;
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
    \})[];
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `role`: `"user"`;
  `type`: `"message"`;
 \}

\{
  `content`: `string`;
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `role`: `"system"`;
  `type`: `"message"`;
 \}

\{
  `id`: `string`;
  `name`: `string`;
  `output`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `string`;
  `type`: `"hosted_tool_call"`;
 \}

\{
  `arguments`: `string`;
  `callId`: `string`;
  `id`: `string`;
  `name`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"function_call"`;
 \}

\{
  `callId`: `string`;
  `id`: `string`;
  `name`: `string`;
  `output`:   \| \{
     `providerData`: `Record`\<`string`, `any`\>;
     `text`: `string`;
     `type`: `"text"`;
    \}
     \| \{
     `data`: `string`;
     `mediaType`: `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"image"`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `status`: `"in_progress"` \| `"completed"` \| `"incomplete"`;
  `type`: `"function_call_result"`;
 \}

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

\{
  `callId`: `string`;
  `id`: `string`;
  `output`: \{
     `data`: `string`;
     `providerData`: `Record`\<`string`, `any`\>;
     `type`: `"computer_screenshot"`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"computer_call_result"`;
 \}

\{
  `content`: `object`[];
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"reasoning"`;
 \}

\{
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"unknown"`;
 \}

##### type

```ts
type: string;
```

#### Overrides

```ts
RunItemBase.toJSON
```
