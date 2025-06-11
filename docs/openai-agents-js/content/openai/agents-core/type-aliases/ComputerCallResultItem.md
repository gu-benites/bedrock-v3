---
editUrl: false
next: false
prev: false
title: "ComputerCallResultItem"
---

```ts
type ComputerCallResultItem = object;
```

## Type declaration

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

### output

```ts
output: object = ComputerToolOutput;
```

The output of the computer call.

#### output.data

```ts
data: string;
```

A base64 encoded image data or a URL representing the screenshot.

#### output.providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

#### output.type

```ts
type: "computer_screenshot";
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional optional provider specific data. Used for custom functionality or model provider
specific fields.

### type

```ts
type: "computer_call_result";
```
