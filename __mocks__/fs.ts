import { jest } from "@jest/globals";

let isFileExists = false;
let isDirMade = true;
let isFileWritten = true;
let fileWrittenFn = jest.fn();

function __setFileExists(isExists: boolean): void {
  isFileExists = isExists;
}

function __setDirMade(isMade: boolean): void {
  isDirMade = isMade;
}

function __setFileWritten(isWritten: boolean, assertionFn): void {
  isFileWritten = isWritten;
  fileWrittenFn = assertionFn;
}

function existsSync(filepath: string): boolean {
  return isFileExists;
}

function mkdirSync(dir: string): void {
  if (isDirMade) {
    return;
  }

  throw new Error("Unable to create DIR (__mock__)");
}

function writeFileSync(file: string, data: string): void {
  if (isFileWritten) {
    fileWrittenFn(file, data);
    return;
  }

  throw new Error("Unable to write FILE (__mock__)");
}

export {
  existsSync,
  mkdirSync,
  writeFileSync,
  __setFileExists,
  __setDirMade,
  __setFileWritten,
};
