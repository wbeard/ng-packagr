import { ReplaySubject } from 'rxjs/ReplaySubject';


let sub$ = new ReplaySubject<string>();

sub$.next('foo'); // <-- from here :-)

sub$.subscribe(
  (next) => {
    debugger;
  },
  (err) => {
    debugger;
  },
  () => {
    // it's complete!
    debugger;
  }
)

sub$.complete(); // <.--!!







































//import { merge } from 'rxjs/observable/merge';
//import { Pipeline, PipelineProgress } from './pipeline';
//import { TaskAttachFn, MetaTask } from './task';
/*
import 'rxjs/add/operator/map';
import { filter, switchMap, map, tap, delay, bufferTime, takeLast, observeOn } from 'rxjs/operators';
import { of as observableOf } from 'rxjs/observable/of';
import { from as observableFrom } from 'rxjs/observable/from';
import { concat as concatStatic } from 'rxjs/observable/concat';
import { merge as mergeStatic } from 'rxjs/observable/merge';
import { asap } from 'rxjs/scheduler/asap';
import { queue } from 'rxjs/scheduler/queue';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';


console.log("hello world");
*/
/*
const obs1$ = observableFrom([1, 22, 3], asap);
const obs2$ = observableFrom([4, 55, 6], asap)
const obs3$ = observableFrom([7, 88, 9], asap);


function subscribeSequentially(...args: Observable<any>[]) {
  const pending = args;

  const current = pending.shift();
  const subscription = current.subscribe(
    (next) => {
      console.log('Next: ', next);
      if (next > 10) {
        // magic value, stop subscription
        subscription.unsubscribe();
        pending.push(current);
        subscribeSequentially(...pending);
      }
    },
    (err) => {
      console.log('Error: ', err);
    },
    () => {
      console.log('Completed');
      // on complete
      if (pending.length > 0) {
        subscribeSequentially(...pending);
      }
    }
  );

}

subscribeSequentially(obs1$, obs2$, obs3$)
*/

//obs1$.subscribe(next => console.log('obs1$ :', next));
//obs2$.subscribe(next => console.log('obs2$ :', next));
//obs3$.subscribe(next => console.log('obs3$ :', next));


/*
const parent = new Subject<any>();

parent.pipe(
  tap((_) => { console.log('Discover entry points...', _) }),
  delay(2000),
  tap(() => {
    console.log('children discovered, starting childs...');
  }),
  switchMap((pV) => {
    const eps = [123, 456, 678];
    const childs = eps.map((ep) => {
      const c = new Subject<any>();

      c.pipe(
        tap((cV) => console.log('Doing child stuff...', pV, cV)),
        tap(() => {
console.log("child stuff depending on other childs?!?", childs);
        }),
        //delay(500),
        //observeOn(queue)
      )
      .subscribe(
        (next) => { console.log('Child next: ', next); },
        (err) => {},
        () => console.log('Child complete!')
      );

      c.next(ep);

      return c;
    });


    return concatStatic(
      childs
    );
  })
).subscribe();


const parentSub  = parent.subscribe();
*/
/*
const child = new Subject<any>();
child.pipe(
  switchMap((pV) => {

    return observableOf(123, 456, 890)
      .pipe(
        delay(1000),
        tap((cV) => { console.log('Doing child stuff...', pV, cV) }),
        takeLast(1)
      )
      .pipe(
        map(() => 'Finishes')
      )
  })
);
const childSub = child.subscribe(
  (next) => { console.log('Child next: ', next); },
  (err) => {},
  () => console.log('Child complete!')
);

parentSub.add(childSub);

parent
  .subscribe(
    (next) => { console.log('Subject Next: ', next); },
    (err) => { console.log('Subject Error: ', err); },
    () => { console.log('Subject Complete!') }
  )

parent
  .pipe(
    filter(v => v === 'Finished')
  )
  .subscribe(
    () => console.log('Finished!')
  );


parent.next('foo');
*/

/*

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
