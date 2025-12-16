import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../services/data.service';
import { Socket } from 'ngx-socket-io';
import { RefresherEventDetail } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnDestroy {
  restaurantName: string = '';
  weeklyRevenue: any = 0;
  monthlyRevenue: any = 0;
  todaysOrders: any = 0;
  todaysRevenue: any = 0;
  totalOrders: any = 0;
  totalRevenue: any = 0;
  weeklyStats: any[] = [];
  isShopOpen: boolean = false; // Toggle state
  private shopDataSubscription?: Subscription;

  constructor(
    private router: Router,
    private socket: Socket,
    private auth: AuthService,
    private data: DataService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnDestroy() {
    if (this.shopDataSubscription) {
      this.shopDataSubscription.unsubscribe();
    }
  }

  async ionViewDidEnter() {
    // Load hotel data from storage first
    await this.loadHotelDataFromStorage();
    
    // Subscribe to shopData changes (unsubscribe on destroy)
    this.shopDataSubscription = this.auth.shopData.subscribe((res: any) => {
      if (res) {
        console.log('Shop data updated:', res);
        this.restaurantName = res?.hotelName || '';
        // Update storage if we got new data
        if (res?.hotelName) {
          this.data.set('hotelData', JSON.stringify(res));
        }
      }
    });
    
    this.getAnalyticsData();
    this.loadShopStatus(); // Load shop status on page enter
  }

  /**
   * Load hotel data from local storage first
   */
  async loadHotelDataFromStorage() {
    try {
      const hotelDataStr = await this.data.get('hotelData');
      if (hotelDataStr) {
        const hotelData = JSON.parse(hotelDataStr);
        this.restaurantName = hotelData?.hotelName || '';
        console.log('Loaded hotel name from storage:', this.restaurantName);
        
        // Update AuthService shopData if not already set
        if (!this.auth.shopData.value) {
          this.auth.shopData.next(hotelData);
        }
      } else {
        // If not in storage, fetch from API
        await this.fetchHotelDataFromAPI();
      }
    } catch (error) {
      console.error('Error loading hotel data from storage:', error);
      await this.fetchHotelDataFromAPI();
    }
  }

  /**
   * Fetch hotel data from API if not in storage
   */
  async fetchHotelDataFromAPI() {
    const userId = this.auth.userId.value;
    if (!userId) {
      console.warn('User ID not found, cannot fetch hotel data');
      return;
    }

    // Use getPartnerById with populate to get hotel details
    this.auth.getPartnerById(true).subscribe({
      next: async (response: any) => {
        console.log('Partner data from API:', response);
        if (response && response.data) {
          const partnerData = response.data;
          
          // Check if hotels are populated
          if (partnerData.hotels && Array.isArray(partnerData.hotels) && partnerData.hotels.length > 0) {
            const hotelData = partnerData.hotels[0]; // Get first hotel
            this.restaurantName = hotelData?.hotelName || '';
            
            // Store in local storage
            await this.data.set('hotelData', JSON.stringify(hotelData));
            
            // Update AuthService
            this.auth.shopData.next(hotelData);
            
            console.log('Fetched and stored hotel data:', hotelData);
          } else if (partnerData.hotelId) {
            // If hotelId is a string, we might need to fetch hotel separately
            // For now, try to get from shopData
            const shopData = this.auth.shopData.value;
            if (shopData) {
              this.restaurantName = shopData?.hotelName || '';
            }
          }
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching partner/hotel data:', error);
      }
    });
  }

  // Load shop status from local storage or API
  async loadShopStatus() {
    try {
      // First try to get from local storage
      const storedStatus = await this.data.get('shopStatus');
      if (storedStatus !== null) {
        this.isShopOpen = storedStatus === 'true';
        console.log('Loaded shop status from storage:', this.isShopOpen);
      } else {
        // If not in storage, fetch from API
        this.fetchShopStatusFromAPI();
      }
    } catch (error) {
      console.error('Error loading shop status:', error);
      this.fetchShopStatusFromAPI();
    }
  }

  // Fetch shop status from API
  fetchShopStatusFromAPI() {
    this.auth.getShopData().subscribe({
      next: async (response: any) => {
        console.log('Shop data from API:', response);
        if (response && response.data) {
          // API uses isOnline, not isOpen
          this.isShopOpen = response.data.isOnline || false;
          // Save to local storage
          await this.data.set('shopStatus', this.isShopOpen.toString());
          console.log('Updated shop status from API:', this.isShopOpen);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching shop status:', error);
        // Default to closed if API fails
        this.isShopOpen = false;
      },
    });
  }

  getAnalyticsData() {
    this.auth.getPartnerDashboard().subscribe({
      next: async (value: any) => {
        console.log('Dashboard data received:', value);

        // Map the new API response structure
        if (value && value.data) {
          const data = value.data;

          // Total stats
          if (data.totalStats) {
            this.totalOrders = data.totalStats.totalOrders || 0;
            this.totalRevenue = data.totalStats.totalEarnings || 0;
          }

          // Current month stats
          if (data.currentMonthStats) {
            this.monthlyRevenue = data.currentMonthStats.totalEarnings || 0;
          }

          // Today's stats
          this.todaysOrders = data.todaysOrders || 0;
          this.todaysRevenue = data.todaysRevenue || 0;

          // Weekly stats
          if (data.weeklyStats && Array.isArray(data.weeklyStats)) {
            this.weeklyStats = data.weeklyStats;
            // Calculate total weekly revenue
            this.weeklyRevenue = this.weeklyStats.reduce((total, day) => {
              return total + (day.totalEarnings || 0);
            }, 0);
          }
        }

        console.log('Mapped data:', {
          totalOrders: this.totalOrders,
          totalRevenue: this.totalRevenue,
          monthlyRevenue: this.monthlyRevenue,
          weeklyRevenue: this.weeklyRevenue,
          todaysOrders: this.todaysOrders,
          todaysRevenue: this.todaysRevenue,
        });
      },
      error: async (error: HttpErrorResponse) => {
        console.log('Dashboard API error:', error.error);
      },
    });
  }

  // Handle toggle change
  async hotelOnlineToggleEvent(ev: any) {
    const newStatus = ev.detail.checked;
    console.log('Toggle changed to:', newStatus);

    // Show loading
    const loading = await this.loadingController.create({
      message: newStatus ? 'Opening shop...' : 'Closing shop...',
      duration: 3000,
    });
    await loading.present();

    // Update via API
    this.auth.updateShopStatus(newStatus).subscribe({
      next: async (response: any) => {
        console.log('Shop status updated successfully:', response);

        // Update local state
        this.isShopOpen = newStatus;

        // Save to local storage
        await this.data.set('shopStatus', newStatus.toString());

        // Show success message
        const toast = await this.toastController.create({
          message: newStatus ? 'Shop is now open!' : 'Shop is now closed!',
          duration: 2000,
          color: newStatus ? 'success' : 'warning',
          position: 'top',
        });
        await toast.present();

        await loading.dismiss();
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error updating shop status:', error);

        // Revert toggle state on error
        this.isShopOpen = !newStatus;

        // Show error message
        const toast = await this.toastController.create({
          message: 'Failed to update shop status. Please try again.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();

        await loading.dismiss();
      },
    });
  }

  handleRefresh(event: any) {
    console.log('Refreshing data...');

    // Refresh all data
    this.getAnalyticsData();
    this.loadShopStatus(); // Also refresh shop status

    // Complete the refresh after a short delay to show the loading state
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  openPage(pageName: string) {
    this.router.navigate([pageName]);
  }
}
