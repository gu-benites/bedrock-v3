---
editUrl: false
next: false
prev: false
title: "EventEmitterReferencingAsyncResource"
---

## Extends

- `AsyncResource`

## Properties

### eventEmitter

```ts
readonly eventEmitter: EventEmitterAsyncResource;
```

## Methods

### asyncId()

```ts
asyncId(): number
```

#### Returns

`number`

The unique `asyncId` assigned to the resource.

#### Inherited from

```ts
AsyncResource.asyncId
```

***

### bind()

```ts
bind<Func>(fn): Func
```

Binds the given function to execute to this `AsyncResource`'s scope.

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`Func` *extends* (...`args`) => `any`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`fn`

</td>
<td>

`Func`

</td>
<td>

The function to bind to the current `AsyncResource`.

</td>
</tr>
</tbody>
</table>

#### Returns

`Func`

#### Since

v14.8.0, v12.19.0

#### Inherited from

```ts
AsyncResource.bind
```

***

### emitDestroy()

```ts
emitDestroy(): this
```

Call all `destroy` hooks. This should only ever be called once. An error will
be thrown if it is called more than once. This **must** be manually called. If
the resource is left to be collected by the GC then the `destroy` hooks will
never be called.

#### Returns

`this`

A reference to `asyncResource`.

#### Inherited from

```ts
AsyncResource.emitDestroy
```

***

### runInAsyncScope()

```ts
runInAsyncScope<This, Result>(
   fn, 
   thisArg?, ...
   args?): Result
```

Call the provided function with the provided arguments in the execution context
of the async resource. This will establish the context, trigger the AsyncHooks
before callbacks, call the function, trigger the AsyncHooks after callbacks, and
then restore the original execution context.

#### Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`This`

</td>
</tr>
<tr>
<td>

`Result`

</td>
</tr>
</tbody>
</table>

#### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`fn`

</td>
<td>

(`this`, ...`args`) => `Result`

</td>
<td>

The function to call in the execution context of this async resource.

</td>
</tr>
<tr>
<td>

`thisArg`?

</td>
<td>

`This`

</td>
<td>

The receiver to be used for the function call.

</td>
</tr>
<tr>
<td>

...`args`?

</td>
<td>

`any`[]

</td>
<td>

Optional arguments to pass to the function.

</td>
</tr>
</tbody>
</table>

#### Returns

`Result`

#### Since

v9.6.0

#### Inherited from

```ts
AsyncResource.runInAsyncScope
```

***

### triggerAsyncId()

```ts
triggerAsyncId(): number
```

#### Returns

`number`

The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.

#### Inherited from

```ts
AsyncResource.triggerAsyncId
```
