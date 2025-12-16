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

  hotelId: any;
  dishId: any;
  categories: any[] = [];
  isDishImageUploadModalOpen: boolean = false;
  form!: FormGroup;
  
  constructor(
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController,
    private data: DataService,
    private fb: FormBuilder,
    private loadingController: LoadingController
  ) {
    this.createForm();
  }

  async ngOnInit() {
    // Load hotel ID from storage or auth service
    const hotelData = await this.data.get('hotelData');
    if (hotelData) {
      const hotel = JSON.parse(hotelData);
      this.hotelId = hotel._id;
    } else if (this.auth.shopData.value) {
      this.hotelId = this.auth.shopData.value._id;
    }
    console.log('Hotel ID:', this.hotelId);
  }

  async createForm() {
    this.form = this.fb.group({
      hotelId: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
    });

    // Set hotelId if available
    if (this.hotelId) {
      this.form.patchValue({
        hotelId: this.hotelId
      });
    }
  }

  ionViewDidEnter(){
    this.loadCategory();
  }

  loadCategory() {
    this.auth.getAllCategory()
      .subscribe({
        next: async (value: any) => {
          console.log('Category response:', value);
          // Handle different response structures
          if (value?.data) {
            if (Array.isArray(value.data)) {
              this.categories = value.data;
            } else if (value.data.content && Array.isArray(value.data.content)) {
              this.categories = value.data.content;
            } else {
              this.categories = [];
            }
          } else if (Array.isArray(value)) {
            this.categories = value;
          } else {
            this.categories = [];
          }
          console.log('Categories loaded:', this.categories);
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Error loading categories:', error);
          this.categories = [];
        }
      });
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

  uploadImage(ev: any) {
    let file = ev.target.files[0];
    
    if (!file) {
      this.presentToast("Please select an image file", 2000, 'warning', 'bottom');
      return;
    }

    if (!this.dishId) {
      this.presentToast("Dish ID not found. Please add dish first.", 2000, 'danger', 'bottom');
      return;
    }

    console.log('Uploading image for dish:', this.dishId);
    let formData = new FormData();
    formData.append("document", file, file.name);
    formData.append("dishId", this.dishId);
    
    this.auth.uploadDishImage(formData)
      .subscribe({
        next: async (value: any) => {
          console.log('Image upload response:', value);
          this.setOpen(false);
          this.presentToast("Dish added successfully!", 2000, 'success', 'bottom');
          setTimeout(() => {
            this.router.navigate(['products', 'view']);
          }, 2000);
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Image upload error:', error);
          this.presentToast("Image upload failed. Please try again.", 2000, 'danger', 'bottom');
        }
      });
  }

  setOpen(isOpen: boolean) {
    this.isDishImageUploadModalOpen = isOpen;
  }

  async onSubmit() {
    if (this.form.valid) {
      const loading = await this.loadingController.create({
        message: 'Adding dish...',
        duration: 5000,
      });
      await loading.present();

      const formValue = this.form.value;
      const dishData = {
        hotelId: formValue.hotelId,
        name: formValue.name,
        description: formValue.description,
        price: parseFloat(formValue.price),
        categoryId: formValue.categoryId,
      };

      console.log('Submitting dish data:', dishData);
      
      this.auth.addDish(dishData)
        .subscribe({
          next: async (value: any) => {
            console.log('Dish added response:', value);
            await loading.dismiss();
            
            // Get dish ID from response
            if (value?.data?._id) {
              this.dishId = value.data._id;
              this.setOpen(true);
            } else {
              this.presentToast("Dish added but image upload unavailable", 2000, 'warning', 'bottom');
              setTimeout(() => {
                this.router.navigate(['products', 'view']);
              }, 2000);
            }
          },
          error: async (error: HttpErrorResponse) => {
            console.error('Error adding dish:', error);
            await loading.dismiss();
            const errorMessage = error.error?.message || 'Failed to add dish. Please try again.';
            this.presentToast(errorMessage, 3000, 'danger', 'bottom');
            this.setOpen(false);
          }
        });
    } else {
      this.presentToast("Please fill all required fields", 2000, 'warning', 'bottom');
    }
  }


 
}
