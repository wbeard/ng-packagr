import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { map, switchMap, tap } from 'rxjs/operators';
import { MetaTask } from './task';

export type ProgressType = '⁄init⁄' | 'ωfinishesω' | 'πpendingπ';

/** @experimental */
export interface PipelineProgress<Payload> {
  task: string,
  payload: Payload,
  type?: ProgressType
}

/** @experimental */
export const INIT: PipelineProgress<any> = {
  task: '⁄init⁄',
  payload: {}
}

/** @experimental */
export const isPipelineProgress = (value: any): value is PipelineProgress<any> =>
  typeof value.type === 'string' && value.payload !== undefined;

/** @experimental */
export class Pipeline<Payload> extends Subject<PipelineProgress<Payload>> {

  private isRunning: boolean = false;
  private tasks: MetaTask<any>[] = [];

  public withTasks(tasks: MetaTask<any>[]): Pipeline<Payload> {
    this.tasks = this.tasks.concat(tasks)
      .reduce(
        (deduplicated, task) => deduplicated.filter((t) => t.id !== task.id).concat(task),
        []
      );

    return this;
  }

  public withTask(task: MetaTask<any>): Pipeline<Payload> {
    const indexOf = this.tasks.findIndex((t) => t.id === task.id);
    if (indexOf < 0) {
      this.tasks.push(task);
    } else {
      this.tasks[indexOf] = task;
    }

    return this;
  }

  public complete() {
    this.isRunning = false;
    super.complete();
  }

  public run(): void {
    this.isRunning = true;
    this.subscribe(
      (next) => { debugger; },
      (err) => { debugger; },
      () => { debugger; }
    )

    for (let task of this.tasks) {
      this.pipe(task.attachTo).subscribe(this);
    }

    this.next(INIT);
  }
}

/**
childSub.add(
  parent.subscribe(
    (next) => {},
    (err) => {},
    () => { ... parent complete ...  }
  )
)
*/

/**

type NgArtefacts = { moduleId: string };
const transformEntryPoint = new Subject<NgArtefacts>()
  .pipe(
    readSources(),
    analyzeDependencies(),
    writeFesm15Bundle,
  );


export const entryPointTransforms = {
  provide: 'entryPointTransforms',
  useFactory: () => {

    return new Subject<NgArtefact>()
      .pipe(
        readSources,
        analyzeDependencies,
        writeFesm15Bundle
      )
  },
  deps: [ readSources, analyzeDependencies ]
}

@Injectable()
class EntryPointTransforms {

  constructor(
    private readSources: ReadSourcesTask,

  ) {}

  public stuff() {

    return new Subject<NgArtefacts>()
      .pipe(
        this.readSources
      );
  }

}

 */
