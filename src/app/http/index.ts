import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {ResponseErrorInterceptor} from './ResponseErrorInterceptor';
import {Provider} from '@angular/core';

export const httpInterceptorProviders: Provider[] = [
  {provide: HTTP_INTERCEPTORS, useClass: ResponseErrorInterceptor, multi: true},
];
