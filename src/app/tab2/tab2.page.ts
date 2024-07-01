import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import * as moment from 'moment';
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  earnings:any[] = [];
  startDate:any = '';
  endDate:any = '';
  constructor(private auth:AuthService,
              private loadingController: LoadingController,

  ) {
    console.log(this.startDate);
    console.log(this.endDate);
    
    
  }

  ionViewDidEnter(){
this.getEarningsData();
  }

  setStartDate(ev:any){
    console.log(ev);
    this.startDate = ev.detail.value;
    this.getEarningsData();
  }

  setEndDate(ev:any){
    console.log(ev);
    this.endDate = ev.detail.value;
    this.getEarningsData();
    
  }
  async getEarningsData(){
    let loading = await this.loadingController.create({
      message:'loading...',
      duration:5000
    });
    await loading.present();

    this.auth.getPartnerEarnings(this.startDate,this.endDate)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.earnings = value['data']['dailyEarnings'];
        await loading.dismiss();
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        await loading.dismiss();
        
      }
    })
  }
}
