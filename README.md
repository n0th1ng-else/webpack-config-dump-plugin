# [Webpack plugin] Dump Webpack Config into file system

A webpack plugin to dump compiled webpack config into file system. Is useful in case
you have resolve aliases formed dynamically and want your IDE to be able to handle them.

#### For typescript config file you can use [webpack-typescript-config-dump-plugin](https://www.npmjs.com/package/webpack-typescript-config-dump-plugin)

![MIT License](https://camo.githubusercontent.com/d59450139b6d354f15a2252a47b457bb2cc43828/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f7365727665726c6573732e737667)
<img alt="pm version" src="https://img.shields.io/npm/v/webpack-config-dump-plugin">

## Installation

```
npm i webpack-config-dump-plugin --save-dev
```

## Usage

### Javascript module

```js
const { WebpackConfigDumpPlugin } = require("webpack-config-dump-plugin");

// webpack config
{
  plugins: [new WebpackConfigDumpPlugin(options)];
}
```

### Typescript module

```typescript
import { WebpackConfigDumpPlugin } from "webpack-config-dump-plugin";

// webpack config
{
  plugins: [new WebpackConfigDumpPlugin(options)];
}
```

### Options and defaults

| Option                 | Type    | Required | Default             | Description                                                                                                                                  |
| ---------------------- | ------- | -------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| outputPath             | string  | no       | ./                  | Path to store config dump                                                                                                                    |
| name                   | string  | no       | webpack.config.dump | Dump filename                                                                                                                                |
| depth                  | number  | no       | 4                   | Config depth. Since webpack config is circularly locked, we can't dump whole config. This parameter sets how deep config dump will be stored |
| keepCircularReferences | boolean | no       | false               | If true, dumps whole config (**disables the "depth" option**) and marks parts that are circular references                                   |
| showFunctionNames      | boolean | no       | false               | By default functions are excluded from the final dump. If true, plugin marks properties that are functions                                   |
| includeFalseValues     | boolean | no       | false               | By default false-ish values are excluded from the dump. If true, plugin will dump empty objects, 0, '' etc                                   |

### Changes

- Version 3
  Added more flexibility, see the options section.  
  Introduced some features like `keepCircularReferences` and so forth  
  **BREAKING**: Adjusted consistency for empty values. Now it does not output empty objects
  and empty arrays by default (i.e. with includeFalseValues=false). Check the plugin
  configuration for details.

- Version 2
  In version 2 the plugin has been rewritten using Typescript.  
  **BREAKING**: Now it needs to be imported as ES module. Check the information above for details.
