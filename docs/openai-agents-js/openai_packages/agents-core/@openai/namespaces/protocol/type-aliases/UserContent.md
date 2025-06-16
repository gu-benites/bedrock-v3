---
editUrl: false
next: false
prev: false
title: "UserContent"
---

```ts
type UserContent = 
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
};
```

## Type declaration

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
  `image`:   \| `string`
     \| \{
     `id`: `string`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"input_image"`;
 \}

### image

```ts
image: 
  | string
  | {
  id: string;
};
```

The image input to the model. Could be a URL, base64 or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "input_image";
```

\{
  `file`:   \| `string`
     \| \{
     `id`: `string`;
    \};
  `providerData`: `Record`\<`string`, `any`\>;
  `type`: `"input_file"`;
 \}

### file

```ts
file: 
  | string
  | {
  id: string;
};
```

The file input to the model. Could be a URL, base64 or an object with a file ID.

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "input_file";
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
