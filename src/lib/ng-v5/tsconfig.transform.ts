import { ValueProvider, InjectionToken } from 'injection-js';
import { Observable } from 'rxjs/Observable';
import { NgEntryPoint } from '../ng-package-format/entry-point';

export const tsConfigTransform = (entryPoint: NgEntryPoint): Observable<any> => {

  return Observable.of('foo');
}


export const TSCONFIG_TRANSFORM_TOKEN = new InjectionToken<any>('ng.v5.tsConfig');

export const TSCONFIG_TRANSFORM_PROVIDER: ValueProvider = {
  provide: TSCONFIG_TRANSFORM_TOKEN,
  useValue: tsConfigTransform
}
