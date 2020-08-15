import weblog from "webpack-log";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { inspect } from "util";
import { isFunction, isRegExp, isObject } from "lodash";

const log = weblog({ name: "wcd" });

interface PluginOptions {
  outputPath?: string;
  name?: string;
  depth?: number;
  keepCircularReferences?: boolean;
  showFunctionNames?: boolean;
  includeFalseValues?: boolean;
}

export class WebpackConfigDumpPlugin {
  private static getReferenceLabel(path: string): string {
    return `<<Circular reference to '${path}'>>`;
  }

  private static getFunctionLabel(fn: Function): string {
    return `<<Function '${fn.name}'>>`;
  }

  private static getRef(
    config: any,
    references: Record<string, any>
  ): any | undefined {
    return Object.keys(references).find(
      (ref) => references[ref].link === config
    );
  }

  public readonly outputPath: string;
  public readonly name: string;
  public readonly depth: number;
  public readonly keepCircularReferences: boolean;
  public readonly showFunctionNames: boolean;
  public readonly includeFalseValues: boolean;

  constructor(options: PluginOptions = {}) {
    this.outputPath = options.outputPath ? options.outputPath : "./";
    this.name = options.name ? options.name : "webpack.config.dump";
    this.depth = options.depth ? options.depth : 4;
    if (this.depth < 0) {
      throw new Error('[wcd] The "depth" option should be a positive number');
    }
    this.keepCircularReferences = options.keepCircularReferences || false;
    this.showFunctionNames = options.showFunctionNames || false;
    this.includeFalseValues = options.includeFalseValues || false;
  }

  public apply(compiler: any): void {
    this.dumpConfig(compiler.options);
  }

  public getDump(
    config: any,
    depth: number | null,
    includeFalseValues: boolean,
    showFunctionNames: boolean
  ): string {
    return inspect(
      this.simplifyConfig(config, depth, includeFalseValues, showFunctionNames),
      { depth }
    );
  }

  public simplifyConfig(
    config: any,
    depth: number | null,
    includeFalseValues: boolean,
    showFunctionNames: boolean
  ) {
    return this.simplifyLevel(
      config,
      depth,
      includeFalseValues,
      showFunctionNames
    );
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

    const depth = this.keepCircularReferences ? null : this.depth;
    const dump = this.getDump(
      config,
      depth,
      this.includeFalseValues,
      this.showFunctionNames
    );
    try {
      writeFileSync(
        `${this.outputPath}/${this.name}`,
        `module.exports = () => (${dump})`
      );
    } catch (err) {
      log.warn("Could not create dump file:", err);
    }
  }

  private simplifyLevel(
    config: any,
    depth: number | null,
    includeFalseValues: boolean,
    showFunctionNames: boolean,
    currentDepth = 0,
    path = "config",
    references: Record<string, any> = {}
  ) {
    const isDepthFinite = typeof depth === "number";

    if (isDepthFinite && currentDepth === depth) {
      return null;
    }

    if (isFunction(config)) {
      const label = WebpackConfigDumpPlugin.getFunctionLabel(config);
      return (showFunctionNames && label) || null;
    }

    if (Array.isArray(config)) {
      const refKey =
        !isDepthFinite && WebpackConfigDumpPlugin.getRef(config, references);
      if (refKey) {
        const label = WebpackConfigDumpPlugin.getReferenceLabel(refKey);
        return !references[refKey].empty || includeFalseValues ? label : null;
      }
      const newRef = {
        link: config,
        empty: false,
      };
      references[path] = newRef;

      const formattedLevel = config.reduce((res, item, ind) => {
        const value = this.simplifyLevel(
          item,
          depth,
          includeFalseValues,
          showFunctionNames,
          currentDepth + 1,
          `${path}.[${ind}]`,
          references
        );
        if (value || includeFalseValues) {
          res.push(value);
        }
        return res;
      }, []);

      newRef.empty = !formattedLevel.length;
      return formattedLevel.length || includeFalseValues
        ? formattedLevel
        : null;
    }

    if (isRegExp(config)) {
      return config || includeFalseValues ? config : null;
    }

    if (isObject(config)) {
      const refKey =
        !isDepthFinite && WebpackConfigDumpPlugin.getRef(config, references);
      if (refKey) {
        const label = WebpackConfigDumpPlugin.getReferenceLabel(refKey);
        return !references[refKey].empty || includeFalseValues ? label : null;
      }
      const newRef = {
        link: config,
        empty: false,
      };
      references[path] = newRef;

      const formattedLevel = Object.keys(config).reduce((res, key) => {
        const value = this.simplifyLevel(
          config[key],
          depth,
          includeFalseValues,
          showFunctionNames,
          currentDepth + 1,
          `${path}.${key}`,
          references
        );
        if (value || includeFalseValues) {
          res[key] = value;
        }
        return res;
      }, {});

      newRef.empty = !Object.keys(formattedLevel).length;
      return Object.keys(formattedLevel).length || includeFalseValues
        ? formattedLevel
        : null;
    }

    return config || includeFalseValues ? config : null;
  }
}
