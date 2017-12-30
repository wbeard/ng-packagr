import { expect } from 'chai';
import { Pipeline, isPipelineProgress } from './pipeline';
import { INIT } from '../../public_api';

describe('Pipeline', () => {

  describe(`withTasks`, () => {
    it(`should add to tasks`, () => {
      const pipeline = new Pipeline<any>()
        .withTasks([
          { id: 'foo', attachTo: (): any => 123 }
        ])
        .withTasks([
          { id: 'bar', attachTo: (): any => 123 }
        ]);

      expect(pipeline['tasks']).to.be.an('array').that.has.length(2);
    });

    it(`should deduplicate by id`, () => {
      const pipeline = new Pipeline<any>()
        .withTasks([
          { id: 'foo', attachTo: (): any => true },
          { id: 'bar', attachTo: (): any => true },
          { id: 'foo', attachTo: (): any => false }
        ]);

      const tasks = pipeline['tasks'] as any[];
      expect(tasks).to.be.an('array').that.has.length(2);
      expect(tasks.find(t => t.id === 'foo').attachTo()).to.be.false;
    });

    it(`should deduplicate by 'last-wins' strategy`, () => {
      const pipeline = new Pipeline<any>()
        .withTasks([
          { id: 'foo', attachTo: (): any => 123 },
          { id: 'foo', attachTo: (): any => false }
        ]);

      const tasks = pipeline['tasks'] as any[];
      expect(tasks.find(t => t.id === 'foo').attachTo()).to.be.false;
    });
  });

  describe(`withTask`, () => {
    it(`should add to tasks`, () => {
      const pipeline = new Pipeline<any>()
        .withTasks([
          { id: 'foo', attachTo: (): any => false }
        ])
        .withTask({ id: 'bar', attachTo: (): any => false });

      expect(pipeline['tasks']).to.be.an('array').that.has.length(2);
    });

    it(`should override by id`, () => {
      const pipeline = new Pipeline<any>()
        .withTasks([
          { id: 'foo', attachTo: (): any => false }
        ])
        .withTask({ id: 'foo', attachTo: (): any => '123' });

      const tasks = pipeline['tasks'] as any[];
      expect(tasks).to.be.an('array').that.has.length(1);
      expect(tasks.find(t => t.id === 'foo').attachTo()).to.equal('123');
    });
  });

  describe(`run()`, () => {
    it(`should emit the ⁄init⁄ progress`, (done: DoneFn) => {
      const pipeline = new Pipeline<any>();

      pipeline.subscribe(
        (next) => {
          expect(next.task).to.equal(INIT.task);
          done();
        },
        (err) => done.fail(`Pipeline must not throw ${err}`)
      );

      pipeline.run();
    });
  });
});

describe(`isPipelineProgress`, () => {
  const pipelineProgress = { type: 'foo', payload: {} };
  const typePropertyMissing = { payload: {} };
  const typePropertyNoString = { type: 123, payload: {} };
  const payloadMissing = { type: 'foo' };

  it(`should type-guard by properties type and payload`, () => {
    expect(isPipelineProgress(pipelineProgress)).to.be.true;
  });

  it(`should return false if type property is missing`, () => {
    expect(isPipelineProgress(typePropertyMissing)).to.be.false;
  });

  it(`should return false if type property is not a string`, () => {
    expect(isPipelineProgress(typePropertyNoString)).to.be.false;
  });

  it(`should return false if payload property is missing`, () => {
    expect(isPipelineProgress(payloadMissing)).to.be.false;
  });
});

describe(`INIT`, () => {
  it(`should have magic type value '⁄init⁄'`, () => {
    expect(INIT.task).to.equal('⁄init⁄');
  });
});
