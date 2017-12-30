import { expect } from 'chai';
import { task, TaskBuilder } from './task';

describe(`task()`, () => {
  it(`should return a TaskBuilder`, () => {
    const builder = task('foo');
    expect(builder).to.be.an.instanceof(TaskBuilder)
  });

  it(`..`, () => {
    interface Stuff {
      countOf: number,
      people: string[]
    }

    const t = task<Stuff>('foo')
      .what('Does foo stuff')
      .when(progress => progress.task === 'BAR')
      .with(payload => payload.people)
      .how((args) => args.length)
      .why((result, payload) => ({
        ...payload,
        countOf: result
      }));
  });

});
