import * as fs from "fs";
import weblog from "webpack-log";
import { jest, describe, it, beforeEach, expect } from "@jest/globals";
import { WebpackConfigDumpPlugin } from ".";

jest.mock("fs");
jest.mock("webpack-log");

const logger = weblog({ name: "wcd-mock" });

let plugin = new WebpackConfigDumpPlugin();

let includeFalseValues: boolean = false;
let showFunctionNames: boolean = false;
let depth: null | number = 5;

function setLogAssertionFn(
  fn: (name: string, msg?: string, err?: Error) => void
): void {
  // @ts-ignore mock helper
  logger.__setAssertionFn(fn);
}

function setFileExists(isExists: boolean): void {
  // @ts-ignore mock helper
  fs.__setFileExists(isExists);
}

function setDirMade(isMade: boolean): void {
  // @ts-ignore mock helper
  fs.__setDirMade(isMade);
}

function setFileWritten(isWritten: boolean, handler): void {
  // @ts-ignore mock helper
  fs.__setFileWritten(isWritten, handler);
}

function runDone(doneFn?: (msg?: string | Error) => void, msg?: Error) {
  if (!doneFn) {
    throw Error("Done is not defined?!");
  }

  return msg ? doneFn(msg) : doneFn();
}

describe("Dump webpack config", () => {
  beforeEach(() => {
    includeFalseValues = false;
    showFunctionNames = false;
    depth = 5;
    plugin = new WebpackConfigDumpPlugin();
  });

  describe("Init", () => {
    it("Check initial values", () => {
      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - depth", () => {
      plugin = new WebpackConfigDumpPlugin({
        depth: 2,
      });

      expect(plugin.depth).toBe(2);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - name", () => {
      plugin = new WebpackConfigDumpPlugin({
        name: "foo.bar",
      });

      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("foo.bar");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - outputPath", () => {
      plugin = new WebpackConfigDumpPlugin({
        outputPath: "foo/bar/",
      });

      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("foo/bar/");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - wrong depth value", (done) => {
      try {
        plugin = new WebpackConfigDumpPlugin({
          depth: -12,
        });
        runDone(done, new Error("wrong depth value"));
      } catch (e) {
        expect(e.message).toBe(
          '[wcd] The "depth" option should be a positive number'
        );
        runDone(done);
      }
    });

    it("Override initial values - keepCircularReferences", () => {
      plugin = new WebpackConfigDumpPlugin({
        keepCircularReferences: true,
      });

      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(true);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - showFunctionNames", () => {
      plugin = new WebpackConfigDumpPlugin({
        showFunctionNames: true,
      });

      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(true);
      expect(plugin.includeFalseValues).toBe(false);
    });

    it("Override initial values - includeFalseValues", () => {
      plugin = new WebpackConfigDumpPlugin({
        includeFalseValues: true,
      });

      expect(plugin.depth).toBe(4);
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
      expect(plugin.keepCircularReferences).toBe(false);
      expect(plugin.showFunctionNames).toBe(false);
      expect(plugin.includeFalseValues).toBe(true);
    });
  });

  describe("Simplify config", () => {
    describe("finite depth, no includeFalseValues, no showFunctionNames", () => {
      beforeEach(() => {
        includeFalseValues = false;
        showFunctionNames = false;
        depth = 5;
      });

      it("Empty config is null", () => {
        const output = plugin.simplifyConfig(
          {},
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Null config is null", () => {
        const output = plugin.simplifyConfig(
          null,
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Undefined config is null", () => {
        const output = plugin.simplifyConfig(
          undefined,
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Cuts functions", () => {
        const output = plugin.simplifyConfig(
          { foo: () => {} },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Keeps RegExp", () => {
        const output = plugin.simplifyConfig(
          {
            foo: /foo/,
            bar: new RegExp("bar"),
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: /foo/, bar: /bar/ });
      });

      it("Keeps numbers with values", () => {
        const output = plugin.simplifyConfig(
          { foo: 9000, bar: 0 },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: 9000 });
      });

      it("Keeps strings with values", () => {
        const output = plugin.simplifyConfig(
          { foo: "bar", bar: "" },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: "bar" });
      });

      it("Keeps non-empty arrays", () => {
        const output = plugin.simplifyConfig(
          {
            foo: [],
            bar: ["test"],
            some: [""],
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ bar: ["test"] });
      });

      it("Keeps nested objects", () => {
        const output = plugin.simplifyConfig(
          { foo: {}, bar: { test: 1 } },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ bar: { test: 1 } });
      });

      it("Cuts config with depth eq to 3", () => {
        const depth = 3;
        const output = plugin.simplifyConfig(
          {
            foo: { bar: { oof: 20, some: { cut: { test: "nested" } } } },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Cuts config with depth eq to 3 for arrays", () => {
        const depth = 3;
        const output = plugin.simplifyConfig(
          {
            foo: [{ some: "state" }, { bar: { oof: 20 } }],
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });
    });

    describe("finite depth, no includeFalseValues, WITH showFunctionNames", () => {
      beforeEach(() => {
        showFunctionNames = true;
      });

      it("Keeps functions", () => {
        const output = plugin.simplifyConfig(
          { foo: () => {} },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: "<<Function 'foo'>>" });
      });

      it("Keeps functions with names", () => {
        const output = plugin.simplifyConfig(
          { foo: function getData() {} },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: "<<Function 'getData'>>" });
      });
    });

    describe("finite depth, WITH includeFalseValues, no showFunctionNames", () => {
      beforeEach(() => {
        includeFalseValues = true;
      });

      it("Empty config is null", () => {
        const output = plugin.simplifyConfig(
          {},
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({});
      });

      it("Null config is null", () => {
        const output = plugin.simplifyConfig(
          null,
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(null);
      });

      it("Undefined config is null", () => {
        const output = plugin.simplifyConfig(
          undefined,
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual(undefined);
      });

      it("Keeps number 0", () => {
        const output = plugin.simplifyConfig(
          { foo: 9000, bar: 0 },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: 9000, bar: 0 });
      });

      it("Keeps empty strings", () => {
        const output = plugin.simplifyConfig(
          { foo: "bar", bar: "" },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: "bar", bar: "" });
      });

      it("Keeps empty arrays", () => {
        const output = plugin.simplifyConfig(
          {
            foo: [],
            bar: ["test"],
            some: [""],
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({ foo: [], bar: ["test"], some: [""] });
      });

      it("Keeps empty objects", () => {
        const output = plugin.simplifyConfig(
          {
            foo: {},
            bar: {
              count: 0,
            },
            some: {
              message: "",
            },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          foo: {},
          bar: {
            count: 0,
          },
          some: {
            message: "",
          },
        });
      });
    });

    describe("INFINITE depth, no includeFalseValues, no showFunctionNames", () => {
      beforeEach(() => {
        depth = null;
      });

      it("outputs the object is a circular dependency", () => {
        const testCircular = {
          baz: {
            feed: "test",
          },
        };
        const output = plugin.simplifyConfig(
          {
            foo: {},
            bar: {
              count: testCircular,
            },
            some: {
              message: testCircular,
              bud: "",
            },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          bar: {
            count: {
              baz: {
                feed: "test",
              },
            },
          },
          some: {
            message: "<<Circular reference to 'config.bar.count'>>",
          },
        });
      });

      it("removes empty object is a circular dependency", () => {
        const testCircular = {};
        const output = plugin.simplifyConfig(
          {
            foo: {},
            bar: {
              count: testCircular,
            },
            some: {
              message: testCircular,
              bud: "test",
            },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          some: {
            bud: "test",
          },
        });
      });

      it("outputs the array is a circular dependency", () => {
        const testCircular = [
          "a",
          {
            baz: "two",
          },
          1,
          0,
          {},
          { foo: "" },
        ];

        const output = plugin.simplifyConfig(
          {
            bar: {
              count: [testCircular],
            },
            some: {
              message: testCircular,
            },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          bar: {
            count: [
              [
                "a",
                {
                  baz: "two",
                },
                1,
              ],
            ],
          },
          some: {
            message: "<<Circular reference to 'config.bar.count.[0]'>>",
          },
        });
      });

      it("removes an empty array is a circular dependency", () => {
        const testCircular = [];

        const output = plugin.simplifyConfig(
          {
            bar: {
              count: [testCircular],
            },
            some: {
              message: testCircular,
            },
            foo: "test-2",
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          foo: "test-2",
        });
      });

      it("outputs the config regardless of the depth", () => {
        const output = plugin.simplifyConfig(
          {
            foo: {
              bar: {
                oof: 20,
                some: {
                  cut: {
                    test: {
                      nested: [
                        {
                          nestedAgain: "test",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          depth,
          includeFalseValues,
          showFunctionNames
        );
        expect(output).toEqual({
          foo: {
            bar: {
              oof: 20,
              some: { cut: { test: { nested: [{ nestedAgain: "test" }] } } },
            },
          },
        });
      });
    });
  });

  describe("INFINITE depth, WITH includeFalseValues, no showFunctionNames", () => {
    beforeEach(() => {
      depth = null;
    });
  });

  describe("Apply plugin", () => {
    it("Only runs dump config", (done) => {
      jest.spyOn(plugin, "dumpConfig").mockImplementationOnce((data) => {
        expect(data).toEqual({ mode: "development" });
        runDone(done);
      });

      plugin.apply({ some: 0, test: "data", options: { mode: "development" } });
    });
  });

  describe("Dump config", () => {
    beforeEach(() => {
      setFileExists(false);
      setDirMade(true);
      setFileWritten(true, jest.fn());
      setLogAssertionFn(jest.fn());

      jest.spyOn(fs, "mkdirSync").mockClear();
    });

    it("Creates file", (done) => {
      setFileWritten(true, (file: string, data: string) => {
        expect(data).toBe("module.exports = () => ({ foo: 'bar' })");
        runDone(done);
      });

      plugin.dumpConfig({ foo: "bar" });
    });

    it("Overrides file", (done) => {
      setFileExists(true);

      setFileWritten(true, (file: string, data: string) => {
        expect(data).toBe("module.exports = () => ({ foo: 'bar' })");
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        runDone(done);
      });

      plugin.dumpConfig({ foo: "bar" });
    });

    it("Unable to write file", (done) => {
      setFileWritten(false, jest.fn());
      setLogAssertionFn((name, message, err) => {
        expect(name).toBe("wcd");
        expect(message).toBe("Could not create dump file:");
        expect(err).toBeInstanceOf(Error);
        runDone(done);
      });
      plugin.dumpConfig({ foo: "bar" });
    });

    it("Unable to make dir", (done) => {
      setDirMade(false);
      setLogAssertionFn((name, message, err) => {
        expect(name).toBe("wcd");
        expect(message).toBe("Could not create cache folder:");
        expect(err).toBeInstanceOf(Error);
        runDone(done);
      });
      plugin.dumpConfig({ foo: "bar" });
    });
  });
});
