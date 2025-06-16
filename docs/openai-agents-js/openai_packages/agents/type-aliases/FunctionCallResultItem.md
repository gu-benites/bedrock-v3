---
editUrl: false
next: false
prev: false
title: "FunctionCallResultItem"
---

```ts
type FunctionCallResultItem = object;
```

## Type declaration

### callId

```ts
callId: string;
```

### id?

```ts
optional id: string;
```

### name

```ts
name: string;
```

### output

```ts
output: 
  | {
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
```

### providerData?

```ts
optional providerData: Record<string, any>;
```

### status

```ts
status: "in_progress" | "completed" | "incomplete";
```

### type

```ts
type: "function_call_result";
```
