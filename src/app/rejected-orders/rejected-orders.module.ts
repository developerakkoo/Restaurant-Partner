import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RejectedOrdersPageRoutingModule } from './rejected-orders-routing.module';

import { RejectedOrdersPage } from './rejected-orders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RejectedOrdersPageRoutingModule
  ],
  declarations: [RejectedOrdersPage]
})
export class RejectedOrdersPageModule {}
