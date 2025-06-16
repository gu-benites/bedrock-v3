---
editUrl: false
next: false
prev: false
title: "TransportToolCallEvent"
---

```ts
type TransportToolCallEvent = object;
```

Event representing an attempted tool call by the model on the transport layer.

## Properties

### arguments

```ts
arguments: string;
```

***

### callId

```ts
callId: string;
```

***

### id?

```ts
optional id: string;
```

***

### name

```ts
name: string;
```

***

### previousItemId?

```ts
optional previousItemId: string;
```

***

### type

```ts
type: "function_call";
```
