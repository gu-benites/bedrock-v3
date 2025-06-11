---
editUrl: false
next: false
prev: false
title: "EventEmitterAsyncResourceOptions"
---

## Extends

- `AsyncResourceOptions`.`EventEmitterOptions`

## Properties

### captureRejections?

```ts
optional captureRejections: boolean;
```

Enables automatic capturing of promise rejection.

#### Inherited from

```ts
EventEmitterOptions.captureRejections
```

***

### name?

```ts
optional name: string;
```

The type of async event, this is required when instantiating `EventEmitterAsyncResource`
directly rather than as a child class.

#### Default

```ts
new.target.name if instantiated as a child class.
```

***

### requireManualDestroy?

```ts
optional requireManualDestroy: boolean;
```

Disables automatic `emitDestroy` when the object is garbage collected.
This usually does not need to be set (even if `emitDestroy` is called
manually), unless the resource's `asyncId` is retrieved and the
sensitive API's `emitDestroy` is called with it.

#### Default

```ts
false
```

#### Inherited from

```ts
AsyncResourceOptions.requireManualDestroy
```

***

### triggerAsyncId?

```ts
optional triggerAsyncId: number;
```

The ID of the execution context that created this async event.

#### Default

```ts
executionAsyncId()
```

#### Inherited from

```ts
AsyncResourceOptions.triggerAsyncId
```
