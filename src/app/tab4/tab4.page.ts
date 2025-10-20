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
  status: any = 0; // Default to 0 (Received)
  allOrders: any[] = []; // Store all orders
  orders: any[] = []; // Filtered orders to display
  constructor(
    private loadingController: LoadingController,
    private auth: AuthService,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.getAllOrders();
  }

  segmentChanged(ev: any) {
    console.log('Segment changed to:', ev.detail.value);
    this.status = parseInt(ev.detail.value);
    this.filterOrders();
  }

  handleRefresh(event: any) {
    console.log('Refreshing orders data...');

    // Refresh all orders data
    this.getAllOrders();

    // Complete the refresh after a short delay to show the loading state
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  // Filter orders based on current segment
  filterOrders() {
    console.log('Filtering orders for status:', this.status);

    switch (this.status) {
      case 0: // Received - Pending orders
        this.orders = this.allOrders.filter((order) => order.status === 0);
        break;
      case 3: // Arriving - Picked-up orders
        this.orders = this.allOrders.filter((order) => order.status === 3);
        break;
      case 4: // In Process - Orders being processed
        this.orders = this.allOrders.filter((order) => order.status === 4);
        break;
      case 7: // Completed orders
        this.orders = this.allOrders.filter((order) => order.status === 7);
        break;
      default:
        this.orders = this.allOrders;
    }

    console.log('Filtered orders count:', this.orders.length);
  }

  async presentActionSheet(orderId: any) {
    if (this.status == 0) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Action',
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
        header: 'Action',
        buttons: [
          {
            text: 'Handed over to Delivery Boy',
            role: '',
            icon: 'checkmark',
            handler: () => {
              console.log('Delete clicked');
              this.handedToDeliveryBoy(orderId, 5);
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
        this.getAllOrders(); // Refresh all orders and re-filter
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }

  // Fetch all orders without status filter
  getAllOrders() {
    // Use status -1 or null to get all orders, or modify your API call accordingly
    this.auth.getAllOrders(-1).subscribe({
      next: async (value: any) => {
        console.log('All orders received:', value);
        this.allOrders = value['data']['content'];
        this.filterOrders(); // Apply current filter
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
        // If API doesn't support getting all orders, try with status 0
        this.auth.getAllOrders(0).subscribe({
          next: async (fallbackValue: any) => {
            console.log('Fallback orders received:', fallbackValue);
            this.allOrders = fallbackValue['data']['content'];
            this.filterOrders();
          },
          error: async (fallbackError: HttpErrorResponse) => {
            console.log('Fallback error:', fallbackError.error);
          },
        });
      },
    });
  }

  orderChangeStatus(orderId: any, status: any) {
    this.auth.AcceptRejectOrder(orderId, status).subscribe({
      next: async (value: any) => {
        console.log(value);
        this.getAllOrders(); // Refresh all orders and re-filter
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
        this.getAllOrders(); // Refresh all orders and re-filter
      },
      error: async (error: HttpErrorResponse) => {
        console.log(error.error);
      },
    });
  }
}
