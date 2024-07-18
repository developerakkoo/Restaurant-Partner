import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {

  notifications:any[] = [];

  constructor(private auth:AuthService,
              private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.getAllNotifications();
  }
async getAllNotifications(){
  let loading = await this.loadingController.create({
    message:"loading..."
  })

  await loading.present();
  this.auth.getAllNotificationsPartner()
  .subscribe({
    next:async(value:any) =>{
      console.log(value);
      await loading.dismiss();
    },
    error:async(error:HttpErrorResponse) =>{
      console.log(error);
      await loading.dismiss();

      
    }
  })

}


}
