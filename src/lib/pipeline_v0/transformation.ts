/**
 * A `TansformationFn` reflects a single transformation that transforms its arguments (e.g. a set
 * of source code files) to a result format (e.g. a bundle file).
 *
 * @stable
 */
export interface Transformation<Arguments, Result> {
  (args: Arguments): Result | Promise<Result>
}
