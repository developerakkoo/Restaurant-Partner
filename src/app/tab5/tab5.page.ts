import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {

  constructor(private auth: AuthService,
              private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.getPartnerById();
  }
  getPartnerById(){
    this.auth.getPartnerById()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  logout(){
    
  }
}
