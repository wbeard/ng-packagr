import { Position, isSyntaxError, syntaxError } from '@angular/compiler';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import * as path from 'path';
import { redirectWriteFileCompilerHost } from '../ts/redirect-write-file-compiler-host';
import { TsConfig } from '../ts/tsconfig';
import * as log from '../util/log';
import { createEmitCallback } from './create-emit-callback';
import {
  createCompilerHost,
  createProgram,
  formatDiagnostics,
  CompilerHost,
  CompilerOptions,
  Diagnostic,
  Program,
  DEFAULT_ERROR_CODE,
  SOURCE,
  UNKNOWN_ERROR_CODE,
  VERSION
} from './ngc.api';

export async function compileSourceFiles(
  sourceFiles: ts.SourceFile[],
  tsConfig: TsConfig,
  extraOptions?: Partial<CompilerOptions>,
  declarationDir?: string
) {
  log.debug(`ngc (v${VERSION.full})`);

  const compilerOptions: CompilerOptions = { ...tsConfig.options, ...extraOptions };
  let compilerHost: CompilerHost = createCompilerHost({ options: compilerOptions });
  if (declarationDir) {
    compilerHost = redirectWriteFileCompilerHost(compilerHost, compilerOptions.basePath, declarationDir);
  }

  // TODO: need to resolve resource file contents from the graph....
  compilerHost.readResource = (fileName: string) => {
    return 'foo';
  };

  let program = createProgram({
    rootNames: tsConfig.rootNames,
    options: compilerOptions,
    host: compilerHost
  });

  const emitCallback = createEmitCallback(compilerOptions);
  const emitFlags = tsConfig.emitFlags;
  let emitResult: ts.EmitResult | undefined;

  let allDiagnostics: Array<ts.Diagnostic | Diagnostic> = [];
  try {
    allDiagnostics.push(...defaultGatherDiagnostics(program!));

    if (!hasErrors(allDiagnostics)) {
      emitResult = program!.emit({ emitCallback, emitFlags });
      allDiagnostics.push(...emitResult.diagnostics);
      return { diagnostics: allDiagnostics, program, emitResult };
    }
    return { diagnostics: allDiagnostics, program };
  } catch (e) {
    let errMsg: string;
    let code: number;
    if (isSyntaxError(e)) {
      // don't report the stack for syntax errors as they are well known errors.
      errMsg = e.message;
      code = DEFAULT_ERROR_CODE;
    } else {
      errMsg = e.stack;
      // It is not a syntax error we might have a program with unknown state, discard it.
      program = undefined;
      code = UNKNOWN_ERROR_CODE;
    }
    allDiagnostics.push({ category: ts.DiagnosticCategory.Error, messageText: errMsg, code, source: SOURCE });
  }

  const flatModuleFile = compilerOptions.flatModuleOutFile;
  const flatModuleFileExtension = path.extname(flatModuleFile);

  // XX(hack): redirect the `*.metadata.json` to the correct outDir
  // @link https://github.com/angular/angular/pull/21787
  if (declarationDir) {
    const metadataBundleFile = flatModuleFile.replace(flatModuleFileExtension, '.metadata.json');
    const metadataSrc = path.resolve(compilerOptions.declarationDir, metadataBundleFile);
    const metadataDest = path.resolve(declarationDir, metadataBundleFile);
    if (metadataDest !== metadataSrc && fs.existsSync(metadataSrc)) {
      await fs.move(metadataSrc, metadataDest, { overwrite: true });
    }
  }

  const exitCode = exitCodeFromResult(allDiagnostics);
  return exitCode === 0 ? Promise.resolve() : Promise.reject(new Error(formatDiagnostics(allDiagnostics)));
}

type Diagnostics = ReadonlyArray<ts.Diagnostic | Diagnostic>;

function exitCodeFromResult(diags: Diagnostics | undefined): number {
  if (!diags || filterErrorsAndWarnings(diags).length === 0) {
    // If we have a result and didn't get any errors, we succeeded.
    return 0;
  }

  // Return 2 if any of the errors were unknown.
  return diags.some(d => d.source === 'angular' && d.code === UNKNOWN_ERROR_CODE) ? 2 : 1;
}

function filterErrorsAndWarnings(diagnostics: Diagnostics): Diagnostics {
  return diagnostics.filter(d => d.category !== ts.DiagnosticCategory.Message);
}

function defaultGatherDiagnostics(program: Program): Diagnostics {
  const allDiagnostics: Array<ts.Diagnostic | Diagnostic> = [];

  function checkDiagnostics(diags: Diagnostics | undefined) {
    if (diags) {
      allDiagnostics.push(...diags);
      return !hasErrors(diags);
    }
    return true;
  }

  let checkOtherDiagnostics = true;
  // Check parameter diagnostics
  checkOtherDiagnostics =
    checkOtherDiagnostics &&
    checkDiagnostics([...program.getTsOptionDiagnostics(), ...program.getNgOptionDiagnostics()]);

  // Check syntactic diagnostics
  checkOtherDiagnostics = checkOtherDiagnostics && checkDiagnostics(program.getTsSyntacticDiagnostics() as Diagnostics);

  // Check TypeScript semantic and Angular structure diagnostics
  checkOtherDiagnostics =
    checkOtherDiagnostics &&
    checkDiagnostics([...program.getTsSemanticDiagnostics(), ...program.getNgStructuralDiagnostics()]);

  // Check Angular semantic diagnostics
  checkOtherDiagnostics = checkOtherDiagnostics && checkDiagnostics(program.getNgSemanticDiagnostics() as Diagnostics);

  return allDiagnostics;
}

function hasErrors(diags: Diagnostics) {
  return diags.some(d => d.category === ts.DiagnosticCategory.Error);
}
