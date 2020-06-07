// old es5 module
let assertionFn = jest.fn();

interface Options {
  name: string;
}

module.exports = function getLoggerMock(options: Options) {
  const name = options.name;
  return {
    __setAssertionFn: (fn) => (assertionFn = fn),
    warn: jest
      .fn()
      .mockImplementation((message?: string, err?: Error) =>
        assertionFn(name, message, err)
      ),
  };
};
