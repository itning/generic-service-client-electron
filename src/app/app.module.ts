import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NZ_I18N, zh_CN} from 'ng-zorro-antd/i18n';
import {registerLocaleData} from '@angular/common';
import zh from '@angular/common/locales/zh';
import {SharedModule} from './module/shared/shared.module';
import {IndexModule} from './module/index/index.module';
import {GenericModule} from './module/generic/generic.module';
import {httpInterceptorProviders} from './http';
import {ThemeService} from './theme.service';

registerLocaleData(zh);

export const AppInitializerProvider = {
  provide: APP_INITIALIZER,
  useFactory: (themeService: ThemeService) => () => {
    return themeService.loadTheme();
  },
  deps: [ThemeService],
  multi: true,
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    GenericModule,
    IndexModule,
    SharedModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule
  ],
  providers: [AppInitializerProvider, {provide: NZ_I18N, useValue: zh_CN}, httpInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule {
}
