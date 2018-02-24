import * as path from 'path';
import { NgEntryPoint, CssUrl } from '../ng-package-format/entry-point';
import * as log from '../util/log';
import * as autoprefixer from 'autoprefixer';
import * as browserslist from 'browserslist';
import * as postcss from 'postcss';
import * as postcssUrl from 'postcss-url';
import * as postcssComments from 'postcss-discard-comments';

export interface PostCssRenderer {
  (args: { filePath: string; cssString: string }): Promise<string>;
}

// DISCUSSION
// `postCssPlugin(entryPoint: NgEntryPoint): any`
/*
 * const plugins = [];
 * for (let pluginFn of plugins) {
 *   plugins.push(pluginFn(entryPoint));
 * }
 * await postCss(plugins).process(...)
 */

export function postCssFactory(entryPoint: NgEntryPoint): PostCssRenderer {
  const filePath = entryPoint.entryFilePath;
  log.debug(`determine browserslist for ${filePath}`);
  const browsers = browserslist(undefined, { filePath });

  const postCssPlugins = [autoprefixer({ browsers }), postcssComments({ removeAll: true })];

  const cssUrl = entryPoint.cssUrl;
  if (cssUrl !== CssUrl.none) {
    log.debug(`postcssUrl: ${cssUrl}`);
    postCssPlugins.push(postcssUrl({ url: cssUrl }));
  }

  return async ({ filePath, cssString }) => {
    const result: postcss.Result = await postcss(postCssPlugins).process(cssString, {
      from: filePath,
      to: filePath.replace(path.extname(filePath), '.css')
    });

    // Escape existing backslashes for the final output into a string literal, which would otherwise escape the character after it
    result.css = result.css.replace(/\\/g, '\\\\');

    // Log warnings from postcss
    result.warnings().forEach(msg => {
      log.warn(msg.toString());
    });

    return result.css;
  };
}
