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
};
```

## Type declaration

\{
  `providerData`: `Record`\<`string`, `any`\>;
  `refusal`: `string`;
  `type`: `"refusal"`;
 \}

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### refusal

```ts
refusal: string;
```

The refusal explanation from the model.

### type

```ts
type: "refusal";
```

\{
  `providerData`: `Record`\<`string`, `any`\>;
  `text`: `string`;
  `type`: `"output_text"`;
 \}

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### text

```ts
text: string;
```

The text output from the model.

### type

```ts
type: "output_text";
```

\{
  `providerData`: `Record`\<`string`, `any`\>;
  `text`: `string`;
  `type`: `"input_text"`;
 \}

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### text

```ts
text: string;
```

A text input for example a message from a user

### type

```ts
type: "input_text";
```

\{
  `audio`:   \| `string`
     \| \{
     `id`: `string`;
    \};
  `format`: `null` \| `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `transcript`: `null` \| `string`;
  `type`: `"audio"`;
 \}

### audio

```ts
audio: 
  | string
  | {
  id: string;
};
```

The audio input to the model. Could be base64 encoded audio data or an object with a file ID.

### format?

```ts
optional format: null | string;
```

The format of the audio.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### transcript?

```ts
optional transcript: null | string;
```

The transcript of the audio.

### type

```ts
type: "audio";
```

\{
  `image`: `string`;
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"image"`;
 \}

### image

```ts
image: string;
```

The image input to the model. Could be base64 encoded image data or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "image";
```
