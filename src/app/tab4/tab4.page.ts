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

//   {
//     "_id": "667fc160d29207d3dcae19ce",
//     "orderId": "28211D-666",
//     "userId": "6677c354290578ee9350b322",
//     "hotelId": "666a83ec1fd2c47f2807b46f",
//     "address": "6677ef03bd009610e721b2fa",
//     "promoCode": null,
//     "products": [
//         {
//             "dishId": "666a91e83dd909c513146247",
//             "quantity": 2,
//             "_id": "667fb9608571aa63f88334ed"
//         },
//         {
//             "dishId": "666a921a3dd909c51314624b",
//             "quantity": 2,
//             "_id": "667fb9658571aa63f88334f3"
//         }
//     ],
//     "priceDetails": {
//         "subtotal": 760,
//         "gstAmount": 136.8,
//         "deliveryCharges": 40,
//         "platformFee": 20,
//         "discount": 0,
//         "totalAmountToPay": 956.8
//     },
//     "paymentId": "order_O5aRa5wBsob47r",
//     "phone": "846465181",
//     "description": "Make it spicy!",
//     "compensationPaidToDeliveryBoy": false,
//     "compensationPaidToHotelPartner": false,
//     "orderStatus": 0,
//     "createdAt": "2024-06-29T08:10:08.901Z",
//     "updatedAt": "2024-06-29T08:10:08.901Z",
//     "__v": 0,
//     "user": {
//         "_id": "6677c354290578ee9350b322",
//         "name": "Akshay Jadhav",
//         "email": "developerakshayjadhav@gmail.com",
//         "phoneNumber": "9028851449",
//         "isOnline": false
//     },
//     "userAddress": {
//         "_id": "6677ef03bd009610e721b2fa",
//         "address": "204, Mote Mangal Karyalay Rd, Bhavani Peth, Shobhapur, Kasba Peth, Pune, Maharashtra 411011, India",
//         "selected": false
//     },
//     "productDetails": [
//         {
//             "_id": "666a91e83dd909c513146247",
//             "hotelId": "666a83ec1fd2c47f2807b46f",
//             "categoryId": "666a8cf4fd48c92ea8979d9c",
//             "name": "Dum-Biryani pune ",
//             "image_url": "https://api.dropeat.in/upload/1719219352855-415048994.jpg",
//             "local_imagePath": "upload/1719219352855-415048994.jpg",
//             "dishType": "non-veg",
//             "partnerPrice": 150,
//             "userPrice": 200,
//             "spicLevel": 1,
//             "stock": 1,
//             "status": 2,
//             "createdAt": "2024-06-13T06:30:00.507Z",
//             "updatedAt": "2024-07-01T05:37:25.615Z",
//             "__v": 0,
//             "categoryDetails": {
//                 "_id": "666a8cf4fd48c92ea8979d9c",
//                 "name": "Biryani",
//                 "image_url": "https://api.dropeat.in/upload/1718259495234-428355549.jpg"
//             }
//         },
//         {
//             "_id": "666a921a3dd909c51314624b",
//             "hotelId": "666a83ec1fd2c47f2807b46f",
//             "categoryId": "666a8cf4fd48c92ea8979d9c",
//             "name": "Tanduri Biryani ",
//             "image_url": "https://api.dropeat.in/upload/1719219182008-994098192.jpg",
//             "local_imagePath": "upload/1719219182008-994098192.jpg",
//             "dishType": "non-veg",
//             "partnerPrice": 150,
//             "userPrice": 180,
//             "spicLevel": 2,
//             "stock": 0,
//             "status": 2,
//             "createdAt": "2024-06-13T06:30:50.942Z",
//             "updatedAt": "2024-07-01T05:33:01.945Z",
//             "__v": 0,
//             "categoryDetails": {
//                 "_id": "666a8cf4fd48c92ea8979d9c",
//                 "name": "Biryani",
//                 "image_url": "https://api.dropeat.in/upload/1718259495234-428355549.jpg"
//             }
//         }
//     ]
// }

  ionViewDidEnter(){
    this.getAllOrders();
  }
  segmentChanged(ev:any){
    console.log(ev.detail.value);
    this.status = ev.detail.value;
    this.getAllOrders();
  }

  async presentActionSheet(orderId:any) {
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
