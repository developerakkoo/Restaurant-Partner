import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  id:any;

  shopId:any;
  serviceId:any;
  categories:any[] = [];
  isDishImageUploadModalOpen:boolean = false;
  form:FormGroup;
  showPerPiecePrice = false;
  showPerKgPrice = false;
  constructor(
    private auth: AuthService,
    private route:ActivatedRoute,
              private router: Router,
              private toastController: ToastController,
              private data:DataService,
              private fb: FormBuilder,
              private loadingController: LoadingController
  ) {
    this.id = this.route.snapshot.paramMap.get("id");
    console.log(this.id);

    this.form = this.fb.group({
      shopeId:[this.id],
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
    this.loadCategory();
    this.getServiceById();
    
  }
  
  ngOnInit() {
    


    
  }
  ionViewDidEnter(){
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

  async getServiceById(){
    this.auth.getServiceById(this.id)
    .subscribe({
      next:async(value:any) =>{
        console.log(value['data']);
        const responseData = {
          shopeId: this.id,
          categoryId: value['data']['categoryId'],
          type: value['data']['type'],
          name: value['data']['name'],
          description: value['data']['description'],
          quantityAcceptedIn: value['data']['quantityAcceptedIn'],
          perPeacePrice: value['data']['perPeacePrice'],
          perKgPrice: value['data']['perKgPrice']
        };
        
        // Patch the form with the response data
        this.form.patchValue({
          shopeId: responseData.shopeId,
          categoryId: responseData.categoryId,
          type: responseData.type,
          name: responseData.name,
          description: responseData.description,
          quantityAcceptedIn: responseData.quantityAcceptedIn,
          perPeacePrice: responseData.perPeacePrice,
          perKgPrice: responseData.perKgPrice
        });
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
        
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
    formdata.append("serviceId", this.id);
    this.auth.uploadServiceImage(formdata)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.setOpen(false);
        this.presentToast("Service Edited Successfully", 2000, 'success','bottom');
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
      this.auth.editService(this.form.value, this.id)
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
