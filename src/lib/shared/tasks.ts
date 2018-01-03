import * as ora from 'ora';
import { Observable } from 'rxjs/Observable';
import { concat as concatStatic } from 'rxjs/observable/concat';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of as ofStatic } from 'rxjs/observable/of';
import { merge } from 'rxjs/observable/merge';
import { never } from 'rxjs/observable/never';
import { map } from 'rxjs/operators/map';
import { switchMap } from 'rxjs/operators/switchMap';
import { filter } from 'rxjs/operators/filter';
import { tap } from 'rxjs/operators/tap';
import { pipe } from 'rxjs/util/pipe';
import 'rxjs/add/operator/map';
import { NgArtefacts } from '../ng-package-format/artefacts';
import { NgPackage } from '../ng-package-format/package';
import { Pipeline, INIT, PipelineProgress } from '../pipeline/pipeline';
import { task, MetaTask } from '../pipeline/task';
import { discoverPackages } from '../steps/init';
import { ngPackagr } from '../ng-v5-packagr';
import { rimraf } from '../util/rimraf';
import { copyFiles } from '../util/copy';

export const discoverEntryPoints = (project: string): MetaTask<NgArtefacts> => ({
  id: 'discoverEntryPoints',
  attachTo: pipe(
    filter(progress => progress.task === INIT.task),
    switchMap(() => {
      const spinner = ora({
        text: 'Discover entry points',
        spinner: 'moon'
      });
      spinner.start();

      return fromPromise(discoverPackages({ project }))
        .map((ngPackage: NgPackage) => {
          spinner.succeed();

          return [ ngPackage.primary, ...ngPackage.secondaries ]
            .map((entryPoint): NgArtefacts => new NgArtefacts(
              project,
              entryPoint,
              ngPackage
            ));
        });
    }),
    map((arr) => {
      return arr.map((payload: NgArtefacts): PipelineProgress<NgArtefacts> => ({ task: 'discoverEntryPoints', payload }))
    }),
    switchMap((arr) => {
      return merge(arr);
    })
  )
});


export const transformEntryPoint = {
  id: 'transformEntryPoint',
  attachTo: (source: Pipeline<NgArtefacts>) => {
    const mediumFree$ = concatStatic(
      ofStatic(true),
      source.pipe(filter(progress => progress.task === 'entryPointWritten'))
    );

    return source.pipe(
      /* .. */
    );
  }
}


export const cleanDest = task<NgArtefacts>('cleanDest')
  .what('Cleaning destination directory')
  .when(progress => progress.task === 'discoverEntryPoints')
  .with(payload => payload.pkg.dest)
  .how(rimraf)
  .build();

export const pruneWorkingDir = task<NgArtefacts>('pruneWorkingDir')
  .what('Prune working directory')
  .when(progress => progress.task === copyPackageFiles.id)
  .with(payload => payload.pkg.workingDirectory)
  .how(rimraf)
  .build();

export const copyPackageFiles = task<NgArtefacts>('copyPackageFiles')
  .what('Copy additional files to npm package')
  .when(progress => progress.task === cleanDest.id)
  .with(payload => payload.pkg)
  .how((args) => Promise.all([
    copyFiles(`${args.src}/README.md`, args.dest),
    copyFiles(`${args.src}/LICENSE`, args.dest)
  ]))
  .build();
