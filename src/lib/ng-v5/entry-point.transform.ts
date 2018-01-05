import { InjectionToken, Provider, ValueProvider } from 'injection-js';
import { Observable } from 'rxjs/Observable';
import { tap, map, switchMap } from 'rxjs/operators';
import { NgArtefacts } from '../ng-package-format/artefacts';

export const entryPointTransform = (artefacts: NgArtefacts) => {
  const ep = artefacts.entryPoint;

  return Observable.of('⁄init⁄')
    .pipe(
      switchMap(() => {

        rimraf(artefacts.outDir);
        rimraf(artefacts.stageDir);
      })
    );
};

export type EntryPointTransform = (artefacts: NgArtefacts) => Observable<NgArtefacts>;

export const ENTRY_POINT_TRANSFORM_TOKEN = new InjectionToken<EntryPointTransform>('ng.v5.entryPointTransform');

export const ENTRY_POINT_TRANSFORM: ValueProvider = {
  provide: ENTRY_POINT_TRANSFORM_TOKEN,
  useValue: entryPointTransform
};
