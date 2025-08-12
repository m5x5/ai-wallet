# ai-wallet



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute      | Description | Type      | Default                        |
| -------------- | -------------- | ----------- | --------- | ------------------------------ |
| `capabilities` | `capabilities` |             | `any`     | `["vlm", "llm", "sst", "tts"]` |
| `cardTitle`    | `card-title`   |             | `string`  | `undefined`                    |
| `subtitle`     | `subtitle`     |             | `string`  | `undefined`                    |
| `sync`         | `sync`         |             | `boolean` | `true`                         |


## Events

| Event           | Description | Type                          |
| --------------- | ----------- | ----------------------------- |
| `configChanged` |             | `CustomEvent<AIWalletConfig>` |


## Methods

### `getConfiguration() => Promise<AIWalletConfig>`



#### Returns

Type: `Promise<AIWalletConfig>`



### `getRemoteStorage() => Promise<any>`



#### Returns

Type: `Promise<any>`



### `saveConfiguration() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`




## Dependencies

### Used by

 - [demo-section](../demo-section)

### Depends on

- [connect-remotestorage](connect-remotestorage)

### Graph
```mermaid
graph TD;
  ai-wallet --> connect-remotestorage
  demo-section --> ai-wallet
  style ai-wallet fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
