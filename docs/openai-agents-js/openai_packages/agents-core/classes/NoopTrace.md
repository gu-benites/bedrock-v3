---
editUrl: false
next: false
prev: false
title: "NoopTrace"
---

## Extends

- [`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

## Constructors

### Constructor

```ts
new NoopTrace(): NoopTrace
```

#### Returns

`NoopTrace`

#### Overrides

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`constructor`](/openai-agents-js/openai/agents-core/classes/trace/#constructor)

## Properties

### groupId

```ts
groupId: null | string = null;
```

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`groupId`](/openai-agents-js/openai/agents-core/classes/trace/#groupid)

***

### metadata?

```ts
optional metadata: Record<string, any>;
```

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`metadata`](/openai-agents-js/openai/agents-core/classes/trace/#metadata)

***

### name

```ts
name: string;
```

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`name`](/openai-agents-js/openai/agents-core/classes/trace/#name)

***

### traceId

```ts
traceId: string;
```

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`traceId`](/openai-agents-js/openai/agents-core/classes/trace/#traceid)

***

### type

```ts
type: "trace";
```

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`type`](/openai-agents-js/openai/agents-core/classes/trace/#type)

## Methods

### clone()

```ts
clone(): Trace
```

#### Returns

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/)

#### Inherited from

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`clone`](/openai-agents-js/openai/agents-core/classes/trace/#clone)

***

### end()

```ts
end(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`end`](/openai-agents-js/openai/agents-core/classes/trace/#end)

***

### start()

```ts
start(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`start`](/openai-agents-js/openai/agents-core/classes/trace/#start)

***

### toJSON()

```ts
toJSON(): null | object
```

#### Returns

`null` \| `object`

#### Overrides

[`Trace`](/openai-agents-js/openai/agents-core/classes/trace/).[`toJSON`](/openai-agents-js/openai/agents-core/classes/trace/#tojson)
