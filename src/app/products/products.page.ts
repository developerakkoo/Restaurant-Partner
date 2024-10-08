import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { HttpBackend, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {

  shopId:any;
  serviceId:any;
  categories:any[] = [];
  isDishImageUploadModalOpen:boolean = false;
  form!:FormGroup;
  showPerPiecePrice = false;
  showPerKgPrice = false;
  constructor(private auth: AuthService,
              private router: Router,
              private toastController: ToastController,
              private data:DataService,
              private fb: FormBuilder,
              private loadingController: LoadingController
  ) {
   this.createForm();
   }

 async ngOnInit() {
 
  
  }

  async createForm(){
    this.form = this.fb.group({
      shopeId:[''],
     categoryId:['',[Validators.required]],
     type:['',[Validators.required]],
     name:['',[Validators.required]],
     description:['',[Validators.required]],
     quantityAcceptedIn:['',[Validators.required]],
     perPeacePrice:['',[]],
     perKgPrice:['',[]],
     
   })
   // Initialize visibility of fields based on quantityAcceptedIn's current value
   this.onQuantityChange({ detail: { value: this.form.get('quantityAcceptedIn')?.value || "" } });
      this.shopId = await this.data.get("shopId");
    console.log("shop Id");
    console.log(this.shopId);
      // Set the shopId in the form control
      this.form.patchValue({
        shopeId: this.shopId
      });
  }

  ionViewDidEnter(){
    this.loadCategory();
  }

  loadCategory(){
    this.auth.getAllCategory()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.categories = value['data'];
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
    formdata.append("file", file, file.name);
    formdata.append("serviceId", this.serviceId);
    this.auth.uploadServiceImage(formdata)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.setOpen(false);
        this.presentToast("Service Addedd Successfully", 2000, 'success','bottom');
       setTimeout(() =>{
        this.router.navigate(['products','view']);
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
  // Function to handle changes in quantityAcceptedIn
  onQuantityChange(event: any) {
    const value = event.detail.value;

    // Make sure form controls are initialized before updating validators
    const perPieceControl = this.form.get('perPeacePrice');
    const perKgControl = this.form.get('perKgPrice');

    if (!perPieceControl || !perKgControl) {
      console.error('Form controls for perPeacePrice or perKgPrice not found!');
      return;
    }

    // Update field visibility and validators based on the selected value
    if (value === '0') {
      this.showPerPiecePrice = true;
      this.showPerKgPrice = false;

      perPieceControl.setValidators([Validators.required]);
      perKgControl.clearValidators();
    } else if (value === '1') {
      this.showPerPiecePrice = false;
      this.showPerKgPrice = true;

      perPieceControl.clearValidators();
      perKgControl.setValidators([Validators.required]);
    } else if (value === '2') {
      this.showPerPiecePrice = true;
      this.showPerKgPrice = true;

      perPieceControl.setValidators([Validators.required]);
      perKgControl.setValidators([Validators.required]);
    }

    // Update the validity state of the controls
    perPieceControl.updateValueAndValidity();
    perKgControl.updateValueAndValidity();
  }
  async onSubmit(){
    if(this.form.valid){
      
      console.log(this.form.value);
      this.auth.addService(this.form.value)
      .subscribe({
        next:(value:any) =>{
          console.log(value);
          this.serviceId = value['data']['_id'];
          this.setOpen(true);
        },
        error:(error:HttpErrorResponse) =>{
          console.log(error.error);
          this.setOpen(false);
        }
      })
    }
  }


 
}
