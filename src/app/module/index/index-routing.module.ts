import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IndexComponent} from './component/index/index.component';
import {GenericComponent} from '../generic/component/generic/generic.component';

const routes: Routes = [
  {
    path: '',
    component: IndexComponent,
    children: [
      {path: '', redirectTo: 'generic', pathMatch: 'full'},
      {path: 'generic', component: GenericComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndexRoutingModule {
}
