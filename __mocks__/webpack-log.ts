// old es5 module
import { jest } from "@jest/globals";

let assertionFn = jest.fn();

interface Options {
  name: string;
}

module.exports = function getLoggerMock(options: Options) {
  const name = options.name;
  return {
    __setAssertionFn: (fn) => (assertionFn = fn),
    warn: jest
      .fn<void, [message?: string, err?: Error]>()
      .mockImplementation((message?: string, err?: Error) =>
        assertionFn(name, message, err)
      ),
  };
};
