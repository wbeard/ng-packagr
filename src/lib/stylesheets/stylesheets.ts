import { NgEntryPoint } from '../ng-package-format/entry-point';

export interface RendererFactory {
  (entryPoint: NgEntryPoint): Renderer;
}

export interface Renderer {
  (args: { filePath: string; cssString: string }): Promise<string>;
}
