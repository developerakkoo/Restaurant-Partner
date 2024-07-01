import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RejectedOrdersPage } from './rejected-orders.page';

const routes: Routes = [
  {
    path: '',
    component: RejectedOrdersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RejectedOrdersPageRoutingModule {}
