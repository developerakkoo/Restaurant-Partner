import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hotel',
  templateUrl: './hotel.page.html',
  styleUrls: ['./hotel.page.scss'],
})
export class HotelPage implements OnInit {

  form:FormGroup;
  isHotelImageUploadModalOpen:boolean = false;
  hotelId:any;
  categories:any[] = [];
  constructor(private formBuilder: FormBuilder,
    private auth:AuthService,
    private data: DataService,
    private router: Router,
              private loadingController: LoadingController,
              private toastController: ToastController
  ) { 
    this.form = this.formBuilder.group({
      hotelName:[,[Validators.required]],
      address:[,[Validators.required]],
      categoryId:[[],[Validators.required]]
    })
  }
  ngOnInit() {
    this.loadCategory();
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


  uploadImage(ev:any){
    let file = ev.target.files[0];
    
    console.log(file);
    let formdata = new FormData();
    formdata.append("document", file, file.name);
    formdata.append("hotelId", this.hotelId);
    this.auth.uploadHotelImage(formdata)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.isHotelImageUploadModalOpen = false;
        this.presentToast("Hotel Registered Successfully", 2000, 'success','bottom');
        setTimeout(() =>{
          this.router.navigate(['tabs','tabs','tab1']);
         },2000)
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
        this.isHotelImageUploadModalOpen = true;
        this.presentToast("Image Upload Failed", 2000, 'danger','bottom')

      }
    })

  }

  setOpen(isOpen: boolean) {
    this.isHotelImageUploadModalOpen = isOpen;
  }

  async onSubmit(){
    let loading = await this.loadingController.create({
      message:"Registering hotel...",
      animated:true,
    
    })
    await loading.present();
    if(this.form.valid){
      console.log(this.form.value);
      this.auth.hotelRegister(this.form.value.hotelName,this.form.value.address, this.form.value.categoryId)
      .subscribe({
        next:async(value:any) =>{
          console.log(value);
          await loading.dismiss();
          this.isHotelImageUploadModalOpen = true;
          this.hotelId = value['data']['_id'];
          await this.data.set("hotelCount", "1");
          await this.data.set("hotelId", value['data']['_id']);
        },
        error:async(error:HttpErrorResponse) =>{
          console.log(error.error);
          await loading.dismiss();
          this.isHotelImageUploadModalOpen = false;
          
        }
      })
    }
  }


  loadCategory(){
    this.auth.getAllCategory()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.categories = value['data']['content'];
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }



}
