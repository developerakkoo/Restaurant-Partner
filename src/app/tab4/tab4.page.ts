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
  status: any;
  orders: any[] = [];
  constructor(
    private loadingController: LoadingController,
    private auth: AuthService,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.getAllOrders(0);
  }
  segmentChanged(ev: any) {
    console.log(ev.detail.value);
    this.status = ev.detail.value;
    this.getAllOrders(this.status);
  }

  async presentActionSheet(orderId: any) {
    if (this.status == 0) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Albums',
        buttons: [
          {
            text: 'Accept',
            role: '',
            icon: 'checkmark',
            handler: () => {
              console.log('Accept ORder And Asssign 1');
              this.orderChangeStatus(orderId, 1);
            },
          },
          {
            text: 'Reject',
            icon: 'trash',
            handler: () => {
              console.log('Reject Order and Assign 8');
              this.orderChangeStatus(orderId, 8);
              
            },
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            },
          },
        ],
      });

      await actionSheet.present();
    } else if (this.status == 4) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Albums',
        buttons: [
          {
            text: 'Handed over to Delivery Boy',
            role: '',
            icon: 'checkmark',
            handler: () => {
              console.log('Delete clicked');
              this.handedToDeliveryBoy(orderId, 6);
            },
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            },
          },
        ],
      });

      await actionSheet.present();
    }
  }

  handedToDeliveryBoy(orderId: any, status: any) {
    this.auth.updateOrderStatus(orderId, status).subscribe({
      next: async (value: any) => {
        console.log(value);
        this.getAllOrders(0);
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }

  getAllOrders(status:any) {
    this.auth.getAllOrders(status).subscribe({
      next: async (value: any) => {
        console.log(value);
        this.orders = value['data']['content'];
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }

  orderChangeStatus(orderId: any, status: any) {
    this.auth.AcceptRejectOrder(orderId, status).subscribe({
      next: async (value: any) => {
        console.log(value);
        this.getAllOrders(0);
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }

  rejectOrder(orderId: any) {
    this.auth.AcceptRejectOrder(orderId, 8).subscribe({
      next: async (value: any) => {
        console.log(value);
        this.getAllOrders(0);
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }
}
