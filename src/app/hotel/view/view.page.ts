import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnInit {

  hotels:any[] = [];
  constructor(private auth:AuthService,
    private router: Router,
              private loadingController: LoadingController
  ) { }



  ngOnInit() {
  }
  ionViewDidEnter(){
    this.getAllHotels();
  }


  openPage(pageNAme:string){
    this.router.navigate([pageNAme]);
  }

 async toggleStatusEvent(ev:any, hotelId:any){
  let status = 0;
  if(ev.detail.checked == true){
    status = 1;
  }
  else if(ev.detail.checked == false){
    status = 0;
  }

    let loading = await this.loadingController.create({
      message:"loading..."
    })

    await loading.present();
    this.auth.setHotelLiveStatus(status, hotelId)
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
  async getAllHotels(){
    let loading = await this.loadingController.create({
      message:"loading..."
    })

    await loading.present();

    this.auth.getAllHotelsPartner()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.hotels = value['data'];
        await loading.dismiss();
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
        await loading.dismiss();

        
      }
    })
  }
}
