import {NgModule} from '@angular/core';

import {IndexRoutingModule} from './index-routing.module';
import {SharedModule} from '../shared/shared.module';
import {IndexComponent} from './component/index/index.component';


@NgModule({
  declarations: [IndexComponent],
  imports: [
    SharedModule,
    IndexRoutingModule
  ]
})
export class IndexModule {
}
