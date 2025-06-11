---
editUrl: false
next: false
prev: false
title: "RealtimeSession"
---

A `RealtimeSession` is the corner piece of building Voice Agents. It's the equivalent of a
Runner in text-based agents except that it automatically handles multiple turns by maintaining a
connection with the underlying transport layer.

The session handles managing the local history copy, executes tools, runs output guardrails, and
facilities handoffs.

The actual audio handling and generation of model responses is handled by the underlying
transport layer. By default if you are using a browser with WebRTC support, the session will
automatically use the WebRTC version of the OpenAI Realtime API. On the server or if you pass
`websocket` as the transport layer, the session will establish a connection using WebSockets.

In the case of WebRTC, in the browser, the transport layer will also automatically configure the
microphone and audio output to be used by the session.

You can also create a transport layer instance yourself and pass it in to have more control over
the configuration or even extend the existing ones. Check out the `TwilioRealtimeTransportLayer`
for an example of how to create a custom transport layer.

## Example

```ts
const agent = new RealtimeAgent({
  name: 'my-agent',
  instructions: 'You are a helpful assistant that can answer questions and help with tasks.',
})

const session = new RealtimeSession(agent);
session.connect({
  apiKey: 'your-api-key',
});
```

## Extends

- `EventEmitter`\<[`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\>

## Type Parameters

<table>
<thead>
<tr>
<th>Type Parameter</th>
<th>Default type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`TBaseContext`

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>

## Constructors

### Constructor

```ts
new RealtimeSession<TBaseContext>(initialAgent, options): RealtimeSession<TBaseContext>
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

`initialAgent`

</td>
<td>

 \| [`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<`TBaseContext`\> \| [`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)\<`TBaseContext`\>\>

</td>
</tr>
<tr>
<td>

`options`

</td>
<td>

`Partial`\<[`RealtimeSessionOptions`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionoptions/)\<`TBaseContext`\>\>

</td>
</tr>
</tbody>
</table>

#### Returns

`RealtimeSession`\<`TBaseContext`\>

#### Overrides

```ts
RuntimeEventEmitter<RealtimeSessionEventTypes<TBaseContext>>.constructor
```

## Properties

### initialAgent

```ts
readonly initialAgent: 
  | RealtimeAgent<TBaseContext>
| RealtimeAgent<RealtimeContextData<TBaseContext>>;
```

***

### options

```ts
readonly options: Partial<RealtimeSessionOptions<TBaseContext>> = {};
```

***

### captureRejections

```ts
static captureRejections: boolean;
```

Value: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

Change the default `captureRejections` option on all new `EventEmitter` objects.

#### Since

v13.4.0, v12.16.0

#### Inherited from

```ts
RuntimeEventEmitter.captureRejections
```

***

### captureRejectionSymbol

```ts
readonly static captureRejectionSymbol: typeof captureRejectionSymbol;
```

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom `rejection handler`.

#### Since

v13.4.0, v12.16.0

#### Inherited from

```ts
RuntimeEventEmitter.captureRejectionSymbol
```

***

### defaultMaxListeners

```ts
static defaultMaxListeners: number;
```

By default, a maximum of `10` listeners can be registered for any single
event. This limit can be changed for individual `EventEmitter` instances
using the `emitter.setMaxListeners(n)` method. To change the default
for _all_`EventEmitter` instances, the `events.defaultMaxListeners` property
can be used. If this value is not a positive number, a `RangeError` is thrown.

Take caution when setting the `events.defaultMaxListeners` because the
change affects _all_ `EventEmitter` instances, including those created before
the change is made. However, calling `emitter.setMaxListeners(n)` still has
precedence over `events.defaultMaxListeners`.

This is not a hard limit. The `EventEmitter` instance will allow
more listeners to be added but will output a trace warning to stderr indicating
that a "possible EventEmitter memory leak" has been detected. For any single
`EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to
temporarily avoid this warning:

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The `--trace-warnings` command-line flag can be used to display the
stack trace for such warnings.

The emitted warning can be inspected with `process.on('warning')` and will
have the additional `emitter`, `type`, and `count` properties, referring to
the event emitter instance, the event's name and the number of attached
listeners, respectively.
Its `name` property is set to `'MaxListenersExceededWarning'`.

#### Since

v0.11.2

#### Inherited from

```ts
RuntimeEventEmitter.defaultMaxListeners
```

***

### errorMonitor

```ts
readonly static errorMonitor: typeof errorMonitor;
```

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted. Therefore, the process will still crash if no
regular `'error'` listener is installed.

#### Since

v13.6.0, v12.17.0

#### Inherited from

```ts
RuntimeEventEmitter.errorMonitor
```

## Accessors

### context

#### Get Signature

```ts
get context(): RunContext<RealtimeContextData<TBaseContext>>
```

The current context of the session.

##### Returns

`RunContext`\<[`RealtimeContextData`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)\<`TBaseContext`\>\>

***

### currentAgent

#### Get Signature

```ts
get currentAgent(): 
  | RealtimeAgent<TBaseContext>
| RealtimeAgent<RealtimeContextData<TBaseContext>>
```

The current agent in the session.

##### Returns

  \| [`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<`TBaseContext`\>
  \| [`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<[`RealtimeContextData`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)\<`TBaseContext`\>\>

***

### history

#### Get Signature

```ts
get history(): RealtimeItem[]
```

The history of the session.

##### Returns

[`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

***

### muted

#### Get Signature

```ts
get muted(): null | boolean
```

Whether the session is muted. Might be `null` if the underlying transport layer does not
support muting.

##### Returns

`null` \| `boolean`

***

### transport

#### Get Signature

```ts
get transport(): RealtimeTransportLayer
```

The transport layer used by the session.

##### Returns

[`RealtimeTransportLayer`](/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/)

***

### usage

#### Get Signature

```ts
get usage(): Usage
```

The current usage of the session.

##### Returns

`Usage`

## Methods

### \[captureRejectionSymbol\]()?

```ts
optional [captureRejectionSymbol]<K>(
   error, 
   event, ...
   args): void
```

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`error`

</td>
<td>

`Error`

</td>
</tr>
<tr>
<td>

`event`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
<tr>
<td>

...`args`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] : `never`

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Inherited from

```ts
RuntimeEventEmitter.[captureRejectionSymbol]
```

***

### addListener()

```ts
addListener<K>(eventName, listener): this
```

Alias for `emitter.on(eventName, listener)`.

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```ts
RuntimeEventEmitter.addListener
```

***

### approve()

```ts
approve(approvalItem, options): Promise<void>
```

Approve a tool call. This will also trigger the tool call to the agent.

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

`approvalItem`

</td>
<td>

`RunToolApprovalItem`

</td>
<td>

The approval item to approve.

</td>
</tr>
<tr>
<td>

`options`

</td>
<td>

\{ `alwaysApprove`: `boolean`; \}

</td>
<td>

Additional options.

</td>
</tr>
<tr>
<td>

`options.alwaysApprove`?

</td>
<td>

`boolean`

</td>
<td>

Whether to always approve the tool call.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

***

### close()

```ts
close(): void
```

Disconnect from the session.

#### Returns

`void`

***

### connect()

```ts
connect(options): Promise<void>
```

Connect to the session. This will establish the connection to the underlying transport layer
and start the session.

After connecting, the session will also emit a `history_updated` event with an empty history.

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

`options`

</td>
<td>

[`RealtimeSessionConnectOptions`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconnectoptions/)

</td>
<td>

The options for the connection.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

***

### emit()

```ts
emit<K>(eventName, ...args): boolean
```

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
<tr>
<td>

...`args`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] : `never`

