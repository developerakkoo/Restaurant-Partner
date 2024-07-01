import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  products:any[] = [];
  constructor(private auth:AuthService,
              private loadingController: LoadingController
  ) {}


  getAllProducts(){
    this.auth.getAllHotelProducts()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  edit(){
    
  }
}
