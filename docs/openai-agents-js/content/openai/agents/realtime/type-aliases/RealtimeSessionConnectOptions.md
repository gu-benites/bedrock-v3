---
editUrl: false
next: false
prev: false
title: "RealtimeSessionConnectOptions"
---

```ts
type RealtimeSessionConnectOptions = object;
```

## Properties

### apiKey

```ts
apiKey: string | () => string | Promise<string>;
```

The API key to use for the connection. Pass a function to lazily load the API key. Overrides
default client options.

***

### model?

```ts
optional model: 
  | OpenAIRealtimeModels
  | string & object;
```

The model to use for the connection.

***

### url?

```ts
optional url: string;
```

The URL to use for the connection.
