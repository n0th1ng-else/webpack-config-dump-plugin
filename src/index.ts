import weblog from "webpack-log";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { inspect } from "util";
import { isFunction, isRegExp, isObject } from "lodash";

const log = weblog({ name: "wcd" });

interface PluginOptions {
  outputPath?: string;
  name?: string;
}

export class WebpackConfigDumpPlugin {
  public readonly outputPath: string;
  public readonly name: string;

  constructor(options: PluginOptions = {}) {
    this.outputPath = options.outputPath ? options.outputPath : "./";
    this.name = options.name ? options.name : "webpack.config.dump";
  }

  public apply(compiler: any): void {
    this.dumpConfig(compiler.options);
  }

  public getDump(config: any): string {
    return inspect(this.simplifyConfig(config));
  }

  public simplifyConfig(config: any) {
    return this.simplifyLevel(config, new Map(), '');
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

    const dump = this.getDump(config);
    try {
      writeFileSync(
        `${this.outputPath}/${this.name}`,
        `module.exports = () => (${dump})`
      );
    } catch (err) {
      log.warn("Could not create dump file:", err);
    }
  }

  private addLevelToMap(map: Map<any, string>, key: string, config: any) {
    map.set(config, `<<circular reference to ${key}>>`);
  }

  private isValidConfigValue(value: any) {
    return value !== undefined && value !== null;
  }

  private simplifyLevel(config: any, map: Map<any, string>, currentKey = '') {
    if (isFunction(config)) {
      if (config.name) {
        return `[Function: ${config.name}]`;
      }
      return "[Function]";
    }

    if (map.has(config)) {
      return map.get(config);
    }

    if (Array.isArray(config)) {
      this.addLevelToMap(map, currentKey, config);
      const formattedLevel = config.reduce((res, item, index) => {
        const value = this.simplifyLevel(item, map, `${currentKey}[${index}]`);
        if (this.isValidConfigValue(value)) {
          res.push(value);
        }
        return res;
      }, []);
      map.delete(config);
      return formattedLevel;
    }

    if (isRegExp(config)) {
      return config;
    }

    if (isObject(config)) {
      this.addLevelToMap(map, currentKey, config);
      return Object.keys(config).reduce((res, key) => {
        const newKey = `${currentKey}["${key.replace(/"/g, "\\\"")}"]`;
        const value = this.simplifyLevel(config[key], map, newKey);
        if (this.isValidConfigValue(value)) {
          res[key] = value;
        }
        return res;
      }, {});
      map.delete(config);
    }

    return config;
  }
}
