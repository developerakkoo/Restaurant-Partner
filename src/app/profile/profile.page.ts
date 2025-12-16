import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  userForm!: FormGroup;
  hotelForm!: FormGroup;
  categories: any[] = [];
  selectedCategories: string[] = [];
  hotelId: string = '';
  hotelImage: string = '';
  hotelImageFile: File | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
    private data: DataService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize form groups
   */
  initializeForms() {
    // User profile form
    this.userForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    });

    // Hotel form
    this.hotelForm = this.formBuilder.group({
      hotelName: ['', [Validators.required]],
      address: ['', [Validators.required]],
      categoryId: [[], [Validators.required]],
    });
  }

  /**
   * Load categories for hotel
   */
  loadCategories() {
    const categorySub = this.auth.getAllCategory().subscribe({
      next: (value: any) => {
        if (value?.data?.content) {
          this.categories = value.data.content;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading categories:', error);
      },
    });
    this.subscriptions.add(categorySub);
  }

  async ionViewDidEnter() {
    // First load from BehaviorSubjects (fastest)
    const currentUserData = this.auth.userData.value;
    if (currentUserData) {
      console.log('Loading userData from BehaviorSubject in profile:', currentUserData);
      this.userForm.patchValue({
        email: currentUserData.email || '',
        name: currentUserData.name || '',
        phoneNumber: currentUserData.phoneNumber || '',
      });
      console.log('Patched userForm from BehaviorSubject');
    }
    
    const currentShopData = this.auth.shopData.value;
    if (currentShopData) {
      console.log('Loading shopData from BehaviorSubject in profile:', currentShopData);
      this.hotelId = currentShopData._id || '';
      this.hotelImage = currentShopData.image_url || '';
      
      const categoryIds = currentShopData?.category || [];
      this.selectedCategories = Array.isArray(categoryIds)
        ? categoryIds.map((cat: any) => (typeof cat === 'string' ? cat : cat._id))
        : [];

      this.hotelForm.patchValue({
        hotelName: currentShopData.hotelName || '',
        address: currentShopData.address || '',
        categoryId: this.selectedCategories,
      });
      console.log('Patched hotelForm from BehaviorSubject');
    }
    
    // Then load from storage (fallback)
    await this.loadDataFromStorage();
    
    // Finally refresh from API
    await this.getPartnerById();
  }

  /**
   * Load data from local storage first
   */
  async loadDataFromStorage() {
    try {
      // Load user data
      const userDataStr = await this.data.get('userData');
      if (userDataStr) {
        let userData = JSON.parse(userDataStr);
        console.log('Loaded userData from storage for profile:', userData);
        
        // Handle array case
        if (Array.isArray(userData) && userData.length > 0) {
          userData = userData[0];
          console.log('Extracted first element from userData array:', userData);
        }
        
        // Only patch if form is empty
        if (!this.userForm.value.name && !this.userForm.value.email) {
          if (userData && typeof userData === 'object') {
            this.userForm.patchValue({
              email: userData?.email || '',
              name: userData?.name || '',
              phoneNumber: userData?.phoneNumber || '',
            });
            console.log('Patched userForm from storage');
          }
        }
      }

      // Load hotel data
      const hotelDataStr = await this.data.get('hotelData');
      if (hotelDataStr) {
        const hotelData = JSON.parse(hotelDataStr);
        console.log('Loaded hotelData from storage for profile:', hotelData);
        
        // Only patch if form is empty
        if (!this.hotelId && !this.hotelForm.value.hotelName) {
          this.hotelId = hotelData?._id || '';
          this.hotelImage = hotelData?.image_url || '';
          
          const categoryIds = hotelData?.category || [];
          this.selectedCategories = Array.isArray(categoryIds)
            ? categoryIds.map((cat: any) => (typeof cat === 'string' ? cat : cat._id))
            : [];

          this.hotelForm.patchValue({
            hotelName: hotelData?.hotelName || '',
            address: hotelData?.address || '',
            categoryId: this.selectedCategories,
          });
          console.log('Patched hotelForm from storage');
        }
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }

  /**
   * Get partner data with hotel details
   */
  async getPartnerById() {
    const loading = await this.loadingController.create({
      message: 'Loading profile...',
      duration: 3000,
    });
    await loading.present();

    this.auth.getPartnerById(true).subscribe({
      next: async (value: any) => {
        console.log('Partner data response in profile:', value);
        await loading.dismiss();

        if (value?.data) {
          // Handle both array and object responses
          let partnerData = value.data;
          if (Array.isArray(partnerData) && partnerData.length > 0) {
            partnerData = partnerData[0];
            console.log('Extracted first element from array:', partnerData);
          }
          
          console.log('Partner data extracted in profile:', partnerData);
          console.log('Partner name:', partnerData?.name, 'email:', partnerData?.email, 'phoneNumber:', partnerData?.phoneNumber);

          // Update user form - always patch all fields
          if (partnerData && typeof partnerData === 'object') {
            this.userForm.patchValue({
              email: partnerData.email || '',
              name: partnerData.name || '',
              phoneNumber: partnerData.phoneNumber || '',
            });
            console.log('Patching userForm with:', {
              email: partnerData.email || '',
              name: partnerData.name || '',
              phoneNumber: partnerData.phoneNumber || '',
            });

            // Update storage
            await this.data.set('userData', JSON.stringify(partnerData));
            this.auth.userData.next(partnerData);
            console.log('Updated userData in profile page');

            // Update hotel form if hotels exist
            if (partnerData.hotels && Array.isArray(partnerData.hotels) && partnerData.hotels.length > 0) {
              const hotelData = partnerData.hotels[0];
              this.hotelId = hotelData._id || '';
              this.hotelImage = hotelData?.image_url || '';

              // Extract category IDs
              const categoryIds = hotelData?.category || [];
              this.selectedCategories = Array.isArray(categoryIds)
                ? categoryIds.map((cat: any) => (typeof cat === 'string' ? cat : cat._id))
                : [];

              this.hotelForm.patchValue({
                hotelName: hotelData?.hotelName || '',
                address: hotelData?.address || '',
                categoryId: this.selectedCategories,
              });

              // Update storage
              await this.data.set('hotelData', JSON.stringify(hotelData));
              await this.data.set('hotelId', hotelData._id);
              this.auth.shopData.next(hotelData);
              this.auth.shopId.next(hotelData._id);
              console.log('Updated hotelData in profile page');
            } else {
              console.log('No hotels found in partner data');
            }
          } else {
            console.warn('Partner data is not a valid object:', partnerData);
          }
        } else {
          console.warn('No data in response for profile:', value);
        }
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error fetching partner data in profile:', error);
        console.error('Error details:', error.error);
        await loading.dismiss();
        await this.presentToast('Failed to load profile data', 2000, 'danger');
      },
    });
  }

  /**
   * Handle hotel image selection
   */
  onHotelImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.hotelImageFile = file;
      
      // Preview image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.hotelImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile() {
    if (!this.userForm.valid) {
      await this.presentToast('Please fill all user fields correctly', 2000, 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating profile...',
    });
    await loading.present();

    this.auth.updatePartnerById(this.userForm.value).subscribe({
      next: async (value: any) => {
        console.log('Profile updated:', value);
        await loading.dismiss();
        
        // Refresh data
        await this.getPartnerById();
        await this.presentToast('Profile updated successfully', 2000, 'success');
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error updating profile:', error);
        await loading.dismiss();
        
        const errorMessage = error.error?.message || error.error?.error || 'Failed to update profile';
        await this.presentToast(errorMessage, 3000, 'danger');
      },
    });
  }

  /**
   * Update hotel details
   */
  async updateHotel() {
    if (!this.hotelForm.valid) {
      await this.presentToast('Please fill all hotel fields correctly', 2000, 'warning');
      return;
    }

    if (!this.hotelId) {
      await this.presentToast('Hotel ID not found', 2000, 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating hotel...',
    });
    await loading.present();

    const updateData: any = {
      hotelId: this.hotelId,
      hotelName: this.hotelForm.value.hotelName,
      address: this.hotelForm.value.address,
      category: this.hotelForm.value.categoryId,
    };

    this.auth.updateHotel(updateData).subscribe({
      next: async (value: any) => {
        console.log('Hotel updated:', value);
        
        // Upload image if selected
        if (this.hotelImageFile) {
          await this.uploadHotelImage();
        }
        
        await loading.dismiss();
        
        // Refresh data
        await this.getPartnerById();
        await this.presentToast('Hotel updated successfully', 2000, 'success');
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error updating hotel:', error);
        await loading.dismiss();
        
        const errorMessage = error.error?.message || error.error?.error || 'Failed to update hotel';
        await this.presentToast(errorMessage, 3000, 'danger');
      },
    });
  }

  /**
   * Upload hotel image
   */
  async uploadHotelImage() {
    if (!this.hotelImageFile || !this.hotelId) {
      return;
    }

    const formData = new FormData();
    formData.append('document', this.hotelImageFile);
    formData.append('hotelId', this.hotelId);

    this.auth.uploadHotelImage(formData).subscribe({
      next: async (value: any) => {
        console.log('Hotel image uploaded:', value);
        if (value?.data) {
          await this.data.set('hotelData', JSON.stringify(value.data));
          this.auth.shopData.next(value.data);
        }
        await this.presentToast('Hotel image updated successfully', 2000, 'success');
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error uploading hotel image:', error);
        const errorMessage = error.error?.message || error.error?.error || 'Failed to upload image';
        await this.presentToast(errorMessage, 3000, 'danger');
      },
    });
  }

  /**
   * Present toast notification
   */
  private async presentToast(
    message: string,
    duration: number = 2000,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
