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
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  restaurantName:string = "Akshay Laundry";
  weeklyRevenue:any;
  monthlyRevenue:any;
  monthlyOrders:any;
  todaysOrders:any;
  totalOrders:any;

  constructor(private router: Router,
    private socket: Socket,
    private auth:AuthService,
    private data: DataService,
              private loadingController: LoadingController,
  ) {
    
  }

  ionViewDidEnter(){
    // this.getAnalyticsData();
  }

 
  getAnalyticsData(){
    this.auth.getPartnerDashboard()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        let data = value['data'];
        // this.dishInStock = data['dishInStock'];
        // this.todaysOrders = data['todaysOrders'];
        // this.monthlyOrders = data['monthlyOrder'];
        // this.dishOutOfStock = data['dishOutOfStock'];
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  changeWorkingStatus(ev:any){
    console.log(ev);
    

  }


  openPage(pageName:string){
    this.router.navigate([pageName]);
  }



}
