import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { UploadPage } from './upload/upload.page';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  form:FormGroup;
  constructor(private auth:AuthService,
              private loadingController: LoadingController,
              private toastController: ToastController,
              private fb: FormBuilder,
              private router: Router,
              private storage: DataService,
              private modalController: ModalController
  ) { 
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      shopeName: ['', [Validators.required]],
      isAcceptExpressService: [true,],
      expressServiceCharges: [200],
      address: this.fb.group({
        addressLine1: ['', [Validators.required]],
        addressLine2: ['', [Validators.required]],
        addressLine3: [''],
        city: ['', [Validators.required]],
      }),
      lat: [18.594842592861156,],
      lng: [73.72846080324209,],
      category: this.fb.array([]),
      shopTimeTable: this.fb.array([]),
    })

     // Initialize with default categories and shop times if needed
     this.setInitialCategories(['66a7496d1f27b4f5fb506c1d', '66a749fe1f27b4f5fb506c23']);
     this.setInitialShopTimeTable([
       { day: 'Monday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       { day: 'Tuesday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       { day: 'Wednesday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       { day: 'Thursday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       { day: 'Friday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       { day: 'Saturday', openingTime: '09:00 AM', closingTime: '09:00 PM' },
       // Add the rest of the days as needed
     ]);
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


  async presentModalUploadDocuments(userId:any) {
    const modal = await this.modalController.create({
    component: UploadPage,
    componentProps: { userId: userId }
    });
  
    await modal.present();
  
    const data = await modal.onDidDismiss();
    console.log(data)
  
  }
  async register(){
    let loading = await this.loadingController.create({
      message:"Logging In...",
      animated:true,
    
    })
    // await loading.present();
    if(this.form.valid){
      console.log(this.form.value);
      await this.storage.set("data", this.form.value);
      this.auth.register(this.form.value)
      .subscribe({
        next:async(value:any) =>{
          console.log(value);
          await loading.dismiss();
          this.presentToast("Registered Successfully.",2000, 'success','bottom');
          this.presentModalUploadDocuments(value['data']['partnerId']);
       

          this.router.navigate(['']);
        },
        error:async(error:HttpErrorResponse) =>{
          console.log(error.error);
          await loading.dismiss();
          this.presentToast(error.error.message,2000, 'danger','bottom');

          
        }
      })
    }
  }


  next(){

  }
  goBack(){

  }

  get category(): FormArray {
    return this.form.get('category') as FormArray;
  }

  get shopTimeTable(): FormArray {
    return this.form.get('shopTimeTable') as FormArray;
  }

  setInitialCategories(categories: string[]) {
    categories.forEach(categoryId => {
      this.category.push(this.fb.control(categoryId, Validators.required));
    });
  }

  addCategory() {
    this.category.push(this.fb.control('', Validators.required));
  }

  removeCategory(index: number) {
    this.category.removeAt(index);
  }

  setInitialShopTimeTable(shopTimeTable: any[]) {
    shopTimeTable.forEach(timeTable => {
      this.shopTimeTable.push(this.fb.group({
        day: [timeTable.day, Validators.required],
        openingTime: [timeTable.openingTime, Validators.required],
        closingTime: [timeTable.closingTime, Validators.required],
      }));
    });
  }

  addShopTimeTable() {
    this.shopTimeTable.push(this.fb.group({
      day: ['', Validators.required],
      openingTime: ['', Validators.required],
      closingTime: ['', Validators.required],
    }));
  }

  removeShopTimeTable(index: number) {
    this.shopTimeTable.removeAt(index);
  }
}
