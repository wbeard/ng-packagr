import { Observer, PartialObserver, NextObserver } from 'rxjs/Observer';
import { Observable, Subscribable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs/interfaces';
import { take, filter, tap, flatMap, switchMap, map, delay, observeOn, takeLast } from 'rxjs/operators';
import { pipe, pipeFromArray } from 'rxjs/util/pipe';
import { concat as concatObservables } from 'rxjs/observable/concat';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { queue } from 'rxjs/scheduler/queue';
import { TaskFn, task } from './task';

export const TYPE_FINISHES: ProgressType = 'ωfinishesω';
export const TYPE_STARTS: ProgressType = '⁄init⁄';

export type ProgressType = '⁄init⁄' | 'ωfinishesω' | 'πpendingπ' | string;

export const filterByFinishes = () =>
  filter((value: Progress<any>) => value.what === TYPE_FINISHES);

export interface Progress<P> {
  what: ProgressType,
  payload: P
}


export class Pipeline<P> implements NextObserver<Progress<P>>, Subscribable<Progress<P>> {

  /** Progress state of the pipeline. */
  private state$: Subject<Progress<P>>;

  /** @internal Observable chain for piping transforms. */
  private transform$: Observable<P>;

  constructor(state$?: Subject<Progress<P>>) {
    if (state$) {
      this.state$ = state$;
    } else {
      this.state$ = new ReplaySubject<Progress<P>>(1, undefined, queue);
      this.state$.next({ what: '⁄init⁄', payload: undefined });
    }
  }

  public get progress$(): Observable<Progress<P>> {
    return this.state$.asObservable();
  }

  public get starts$(): Observable<Progress<P>> {
    return this.state$.pipe(
      filter(value => value.what === TYPE_STARTS),
      take(1)
    );
  }

  public get finishes$(): Observable<Progress<P>> {
    return this.state$.pipe(filterByFinishes());
  }

  next(value: Progress<P>): void {
    this.state$.next(value);
    if (value.what === TYPE_FINISHES) {
      this.state$.complete();
    }
  }

  subscribe(
    observerOrNext?: PartialObserver<Progress<P>> | ((value: Progress<P>) => void),
    error?: (error: any) => void,
    complete?: () => void): Subscription {

      if (typeof observerOrNext === 'function') {
        return this.state$.subscribe(observerOrNext, error, complete);
      } else {
        return this.state$.subscribe(observerOrNext);
      }
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
      this.transform$ = this.state$.pipe(
        filter(v => v.what === TYPE_STARTS),
        take(1),
        map((v) => v.payload)
      );
    }

    if (tasks) {
      // transform$ = transform$ | ...[ foo, bar ]
      // ~> transform$ = transform$ | foo | bar
      this.transform$ = this.transform$.pipe(
        pipeFromArray(tasks),
        tap((_) => this.state$.next({ what: 'foo', payload: _ }))
      );

      // XX: we could add "meta operators" that 'incercept' on each emission
    }

    return this;
  }

}



const projectPipeline = new Pipeline<string>();

projectPipeline
  .pipe(
    delay(500),
    task<string>('Foo')
      .what('Do foo things')
      //.with(payload => payload)
      .how(args => {
        return 123;
      })
      //.why((result, payload) => payload)
      .build(),
    tap((_) => {
      projectPipeline.next({ what: 'Reading source files', payload: _ });
      //console.log('do stuff', _);
    }),
    delay(100),
    flatMap((valueBeforeChildsForked) => {

      // --> runs [a$, b$, c$] in sequence, one at a time, suspends and re-schedules on 'Pending' progress
      function runOneByOne(...pending: Pipeline<any>[]) {
        const current = pending.shift();
        const subscription = current.subscribe(
          (next) => {
            console.log('Next: ', next);
            if (next.what === 'πpendingπ') {
              // 'Pending' is a magic value, stop subscription
              subscription.unsubscribe();
              pending.push(current);
              runOneByOne(...pending);
            } else if (next.what === 'ωfinishesω') {
              runOneByOne(...pending);
            }
          },
          (err) => {
            console.log('Error: ', err);
          },
          () => {
            console.log('Completed');
          }
        );

      }

      projectPipeline.next({ what: 'Discovered entry points', payload: valueBeforeChildsForked });
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
              childPipeline.next({ what: 'ωfinishesω', payload: undefined });
              console.log('Child pipeline finishes with: ', _)
            })
          );

        return childPipeline;
      });

      return new Observable(observer => {
        debugger;
        runOneByOne(...childs);
        debugger;
        // XX: this needs to be async on every pipeline finished...
        if (childs.length === 0) {
          projectPipeline.next({ what: 'Entry points finished', payload: valueBeforeChildsForked });
        }
      });
      /*
      const childrenFinishes$ = childs.map((child) => child.finishes$);
      return forkJoin(childrenFinishes$)
//      return concatObservables(...childrenFinishes$)
        .pipe(tap((_) => { console.log('Childs emitting... ', _) }))
        .pipe(map(() => valueBeforeChildsForked))
        .pipe(tap(() => { console.log('Childs returning... ') }))
      */
      }),
    tap((_) => {
      console.log('hello', _);

      projectPipeline.next({ what: 'Writing npm package data', payload: _ });
    }),
    delay(1000),
    tap(() => console.log('About to finish...'))
  )
//  .runWith('my/package.json')



import { SpinnerUi } from './spinner';
projectPipeline.subscribe(new SpinnerUi());
