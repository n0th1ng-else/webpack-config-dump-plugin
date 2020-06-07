import weblog from "webpack-log";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { inspect } from "util";
import { isFunction, isRegExp, isObject } from "lodash";

const log = weblog({ name: "wcd" });

interface PluginOptions {
  outputPath?: string;
  name?: string;
  depth?: number;
}

export class WebpackConfigDumpPlugin {
  public readonly outputPath: string;
  public readonly name: string;
  public readonly depth: number;

  constructor(options: PluginOptions = {}) {
    this.outputPath = options.outputPath ? options.outputPath : "./";
    this.name = options.name ? options.name : "webpack.config.dump";
    this.depth = options.depth ? options.depth : 4;
  }

  public apply(compiler: any): void {
    this.dumpConfig(compiler.options);
  }

  public getDump(config: any, depth: number): string {
    return inspect(this.simplifyConfig(config, depth), { depth });
  }

  public simplifyConfig(config: any, depth = 4) {
    return this.simplifyLevel(config, 0, depth);
  }

  public dumpConfig(config: any): void {
    if (!existsSync(this.outputPath)) {
      try {
        mkdirSync(this.outputPath);
      } catch (err) {
        log.warn("Could not create cache folder:", err);
        return;
      }
    }

    const dump = this.getDump(config, this.depth);
    try {
      writeFileSync(
        `${this.outputPath}/${this.name}`,
        `module.exports = () => (${dump})`
      );
    } catch (err) {
      log.warn("Could not create dump file:", err);
    }
  }

  private simplifyLevel(config: any, currentDepth = 0, depth = 2) {
    if (currentDepth === depth) {
      return null;
    }

    if (isFunction(config)) {
      return null;
    }

    if (Array.isArray(config)) {
      const formattedLevel = config.reduce((res, item) => {
        const value = this.simplifyLevel(item, currentDepth + 1, depth);
        if (value) {
          res.push(value);
        }
        return res;
      }, []);
      return formattedLevel.length ? formattedLevel : null;
    }

    if (isRegExp(config)) {
      return config;
    }

    if (isObject(config)) {
      return Object.keys(config).reduce((res, key) => {
        const value = this.simplifyLevel(config[key], currentDepth + 1, depth);
        if (value) {
          res[key] = value;
        }
        return res;
      }, {});
    }

    return config;
  }
}
