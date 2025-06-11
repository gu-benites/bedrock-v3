---
editUrl: false
next: false
prev: false
title: "HostedTool"
---

```ts
type HostedTool = object;
```

A built-in hosted tool that will be executed directly by the model during the request and won't result in local code executions.
Examples of these are `web_search_call` or `file_search_call`.

## Param

The context of the tool

## Param

The result of the tool

## Properties

### name

```ts
name: string;
```

A unique name for the tool.

***

### providerData?

```ts
optional providerData: Record<string, any>;
```

Additional configuration data that gets passed to the tool

***

### type

```ts
type: "hosted_tool";
```
