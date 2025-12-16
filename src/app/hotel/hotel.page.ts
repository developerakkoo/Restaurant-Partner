import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, Platform } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';

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
  currentLocation: { lat: number; lng: number } | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private auth:AuthService,
    private data: DataService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private platform: Platform
  ) { 
    this.form = this.formBuilder.group({
      hotelName:[,[Validators.required]],
      address:[,[Validators.required]],
      categoryId:[[],[Validators.required]]
    })
  }
  async ngOnInit() {
    // Ensure AuthService is initialized
    await this.auth.init();

    // Check if user is authenticated before allowing access
    if (!this.auth.isAuthenticated()) {
      this.presentToast("Please login first", 2000, 'danger', 'bottom');
      this.router.navigate([''], { replaceUrl: true });
      return;
    }

    // Check if userId exists in AuthService
    const userId = this.auth.userId.value;
    if (!userId) {
      this.presentToast("Please login first", 2000, 'danger', 'bottom');
      this.router.navigate([''], { replaceUrl: true });
      return;
    }

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


  async uploadImage(ev:any){
    let file = ev.target.files[0];
    
    if (!file) {
      return;
    }
    
    console.log('Uploading image:', file);
    let loading = await this.loadingController.create({
      message: "Uploading image...",
      animated: true,
    });
    await loading.present();
    
    let formdata = new FormData();
    formdata.append("document", file, file.name);
    formdata.append("hotelId", this.hotelId);
    
    this.auth.uploadHotelImage(formdata)
    .subscribe({
      next: async (value: any) => {
        console.log('Image upload response:', value);
        await loading.dismiss();
        this.isHotelImageUploadModalOpen = false;
        
        // Update hotel data in storage
        if (value && value['data']) {
          await this.data.set("hotelData", JSON.stringify(value['data']));
        }
        
        this.presentToast("Hotel Image Uploaded Successfully", 2000, 'success', 'bottom');
        setTimeout(() => {
          this.router.navigate(['tabs', 'tabs', 'tab1']);
        }, 2000);
      },
      error: async (error: HttpErrorResponse) => {
        console.log('Image upload error:', error);
        await loading.dismiss();
        this.isHotelImageUploadModalOpen = true;
        const errorMessage = error.error?.message || error.error?.error || 'Image upload failed';
        this.presentToast(errorMessage, 2000, 'danger', 'bottom');
      }
    });
  }

  setOpen(isOpen: boolean) {
    this.isHotelImageUploadModalOpen = isOpen;
    // If modal is closed and hotel is registered, navigate to home
    if (!isOpen && this.hotelId) {
      setTimeout(() => {
        this.router.navigate(['tabs', 'tabs', 'tab1']);
      }, 500);
    }
  }

  /**
   * Check permissions and get current location
   */
  async checkPermissionsAndGetCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      // Check if running on a native platform
      if (!this.platform.is('capacitor')) {
        // For web platform, use browser geolocation
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            this.presentToast('Geolocation is not supported by your browser', 2000, 'warning', 'bottom');
            resolve(null);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (error) => {
              console.error('Geolocation error:', error);
              this.presentToast('Unable to get your location. Hotel will be registered without coordinates.', 2000, 'warning', 'bottom');
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          );
        });
      }

      // For native platforms, use Capacitor Geolocation
      let permission = await Geolocation.checkPermissions();
      console.log('Location permission status:', permission.location);

      if (permission?.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        console.log('Location permission request status:', requestStatus.location);

        if (requestStatus?.location !== 'granted') {
          this.presentToast('Location permission denied. Hotel will be registered without coordinates.', 2000, 'warning', 'bottom');
          return null;
        }
      }

      // Check if permission is granted
      if (permission.location === 'granted' || (await Geolocation.checkPermissions()).location === 'granted') {
        const options: PositionOptions = {
          maximumAge: 300000, // 5 minutes
          timeout: 10000,
          enableHighAccuracy: false,
        };

        const position = await Geolocation.getCurrentPosition(options);
        console.log('Current position:', position.coords);

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      }

      return null;
    } catch (e: any) {
      console.error('Location error:', e);
      const errorMessage = e?.message || 'Unable to get location';
      
      if (errorMessage.includes('Location services are not enabled') || 
          errorMessage.includes('not enabled')) {
        this.presentToast('Please enable location services in your device settings', 3000, 'warning', 'bottom');
      } else {
        this.presentToast('Unable to get your location. Hotel will be registered without coordinates.', 2000, 'warning', 'bottom');
      }
      
      return null;
    }
  }

  async onSubmit(){
    if (!this.form.valid) {
      this.presentToast('Please fill all required fields', 2000, 'warning', 'bottom');
      return;
    }

    // Check authentication before proceeding
    if (!this.auth.isAuthenticated()) {
      this.presentToast("Please login first", 2000, 'danger', 'bottom');
      this.router.navigate([''], { replaceUrl: true });
      return;
    }

    // Check if userId exists in AuthService
    const userId = this.auth.userId.value;
    if (!userId) {
      this.presentToast("Please login first", 2000, 'danger', 'bottom');
      this.router.navigate([''], { replaceUrl: true });
      return;
    }

    let loading = await this.loadingController.create({
      message:"Getting your location...",
      animated:true,
    });
    await loading.present();

    // Get current location with permission checks
    this.currentLocation = await this.checkPermissionsAndGetCurrentLocation();

    // Update loading message
    loading.message = "Registering hotel...";
    
    console.log('Hotel registration data:', this.form.value);
    console.log('Location coordinates:', this.currentLocation);

    // Register hotel with location if available
    this.auth.hotelRegister(
      this.form.value.hotelName,
      this.form.value.address,
      this.form.value.categoryId,
      this.currentLocation?.lat,
      this.currentLocation?.lng
    )
    .subscribe({
        next:async(value:any) =>{
          console.log('Hotel Registration Response:', value);
          await loading.dismiss();
          
          if (value && value['data']) {
            const hotelData = value['data'];
            this.hotelId = hotelData._id;
            
            // Store hotel data in storage
            await this.data.set("hotelCount", "1");
            await this.data.set("hotelId", hotelData._id);
            await this.data.set("hotelData", JSON.stringify(hotelData));
            
            // Update AuthService
            this.auth.shopId.next(hotelData._id);
            
            this.presentToast("Hotel Registered Successfully", 2000, 'success', 'bottom');
            
            // Show image upload modal
            this.isHotelImageUploadModalOpen = true;
            
            // After image upload (or skip), navigate to home
            // For now, navigate after a delay if user doesn't upload image
            // You can modify this to navigate after image upload is complete
          } else {
            this.presentToast("Hotel registration failed", 2000, 'danger', 'bottom');
          }
        },
        error:async(error:HttpErrorResponse) =>{
          console.log(error.error);
          await loading.dismiss();
          this.isHotelImageUploadModalOpen = false;
          const errorMessage = error.error?.message || error.error?.error || 'Hotel registration failed';
          this.presentToast(errorMessage, 2000, 'danger', 'bottom');
        }
      });
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
