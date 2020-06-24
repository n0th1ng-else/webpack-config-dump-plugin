import * as fs from "fs";
import weblog from "webpack-log";
import { WebpackConfigDumpPlugin } from ".";
// import WebpackConfigDumpPlugin from "./old";

jest.mock("fs");
jest.mock("webpack-log");

const logger = weblog({ name: "wcd-mock" });

let plugin = new WebpackConfigDumpPlugin();

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

describe("Dump webpack config", () => {
  beforeEach(() => {
    plugin = new WebpackConfigDumpPlugin();
  });

  describe("Init", () => {
    it("Check initial values", () => {
      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("webpack.config.dump");
    });

    it("Override initial values - name", () => {
      plugin = new WebpackConfigDumpPlugin({
        name: "foo.bar",
      });

      expect(plugin.outputPath).toBe("./");
      expect(plugin.name).toBe("foo.bar");
    });

    it("Override initial values - outputPath", () => {
      plugin = new WebpackConfigDumpPlugin({
        outputPath: "foo/bar/",
      });

      expect(plugin.outputPath).toBe("foo/bar/");
      expect(plugin.name).toBe("webpack.config.dump");
    });
  });

  describe("Simplify config", () => {
    it("Empty config", () => {
      const output = plugin.simplifyConfig({});
      expect(output).toEqual({});
    });

    it("Null config", () => {
      const output = plugin.simplifyConfig(null);
      expect(output).toEqual(null);
    });

    it("Undefined config", () => {
      const output = plugin.simplifyConfig(undefined);
      expect(output).toEqual(undefined);
    });

    it("Keeps functions", () => {
      const output = plugin.simplifyConfig({ foo: () => {} });
      expect(output).toEqual({ foo: "[Function: foo]" });
    });

    it("Keeps RegExp", () => {
      const output = plugin.simplifyConfig({
        foo: /foo/,
        bar: new RegExp("bar"),
      });
      expect(output).toEqual({ foo: /foo/, bar: /bar/ });
    });

    it("Keeps numbers with values", () => {
      const output = plugin.simplifyConfig({ foo: 9000, bar: 0 });
      expect(output).toEqual({ foo: 9000 });
    });

    it("Keeps strings with values", () => {
      const output = plugin.simplifyConfig({ foo: "bar", bar: "" });
      expect(output).toEqual({ foo: "bar" });
    });

    it("Keeps non-empty arrays", () => {
      const output = plugin.simplifyConfig({
        foo: [],
        bar: ["test"],
        some: [""],
      });
      expect(output).toEqual({ bar: ["test"] });
    });

    it("Keeps nested objects", () => {
      const output = plugin.simplifyConfig({ foo: {}, bar: { test: 1 } });
      expect(output).toEqual({ foo: {}, bar: { test: 1 } });
    });

    it("Finds circular references", () => {
      const loop = { key: {} };
      loop.key = loop;
      const output = plugin.simplifyConfig({ foo: { oof: 20, loop }, });
      expect(output).toEqual({
        foo: {
          oof: 20,
          loop: {
            key: '<<circular reference to ["foo"]["loop"]>>'
          }
        },
      });
    });

    it("Finds circular references for arrays", () => {
      const loop = { key: {} };
      loop.key = loop;
      const output = plugin.simplifyConfig({
        foo: [{ some: "state" }, { bar: loop }],
      });
      expect(output).toEqual({
        foo: [
          { some: "state" },
          { bar: { key: '<<circular reference to ["foo"][1]["bar"]>>' } }
        ]
      });
    });
  });

  describe("Apply plugin", () => {
    it("Only runs dump config", (done) => {
      jest.spyOn(plugin, "dumpConfig").mockImplementationOnce((data) => {
        expect(data).toEqual({ mode: "development" });
        done();
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
        done();
      });

      plugin.dumpConfig({ foo: "bar" });
    });

    it("Overrides file", (done) => {
      setFileExists(true);

      setFileWritten(true, (file: string, data: string) => {
        expect(data).toBe("module.exports = () => ({ foo: 'bar' })");
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        done();
      });

      plugin.dumpConfig({ foo: "bar" });
    });

    it("Unable to write file", (done) => {
      setFileWritten(false, jest.fn());
      setLogAssertionFn((name, message, err) => {
        expect(name).toBe("wcd");
        expect(message).toBe("Could not create dump file:");
        expect(err).toBeInstanceOf(Error);
        done();
      });
      plugin.dumpConfig({ foo: "bar" });
    });

    it("Unable to make dir", (done) => {
      setDirMade(false);
      setLogAssertionFn((name, message, err) => {
        expect(name).toBe("wcd");
        expect(message).toBe("Could not create cache folder:");
        expect(err).toBeInstanceOf(Error);
        done();
      });
      plugin.dumpConfig({ foo: "bar" });
    });
  });
});
