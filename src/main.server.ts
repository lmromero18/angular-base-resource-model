import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideServerRendering } from '@angular/ssr';
import { appConfig } from './app/app.config';

export default () => bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideServerRendering()
  ]
});