</td>
</tr>
</tbody>
</table>

#### Returns

`boolean`

#### Since

v0.1.26

#### Inherited from

```ts
RuntimeEventEmitter.emit
```

***

### eventNames()

```ts
eventNames(): (
  | "audio"
  | "error"
  | "audio_interrupted"
  | "agent_start"
  | "agent_end"
  | "agent_handoff"
  | "agent_tool_start"
  | "agent_tool_end"
  | "transport_event"
  | "audio_start"
  | "audio_stopped"
  | "guardrail_tripped"
  | "history_updated"
  | "history_added"
  | "tool_approval_requested")[]
```

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

(
  \| `"audio"`
  \| `"error"`
  \| `"audio_interrupted"`
  \| `"agent_start"`
  \| `"agent_end"`
  \| `"agent_handoff"`
  \| `"agent_tool_start"`
  \| `"agent_tool_end"`
  \| `"transport_event"`
  \| `"audio_start"`
  \| `"audio_stopped"`
  \| `"guardrail_tripped"`
  \| `"history_updated"`
  \| `"history_added"`
  \| `"tool_approval_requested"`)[]

#### Since

v6.0.0

#### Inherited from

```ts
RuntimeEventEmitter.eventNames
```

***

### getMaxListeners()

```ts
getMaxListeners(): number
```

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [EventEmitter.defaultMaxListeners](/openai-agents-js/openai/agents-realtime/classes/realtimesession/#defaultmaxlisteners).

#### Returns

`number`

#### Since

v1.0.0

#### Inherited from

```ts
RuntimeEventEmitter.getMaxListeners
```

***

### interrupt()

```ts
interrupt(): void
```

Interrupt the session artificially for example if you want to build a "stop talking"
button.

#### Returns

`void`

***

### listenerCount()

```ts
listenerCount<K>(eventName, listener?): number
```

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

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

`K`

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

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
<td>

The name of the event being listened for

</td>
</tr>
<tr>
<td>

`listener`?

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
<td>

The event handler function

</td>
</tr>
</tbody>
</table>

#### Returns

`number`

#### Since

v3.2.0

#### Inherited from

```ts
RuntimeEventEmitter.listenerCount
```

***

### listeners()

```ts
listeners<K>(eventName): K extends keyof RealtimeSessionEventTypes<TBaseContext> ? RealtimeSessionEventTypes<TBaseContext>[K<K>] extends unknown[] ? (...args) => void : never : never[]
```

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
</tbody>
</table>

#### Returns

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`[]

#### Since

v0.1.26

#### Inherited from

```ts
RuntimeEventEmitter.listeners
```

***

### mute()

```ts
mute(muted): void
```

Mute the session.

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

`muted`

</td>
<td>

`boolean`

</td>
<td>

Whether to mute the session.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### off()

```ts
off<K>(eventName, listener): this
```

Alias for `emitter.removeListener()`.

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v10.0.0

#### Inherited from

```ts
RuntimeEventEmitter.off
```

***

### on()

```ts
on<K>(eventName, listener): this
```

Adds the `listener` function to the end of the listeners array for the event
named `eventName`. No checks are made to see if the `listener` has already
been added. Multiple calls passing the same combination of `eventName` and
`listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

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

`K`

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

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
<td>

The name of the event.

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
<td>

The callback function

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.1.101

#### Inherited from

```ts
RuntimeEventEmitter.on
```

***

### once()

```ts
once<K>(eventName, listener): this
```

Adds a **one-time** `listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

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

`K`

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

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
<td>

The name of the event.

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
<td>

The callback function

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.3.0

#### Inherited from

```ts
RuntimeEventEmitter.once
```

***

### prependListener()

```ts
prependListener<K>(eventName, listener): this
```

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`
and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

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

`K`

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

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
<td>

The name of the event.

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
<td>

The callback function

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

```ts
RuntimeEventEmitter.prependListener
```

***

### prependOnceListener()

```ts
prependOnceListener<K>(eventName, listener): this
```

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

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

`K`

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

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
<td>

The name of the event.

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
<td>

The callback function

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

```ts
RuntimeEventEmitter.prependOnceListener
```

***

### rawListeners()

```ts
rawListeners<K>(eventName): K extends keyof RealtimeSessionEventTypes<TBaseContext> ? RealtimeSessionEventTypes<TBaseContext>[K<K>] extends unknown[] ? (...args) => void : never : never[]
```

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
</tbody>
</table>

#### Returns

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`[]

#### Since

v9.4.0

#### Inherited from

```ts
RuntimeEventEmitter.rawListeners
```

***

### reject()

```ts
reject(approvalItem, options): Promise<void>
```

Reject a tool call. This will also trigger the tool call to the agent.

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

`approvalItem`

</td>
<td>

`RunToolApprovalItem`

</td>
<td>

The approval item to reject.

</td>
</tr>
<tr>
<td>

`options`

</td>
<td>

\{ `alwaysReject`: `boolean`; \}

</td>
<td>

Additional options.

</td>
</tr>
<tr>
<td>

`options.alwaysReject`?

</td>
<td>

`boolean`

</td>
<td>

Whether to always reject the tool call.

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<`void`\>

***

### removeAllListeners()

```ts
removeAllListeners(eventName?): this
```

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

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

`eventName`?

</td>
<td>

`unknown`

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```ts
RuntimeEventEmitter.removeAllListeners
```

***

### removeListener()

```ts
removeListener<K>(eventName, listener): this
```

Removes the specified `listener` from the listener array for the event named `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any `removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')` listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

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

`K`

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
</tr>
</thead>
<tbody>
<tr>
<td>

`eventName`

</td>
<td>

keyof RealtimeSessionEventTypes\<TBaseContext\> \| `K`

</td>
</tr>
<tr>
<td>

`listener`

</td>
<td>

`K` *extends* keyof [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\> ? [`RealtimeSessionEventTypes`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)\<`TBaseContext`\>\[`K`\<`K`\>\] *extends* `unknown`[] ? (...`args`) => `void` : `never` : `never`

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```ts
RuntimeEventEmitter.removeListener
```

***

### sendAudio()

```ts
sendAudio(audio, options): void
```

Send audio to the session.

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

`audio`

</td>
<td>

`ArrayBuffer`

</td>
<td>

The audio to send.

</td>
</tr>
<tr>
<td>

`options`

</td>
<td>

\{ `commit`: `boolean`; \}

</td>
<td>

Additional options.

</td>
</tr>
<tr>
<td>

`options.commit`?

</td>
<td>

`boolean`

</td>
<td>

Whether to finish the turn with this audio.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### sendMessage()

```ts
sendMessage(message, otherEventData): void
```

Send a message to the session.

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

`message`

</td>
<td>

`RealtimeUserInput`

</td>
<td>

The message to send.

</td>
</tr>
<tr>
<td>

`otherEventData`

</td>
<td>

`Record`\<`string`, `any`\>

</td>
<td>

Additional event data to send.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### setMaxListeners()

```ts
setMaxListeners(n): this
```

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

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

`n`

</td>
<td>

`number`

</td>
</tr>
</tbody>
</table>

#### Returns

`this`

#### Since

v0.3.5

#### Inherited from

```ts
RuntimeEventEmitter.setMaxListeners
```

***

### updateAgent()

```ts
updateAgent(newAgent): Promise<RealtimeAgent<TBaseContext>>
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

`newAgent`

</td>
<td>

[`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<`TBaseContext`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`Promise`\<[`RealtimeAgent`](/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)\<`TBaseContext`\>\>

***

### updateHistory()

```ts
updateHistory(newHistory): void
```

Update the history of the session.

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

`newHistory`

</td>
<td>

 \| [`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[] \| (`history`) => [`RealtimeItem`](/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

</td>
<td>

The new history to set.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

***

### addAbortListener()

```ts
static addAbortListener(signal, resource): Disposable
```

Listens once to the `abort` event on the provided `signal`.

Listening to the `abort` event on abort signals is unsafe and may
lead to resource leaks since another third party with the signal can
call `e.stopImmediatePropagation()`. Unfortunately Node.js cannot change
this since it would violate the web standard. Additionally, the original
API makes it easy to forget to remove listeners.

This API allows safely using `AbortSignal`s in Node.js APIs by solving these
two issues by listening to the event such that `stopImmediatePropagation` does
not prevent the listener from running.

Returns a disposable so that it may be unsubscribed from more easily.

```js
import { addAbortListener } from 'node:events';

function example(signal) {
  let disposable;
  try {
    signal.addEventListener('abort', (e) => e.stopImmediatePropagation());
    disposable = addAbortListener(signal, (e) => {
      // Do something when signal is aborted.
    });
  } finally {
    disposable?.[Symbol.dispose]();
  }
}
```

:::caution[Experimental]
This API should not be used in production and may be trimmed from a public release.
:::

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

`signal`

</td>
<td>

`AbortSignal`

</td>
</tr>
<tr>
<td>

`resource`

</td>
<td>

(`event`) => `void`

</td>
</tr>
</tbody>
</table>

#### Returns

`Disposable`

Disposable that removes the `abort` listener.

#### Since

v20.5.0

#### Inherited from

```ts
RuntimeEventEmitter.addAbortListener
```

***

### getEventListeners()

```ts
static getEventListeners(emitter, name): Function[]
```

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
import { getEventListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  console.log(getEventListeners(ee, 'foo')); // [ [Function: listener] ]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  console.log(getEventListeners(et, 'foo')); // [ [Function: listener] ]
}
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

`emitter`

</td>
<td>

`EventTarget` \| `EventEmitter`\<`DefaultEventMap`\>

</td>
</tr>
<tr>
<td>

`name`

</td>
<td>

`string` \| `symbol`

</td>
</tr>
</tbody>
</table>

#### Returns

`Function`[]

#### Since

v15.2.0, v14.17.0

#### Inherited from

```ts
RuntimeEventEmitter.getEventListeners
```

***

### getMaxListeners()

```ts
static getMaxListeners(emitter): number
```

Returns the currently set max amount of listeners.

For `EventEmitter`s this behaves exactly the same as calling `.getMaxListeners` on
the emitter.

For `EventTarget`s this is the only way to get the max event listeners for the
event target. If the number of event handlers on a single EventTarget exceeds
the max set, the EventTarget will print a warning.

```js
import { getMaxListeners, setMaxListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  console.log(getMaxListeners(ee)); // 10
  setMaxListeners(11, ee);
  console.log(getMaxListeners(ee)); // 11
}
{
  const et = new EventTarget();
  console.log(getMaxListeners(et)); // 10
  setMaxListeners(11, et);
  console.log(getMaxListeners(et)); // 11
}
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

`emitter`

</td>
<td>

`EventTarget` \| `EventEmitter`\<`DefaultEventMap`\>

</td>
</tr>
</tbody>
</table>

#### Returns

`number`

#### Since

v19.9.0

#### Inherited from

```ts
RuntimeEventEmitter.getMaxListeners
```

***

### ~~listenerCount()~~

```ts
static listenerCount(emitter, eventName): number
```

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
import { EventEmitter, listenerCount } from 'node:events';

const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

:::caution[Deprecated]
Since v3.2.0 - Use `listenerCount` instead.
:::

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

`emitter`

</td>
<td>

`EventEmitter`

</td>
<td>

The emitter to query

</td>
</tr>
<tr>
<td>

`eventName`

</td>
<td>

`string` \| `symbol`

</td>
<td>

The event name

</td>
</tr>
</tbody>
</table>

#### Returns

`number`

#### Since

v0.9.12

#### Inherited from

```ts
RuntimeEventEmitter.listenerCount
```

***

### on()

#### Call Signature

```ts
static on(
   emitter, 
   eventName, 
options?): AsyncIterator<any[]>
```

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

##### Parameters

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

`emitter`

</td>
<td>

`EventEmitter`

</td>
</tr>
<tr>
<td>

`eventName`

</td>
<td>

`string` \| `symbol`

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`StaticEventEmitterIteratorOptions`

</td>
</tr>
</tbody>
</table>

##### Returns

`AsyncIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

##### Since

v13.6.0, v12.16.0

##### Inherited from

```ts
RuntimeEventEmitter.on
```

#### Call Signature

```ts
static on(
   emitter, 
   eventName, 
options?): AsyncIterator<any[]>
```

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

##### Parameters

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

`emitter`

</td>
<td>

`EventTarget`

</td>
</tr>
<tr>
<td>

`eventName`

</td>
<td>

`string`

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`StaticEventEmitterIteratorOptions`

</td>
</tr>
</tbody>
</table>

##### Returns

`AsyncIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

##### Since

v13.6.0, v12.16.0

##### Inherited from

```ts
RuntimeEventEmitter.on
```

***

### once()

#### Call Signature

```ts
static once(
   emitter, 
   eventName, 
options?): Promise<any[]>
```

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

##### Parameters

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

`emitter`

</td>
<td>

`EventEmitter`

</td>
</tr>
<tr>
<td>

`eventName`

</td>
<td>

`string` \| `symbol`

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`StaticEventEmitterOptions`

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`\<`any`[]\>

##### Since

v11.13.0, v10.16.0

##### Inherited from

```ts
RuntimeEventEmitter.once
```

#### Call Signature

```ts
static once(
   emitter, 
   eventName, 
options?): Promise<any[]>
```

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

##### Parameters

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

`emitter`

</td>
<td>

`EventTarget`

</td>
</tr>
<tr>
<td>

`eventName`

</td>
<td>

`string`

</td>
</tr>
<tr>
<td>

`options`?

</td>
<td>

`StaticEventEmitterOptions`

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`\<`any`[]\>

##### Since

v11.13.0, v10.16.0

##### Inherited from

```ts
RuntimeEventEmitter.once
```

***

### setMaxListeners()

```ts
static setMaxListeners(n?, ...eventTargets?): void
```

```js
import { setMaxListeners, EventEmitter } from 'node:events';

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

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

`n`?

</td>
<td>

`number`

</td>
<td>

A non-negative number. The maximum number of listeners per `EventTarget` event.

</td>
</tr>
<tr>
<td>

...`eventTargets`?

</td>
<td>

(`EventTarget` \| `EventEmitter`\<`DefaultEventMap`\>)[]

</td>
<td>

Zero or more {EventTarget} or {EventEmitter} instances. If none are specified, `n` is set as the default max for all newly created {EventTarget} and {EventEmitter}
objects.

</td>
</tr>
</tbody>
</table>

#### Returns

`void`

#### Since

v15.4.0

#### Inherited from

```ts
RuntimeEventEmitter.setMaxListeners
```
