---
editUrl: false
next: false
prev: false
title: "MessageItem"
---

```ts
type MessageItem = 
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

### content

```ts
content: 
  | string
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
role: "user";
```

Representing a message from the user

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message

\{
  `content`: `string`;
  `id`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `role`: `"system"`;
  `type`: `"message"`;
 \}

### content

```ts
content: string;
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
role: "system";
```

Representing a system message to the user

### type?

```ts
optional type: "message";
```

Any item without a type is treated as a message
