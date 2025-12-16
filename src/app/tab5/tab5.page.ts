import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit, OnDestroy {
  name: string = '';
  email: string = '';
  hotelName: string = '';
  file!: File;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private data: DataService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // First, check BehaviorSubjects for immediate data (fastest)
    const currentUserData = this.auth.userData.value;
    if (currentUserData) {
      this.name = currentUserData?.name || '';
      this.email = currentUserData?.email || '';
      console.log('Loaded from BehaviorSubject - name:', this.name, 'email:', this.email);
    }
    
    const currentShopData = this.auth.shopData.value;
    if (currentShopData) {
      this.hotelName = currentShopData?.hotelName || '';
      console.log('Loaded hotel from BehaviorSubject:', this.hotelName);
    }
    
    // Then load from storage (fallback)
    await this.loadDataFromStorage();
    
    // Subscribe to userData and shopData changes for real-time updates
    const userDataSub = this.auth.userData.subscribe((userData: any) => {
      if (userData) {
        this.name = userData?.name || '';
        this.email = userData?.email || '';
        console.log('Updated from subscription - name:', this.name, 'email:', this.email);
      }
    });
    
    const shopDataSub = this.auth.shopData.subscribe((shopData: any) => {
      if (shopData) {
        this.hotelName = shopData?.hotelName || '';
        console.log('Updated hotel from subscription:', this.hotelName);
      }
    });
    
    this.subscriptions.add(userDataSub);
    this.subscriptions.add(shopDataSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load data from local storage
   */
  async loadDataFromStorage() {
    try {
      // Load user data
      const userDataStr = await this.data.get('userData');
      if (userDataStr) {
        let userData = JSON.parse(userDataStr);
        console.log('Loaded userData from storage:', userData);
        
        // Handle array case
        if (Array.isArray(userData) && userData.length > 0) {
          userData = userData[0];
          console.log('Extracted first element from userData array:', userData);
        }
        
        if (userData && typeof userData === 'object') {
          this.name = userData?.name || '';
          this.email = userData?.email || '';
        }
      } else {
        console.log('No userData found in storage');
      }

      // Load hotel data
      const hotelDataStr = await this.data.get('hotelData');
      if (hotelDataStr) {
        const hotelData = JSON.parse(hotelDataStr);
        console.log('Loaded hotelData from storage:', hotelData);
        this.hotelName = hotelData?.hotelName || '';
      } else {
        console.log('No hotelData found in storage');
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }

  fileEvent(ev: any) {
    console.log(ev.target.files[0]);
    this.file = ev.target.files[0];
  }

  async ionViewDidEnter() {
    // Refresh data from API
    await this.getPartnerById();
  }

  async getPartnerById() {
    this.auth.getPartnerById(true).subscribe({
      next: async (value: any) => {
        console.log('Partner data response:', value);
        if (value?.data) {
          // Handle both array and object responses
          let partnerData = value.data;
          if (Array.isArray(partnerData) && partnerData.length > 0) {
            partnerData = partnerData[0];
            console.log('Extracted first element from array:', partnerData);
          }
          
          console.log('Partner data extracted:', partnerData);
          
          // Update user data - ensure we have name, email, phoneNumber
          if (partnerData && typeof partnerData === 'object') {
            this.name = partnerData.name || '';
            this.email = partnerData.email || '';
            
            console.log('Updated name:', this.name, 'email:', this.email);
            
            // Update hotel data if populated
            if (partnerData.hotels && Array.isArray(partnerData.hotels) && partnerData.hotels.length > 0) {
              const hotelData = partnerData.hotels[0];
              this.hotelName = hotelData?.hotelName || '';
              console.log('Updated hotelName:', this.hotelName);
              
              // Update storage
              await this.data.set('hotelData', JSON.stringify(hotelData));
              this.auth.shopData.next(hotelData);
            }
            
            // Update storage and BehaviorSubject with partner data
            await this.data.set('userData', JSON.stringify(partnerData));
            this.auth.userData.next(partnerData);
            console.log('Updated userData BehaviorSubject with:', partnerData);
          } else {
            console.warn('Partner data is not a valid object:', partnerData);
          }
        } else {
          console.warn('No data in response:', value);
        }
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error fetching partner data:', error);
        console.error('Error details:', error.error);
      },
    });
  }

  async logout() {
    const loading = await this.loadingController.create({
      message: 'Logging out...',
      duration: 1000,
    });
    await loading.present();

    try {
      // Call logout API (returns Promise)
      await this.auth.logout();
      await this.data.clearAll();
      await loading.dismiss();
      this.router.navigate([''], { replaceUrl: true });
    } catch (error) {
      // Even if API fails, clear local data
      console.error('Logout error:', error);
      await this.data.clearAll();
      await loading.dismiss();
      this.router.navigate([''], { replaceUrl: true });
    }
  }
}
