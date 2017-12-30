import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { map, switchMap, tap } from 'rxjs/operators';
import { MetaTask } from './task';

/** @experimental */
export interface PipelineProgress<Payload> {
  type: string,
  payload: Payload
}

/** @experimental */
export const INIT: PipelineProgress<any> = {
  type: '⁄init⁄',
  payload: {}
}

/** @experimental */
export const isPipelineProgress = (value: any): value is PipelineProgress<any> =>
  typeof value.type === 'string' && value.payload !== undefined;

/** @experimental */
export class Pipeline<Payload> extends Subject<PipelineProgress<Payload>> {

  private tasks: MetaTask<any>[] = [];

  public withTasks(tasks: MetaTask<any>[]): Pipeline<Payload> {
    this.tasks = this.tasks.concat(tasks)
      .reduce(
        (deduplicated, task) => deduplicated.filter((t) => t.name !== task.id).concat(task),
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

  public run(): void {
    for (let task of this.tasks) {
      this.pipe(task.attachTo).subscribe(this);
    }

    this.next(INIT);
  }
}
