import { expect } from 'chai';
import * as ng from '@angular/compiler-cli';
import { createSourceFile } from '../../testing/typescript.testing';
import { compileSourceFiles } from './compile-source-files';

describe(`compileSourceFiles()`, () => {
  it(`should do something for over-lapping flatModuleOutFile`, done => {
    const sourceOne = createSourceFile(`export const ONE = 2;`, '/foo/one.ts');
    const sourceIndex = createSourceFile(`export * from './one';`, '/foo/index.ts');

    compileSourceFiles([sourceOne, sourceIndex], {
      project: '/foo/tsconfig-ngc.json',
      rootNames: ['/foo/index.ts'],
      emitFlags: ng.EmitFlags.All,
      errors: [],
      options: {
        outDir: 'dist',
        flatModuleOutFile: 'one.js'
      }
    }).then(result => {
      expect(true).to.be.false;

      done();
    });
  });
});
