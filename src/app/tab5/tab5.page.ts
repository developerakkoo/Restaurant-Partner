import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {

  name:string = "";
  email:string = "";
  file!:File;

  constructor(private auth: AuthService,
    private data: DataService,
    private router: Router,
              private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  fileEvent(ev:any){
    console.log(ev.target.files[0]);
    this.file = ev.target.files[0];
    
  }
  ionViewDidEnter(){
    this.getPartnerById();
  }
  getPartnerById(){
    this.auth.getPartnerById()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.name = value['data'][0]['name'];
        this.email = value['data'][0]['email'];
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  async logout(){
    await this.data.clearAll();
    this.router.navigate([''])
  }
}
