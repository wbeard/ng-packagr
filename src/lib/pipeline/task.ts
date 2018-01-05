import { Observer, PartialObserver, NextObserver } from 'rxjs/Observer';
import { Observable, Subscribable } from 'rxjs/Observable';
import { of as ofStatic } from 'rxjs/observable/of';
import { take, filter, tap, flatMap, switchMap, map, delay, observeOn, takeLast } from 'rxjs/operators';
import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs/interfaces';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { Progress, Pipeline } from './pipeline';

export type TaskFn<P> = MonoTypeOperatorFunction<P>;

export class TaskBuilder<P, A, R> {

  private mapFn: (payload: P) => A = (p) => p as any as A;
  private transformFn: (args: A) => R | Promise<R>;
  private resultFn: (result: R, payload: P) => P = (r, p) => p;

  private label: string;

  constructor(
    private id: string
  ) {
    this.label = id;
  }

  /**
   * …and it did so magic things that you need to tell us what the task does!
   *
   * @param label An human-readable label, e.g. for logging
   */
  public what(label: string) {
    this.label = label;

    return this;
  }

  /**
   * But it needed some extra input to get the job dob.
   *
   * Give a projection function to extract the task's input arguments from the pipeline's payload!
   *
   * @param mapFn Example: `(payload) => payload.sourceFiles.get('myFooBar.ts')`
   */
  public with<Args>(mapFn: (payload: P) => Args) {
    this.mapFn = (mapFn as any);

    return this as any as TaskBuilder<P, Args, {}>;
  }

  /**
   * After all, it performed like magic!
   *
   * Give a transformation function to execute the task.
   *
   * @param transformFn Example: `(sourceFile: string): number => transpile(sourceFile)`
   */
  public how<Result>(transformFn: (args: A) => Result | Promise<Result>) {
    this.transformFn = (transformFn as any)

    return this as any as TaskBuilder<P, A, Result>;
  }

  /**
   * And if it didn't die…
   *
   * Tell other tasks why this task was so important by adding this task's result to the pipeline
   * payload.
   *
   * @param resultFn Example: `(result, payload) => ({ ...payload, mySourceFiles: result.sourceFiles })`
   */
  public why(resultFn: (result: R, payload: P) => P) {
    this.resultFn = resultFn;

    return this;
  }

  /** Enterprisy method names need no documentation. */
  public build(): TaskFn<P> {
    if (!this.transformFn) {
      throw new Error(`No transform function for task ${this.what}`);
    }

    return (source: Observable<P>): Observable<P> => {
      let s$: Observer<Progress<P>>;
      if (typeof source['next'] === 'function') {
        s$ = source as any as Observer<Progress<P>>;
      }

      let tmp;
      return source.pipe(
        switchMap((value) => {
          if (s$) {
            s$.next({ what: this.label, payload: value });
          }

          const args = this.mapFn(value);
          const transformationResult = this.transformFn(args);

          if (transformationResult instanceof Promise) {
            return fromPromise(transformationResult)
              .pipe(map(result => ({ value, result })));
          } else {
            const result = transformationResult;
            return ofStatic({ value, result });
          }
        }),
        map(({ value, result }) => {
          const payload = this.resultFn(result, value);
          if (s$) {
            s$.next({ what: this.label, payload });
          }

          return payload;
        })
      );
    };
  }

}

export function task<P>(what: string) {
  return new TaskBuilder<P, P, any>(what);
}

