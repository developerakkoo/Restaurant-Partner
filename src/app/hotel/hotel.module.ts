import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HotelPageRoutingModule } from './hotel-routing.module';

import { HotelPage } from './hotel.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    HotelPageRoutingModule
  ],
  declarations: [HotelPage]
})
export class HotelPageModule {}
