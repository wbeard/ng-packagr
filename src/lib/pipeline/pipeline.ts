import { Observer, PartialObserver } from 'rxjs/Observer';
import { Observable, Subscribable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';
import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs/interfaces';
import { take, filter, tap, flatMap, switchMap, map, delay, observeOn, takeLast } from 'rxjs/operators';
import { pipe, pipeFromArray } from 'rxjs/util/pipe';
import { of as ofStatic } from 'rxjs/observable/of';
import { concat as concatObservables } from 'rxjs/observable/concat';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { queue } from 'rxjs/scheduler/queue';
import * as spinner from '../util/spinner';

export type ProgressType = 'Initialized' | 'Starts' | 'Finishes' | 'Pending' | string;

export interface Progress<P> {
  what: ProgressType,
  payload: P
}

export type TaskFn<P> = MonoTypeOperatorFunction<P>;

export class TaskBuilder<P, A, R> {

  constructor(
    private what: string
  ) {}

  private transformFn: (args: A) => R | undefined;

  public how(transformFn: (args: A) => R) {
    this.transformFn = transformFn;

    return this;
  }

  public build(): TaskFn<P> {
    if (!this.transformFn) {
      throw new Error(`No transform function for task ${this.what}`);
    }

    return (source: Observable<P>): Observable<P> => {
      let s$: Observer<P>;
      if (typeof source['next'] === 'function') {
        s$ = source as (Observer<P> & Observable<P>);
      }

      let tmp;
      return source.pipe(
        tap((_) => { /* .. do stuff .. */ tmp = _; }),
        switchMap(() => {
          return ofStatic(444)
        }),
        map(() => {
          if (s$) {
            s$.next({} as any as P);
          }

          return tmp;
        })
      );
    };
    /*pipe(
      switchMap((v) => {
        // TODO: .with() and .why()

        return ofStatic(this.transformFn(undefined));
      }),
      map((v) => {

        return (v as any as P);
      })
    );
    */
  }
}

export function task<P>(what: string) {
  return new TaskBuilder<P, {}, {}>(what);
}


export class Pipeline<P> {

  /** Public visible progress state of the pipeline. */
  private progress$ = new ReplaySubject<Progress<P>>(1);

  /** Internal observable chain for piping transforms. */
  private transform$: Observable<P>;

  public progress(what: string) {
    this.progress$.next({ what, payload: undefined });
    if (what === 'Finishes') {
      this.progress$.complete();
    }
  }

  public get finishes$(): Observable<Progress<P>> {
    return this.progress$.pipe(
      filter((v) => v.what === 'Finishes')
    );
  }

  public subscribe(value: any) {
    return this.progress$.subscribe(value);
  }

  pipe(): Pipeline<P>;
  pipe(op1: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>, op5: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>, op5: TaskFn<P>, op6: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>, op5: TaskFn<P>, op6: TaskFn<P>, op7: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>, op5: TaskFn<P>, op6: TaskFn<P>, op7: TaskFn<P>, op8: TaskFn<P>): Pipeline<P>;
  pipe(op1: TaskFn<P>, op2: TaskFn<P>, op3: TaskFn<P>, op4: TaskFn<P>, op5: TaskFn<P>, op6: TaskFn<P>, op7: TaskFn<P>, op8: TaskFn<P>, op9: TaskFn<P>): Pipeline<P>;
  public pipe(...tasks: TaskFn<P>[]): Pipeline<P> {
    if (!this.transform$) {
      this.transform$ = this.progress$.pipe(
        filter(v => v.what === 'Starts'),
        take(1),
        map((v) => v.payload)
      );

      // ofStatic({} as any as P);
    }

    if (tasks) {
      // transform$ = transform$ | ...[ foo, bar ]
      // ~> transform$ = transform$ | foo | bar
      this.transform$ = this.transform$.pipe(pipeFromArray(tasks));

      // XX: we could add "meta operators" that 'incercept' on each emission
    }

    return this;
  }

  public runWith(payload?: P) {
    this.progress$
      .next({ what: 'Starts', payload });

    this.transform$
      .pipe(observeOn(queue))
      .pipe(takeLast(1))
      .subscribe(
        (next) => {
          this.progress$.next({ what: 'Finishes', payload: next });
        },
        (err) => {
          this.progress$.error(err);
        },
        () => {}
      );

    return this;
  }

}


class SpinnerUi {

  private spinner;

  private prefix: string;

  constructor() {
    this.spinner = spinner.spinner('123');
  }

  next(value) {
    if (value.what === 'Starts') {
      this.prefix = value.payload;

      this.spinner.start(`${this.prefix}: ${value.what}`);
    } else if (value.what === 'Finishes') {
      this.spinner.succeed(`${this.prefix}: Build success.`);
    } else {
      this.spinner.info(`${this.prefix}: ${value.what}`);
    }
  }

  error(err) {
    this.spinner.fail(`${this.prefix}: ${err}`);
  }

  complete() {
  }

}

const projectPipeline = new Pipeline<string>();

projectPipeline
  .pipe(
    delay(500),
    tap((_) => {
      projectPipeline.progress('Reading source files');

      console.log('do stuff', _);
    }),
    delay(100),
    flatMap((valueBeforeChildsForked) => {
      projectPipeline.progress('Discovered entry points');
      const eps = [123, 456, 789];

      const childs = eps.map((ep) => {
        const childPipeline = new Pipeline<number>();

        childPipeline
          .pipe(
            tap((_) => console.log('Child pipeline running', _)),
            delay(1300),
            map((_) => {
              if(_ === 456) {
                throw 'Shit';
              }

              return _ + 1;
            }),
            tap((_) => {
              childPipeline.progress('Finishes');
              console.log('Child pipeline finishes with: ', _)
            })
          )
          .runWith(ep)

        return childPipeline;
      });

      const childrenFinishes$ = childs.map((child) => child.finishes$);
      return forkJoin(childrenFinishes$)
//      return concatObservables(...childrenFinishes$)
        .pipe(tap((_) => { console.log('Childs emitting... ', _) }))
        .pipe(map(() => valueBeforeChildsForked))
        .pipe(tap(() => { console.log('Childs returning... ') }))
    }),
    tap((_) => {
      console.log('hello', _);

      projectPipeline.progress('Writing npm package data');
    }),
    delay(1000),
    tap(() => console.log('About to finish...'))
  )
  .runWith('my/package.json')

projectPipeline.subscribe(new SpinnerUi());
