import * as fs from 'fs-extra';
import * as path from 'path';
import stripBom = require('strip-bom');
import { Transform, transformFromPromise } from '../../../brocc/transform';
import { NgEntryPoint, CssUrl } from '../../../ng-package-format/entry-point';
import { RendererFactory } from '../../../stylesheets/stylesheets';
import * as log from '../../../util/log';
import { byEntryPoint, isInProgress } from '../../entry-point.node';

// CSS Tools
import * as sass from 'node-sass';
import * as nodeSassTildeImporter from 'node-sass-tilde-importer';
import * as less from 'less';
import * as stylus from 'stylus';

export const stylesheetTransformFactory = (postCssFactory: RendererFactory) =>
  transformFromPromise(async graph => {
    log.info(`Rendering Stylesheets`);

    // TODO: fetch current entry point from graph
    const entryPoint = graph.find(byEntryPoint().and(isInProgress));

    // TODO: fetch nodes from the graph
    const stylesheetNodes = graph.from(entryPoint).filter(node => node.type === 'text/css' && node.state !== 'done');

    // TODO: detemrine base path from NgPackage
    const ngPkg = graph.find(node => node.type === 'application/ng-package');
    const basePath: string = ngPkg.data.basePath;

    const postCssProcessor = postCssFactory(entryPoint.data.entryPoint);

    await Promise.all(
      stylesheetNodes.map(async stylesheetNode => {
        const filePath: string = stylesheetNode.url.substring('file://'.length);

        // preprocessor (render)
        const cssString: string = await renderPreProcessor(filePath, basePath, entryPoint.data.entryPoint);

        // postcss (autoprefixing, et al)
        const result: string = await postCssProcessor({ filePath, cssString });

        // TODO: update nodes in the graph
        stylesheetNode.data = {
          ...stylesheetNode.data,
          content: result
        };
      })
    );

    // TODO: await forEach() ?!?

    return graph;
  });

async function renderPreProcessor(filePath: string, basePath: string, entryPoint: NgEntryPoint): Promise<string> {
  log.debug(`Render styles for ${filePath}`);
  switch (path.extname(filePath)) {
    case '.scss':
    case '.sass':
      log.debug(`rendering sass from ${filePath}`);
      return renderSass({
        file: filePath,
        importer: nodeSassTildeImporter,
        includePaths: entryPoint.styleIncludePaths
      });

    case '.less':
      log.debug(`rendering less from ${filePath}`);
      return renderLess({
        filename: filePath,
        paths: entryPoint.styleIncludePaths
      });

    case '.styl':
    case '.stylus':
      log.debug(`rendering styl from ${filePath}`);
      return renderStylus({
        filename: filePath,
        root: basePath,
        paths: entryPoint.styleIncludePaths
      });

    case '.css':
    default:
      log.debug(`reading css from ${filePath}`);
      return fs.readFile(filePath).then(buffer => stripBom(buffer.toString()));
  }
}

const renderSass = (sassOpts: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    sass.render(sassOpts, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.css.toString());
      }
    });
  });
};

const renderLess = (lessOpts: any): Promise<string> => {
  return fs
    .readFile(lessOpts.filename)
    .then(buffer => stripBom(buffer.toString()))
    .then(
      (lessData: string) =>
        new Promise<string>((resolve, reject) => {
          less.render(lessData || '', lessOpts, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result.css.toString());
            }
          });
        })
    );
};

/**
 * filename - absolute path to file
 * root - root folder of project (where ng-package.json is located)
 */
const renderStylus = ({ filename, root, paths }): Promise<string> => {
  return fs
    .readFile(filename)
    .then(buffer => stripBom(buffer.toString()))
    .then(
      (stylusData: string) =>
        new Promise<string>((resolve, reject) => {
          stylus(stylusData)
            // add paths for resolve
            .set('paths', [root, '.', ...paths, 'node_modules'])
            // add support for resolving plugins from node_modules
            .set('filename', filename)
            // turn on url resolver in stylus, same as flag --resolve-url
            .set('resolve url', true)
            .define('url', stylus.resolver())
            .render((err, css) => {
              if (err) {
                reject(err);
              } else {
                resolve(css);
              }
            });
        })
    );
};
