import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  form!:FormGroup;

  constructor(private router:Router,
              private formBuilder: FormBuilder,
              private toastController: ToastController,
              private auth:AuthService,
              private loadingController: LoadingController,
              private data: DataService
  ) {
    this.form = this.formBuilder.group({
      phoneNumber: ['', [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")]]  ,
      isAgreed:[,[Validators.requiredTrue]]
    })
   }

  ngOnInit() {
  }

  async presentToast(msg:string, duration:any, color:any, position:any) {
    const toast = await this.toastController.create({
      message: msg,
      duration: duration,
      color:color,
      position:position
    });
    toast.present();
  }

  async login(){
    let loading = await this.loadingController.create({
      message:"Logging In...",
      animated:true,
    
    })
    await loading.present();
    if(this.form.valid){
      console.log(this.form.value);
      this.auth.login({phoneNumber: this.form.value.phoneNumber})
      .subscribe({
        next:async(value:any) =>{
          console.log(value);
          await loading.dismiss();
          this.presentToast("Logged In Successfully.",2000, 'success','bottom');
          let userId = value['data']['userId'];
          let accessToken = value['data']['accessToken'];
          let refreshToken = value['data']['refreshToken'];
          let hotelCount = value['data']['hotelCount'];
          await this.data.set("userId", userId);
          await this.data.set("accessToken", accessToken);
          await this.data.set("refreshToken", refreshToken);
          await this.data.set("hotelCount", hotelCount);
          if(hotelCount > 0){
            this.router.navigate(['tabs','tabs','tab1']);

          }else{
            this.router.navigate(['hotel']);
          }
        },
        error:async(error:HttpErrorResponse) =>{
          console.log(error.error);
          await loading.dismiss();
          this.presentToast(error.error.message,2000, 'danger','bottom');

          
        }
      })
    }
  }


}
