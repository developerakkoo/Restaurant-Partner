import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  form!:FormGroup;
  constructor(private auth: AuthService,
              private loadingController: LoadingController,
              private formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group({
      email:[,[Validators.required, Validators.email]],
      name:[,[Validators.required]],
      phoneNumber:[,[Validators.required]]
    })
   }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.getPartnerById();
  }
  getPartnerById(){
    this.auth.getPartnerById()
    .subscribe({
      next:(value:any) =>{
        console.log(value);
        this.form.patchValue({email: value['data'][0]['email'], name: value['data'][0]['name'], phoneNumber:value['data'][0]['phoneNumber']});
      },
      error:(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  async onSubmit(){
    let loading = await this.loadingController.create({
      message:"Saving new changes..."

    })

    await loading.present();
    this.auth.updatePartnerById(this.form.value)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.getPartnerById();
        await loading.dismiss();
        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        await loading.dismiss();
        
      }
    })

  }
}
