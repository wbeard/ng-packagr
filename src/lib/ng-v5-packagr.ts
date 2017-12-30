import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Injector } from 'injection-js';
import { Pipeline } from './pipeline/pipeline';
import { NgArtefacts } from './ng-package-format/artefacts';
import { NgEntryPoint } from './ng-package-format/entry-point';
import { NgPackage } from './ng-package-format/package';
import { discoverEntryPoints, copyPackageFiles, cleanDest, pruneWorkingDir, transformEntryPoint, writeEntryPoint } from './shared/tasks';

/**
 * The original ng-packagr, implemented on top of a pluggable build pipeline, transpiles from
 * TypeScript sources to Angular Package Format v5, intended for Angular v5!
 *
 * @experimental
 */
export class NgPackagr extends Pipeline<NgArtefacts> {

  public forProject(project: string): NgPackagr {
    this.withTask(discoverEntryPoints(project));

    return this;
  }
}

/** @experimental */
export const ngPackagr = () => new NgPackagr()
  .withTasks([
//    copyPackageFiles,
    transformEntryPoint(),
    writeEntryPoint,
    pruneWorkingDir,
    cleanDest
  ]) as NgPackagr;

export const ngPackagrDi = () => {
  const ng = ReflectiveInjector.resolveAndCreate([
    NgPackagr
  ]).get(NgPackagr);

  (ng as NgPackagr).run();
}

/**
 * const injector = ReflectiveInjector.resolveAndCreate([
 * Service,
 * Http
 * ]);
 */
