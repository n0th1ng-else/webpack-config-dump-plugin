# [Webpack plugin] Dump Webpack Config into file system
A webpack plugin to dump compiled webpack config into file system. Is useful in case
you have resolve aliases formed dynamically and want your IDE to be able to handle them.

**Note that functions will be excluded from the final dump**.

#### For typescript config file you can use [webpack-typescript-config-dump-plugin](https://www.npmjs.com/package/webpack-typescript-config-dump-plugin)


![MIT License](https://camo.githubusercontent.com/d59450139b6d354f15a2252a47b457bb2cc43828/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f7365727665726c6573732e737667)
[![Semver](http://img.shields.io/SemVer/1.0.5.png)](http://semver.org/spec/v1.0.5.html)

## Installation
```
npm i webpack-config-dump-plugin --save-dev
```

## Usage
```js
const WebpackConfigDumpPlugin = require('webpack-config-dump-plugin')

// webpack config
{
  plugins: [
    new WebpackConfigDumpPlugin(options)
  ]
}
```

### Options and defaults (Optional)
```js
{
  // Path to store config dump
  outputPath: './',

  // Config dump filename
  name: 'webpack.config.dump',
  
  // Config depth. Since webpack config is circulary locked, 
  // we can't dump whole config. This parameter sets how deep
  // config dump will be stored
  depth: 4           

}
```
