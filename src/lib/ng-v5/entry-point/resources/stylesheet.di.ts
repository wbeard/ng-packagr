import { InjectionToken, FactoryProvider } from 'injection-js';
import { Transform } from '../../../brocc/transform';
import { TransformProvider, provideTransform } from '../../../brocc/transform.di';
import { postCssFactory } from '../../../stylesheets/post-css';
import { stylesheetTransformFactory } from './stylesheet.transform';
import { RendererFactory } from '../../../stylesheets/stylesheets';

export const POST_CSS_TOKEN = new InjectionToken<RendererFactory>(`ng.v5.postCss`);

export function providePostCss(value: RendererFactory) {
  return {
    provide: POST_CSS_TOKEN,
    useValue: value
  };
}

export const POST_CSS_PROVIDER = providePostCss(postCssFactory);

export const STYLESHEET_TRANSFORM_TOKEN = new InjectionToken<Transform>(`ng.v5.stylesheetTransform`);

export const STYLESHEET_TRANSFORM: TransformProvider = provideTransform({
  provide: STYLESHEET_TRANSFORM_TOKEN,
  useFactory: stylesheetTransformFactory,
  deps: [POST_CSS_TOKEN]
});
