import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { HttpBackend, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {

  dishId:any;
  hotels:any[] = [];
  categories:any[] = [];
  isDishImageUploadModalOpen:boolean = false;
  form:FormGroup;
  constructor(private auth: AuthService,
              private router: Router,
              private toastController: ToastController,
              private fb: FormBuilder,
              private loadingController: LoadingController
  ) {
    this.form = this.fb.group({
      hotelId:[,[Validators.required]],
      categoryId:[,[Validators.required]],
      name:[,[Validators.required]],
      dishType:[,[Validators.required]],
      partnerPrice:[,[Validators.required]],
      spicLevel:[,[Validators.required]],
      stock:[,[Validators.required]],
      timeToPrepare:[30]
      
    })
   }

  ngOnInit() {
  }


  ionViewDidEnter(){
    this.loadCategory();
    this.getAllHotels();
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
    formdata.append("dishId", this.dishId);
    this.auth.uploadDishImage(formdata)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.setOpen(false);
        this.presentToast("Dish Addedd Successfully", 2000, 'success','bottom');
       setTimeout(() =>{
        this.router.navigate(['tabs','tabs','tab1']);
       },2000)
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
      
        this.presentToast("Image Upload Failed", 2000, 'danger','bottom')

      }
    })

  }

  setOpen(isOpen: boolean) {
    this.isDishImageUploadModalOpen = isOpen;
  }

  async onSubmit(){
    if(this.form.valid){
      
      console.log(this.form.value);
      this.auth.addProduct(this.form.value)
      .subscribe({
        next:(value:any) =>{
          console.log(value);
          this.dishId = value['data']['_id'];
          this.setOpen(true);
        },
        error:(error:HttpErrorResponse) =>{
          console.log(error.error);
          this.setOpen(false);
        }
      })
    }
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
