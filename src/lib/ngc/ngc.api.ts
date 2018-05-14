/* The purpose of this file is to track the APIs of ngc that we use */

export {
  createCompilerHost,
  createProgram,
  formatDiagnostics,
  CompilerHost,
  Program,
  Diagnostic
} from '@angular/compiler-cli/ngtools2';
export {
  CompilerOptions,
  EmitFlags,
  TsEmitCallback as EmitCallback,
  DEFAULT_ERROR_CODE,
  SOURCE,
  UNKNOWN_ERROR_CODE
} from '@angular/compiler-cli/src/transformers/api';

export { VERSION } from '@angular/compiler-cli';
