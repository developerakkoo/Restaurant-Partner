import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  restaurantName: string = '';
  weeklyRevenue: any = 0;
  monthlyRevenue: any = 0;
  monthlyOrders: any = 4;
  todaysOrders: any = 0;
  todaysRevenue: any = 0;
  totalOrders: any = 0;
  totalRevenue: any = 0;

  constructor(
    private router: Router,
    private socket: Socket,
    private auth: AuthService,
    private data: DataService,
    private loadingController: LoadingController
  ) {}

  ionViewDidEnter() {
    this.auth.shopData.subscribe((res: any) => {
      if (res) {
        console.log(res);

        this.restaurantName = res['name'];
      }
    });
    this.getAnalyticsData();
  }

  getAnalyticsData() {
    this.auth.getPartnerDashboard().subscribe({
      next: async (value: any) => {
        console.log(value);
        let data = value['data'];
        this.monthlyRevenue = value['data']['monthlyRevenue'];

        this.todaysOrders = data['todaysOrders'];

        this.todaysRevenue = data['todaysRevenue'];

        this.totalOrders = data['totalOrders'];

        this.totalRevenue = data['totalRevenue'];

        this.weeklyRevenue = data['weeklyRevenue'];
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }

  hotelOnlineToggleEvent(ev: any) {
    console.log(ev.detail.checked);
  }

  openPage(pageName: string) {
    this.router.navigate([pageName]);
  }
}
