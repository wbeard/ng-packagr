// https://github.com/ReactiveX/rxjs/issues/60#issuecomment-120476702


/*
const _lift = Observable.prototype.lift;
Observable.prototype.lift = function(observerFactory) {
  return _lift.call(this, new LogObserverFactory(observerFactory));
};

class LogObserverFactory {
  constructor(actualObserverFactory) {
    this.actualObserverFactory = actualObserverFactory;
  }
  create(destination) {
    return new LogObserver(this.actualObserverFactory.create(destination))
  }
}

class LogObserver {
  constructor(destination) {
    this.destination = destination;
  }
  next(x) {
   log('nexting ' , x);
    return this.destination.next(x);
  }
  throw(e) {
    log('throwing ', e);
    return this.destination.throw(e);
  }
  return(e) {
     log('returning', e);
    return this.destination.return(e);
  }
}
*/

import { Observable } from 'rxjs/Observable';
import { Operator } from 'rxjs/Operator';
import { Subject } from 'rxjs/Subject';
import { concat, tap, take, map } from 'rxjs/operators';
import { Observer } from 'rxjs/Observer';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { concat as concatStatic } from 'rxjs/observable/concat';
import { merge as mergeStatic } from 'rxjs/observable/merge';

const sub$ = new Subject<string>();

class LogProxyObserver {

  constructor(
    private original: Observer<any>
  ) {}

  next(value) {
    console.log("Nexted to inner obs...");

    this.original.next(value);
  }

  error(err) {
    console.log("Errored to inner obs...");

    this.original.error(err);
  }

  complete() {
    console.log("Completed to inner obs...");

    this.original.complete();
  }
}

class MyObservable<T> extends Observable<T> {

  constructor(subscribe) {
    super(subscribe);
  }

  private state$;

  public lift<R>(operator: Operator<T, R>): Observable<R> {
    const obs$ = super.lift(operator);

    const ret$ = new Observable(obs => {
      console.log("Subscribed to inner obs...");
      obs$.subscribe(new LogProxyObserver(obs));
    })

    return ret$ as Observable<R>;
  }
}

/*
const foo = new MyObservable(obs => obs.next(42));

const bar = foo.pipe(
  take(1),
  tap((_) => console.log('tapped: ', _))
);

bar.subscribe(
  (next) => { debugger; }
);
*/


type Payload = string;

class Pipeline extends Observable<Payload> {

  constructor(
    source$?: Observable<string>
  ) {
    super();

    if (source$) {
      this.source = source$;
    } else {
      this.source = new Observable(obs => obs.next('⁄init⁄'));
    }
  }

  public lift<R>(operator: Operator<string, R>): Observable<R> {
    const obs$ = super.lift(operator);
    //const pipe$ = new Pipeline();
    //obs$.subscribe(this.state$);

    const lifted = new Pipeline(this);
    lifted.operator = operator as any;
debugger;
    return mergeStatic(
      this as any as Observable<R>,
      lifted as any as Observable<R>
    );
  }

}
/*
const pipe = new Pipeline();
const bar = pipe.pipe(
  tap((_) => console.log('tapped ', _)),
  map((_) => _ + 42)
);

bar.subscribe(
  (next) => { debugger; }
)

pipe.subscribe(
  (next) => { debugger; }
);
*/


const pipeline$ = new Observable<string>(obs => obs.next('⁄init⁄'));

pipeline$.pipe(
  concat(
    new Observable
  )
)



const transform = (): Observable<string> => {


  return new Observable(obs => obs.next('123'));
}
