import { merge } from 'rxjs/observable/merge';
import { Pipeline, PipelineProgress } from './pipeline';
import { TaskAttachFn, MetaTask } from './task';
import 'rxjs/add/operator/map';
import { filter, switchMap, map, tap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

interface MyArtefacts {
  [key: string]: any;
}

const readSources = { id: 'readSources', attachTo:
  (pipeline$: Pipeline<MyArtefacts>) => pipeline$.pipe(
    filter((progress) => progress.task === 'INIT'),
    switchMap((value) => {
      pipeline$.next({ task: 'readSources', payload: { moduleId: '@foo/core' } });
      pipeline$.next({ task: 'readSources', payload: { moduleId: '@foo/bar' } });
      pipeline$.next({ task: 'readSources', payload: { moduleId: '@foo/common' } });

      return of(123)
    }),
    map((result) => ({ type: 'readSources' , payload: result}))
  )
};


const writeSources = { id: 'writeSources', attachTo:
  (pipeline$: Pipeline<MyArtefacts>) => pipeline$.pipe(
    filter((progress) => progress.task === 'readSources'),
    map((abc) => '123'),
    map(() => ({ type: 'writeSources', payload: null }))
  )
};

const rewriteDependencyStuff = { id: 'invokedBeforeDependencyEntryPoint', attachTo:
  (pipe$: Pipeline<MyArtefacts>) => pipe$.pipe(
    filter((progress) => progress.task === 'waitForDependencies'),
    tap((value) => {
      pipe$.next({ task: 'JUHU!', payload: {} });

      console.log("invokedBeforeDependencyEntryPoint", value);
    })
  )
};


const waitForDependencyEntryPoint = { id: 'waitForDependencies', attachTo:
  (pipeline$: Pipeline<MyArtefacts>) => pipeline$.pipe(
    filter((progress) => progress.task === 'readSources' && progress.payload.moduleId === '@foo/bar'),
    map((value) => {
      console.log("Found dependency!", value);

      return { type: 'waitForDependencies', payload: value };
    })
  )
};

/*
class NgPackagr extends Pipeline<MyArtefacts> {
}

const ngPackagr = () => new NgPackagr();

ngPackagr()
  .withTasks([ rewriteDependencyStuff, readSources , writeSources , waitForDependencyEntryPoint ])
  .run();


import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
const foo = new Subject<string>();

const bar = foo.pipe(
  map((value) => 123)
);

const discoverStuff = () => (source: Observable<number>): Observable<string> => {

  return new Observable<string>(observer => {
    observer.next('abc');
  })
}
*/
