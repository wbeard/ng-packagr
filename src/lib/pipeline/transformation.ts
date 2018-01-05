export interface TransformationFn<Arguments, Result> {
  (args: Arguments): Result | Promise<Result>;
}

export type Transformation = /* .. */;
