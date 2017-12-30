import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { filter, switchMap, tap, map } from 'rxjs/operators';
import { UnaryFunction } from 'rxjs/interfaces';
import { pipe } from 'rxjs/util/pipe';
import * as spinner from '../util/spinner';
import { Pipeline, PipelineProgress } from './pipeline';
import { Transformation } from './transformation';

/**
 * Attaches a task to a pipeline. Type-compatible to a lettable operator.
 *
 * #### How It Works
 *
 * The `source$` pipeline emits progress events.
 * A task will typically filter events and listen to those that are of interest.
 * It will then read the payload emitted in the progress event, apply a transformation function
 * (i.e., do some magic stuff), and add the results to the payload.
 * The task reports back the result by returning an `Observable` that emits a subsequent progress
 * event with a modified payload.
 *
 * Internally, in RxJS, this works by something like `subject$.pipe(taskOps).subscribe(subject$)`.
 *
 * @internal
 */
export interface TaskAttachFn<T> {
  (source$: Pipeline<T>): Observable<PipelineProgress<T>>
}

/**
 * A `MetaTask` can be attached to a pipleine.
 *
 * @internal
 */
export interface MetaTask<T> {
  id: string,
  attachTo: TaskAttachFn<T>
}

/**
 * Creates a task that can be attached to a pipeline.
 *
 * #### How It Works
 *
 * You tell what your task is supposed to do in a human-inspired domain-specific language.
 * We will fly you to the moon and back by piping your DSL specs through lettable operators on an
 * Observable in the RxJS world.
 *
 * @experimental
 */
export class TaskBuilder<P, A, R> {

  constructor(
    private identifier: string
  ) {
    this.label = identifier;
  }

  private label: string;

  private filterFn: (progress: PipelineProgress<P>) => boolean =
    () => true;

  private mapFn: (payload: P) => A =
    (p) => p as any as A;

  private transformFn: (args: A) => R | Promise<R>;

  private resultFn: (result: R, payload: P) => P =
    (r, p) => p;

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
   * Then, something happened and the task was executed.
   *
   * Give a selector function to determine when this task will be executed!
   *
   * @param filterFn Example: `(progress) => progress.type === 'readSources'`
   */
  public when(filterFn: (progress: PipelineProgress<P>) => boolean) {
    this.filterFn = filterFn || this.filterFn;

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
  public build() : MetaTask<P> {
    if (!this.transformFn) {
      throw new Error(`No transform function for task ${this.identifier}`);
    }

    const attachTo = pipe(
      filter(this.filterFn),
      tap(() => spinner.taskStarts(this.label)),
      switchMap(({ task, payload }) => {
        const args = this.mapFn(payload);
        const result = this.transformFn(args);
        if (result instanceof Promise) {
          return fromPromise(result)
            .map((result) => this.resultFn(result, payload));
        } else {
          return of(this.resultFn(result, payload));
        }
      }),
      tap(() => spinner.taskCompleted(this.label)),
      map((payload) => ({ task: this.identifier, payload }))
    );

    return {
      id: this.identifier,
      attachTo
    };
  }

}

/**
 * Once upon a time, there was a task…
 *
 * @param id Task identifier
 * @see TaskBuilder
 * @experimental
 */
export function task<T>(id: string): TaskBuilder<T, {}, {}> {
  return new TaskBuilder<T, {}, {}>(id);
}
