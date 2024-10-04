import { Component, OnInit } from '@angular/core';
import { ActionSheetController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {

  status:any = 0;
  orders:any[] = [];
  constructor(private loadingController: LoadingController,
              private auth:AuthService,
              private actionSheetController: ActionSheetController

  ) { }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.getAllOrders();
  }
  segmentChanged(ev:any){
    console.log(ev.detail.value);
    this.status = ev.detail.value;
    this.getAllOrders();
  }

  async presentActionSheet(orderId:any) {
   if(this.status == 0){
    const actionSheet = await this.actionSheetController.create({
      header: 'Albums',
      buttons: [{
        text: 'Accept',
        role: '',
        icon: 'checkmark',
        handler: () => {
          console.log('Delete clicked');
          this.acceptOrder(orderId);
        }
      }, {
        text: 'Reject',
        icon: 'trash',
        handler: () => {
          console.log('Share clicked');
          this.rejectOrder(orderId);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
  
    await actionSheet.present();
   }
   else  if(this.status == 4){
    const actionSheet = await this.actionSheetController.create({
      header: 'Albums',
      buttons: [{
        text: 'Handed over to Delivery Boy',
        role: '',
        icon: 'checkmark',
        handler: () => {
          console.log('Delete clicked');
          this.handedToDeliveryBoy(orderId,6);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
  
    await actionSheet.present();
   }
  }

  handedToDeliveryBoy(orderId:any, status:any){
    this.auth.updateOrderStatus(orderId, status)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.getAllOrders();
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  getAllOrders(){
    this.auth.getAllOrders(this.status)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.orders = value['data']['content'];
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  acceptOrder(orderId:any){
    this.auth.AcceptRejectOrder(orderId, 4)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.getAllOrders();
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }


  rejectOrder(orderId:any){
    this.auth.AcceptRejectOrder(orderId, 5)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.getAllOrders();
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }
}
